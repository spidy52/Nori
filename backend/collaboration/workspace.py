"""
Collaborative Nori Network & Shared Workspace Engine
Manages multi-Nori peer identity, explicit granular sharing, shared graph synchronization, and team blocker intelligence.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class NoriPeer(BaseModel):
    id: str
    name: str
    owner: str
    role: str             # e.g., 'Vision Lead', 'Hardware Specialist', 'Audio Engineer'
    device_model: str     # e.g., 'HP OmniBook Ultra (Snapdragon X Elite)'
    npu_status: str       # 'Active / 45 TOPS', 'Active / Low Power', 'CPU Fallback'
    npu_utilization: float
    cpu_utilization: float
    active_task: str
    status: str = "online" # 'online', 'busy', 'offline'

class TeamActivityEvent(BaseModel):
    id: str
    peer_name: str
    event_type: str       # 'TASK_COMPLETE', 'ISSUE_DISCOVERED', 'CALIBRATION_FINISHED'
    summary: str
    timestamp: str

class SharedWorkspace(BaseModel):
    id: str = "ws_local"
    name: str = "Local Workspace"
    description: str = "Private local Nori workspace. Connect peers over local network to share context."
    peers: List[NoriPeer] = Field(default_factory=list)
    shared_tasks: List[str] = Field(default_factory=list)
    unresolved_blockers: List[str] = Field(default_factory=list)
    recent_activity: List[TeamActivityEvent] = Field(default_factory=list)

class CollaborationEngine:
    def __init__(self):
        # Clean production state — no fake peers until authenticated peers connect
        self.workspace = SharedWorkspace()

    def get_workspace_state(self) -> SharedWorkspace:
        return self.workspace

    def add_peer(self, peer: NoriPeer):
        self.workspace.peers = [p for p in self.workspace.peers if p.id != peer.id]
        self.workspace.peers.append(peer)

    def remove_peer(self, peer_id: str):
        self.workspace.peers = [p for p in self.workspace.peers if p.id != peer_id]

    def ask_workspace(self, query: str) -> Dict[str, Any]:
        if not self.workspace.peers:
            return {
                "headline": "No Connected Nori Peers",
                "summary": "You are currently working in private standalone mode. No remote Nori peers are connected.",
                "connected_peers": [],
                "active_tasks": [],
                "confidence": 1.0
            }
        
        return {
            "headline": f"Shared Workspace ({len(self.workspace.peers)} Peers Connected)",
            "summary": f"Connected to {', '.join(p.name for p in self.workspace.peers)}.",
            "connected_peers": [p.name for p in self.workspace.peers],
            "active_tasks": self.workspace.shared_tasks,
            "confidence": 1.0
        }

collaboration_engine = CollaborationEngine()
