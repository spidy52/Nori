"""
Async Event Bus & Normalized Event Dispatcher for Nori
"""

import asyncio
from datetime import datetime, timezone
import json
import uuid
from typing import Any, Callable, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.storage.database import get_db_connection

class NoriEvent(BaseModel):
    id: str = Field(default_factory=lambda: f"evt_{uuid.uuid4().hex[:12]}")
    event_type: str  # e.g., 'OBJECT_DETECTED', 'FILE_MODIFIED', 'PROCESS_RESOURCE_USAGE', 'APP_FOCUSED', 'QUERY_RECEIVED'
    source: str      # 'camera', 'filesystem', 'process_monitor', 'user', 'ai_reasoning', 'workspace'
    project_id: Optional[str] = "proj_nori_workspace"
    summary: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = 1.0
    visibility: str = "private"  # 'private', 'shared'
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"))

class EventBus:
    def __init__(self):
        self._subscribers: List[Callable[[NoriEvent], Any]] = []
        self._history: List[NoriEvent] = []
        self._max_history = 200

    def subscribe(self, callback: Callable[[NoriEvent], Any]):
        self._subscribers.append(callback)

    def unsubscribe(self, callback: Callable[[NoriEvent], Any]):
        if callback in self._subscribers:
            self._subscribers.remove(callback)

    async def publish(self, event: NoriEvent):
        self._history.append(event)
        if len(self._history) > self._max_history:
            self._history.pop(0)

        # Persist to SQLite
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO events (id, project_id, event_type, source, summary, payload, confidence, visibility, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                event.id,
                event.project_id or "proj_nori_workspace",
                event.event_type,
                event.source,
                event.summary,
                json.dumps(event.payload),
                event.confidence,
                event.visibility,
                event.timestamp
            ))
            conn.commit()
            conn.close()
        except Exception as e:
            print("[EVENT BUS PERSIST ERR]:", e)

        tasks = []
        for callback in self._subscribers:
            if asyncio.iscoroutinefunction(callback):
                tasks.append(callback(event))
            else:
                callback(event)
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    def get_recent_events(self, limit: int = 50) -> List[NoriEvent]:
        return self._history[-limit:]

# Global event bus instance
event_bus = EventBus()
