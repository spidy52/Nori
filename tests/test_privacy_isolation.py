"""
Privacy, Redaction & Isolation Tests
Ensures private context does not leak and Global Pause functions reliably.
"""

import pytest
from backend.privacy.manager import privacy_manager

def test_credential_redaction():
    raw = "My OpenAI key is sk-1234567890abcdef12345678 and token: 'secret_token_value_999'"
    redacted = privacy_manager.redact_text(raw)
    assert "sk-" not in redacted or "[REDACTED_BY_NORI_PRIVACY]" in redacted
    assert "REDACTED" in redacted

def test_global_pause_behavior():
    privacy_manager.state.camera_enabled = True
    privacy_manager.state.microphone_enabled = True
    
    # Trigger pause
    state = privacy_manager.toggle_global_pause(True)
    assert state.is_paused is True
    assert state.camera_enabled is False
    assert state.microphone_enabled is False
    
    # Event sanitization on pause returns None
    sanitized = privacy_manager.sanitize_event({"source": "camera", "summary": "Detected object"})
    assert sanitized is None
    
    # Unpause
    state = privacy_manager.toggle_global_pause(False)
    assert state.is_paused is False

def test_private_shared_isolation():
    private_node = {"id": "node_1", "visibility": "private", "name": "personal_notes.txt"}
    shared_node = {"id": "node_2", "visibility": "shared", "name": "team_spec.md"}
    
    assert privacy_manager.is_sharable_to_workspace(private_node) is False
    assert privacy_manager.is_sharable_to_workspace(shared_node) is True
