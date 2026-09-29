"""
Real-Time Windows Digital & System Observer for Nori
Continuously observes the real active foreground application, active files, and PC anomalies.
Dispatches genuine events without fabricated static state.
"""

import os
import time
import psutil
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

try:
    import win32gui
    import win32process
    HAS_WIN32 = True
except ImportError:
    HAS_WIN32 = False

class ActiveWindowContext(BaseModel):
    title: str = "Desktop"
    app_name: str = "Explorer"
    pid: int = 0
    active_file: Optional[str] = None
    workspace_name: Optional[str] = None
    is_development_tool: bool = False
    cpu_percent: float = 0.0
    memory_mb: float = 0.0

class SystemAnomaly(BaseModel):
    is_anomaly: bool = False
    severity: str = "none" # none, info, warning, critical
    headline: str = ""
    description: str = ""
    suggested_action: str = ""
    affected_process: Optional[str] = None

class LiveSystemObserver:
    def __init__(self):
        self._last_window_title = ""
        self._last_active_app = ""
        self._recent_files: List[str] = []

    def get_real_active_window(self) -> ActiveWindowContext:
        """Retrieves the actual active foreground window on Windows."""
        if not HAS_WIN32:
            return ActiveWindowContext(title="Desktop", app_name="Explorer", pid=0)
            
        try:
            hwnd = win32gui.GetForegroundWindow()
            if not hwnd:
                return ActiveWindowContext(title="Desktop", app_name="Windows Shell", pid=0)
                
            title = win32gui.GetWindowText(hwnd) or "Desktop"
            _, pid = win32process.GetWindowThreadProcessId(hwnd)
            
            app_name = "Unknown"
            cpu_pct = 0.0
            mem_mb = 0.0
            try:
                proc = psutil.Process(pid)
                app_name = proc.name()
                cpu_pct = proc.cpu_percent()
                mem_mb = proc.memory_info().rss / (1024 * 1024)
            except Exception:
                pass

            # Extract active file or workspace from window title
            active_file = None
            workspace = None
            is_dev = False

            title_lower = title.lower()
            if "code" in app_name.lower() or "cursor" in app_name.lower() or "visual studio code" in title_lower:
                is_dev = True
                app_name = "VS Code"
                # VS code title usually format: "filename - workspace - Visual Studio Code"
                parts = title.split(" - ")
                if len(parts) >= 2:
                    active_file = parts[0].strip()
                    workspace = parts[1].strip() if len(parts) > 2 else "Workspace"
            elif "chrome" in app_name.lower():
                app_name = "Google Chrome"
            elif "terminal" in app_name.lower() or "powershell" in app_name.lower() or "cmd" in app_name.lower():
                is_dev = True
                app_name = "Windows Terminal"

            if active_file and active_file not in self._recent_files:
                self._recent_files.append(active_file)
                if len(self._recent_files) > 10:
                    self._recent_files.pop(0)

            return ActiveWindowContext(
                title=title,
                app_name=app_name,
                pid=pid,
                active_file=active_file,
                workspace_name=workspace,
                is_development_tool=is_dev,
                cpu_percent=round(cpu_pct, 1),
                memory_mb=round(mem_mb, 1)
            )
        except Exception:
            return ActiveWindowContext(title="Desktop", app_name="Desktop", pid=0)

    def check_system_anomaly(self) -> SystemAnomaly:
        """Detects real hardware anomalies or resource bottlenecks that warrant companion attention."""
        cpu_overall = psutil.cpu_percent(interval=None)
        mem = psutil.virtual_memory()

        # Find highest consuming process
        top_proc_name = "System"
        top_proc_cpu = 0.0
        try:
            for p in psutil.process_iter(['name', 'cpu_percent']):
                p_cpu = p.info['cpu_percent'] or 0.0
                if p_cpu > top_proc_cpu:
                    top_proc_cpu = p_cpu
                    top_proc_name = p.info['name'] or "System"
        except Exception:
            pass

        if cpu_overall > 85.0:
            return SystemAnomaly(
                is_anomaly=True,
                severity="warning",
                headline=f"High CPU Surge ({cpu_overall}%)",
                description=f"{top_proc_name} is currently consuming {top_proc_cpu}% CPU.",
                suggested_action="Nori can balance background threads or offload inference to NPU.",
                affected_process=top_proc_name
            )
        elif mem.percent > 90.0:
            return SystemAnomaly(
                is_anomaly=True,
                severity="warning",
                headline=f"High Memory Pressure ({mem.percent}%)",
                description=f"Using {round(mem.used / (1024**3), 1)} GB out of {round(mem.total / (1024**3), 1)} GB.",
                suggested_action="Close unused background tabs or release inactive processes.",
                affected_process=top_proc_name
            )
        return SystemAnomaly(is_anomaly=False, severity="none")

live_observer = LiveSystemObserver()
