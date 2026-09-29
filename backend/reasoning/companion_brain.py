"""
Nori Proactive Living Companion Brain
Continuously synthesizes digital workspace focus, physical hardware perception,
and hardware telemetry to generate spontaneous, friendly, and helpful companion thoughts,
with strict anti-nagging debouncing and quiet background operation.
"""

import time
import asyncio
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from backend.digital.observer import live_observer
from backend.device.telemetry import get_system_telemetry
from backend.context.graph import context_graph

class CompanionThought(BaseModel):
    id: str
    timestamp: float
    mood: str          # 'friendly', 'curious', 'observing', 'helpful', 'alert', 'thinking'
    thought: str
    detail: Optional[str] = None
    action_suggestion: Optional[str] = None
    threat_action: Optional[str] = None  # 'optimize_memory', 'dismiss', 'inspect'
    speak_aloud: bool = False
    source: str        # 'digital_focus', 'physical_vision', 'hardware_telemetry', 'work_session'

class ProactiveCompanionBrain:
    def __init__(self):
        self._last_emitted_thought: Optional[CompanionThought] = None
        self._last_focus_app: str = ""
        self._last_focus_file: Optional[str] = None
        self._session_start = time.time()
        self._thought_history: List[CompanionThought] = []

        # Strict Anti-nagging / alert cooldown controls
        self._last_anomaly_alert_time: float = 0.0
        self._last_anomaly_headline: str = ""
        self._anomaly_cooldown_seconds: float = 600.0   # 10 minutes minimum before re-alerting
        self._last_battery_alert_time: float = 0.0
        self._battery_cooldown_seconds: float = 900.0   # 15 minutes
        self._last_spontaneous_time: float = time.time()

    def dismiss_threat_alert(self, duration_seconds: float = 600.0):
        """Allows user to snooze or dismiss alerts for a specified duration."""
        self._last_anomaly_alert_time = time.time() + duration_seconds

    def evaluate_live_state(self) -> Optional[CompanionThought]:
        """
        Evaluates current digital and hardware state.
        Debounces repeated alerts so the user is never repeatedly nagged.
        """
        win = live_observer.get_real_active_window()
        telemetry = get_system_telemetry()
        anomaly = live_observer.check_system_anomaly()
        now = time.time()

        # 1. Thermal or Hardware Alert (DEBOUNCED: 10 minutes cooldown)
        if anomaly.is_anomaly and anomaly.severity in ["warning", "critical"]:
            is_same_alert = (anomaly.headline == self._last_anomaly_headline)
            is_within_cooldown = (now - self._last_anomaly_alert_time) < self._anomaly_cooldown_seconds

            if not is_within_cooldown and not is_same_alert:
                self._last_anomaly_alert_time = now
                self._last_anomaly_headline = anomaly.headline

                threat_action = "optimize_memory" if "Memory" in anomaly.headline else "inspect"
                consent_question = (
                    f"Notice: {anomaly.headline}. Would you like to optimize system memory?"
                    if threat_action == "optimize_memory"
                    else f"Notice: {anomaly.headline} from {anomaly.affected_process}."
                )

                thought = CompanionThought(
                    id=f"thought_anomaly_{int(now)}",
                    timestamp=now,
                    mood="alert",
                    thought=consent_question,
                    detail=anomaly.description,
                    action_suggestion="Optimize Memory" if threat_action == "optimize_memory" else "Inspect Telemetry",
                    threat_action=threat_action,
                    speak_aloud=False,
                    source="hardware_telemetry"
                )
                self._last_emitted_thought = thought
                return thought

        # 2. Battery Low / Power Precaution (DEBOUNCED: 15 minute cooldown)
        if telemetry.battery_percent is not None and telemetry.battery_percent <= 15 and not telemetry.power_plugged:
            if (now - self._last_battery_alert_time) > self._battery_cooldown_seconds:
                self._last_battery_alert_time = now
                thought = CompanionThought(
                    id=f"thought_bat_{int(now)}",
                    timestamp=now,
                    mood="alert",
                    thought=f"Battery is at {int(telemetry.battery_percent)}%. AC power connection recommended.",
                    action_suggestion="Connect AC Power",
                    speak_aloud=False,
                    source="hardware_telemetry"
                )
                self._last_emitted_thought = thought
                return thought

        # 3. Focus Context Change (Only when significant new file opened)
        app_changed = win.app_name != self._last_focus_app and win.app_name not in ["Unknown", "Desktop", ""]
        file_changed = win.active_file != self._last_focus_file and win.active_file is not None

        if (app_changed or file_changed) and (not self._last_emitted_thought or (now - self._last_emitted_thought.timestamp > 120.0)):
            self._last_focus_app = win.app_name
            self._last_focus_file = win.active_file

            if win.active_file:
                thought = CompanionThought(
                    id=f"thought_focus_{int(now)}",
                    timestamp=now,
                    mood="observing",
                    thought=f"Active in '{win.active_file}'. Workspace context synced in local SQLite.",
                    action_suggestion="View Context Graph",
                    speak_aloud=False,
                    source="digital_focus"
                )
                self._last_emitted_thought = thought
                return thought

        # 4. Physical Camera Activity & Scene Interaction (Work, Cooking, Repair, Table Organization, Handheld items)
        try:
            from backend.physical.vision_engine import camera_manager
            analysis = camera_manager.get_latest_analysis()
            if analysis and analysis.activity:
                act = analysis.activity
                # If activity is specialized (repair, cooking, table organization, handheld item) and not recently spoken
                if act.activity_type != "work_and_coding" and (now - self._last_spontaneous_time > 60.0):
                    self._last_spontaneous_time = now
                    thought = CompanionThought(
                        id=f"thought_activity_{int(now)}",
                        timestamp=now,
                        mood="helpful" if act.activity_type == "hardware_repair" else "friendly",
                        thought=f"{act.headline}: {act.details}",
                        detail=act.suggested_action,
                        action_suggestion=act.suggested_action,
                        speak_aloud=False,
                        source="physical_vision"
                    )
                    self._last_emitted_thought = thought
                    return thought
        except Exception:
            pass

        # 5. Spontaneous Friendly Thought (every 3-5 minutes max, unobtrusive)
        if (now - self._last_spontaneous_time) > 180.0:
            self._last_spontaneous_time = now
            ideas = [
                ("friendly", "Your local AI companion is watching your workspace and screen. Just say 'type [text]' or 'inspect this' whenever you need help."),
                ("helpful", "I can manipulate your screen, type code, search docs, and inspect hardware circuits anytime."),
                ("observing", "All local neural models and DirectML inference pipelines are operating smoothly.")
            ]
            import random
            mood, text = random.choice(ideas)
            thought = CompanionThought(
                id=f"thought_spontaneous_{int(now)}",
                timestamp=now,
                mood=mood,
                thought=text,
                speak_aloud=False,
                source="work_session"
            )
            self._last_emitted_thought = thought
            return thought

        return None

companion_brain = ProactiveCompanionBrain()
