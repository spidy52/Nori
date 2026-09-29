"""
Unit & Integration Tests for Nori Context Engine & Graph
"""

import pytest
from backend.storage.database import init_db
from backend.demo.seed_data import seed_database
from backend.context.graph import context_graph

@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()
    seed_database(force=True)


def test_graph_retrieval():
    graph = context_graph.get_graph("proj_nori_workspace")
    assert graph.project_id == "proj_nori_workspace"
    assert len(graph.nodes) >= 8
    assert len(graph.edges) >= 4

def test_work_summary():
    summary = context_graph.get_active_work_summary("proj_nori_workspace")
    assert "Nori" in summary["project_name"]
    assert len(summary["digital_context"]) > 0
    assert summary["total_nodes"] >= 8


def test_node_details_and_edges():
    details = context_graph.get_node_details("node_file_1")
    assert details is not None
    assert details["node"]["name"] == "App.tsx"
    assert len(details["connected_out"]) > 0 or len(details["connected_in"]) > 0

