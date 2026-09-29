"""
Work Context Graph Engine for Nori
Maintains the relational graph between Projects, Tasks, Files, Physical Objects, Processes, and Issues.
Supports evidence chains, confidence weighting, and private/shared context boundaries.
"""

import json
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.storage.database import get_db_connection

class ContextNode(BaseModel):
    id: str
    project_id: str
    type: str          # 'project', 'task', 'file', 'document', 'physical_object', 'process', 'issue', 'decision'
    name: str
    category: str      # 'digital', 'physical', 'device', 'temporal', 'issue', 'decision'
    metadata: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = 1.0
    source: str        # 'filesystem', 'camera', 'telemetry', 'user', 'ai_reasoning'
    visibility: str = "private"  # 'private', 'shared'
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ContextEdge(BaseModel):
    id: str
    source_id: str
    target_id: str
    relation_type: str  # 'BELONGS_TO', 'USES', 'RELATED_TO', 'CAUSED', 'RESOLVES', 'BLOCKED_BY', 'DETECTED_NEAR', 'RUN_BY', 'MODIFIED'
    confidence: float = 1.0
    evidence: List[str] = Field(default_factory=list)
    visibility: str = "private"
    created_at: Optional[str] = None

class WorkContextGraphResponse(BaseModel):
    project_id: str
    project_name: str
    nodes: List[ContextNode]
    edges: List[ContextEdge]

class ContextGraph:
    def __init__(self):
        pass

    def get_graph(self, project_id: Optional[str] = None, visibility_filter: Optional[str] = None) -> WorkContextGraphResponse:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Resolve active project if not specified
        if not project_id:
            cursor.execute("SELECT id, name FROM projects ORDER BY updated_at DESC LIMIT 1")
            proj_row = cursor.fetchone()
            if proj_row:
                project_id = proj_row["id"]
                project_name = proj_row["name"]
            else:
                project_id = ""
                project_name = "No active project detected"
        else:
            cursor.execute("SELECT name FROM projects WHERE id = ?", (project_id,))
            row = cursor.fetchone()
            project_name = row["name"] if row else "No active project detected"

        # Fetch nodes
        query_nodes = "SELECT * FROM context_nodes WHERE project_id = ?"
        params_nodes = [project_id]
        if visibility_filter:
            query_nodes += " AND visibility = ?"
            params_nodes.append(visibility_filter)
            
        cursor.execute(query_nodes, params_nodes)
        node_rows = cursor.fetchall()
        
        nodes = []
        node_ids = set()
        for r in node_rows:
            meta = json.loads(r["metadata"]) if r["metadata"] else {}
            node = ContextNode(
                id=r["id"],
                project_id=r["project_id"],
                type=r["type"],
                name=r["name"],
                category=r["category"],
                metadata=meta,
                confidence=r["confidence"],
                source=r["source"],
                visibility=r["visibility"],
                created_at=r["created_at"],
                updated_at=r["updated_at"]
            )
            nodes.append(node)
            node_ids.add(r["id"])

        # Fetch edges connecting these nodes
        edges = []
        if node_ids:
            cursor.execute("SELECT * FROM context_edges")
            edge_rows = cursor.fetchall()
            for r in edge_rows:
                if r["source_id"] in node_ids and r["target_id"] in node_ids:
                    if visibility_filter and r["visibility"] != visibility_filter:
                        continue
                    ev = json.loads(r["evidence"]) if r["evidence"] else []
                    edges.append(ContextEdge(
                        id=r["id"],
                        source_id=r["source_id"],
                        target_id=r["target_id"],
                        relation_type=r["relation_type"],
                        confidence=r["confidence"],
                        evidence=ev,
                        visibility=r["visibility"],
                        created_at=r["created_at"]
                    ))

        conn.close()
        return WorkContextGraphResponse(
            project_id=project_id,
            project_name=project_name,
            nodes=nodes,
            edges=edges
        )

    def get_node_details(self, node_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM context_nodes WHERE id = ?", (node_id,))
        node_row = cursor.fetchone()
        if not node_row:
            conn.close()
            return None
            
        node = dict(node_row)
        node["metadata"] = json.loads(node["metadata"]) if node["metadata"] else {}
        
        # Get inbound and outbound edges
        cursor.execute("""
            SELECT e.*, n.name as other_name, n.type as other_type, n.category as other_category
            FROM context_edges e
            JOIN context_nodes n ON (e.target_id = n.id)
            WHERE e.source_id = ?
        """, (node_id,))
        outbound = [dict(r) for r in cursor.fetchall()]
        
        cursor.execute("""
            SELECT e.*, n.name as other_name, n.type as other_type, n.category as other_category
            FROM context_edges e
            JOIN context_nodes n ON (e.source_id = n.id)
            WHERE e.target_id = ?
        """, (node_id,))
        inbound = [dict(r) for r in cursor.fetchall()]
        
        conn.close()
        return {
            "node": node,
            "connected_out": outbound,
            "connected_in": inbound
        }

    def get_active_work_summary(self, project_id: Optional[str] = None) -> Dict[str, Any]:
        """Provides a high-level fused snapshot of the user's current work state."""
        graph = self.get_graph(project_id)
        
        # Pull live real-world Windows foreground application & active file
        try:
            from backend.digital.observer import live_observer
            live_win = live_observer.get_real_active_window()
            active_app = live_win.app_name
            active_file = live_win.active_file or live_win.title
        except Exception:
            active_app = "Desktop"
            active_file = None

        digital_nodes = [n for n in graph.nodes if n.category == "digital"]
        physical_nodes = [n for n in graph.nodes if n.category == "physical"]
        device_nodes = [n for n in graph.nodes if n.category == "device"]
        issue_nodes = [n for n in graph.nodes if n.type == "issue"]
        task_nodes = [n for n in graph.nodes if n.type == "task"]
        
        return {
            "project_id": graph.project_id if graph.project_id else None,
            "project_name": graph.project_name if graph.project_id else "No active project detected",
            "active_application": active_app,
            "active_file": active_file,
            "current_task": task_nodes[0].name if task_nodes else None,
            "current_issue": issue_nodes[0].name if issue_nodes else None,
            "issue_details": issue_nodes[0].metadata.get("description", "") if issue_nodes else None,
            "digital_context": [n.name for n in digital_nodes],
            "physical_context": [n.name for n in physical_nodes],
            "device_context": [n.name for n in device_nodes],
            "total_nodes": len(graph.nodes),
            "total_edges": len(graph.edges)
        }

context_graph = ContextGraph()
