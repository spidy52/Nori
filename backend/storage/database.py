"""
Database management & SQLite schema for Nori Work Context Graph
Local-first, ACID-compliant, zero external dependencies.
"""

import sqlite3
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

DB_PATH = Path(__file__).resolve().parent.parent / "nori_context.db"

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Projects
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        root_path TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Tasks
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'in_progress',
        priority TEXT DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
    """)

    # Context Nodes (Files, Documents, Physical Objects, Processes, Metrics, Issues, Decisions)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS context_nodes (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL, -- 'digital', 'physical', 'device', 'temporal', 'decision', 'issue'
        metadata TEXT, -- JSON string
        confidence REAL DEFAULT 1.0,
        source TEXT NOT NULL, -- 'filesystem', 'camera', 'telemetry', 'user', 'ai_reasoning'
        visibility TEXT DEFAULT 'private', -- 'private', 'shared'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
    """)

    # Context Edges (Relationships)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS context_edges (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        relation_type TEXT NOT NULL, -- 'BELONGS_TO', 'USES', 'RELATED_TO', 'CAUSED', 'RESOLVES', 'BLOCKED_BY', 'DETECTED_NEAR', 'RUN_BY'
        confidence REAL DEFAULT 1.0,
        evidence TEXT, -- JSON array of evidence strings or node IDs
        visibility TEXT DEFAULT 'private',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_id) REFERENCES context_nodes(id) ON DELETE CASCADE,
        FOREIGN KEY (target_id) REFERENCES context_nodes(id) ON DELETE CASCADE
    )
    """)

    # Temporal Events
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        event_type TEXT NOT NULL,
        source TEXT NOT NULL,
        summary TEXT NOT NULL,
        payload TEXT, -- JSON string
        confidence REAL DEFAULT 1.0,
        visibility TEXT DEFAULT 'private',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Permissions & Privacy Settings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS privacy_settings (
        id TEXT PRIMARY KEY,
        source_name TEXT NOT NULL UNIQUE,
        enabled INTEGER DEFAULT 1,
        redact_credentials INTEGER DEFAULT 1,
        allowed_paths TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Workspaces (Collaborative Nori)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_by TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Workspace Members
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS workspace_members (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        peer_name TEXT NOT NULL,
        device_name TEXT NOT NULL,
        role TEXT NOT NULL,
        npu_available INTEGER DEFAULT 1,
        status TEXT DEFAULT 'active',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at", DB_PATH)
