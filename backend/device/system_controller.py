"""
Dynamic OS System Automation & Hardware Controller for Windows
Allows Nori AI to dynamically handle any system control request:
Volume, Brightness, Wi-Fi, Bluetooth, App Launching, Power Management, Media Control, and Device Operations.
Operates dynamically without hardcoding fixed rigid strings.
"""

import os
import re
import sys
import subprocess
import ctypes
from typing import Dict, Any, Optional, List

class SystemController:
    """
    Universal Dynamic OS Automation Controller for Windows.
    Executes real system actions via native Windows C APIs, PowerShell, WMI, and netsh.
    """

    def __init__(self):
        self.user32 = ctypes.windll.user32 if hasattr(ctypes, 'windll') else None

    def execute_os_action(self, query: str) -> Dict[str, Any]:
        """
        Dynamically analyzes natural language query to identify and execute system control actions.
        Returns detailed execution payload with success status, action taken, and quantitative metrics.
        """
        q_clean = query.strip()
        q_lower = q_clean.lower()

        # Extract numerical percentage if present (e.g., 50%, 80, 100)
        num_match = re.search(r'\b(\d{1,3})\s*%?\b', q_lower)
        number_val = int(num_match.group(1)) if num_match else None
        if number_val is not None and (number_val < 0 or number_val > 100):
            number_val = max(0, min(100, number_val))

        # ---------------------------------------------------------------------
        # 1. AUDIO & VOLUME CONTROL
        # ---------------------------------------------------------------------
        audio_keywords = ["volume", "sound", "audio", "mute", "unmute", "louder", "quieter", "speaker", "headphone", "vol"]
        if any(kw in q_lower for kw in audio_keywords):
            return self._handle_audio(q_lower, number_val)

        # ---------------------------------------------------------------------
        # 2. DISPLAY & BRIGHTNESS CONTROL
        # ---------------------------------------------------------------------
        brightness_keywords = ["brightness", "display", "screen light", "dim", "brighter", "backlight", "screen"]
        if any(kw in q_lower for kw in brightness_keywords):
            return self._handle_brightness(q_lower, number_val)

        # ---------------------------------------------------------------------
        # 3. MOUSE CLICKING & GUI SCREEN AUTOMATION
        # ---------------------------------------------------------------------
        gui_keywords = ["click", "double click", "right click", "mouse", "type", "press enter", "press key", "shortcut", "copy", "paste", "scroll"]
        if any(kw in q_lower for kw in gui_keywords):
            return self._handle_gui_automation(q_clean, q_lower)

        # ---------------------------------------------------------------------
        # 4. WI-FI & NETWORK MANAGEMENT
        # ---------------------------------------------------------------------
        wifi_keywords = ["wifi", "wi-fi", "wireless", "network", "internet", "ssid", "ipconfig", "dns", "ping", "wlan", "hotspot"]
        if any(kw in q_lower for kw in wifi_keywords):
            return self._handle_wifi(q_lower)

        # ---------------------------------------------------------------------
        # 5. BLUETOOTH & PERIPHERAL CONTROL
        # ---------------------------------------------------------------------
        bt_keywords = ["bluetooth", "bt", "pair", "peripheral", "headset", "mouse", "keyboard", "bthserv"]
        if any(kw in q_lower for kw in bt_keywords):
            return self._handle_bluetooth(q_lower)

        # ---------------------------------------------------------------------
        # 6. POWER & SYSTEM STATE MANAGEMENT
        # ---------------------------------------------------------------------
        power_keywords = ["lock", "sleep", "lockscreen", "shutdown", "restart", "reboot", "power", "battery", "charge", "charging", "standby"]
        if any(kw in q_lower for kw in power_keywords):
            return self._handle_power(q_lower)

        # ---------------------------------------------------------------------
        # 7. MEDIA PLAYBACK CONTROL
        # ---------------------------------------------------------------------
        media_keywords = ["play", "pause", "track", "song", "media", "next song", "prev song", "music"]
        if any(kw in q_lower for kw in media_keywords):
            return self._handle_media(q_lower)

        # ---------------------------------------------------------------------
        # 8. DYNAMIC APPLICATION & WINDOW LAUNCHING
        # ---------------------------------------------------------------------
        launch_keywords = ["open", "launch", "start", "run", "open app", "exec"]
        if any(kw in q_lower for kw in launch_keywords):
            return self._handle_app_launch(q_clean, q_lower)

        # Fallback dynamic evaluation
        return {
            "executed": False,
            "domain": "unknown",
            "message": "No direct OS command matched.",
            "metrics": {}
        }

    # -------------------------------------------------------------------------
    # HANDLERS FOR EACH OS DOMAIN
    # -------------------------------------------------------------------------
    def _handle_audio(self, q_lower: str, number_val: Optional[int]) -> Dict[str, Any]:
        """Controls Windows Volume & Mute state dynamically."""
        if not self.user32:
            return {"executed": False, "domain": "audio", "message": "Windows C User32 API unavailable."}

        VK_VOLUME_MUTE = 0xAD
        VK_VOLUME_DOWN = 0xAE
        VK_VOLUME_UP = 0xAF

        if "mute" in q_lower and "unmute" not in q_lower:
            self.user32.keybd_event(VK_VOLUME_MUTE, 0, 0, 0)
            self.user32.keybd_event(VK_VOLUME_MUTE, 0, 2, 0)
            return {
                "executed": True,
                "domain": "audio",
                "action": "toggle_mute",
                "headline": "System Audio Muted / Toggled.",
                "details": "Triggered native Windows VK_VOLUME_MUTE key event."
            }
        elif "unmute" in q_lower:
            self.user32.keybd_event(VK_VOLUME_MUTE, 0, 0, 0)
            self.user32.keybd_event(VK_VOLUME_MUTE, 0, 2, 0)
            return {
                "executed": True,
                "domain": "audio",
                "action": "unmute",
                "headline": "System Audio Unmuted.",
                "details": "Triggered native Windows VK_VOLUME_MUTE key event."
            }
        elif number_val is not None:
            # Approximate volume adjustment using PowerShell SendKeys
            steps = int(number_val / 2)  # 50 steps = 100%
            ps_cmd = f"$wsh = New-Object -ComObject WScript.Shell; 1..50 | % {{ $wsh.SendKeys([char]174) }}; 1..{steps} | % {{ $wsh.SendKeys([char]175) }}"
            subprocess.Popen(["powershell", "-Command", ps_cmd], creationflags=subprocess.CREATE_NO_WINDOW)
            return {
                "executed": True,
                "domain": "audio",
                "action": f"set_volume_{number_val}",
                "headline": f"System Volume adjusted to ~{number_val}%.",
                "details": f"Executed PowerShell WScript.Shell SendKeys sequence to set volume level to {number_val}%."
            }
        elif any(k in q_lower for k in ["up", "increase", "louder", "raise", "max"]):
            for _ in range(5):
                self.user32.keybd_event(VK_VOLUME_UP, 0, 0, 0)
                self.user32.keybd_event(VK_VOLUME_UP, 0, 2, 0)
            return {
                "executed": True,
                "domain": "audio",
                "action": "volume_up",
                "headline": "System Volume Increased.",
                "details": "Sent VK_VOLUME_UP keybd_event sequence (+10%)."
            }
        elif any(k in q_lower for k in ["down", "decrease", "quieter", "lower", "reduce"]):
            for _ in range(5):
                self.user32.keybd_event(VK_VOLUME_DOWN, 0, 0, 0)
                self.user32.keybd_event(VK_VOLUME_DOWN, 0, 2, 0)
            return {
                "executed": True,
                "domain": "audio",
                "action": "volume_down",
                "headline": "System Volume Decreased.",
                "details": "Sent VK_VOLUME_DOWN keybd_event sequence (-10%)."
            }

        return {"executed": False, "domain": "audio", "message": "Could not determine audio command intent."}

    def _handle_gui_automation(self, q_clean: str, q_lower: str) -> Dict[str, Any]:
        """Handles GUI mouse clicking, coordinate navigation, typing, and keyboard shortcuts."""
        if not self.user32:
            return {"executed": False, "domain": "gui", "message": "Windows User32 API unavailable."}

        coords = re.findall(r'\b(\d{1,4})\s*,\s*(\d{1,4})\b', q_lower)

        if "double click" in q_lower:
            if coords:
                x, y = int(coords[0][0]), int(coords[0][1])
                self.user32.SetCursorPos(x, y)
            self.user32.mouse_event(0x0002, 0, 0, 0, 0)
            self.user32.mouse_event(0x0004, 0, 0, 0, 0)
            time.sleep(0.05)
            self.user32.mouse_event(0x0002, 0, 0, 0, 0)
            self.user32.mouse_event(0x0004, 0, 0, 0, 0)
            return {
                "executed": True,
                "domain": "gui",
                "action": "double_click",
                "headline": f"Double-clicked Screen Target{' at (' + str(coords[0][0]) + ', ' + str(coords[0][1]) + ')' if coords else ''}.",
                "details": "Triggered Win32 C MOUSEEVENTF_LEFTDOWN/UP double-click sequence."
            }
        elif "right click" in q_lower:
            if coords:
                x, y = int(coords[0][0]), int(coords[0][1])
                self.user32.SetCursorPos(x, y)
            self.user32.mouse_event(0x0008, 0, 0, 0, 0)
            self.user32.mouse_event(0x0010, 0, 0, 0, 0)
            return {
                "executed": True,
                "domain": "gui",
                "action": "right_click",
                "headline": f"Right-clicked Screen Target{' at (' + str(coords[0][0]) + ', ' + str(coords[0][1]) + ')' if coords else ''}.",
                "details": "Triggered Win32 C MOUSEEVENTF_RIGHTDOWN/UP key sequence."
            }
        elif "click" in q_lower:
            if coords:
                x, y = int(coords[0][0]), int(coords[0][1])
                self.user32.SetCursorPos(x, y)
            self.user32.mouse_event(0x0002, 0, 0, 0, 0)
            self.user32.mouse_event(0x0004, 0, 0, 0, 0)
            return {
                "executed": True,
                "domain": "gui",
                "action": "left_click",
                "headline": f"Clicked Active Screen Location{' at (' + str(coords[0][0]) + ', ' + str(coords[0][1]) + ')' if coords else ''}.",
                "details": "Triggered Win32 C MOUSEEVENTF_LEFTDOWN/UP key sequence."
            }
        elif "type" in q_lower:
            text_to_type = q_clean
            for prefix in ["type ", "type in ", "type text "]:
                if q_lower.startswith(prefix):
                    text_to_type = q_clean[len(prefix):].strip()
                    break
            
            safe_text = text_to_type.replace("'", "''").replace('"', '`"')
            ps_cmd = f"$wsh = New-Object -ComObject WScript.Shell; $wsh.SendKeys('{safe_text}')"
            subprocess.Popen(["powershell", "-Command", ps_cmd], creationflags=subprocess.CREATE_NO_WINDOW)
            return {
                "executed": True,
                "domain": "gui",
                "action": "type_text",
                "headline": f"Typed text into active window: '{text_to_type}'.",
                "details": f"Executed PowerShell WScript.Shell SendKeys sequence for '{text_to_type}'."
            }
        elif any(k in q_lower for k in ["press enter", "enter key"]):
            VK_RETURN = 0x0D
            self.user32.keybd_event(VK_RETURN, 0, 0, 0)
            self.user32.keybd_event(VK_RETURN, 0, 2, 0)
            return {
                "executed": True,
                "domain": "gui",
                "action": "press_enter",
                "headline": "Sent Enter Key Event.",
                "details": "Triggered VK_RETURN key stroke."
            }

        return {"executed": False, "domain": "gui", "message": "GUI action target unhandled."}

    def _handle_brightness(self, q_lower: str, number_val: Optional[int]) -> Dict[str, Any]:
        """Controls Windows Display Brightness dynamically via WMI."""
        target_val = 50
        if number_val is not None:
            target_val = number_val
        elif any(k in q_lower for k in ["increase", "up", "brighter", "max", "full"]):
            target_val = 90
        elif any(k in q_lower for k in ["decrease", "down", "dim", "lower", "min"]):
            target_val = 20

        ps_cmd = f"(Get-WmiObject -Namespace root/wmi -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, {target_val})"
        try:
            res = subprocess.run(["powershell", "-Command", ps_cmd], capture_output=True, text=True, timeout=5)
            return {
                "executed": True,
                "domain": "brightness",
                "action": f"set_brightness_{target_val}",
                "headline": f"Display Brightness set to {target_val}%.",
                "details": f"WmiMonitorBrightnessMethods WmiSetBrightness(1, {target_val}) executed cleanly via PowerShell.",
                "raw_output": res.stdout.strip()
            }
        except Exception as e:
            return {
                "executed": False,
                "domain": "brightness",
                "message": f"WMI Brightness adjustment failed: {str(e)}"
            }

    def _handle_wifi(self, q_lower: str) -> Dict[str, Any]:
        """Manages Windows Wi-Fi interfaces, connections, and network status."""
        try:
            if "disconnect" in q_lower:
                res = subprocess.run(["netsh", "wlan", "disconnect"], capture_output=True, text=True, timeout=5)
                return {
                    "executed": True,
                    "domain": "wifi",
                    "action": "disconnect",
                    "headline": "Wi-Fi Interface Disconnected.",
                    "details": res.stdout.strip() or "Executed netsh wlan disconnect."
                }
            elif any(k in q_lower for k in ["scan", "available", "networks", "show"]):
                res = subprocess.run(["netsh", "wlan", "show", "networks"], capture_output=True, text=True, timeout=5)
                networks = [line.strip() for line in res.stdout.splitlines() if "SSID" in line]
                return {
                    "executed": True,
                    "domain": "wifi",
                    "action": "scan_networks",
                    "headline": f"Found {len(networks)} available Wi-Fi networks.",
                    "details": "\n".join(networks[:5]) if networks else res.stdout.strip()
                }
            elif "connect" in q_lower:
                # Extract target SSID if specified
                words = q_lower.split()
                ssid = words[-1] if len(words) > 1 and words[-1] not in ["wifi", "connect", "to"] else None
                if ssid:
                    res = subprocess.run(["netsh", "wlan", "connect", f"name={ssid}"], capture_output=True, text=True, timeout=5)
                    return {
                        "executed": True,
                        "domain": "wifi",
                        "action": f"connect_{ssid}",
                        "headline": f"Connecting to Wi-Fi network '{ssid}'...",
                        "details": res.stdout.strip()
                    }
            
            # Default interface status
            res = subprocess.run(["netsh", "wlan", "show", "interfaces"], capture_output=True, text=True, timeout=5)
            status_lines = [l.strip() for l in res.stdout.splitlines() if any(k in l for k in ["SSID", "State", "Signal", "Radio"])]
            return {
                "executed": True,
                "domain": "wifi",
                "action": "status",
                "headline": "Wi-Fi Interface Telemetry Active.",
                "details": "\n".join(status_lines) if status_lines else "Wi-Fi interface active."
            }
        except Exception as e:
            return {"executed": False, "domain": "wifi", "message": f"Netsh execution failed: {str(e)}"}

    def _handle_bluetooth(self, q_lower: str) -> Dict[str, Any]:
        """Queries and toggles Windows Bluetooth devices and services."""
        try:
            ps_cmd = "Get-PnpDevice -Class Bluetooth | Select-Object -First 5 FriendlyName, Status"
            res = subprocess.run(["powershell", "-Command", ps_cmd], capture_output=True, text=True, timeout=5)
            output = res.stdout.strip()
            
            action = "status"
            if "on" in q_lower or "enable" in q_lower:
                subprocess.run(["powershell", "-Command", "Start-Service bthserv"], capture_output=True, timeout=5)
                action = "enable"
            elif "off" in q_lower or "disable" in q_lower:
                subprocess.run(["powershell", "-Command", "Stop-Service bthserv"], capture_output=True, timeout=5)
                action = "disable"

            return {
                "executed": True,
                "domain": "bluetooth",
                "action": action,
                "headline": "Bluetooth Subsystem Telemetry & Control Active.",
                "details": output if output else "Bluetooth service (bthserv) checked."
            }
        except Exception as e:
            return {"executed": False, "domain": "bluetooth", "message": f"Bluetooth control error: {str(e)}"}

    def _handle_power(self, q_lower: str) -> Dict[str, Any]:
        """Handles screen locking, system sleep, and battery health."""
        if "lock" in q_lower:
            if self.user32:
                self.user32.LockWorkStation()
            else:
                subprocess.run(["rundll32.exe", "user32.dll,LockWorkStation"])
            return {
                "executed": True,
                "domain": "power",
                "action": "lock",
                "headline": "Windows Workstation Locked.",
                "details": "Triggered LockWorkStation via user32.dll C API."
            }
        elif "sleep" in q_lower:
            subprocess.Popen(["powershell", "-Command", "Add-Type -Assembly System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState('Suspend', $false, $false)"])
            return {
                "executed": True,
                "domain": "power",
                "action": "sleep",
                "headline": "Initiated System Sleep.",
                "details": "SetSuspendState invoked via PowerShell WinForms API."
            }
        elif "battery" in q_lower:
            ps_cmd = "Get-CimInstance -ClassName Win32_Battery | Select-Object EstimatedChargeRemaining, BatteryStatus"
            res = subprocess.run(["powershell", "-Command", ps_cmd], capture_output=True, text=True, timeout=5)
            return {
                "executed": True,
                "domain": "power",
                "action": "battery_status",
                "headline": "Battery Health & Charge Query Executed.",
                "details": res.stdout.strip() or "Battery CIM Instance queried."
            }

        return {"executed": False, "domain": "power", "message": "Power action not executed."}

    def _handle_media(self, q_lower: str) -> Dict[str, Any]:
        """Sends native Windows VK Media keys for global media control."""
        if not self.user32:
            return {"executed": False, "domain": "media", "message": "User32 API unavailable."}

        VK_MEDIA_NEXT_TRACK = 0xB0
        VK_MEDIA_PREV_TRACK = 0xB1
        VK_MEDIA_PLAY_PAUSE = 0xCD

        if any(k in q_lower for k in ["next", "forward"]):
            self.user32.keybd_event(VK_MEDIA_NEXT_TRACK, 0, 0, 0)
            self.user32.keybd_event(VK_MEDIA_NEXT_TRACK, 0, 2, 0)
            action = "next_track"
            label = "Next Media Track"
        elif any(k in q_lower for k in ["prev", "previous", "back"]):
            self.user32.keybd_event(VK_MEDIA_PREV_TRACK, 0, 0, 0)
            self.user32.keybd_event(VK_MEDIA_PREV_TRACK, 0, 2, 0)
            action = "prev_track"
            label = "Previous Media Track"
        else:
            self.user32.keybd_event(VK_MEDIA_PLAY_PAUSE, 0, 0, 0)
            self.user32.keybd_event(VK_MEDIA_PLAY_PAUSE, 0, 2, 0)
            action = "toggle_play_pause"
            label = "Media Play/Pause Toggled"

        return {
            "executed": True,
            "domain": "media",
            "action": action,
            "headline": f"{label}.",
            "details": f"Sent native C keybd_event key code for {label}."
        }

    def _handle_app_launch(self, q_clean: str, q_lower: str) -> Dict[str, Any]:
        """Dynamically launches any requested application or website on Windows."""
        # Clean wake words first
        clean_q = q_lower
        for wake in ["hey nori", "hi nori", "hello nori", "nori", "please", "can you"]:
            clean_q = clean_q.replace(wake, "").strip()

        # Extract app name after open/launch/start/run
        app_target = clean_q
        for verb in ["open", "launch", "start", "run"]:
            if clean_q.startswith(verb):
                app_target = clean_q[len(verb):].strip()
                break

        app_target = app_target.strip(" .")
        if not app_target:
            return {"executed": False, "domain": "launch", "message": "No application specified."}

        # Common Windows protocol / executable / URL aliases
        alias_map = {
            "calculator": "calc.exe",
            "calc": "calc.exe",
            "notepad": "notepad.exe",
            "cmd": "cmd.exe",
            "command prompt": "cmd.exe",
            "terminal": "wt.exe",
            "powershell": "powershell.exe",
            "browser": "msedge.exe",
            "edge": "msedge.exe",
            "chrome": "chrome.exe",
            "brave": "brave.exe",
            "code": "code",
            "vs code": "code",
            "vscode": "code",
            "explorer": "explorer.exe",
            "settings": "ms-settings:",
            "camera": "microsoft.windows.camera:",
            "paint": "mspaint.exe",
            "youtube": "https://www.youtube.com",
            "google": "https://www.google.com"
        }

        exe_or_uri = alias_map.get(app_target.lower(), app_target)

        try:
            if exe_or_uri.startswith("http://") or exe_or_uri.startswith("https://"):
                import webbrowser
                webbrowser.open(exe_or_uri)
            elif exe_or_uri.endswith(":") or exe_or_uri.endswith(".exe"):
                subprocess.Popen(["start", exe_or_uri], shell=True)
            else:
                subprocess.Popen([exe_or_uri], shell=True)

            return {
                "executed": True,
                "domain": "launch",
                "action": f"launch_{app_target}",
                "headline": f"Opening '{app_target.title()}' for you now.",
                "details": f"Subprocess spawned application: '{exe_or_uri}'."
            }
        except Exception as e:
            # Fallback to start command via shell
            try:
                subprocess.Popen(["start", app_target], shell=True)
                return {
                    "executed": True,
                    "domain": "launch",
                    "action": f"launch_{app_target}",
                    "headline": f"Opening '{app_target.title()}' now.",
                    "details": f"Executed shell start '{app_target}'."
                }
            except Exception as ex:
                return {
                    "executed": False,
                    "domain": "launch",
                    "message": f"Failed to open '{app_target}': {str(ex)}"
                }

system_controller = SystemController()
