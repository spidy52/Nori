"""
Privacy, Permission & Isolation Manager for Nori
Ensures all data remains on-device by default, supports Global Pause, and redacts sensitive credentials.
"""

import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class PrivacyState(BaseModel):
    is_paused: bool = False
    camera_enabled: bool = True  # Active for workspace vision
    microphone_enabled: bool = True  # Active for voice assistant
    filesystem_enabled: bool = True
    process_telemetry_enabled: bool = True
    browser_context_enabled: bool = False  # Off by default
    screen_capture_enabled: bool = False   # Off by default
    network_collaboration_enabled: bool = False
    redact_sensitive_credentials: bool = True
    allowed_project_paths: List[str] = ["demo/sensor_monitoring"]

class PrivacyManager:
    def __init__(self):
        self.state = PrivacyState()
        # Common credential / API Key / Secret regex patterns
        self.sensitive_patterns = [
            re.compile(r"(?i)(api[_-]?key|secret|token|password|bearer|auth[_-]?token)\s*[:=]\s*['\"]?([a-zA-Z0-9_\-\.]{8,})['\"]?"),
            re.compile(r"sk-[a-zA-Z0-9]{20,}"), # Generic sk- token
            re.compile(r"ghp_[a-zA-Z0-9]{36}"), # GitHub token
            re.compile(r"(?i)bearer\s+[a-zA-Z0-9_\-\.]{20,}"),
            re.compile(r"-----BEGIN [A-Z ]+ PRIVATE KEY-----")
        ]

    def toggle_global_pause(self, paused: Optional[bool] = None) -> PrivacyState:
        if paused is not None:
            self.state.is_paused = paused
        else:
            self.state.is_paused = not self.state.is_paused
            
        if self.state.is_paused:
            # Force sensors off immediately on pause
            self.state.camera_enabled = False
            self.state.microphone_enabled = False
            self.state.network_collaboration_enabled = False
        return self.state

    def update_permissions(self, **kwargs) -> PrivacyState:
        for key, value in kwargs.items():
            if hasattr(self.state, key):
                setattr(self.state, key, value)
        return self.state

    def redact_text(self, text: str) -> str:
        """Strips passwords, API keys, and sensitive tokens from text before saving or sending."""
        if not self.state.redact_sensitive_credentials or not text:
            return text
            
        redacted = text
        for pattern in self.sensitive_patterns:
            def repl(match):
                if match.groups() and match.group(1):
                    return f"{match.group(1)}: [REDACTED_BY_NORI_PRIVACY]"
                return "[REDACTED_BY_NORI_PRIVACY]"
            redacted = pattern.sub(repl, redacted)
        return redacted

    def sanitize_event(self, event_dict: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Validates if an event is permissible under current privacy configuration."""
        if self.state.is_paused:
            return None
            
        source = event_dict.get("source")
        if source == "camera" and not self.state.camera_enabled:
            return None
        if source == "microphone" and not self.state.microphone_enabled:
            return None
        if source == "filesystem" and not self.state.filesystem_enabled:
            return None
        if source == "telemetry" and not self.state.process_telemetry_enabled:
            return None
            
        # Redact summary and payload text
        if "summary" in event_dict and isinstance(event_dict["summary"], str):
            event_dict["summary"] = self.redact_text(event_dict["summary"])
            
        return event_dict

    def is_sharable_to_workspace(self, node: Dict[str, Any]) -> bool:
        """Guarantees private files, timeline, notes never leak into shared workspace unless marked shared."""
        visibility = node.get("visibility", "private")
        if visibility != "shared":
            return False
        return True

privacy_manager = PrivacyManager()
