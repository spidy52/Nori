"""
Reasoning Engine Unit Tests
Tests key work query responses and evidence chains.
"""

import pytest
import asyncio
from backend.storage.database import init_db
from backend.demo.seed_data import seed_database
from backend.reasoning.engine import reasoning_engine

@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()
    seed_database()

@pytest.mark.asyncio
async def test_query_what_am_i_working_on():
    resp = await reasoning_engine.process_query("What am I working on?")
    assert len(resp.headline) > 0
    assert len(resp.breakdowns) >= 2
    assert len(resp.evidence_chain) >= 2
    assert resp.confidence >= 0.9

@pytest.mark.asyncio
async def test_query_why_pc_slow():
    resp = await reasoning_engine.process_query("Why is my laptop slow?")
    assert "cpu" in resp.headline.lower() or "load" in resp.headline.lower() or "process" in resp.headline.lower()
    assert len(resp.breakdowns) >= 2
    assert len(resp.evidence_chain) >= 1

@pytest.mark.asyncio
async def test_query_what_is_this():
    resp = await reasoning_engine.process_query("What is this?")
    assert len(resp.headline) > 0
    assert len(resp.breakdowns) >= 1
    assert len(resp.evidence_chain) >= 1

@pytest.mark.asyncio
async def test_query_resume_work():
    resp = await reasoning_engine.process_query("Resume my work")
    assert resp.resumable_workspace is not None
    assert "project_path" in resp.resumable_workspace
    assert len(resp.headline) > 0
