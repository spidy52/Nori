"""
Nori Universal Desktop Automation & OS App Controller
Launches and activates ANY Windows applications (VS Code, Brave, Chrome, Nori Workspace,
Notepad, Calculator, Spotify, Explorer, etc.) and performs window control.
"""

import os
import sys
import time
import subprocess
import platform
import logging
import webbrowser
from typing import Optional, Dict, Any, List

logger = logging.getLogger("nori.desktop")
logging.basicConfig(level=logging.INFO)

try:
    import pyautogui
    pyautogui.FAILSAFE = False
except Exception:
    pass

def resolve_folder_path(folder_query: str) -> str:
    """Resolve a spoken query or folder name into an absolute filesystem path."""
    f_lower = (folder_query or "").lower().strip()
    home = os.path.expanduser("~")
    desktop_dir = os.path.join(home, "Desktop")
    docs_dir = os.path.join(home, "Documents")
    downloads_dir = os.path.join(home, "Downloads")

    cleaned = (
        f_lower.replace("open folder in vscode", "")
        .replace("open folder in vs code", "")
        .replace("open in vscode", "")
        .replace("open in vs code", "")
        .replace("open folder", "")
        .replace("open project", "")
        .replace("open app", "")
        .replace("open", "")
        .replace("in vscode", "")
        .replace("in vs code", "")
        .replace("folder", "")
        .replace("project", "")
        .strip(' "/\'')
    )

    if not cleaned or "nori" in cleaned:
        return os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    if "vesper" in cleaned:
        vesper_desk = os.path.join(desktop_dir, "vesper")
        if os.path.exists(vesper_desk):
            return vesper_desk

    if os.path.exists(cleaned):
        return os.path.abspath(cleaned)

    # Check Desktop subfolders
    if os.path.exists(desktop_dir):
        for item in os.listdir(desktop_dir):
            full_path = os.path.join(desktop_dir, item)
            if os.path.isdir(full_path) and (cleaned in item.lower() or item.lower() in cleaned):
                return full_path

    # Check Documents subfolders
    if os.path.exists(docs_dir):
        for item in os.listdir(docs_dir):
            full_path = os.path.join(docs_dir, item)
            if os.path.isdir(full_path) and (cleaned in item.lower() or item.lower() in cleaned):
                return full_path

    return desktop_dir

def activate_window(app_name: str) -> bool:
    """Bring requested application window (VS Code, Brave, Chrome, etc.) to foreground."""
    if platform.system() != "Windows":
        return False

    target = (app_name or "").lower().strip()
    aliases = {
        "vscode": ["visual studio code", "code"],
        "vs code": ["visual studio code", "code"],
        "code": ["visual studio code", "code"],
        "brave": ["brave", "brave browser"],
        "chrome": ["chrome", "google chrome"],
        "edge": ["msedge", "edge", "microsoft edge"],
        "notepad": ["notepad"],
        "calc": ["calculator", "calc"],
        "spotify": ["spotify"],
        "discord": ["discord"],
        "nori": ["nori", "vite", "localhost:5173", "localhost"],
    }
    search_terms = aliases.get(target, [target])

    try:
        import ctypes
        user32 = ctypes.windll.user32
        # Tap Alt key to bypass Windows SetForegroundWindow lock
        user32.keybd_event(0x12, 0, 0, 0)
        time.sleep(0.02)
        user32.keybd_event(0x12, 0, 2, 0)

        found_hwnd = None
        WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)

        def enum_cb(hwnd, _):
            nonlocal found_hwnd
            if user32.IsWindowVisible(hwnd):
                length = user32.GetWindowTextLengthW(hwnd)
                if length > 0:
                    buff = ctypes.create_unicode_buffer(length + 1)
                    user32.GetWindowTextW(hwnd, buff, length + 1)
                    title = buff.value.lower()
                    if any(term in title for term in search_terms):
                        found_hwnd = hwnd
                        return False
            return True

        user32.EnumWindows(WNDENUMPROC(enum_cb), 0)
        if found_hwnd:
            user32.ShowWindow(found_hwnd, 9)  # SW_RESTORE
            user32.BringWindowToTop(found_hwnd)
            user32.SetForegroundWindow(found_hwnd)
            return True
    except Exception as e:
        logger.warning(f"Window activate notice: {e}")

    return False

def launch_any_app(app_query: str) -> bool:
    """Launches or brings to front ANY requested Windows app or workspace."""
    raw = (app_query or "").lower().strip()
    # Clean prefix tokens
    cleaned = (
        raw.replace("can you please", "")

        .replace("could you please", "")
        .replace("can you", "")
        .replace("could you", "")
        .replace("please", "")
        .replace("open app", "")
        .replace("launch app", "")
        .replace("start app", "")
        .replace("open my", "")
        .replace("launch my", "")
        .replace("open the", "")
        .replace("open", "")
        .replace("launch", "")
        .replace("start", "")
        .strip()
    )

    # 0. Reject math expressions and conversational questions immediately
    math_indicators = ["plus", "minus", "times", "multiplied", "divided by", "divide by", "over", "+", "-", "*", "/", "sum of", "drain plus", "equals", "?"]
    if any(w in cleaned for w in math_indicators):
        logger.info(f"Skipping app launch for math query: {cleaned}")
        return False

    # 1. Calculator (Only launch if explicitly requesting the calculator tool/app)
    if cleaned in ["calc", "calculator", "caliculate", "calculate"] or cleaned.endswith("calculator") or cleaned.endswith("calc"):
        subprocess.Popen("start calc:", shell=True)
        time.sleep(0.3)
        activate_window("calc")
        return True

    # 2. Notepad & Text Editor
    if any(k in cleaned for k in ["notepad", "text editor", "notes"]):
        subprocess.Popen(["notepad.exe"])
        time.sleep(0.2)
        activate_window("notepad")
        return True

    # 3. Terminal & PowerShell & Command Prompt
    if any(k in cleaned for k in ["terminal", "powershell", "cmd", "command prompt", "bash"]):
        try:
            subprocess.Popen("start wt.exe", shell=True)
        except Exception:
            subprocess.Popen("start powershell.exe", shell=True)
        return True

    # 4. Nori Workspace / Web Studio
    if any(k in cleaned for k in ["nori", "workspace", "studio", "canvas", "website", "dashboard"]):
        url = "http://localhost:5173"
        for p in [5173, 5174, 5175]:
            try:
                import urllib.request
                urllib.request.urlopen(f"http://localhost:{p}", timeout=0.2)
                url = f"http://localhost:{p}"
                break
            except Exception:
                pass
        open_url_in_browser(url, "brave")
        return True

    # 5. Visual Studio Code
    if any(k in cleaned for k in ["vscode", "vs code", "visual studio code", "code"]):
        folder = resolve_folder_path(cleaned)
        try:
            subprocess.Popen(f'code "{folder}"', shell=True)
            time.sleep(0.5)
            activate_window("vscode")
            return True
        except Exception:
            pass

    # 6. Task Manager, Paint, Settings
    if "task manager" in cleaned or "taskmgr" in cleaned:
        subprocess.Popen("taskmgr.exe", shell=True)
        return True
    if "paint" in cleaned or "mspaint" in cleaned:
        subprocess.Popen("mspaint.exe", shell=True)
        return True
    if "settings" in cleaned:
        subprocess.Popen("start ms-settings:", shell=True)
        return True

    # 7. Web Shortcuts & Websites
    if "youtube" in cleaned:
        open_url_in_browser("https://www.youtube.com", "brave")
        return True
    if "github" in cleaned:
        open_url_in_browser("https://www.github.com", "brave")
        return True
    if "gmail" in cleaned:
        open_url_in_browser("https://mail.google.com", "brave")
        return True
    if "google" in cleaned:
        open_url_in_browser("https://www.google.com", "brave")
        return True

    # 8. Brave Browser
    if "brave" in cleaned:
        if activate_window("brave"):
            return True
        brave_paths = [
            r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
            os.path.expandvars(r"%LocalAppData%\BraveSoftware\Brave-Browser\Application\brave.exe"),
            os.path.expandvars(r"%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe"),
        ]
        for bp in brave_paths:
            if os.path.exists(bp):
                subprocess.Popen([bp])
                time.sleep(0.3)
                activate_window("brave")
                return True
        webbrowser.open("https://google.com")
        return True

    # 9. Google Chrome
    if "chrome" in cleaned:
        if activate_window("chrome"):
            return True
        chrome_paths = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        ]
        for cp in chrome_paths:
            if os.path.exists(cp):
                subprocess.Popen([cp])
                time.sleep(0.3)
                activate_window("chrome")
                return True
        webbrowser.open("https://google.com")
        return True

    # 10. File Explorer
    if any(k in cleaned for k in ["explorer", "files", "folder", "downloads", "desktop", "documents"]):
        target_dir = resolve_folder_path(cleaned)
        subprocess.Popen(f'explorer.exe "{target_dir}"', shell=True)
        return True

    # 11. Generic App Launch (Strictly validated, 1-2 words only, no shell crashes)
    words = cleaned.split()
    if words and len(words) <= 2:
        safe_app = re.sub(r'[^a-zA-Z0-9_\-\.]', '', words[0])
        if safe_app and len(safe_app) >= 2 and safe_app.lower() not in ["what", "how", "why", "when", "can", "could", "would", "is", "are", "do", "does", "my", "your", "the"]:
            try:
                subprocess.Popen(f'start {safe_app}', shell=True)
                time.sleep(0.3)
                activate_window(safe_app)
                return True
            except Exception as e:
                logger.debug(f"Generic start notice for '{safe_app}': {e}")
    return False

def close_active_window() -> bool:
    """Closes the current active foreground window."""
    try:
        import ctypes
        user32 = ctypes.windll.user32
        hwnd = user32.GetForegroundWindow()
        if hwnd:
            user32.PostMessageW(hwnd, 0x0010, 0, 0)  # WM_CLOSE
            return True
    except Exception as e:
        logger.warning(f"Close window failed: {e}")
    return False

def minimize_active_window() -> bool:
    """Minimizes the current active foreground window."""
    try:
        import ctypes
        user32 = ctypes.windll.user32
        hwnd = user32.GetForegroundWindow()
        if hwnd:
            user32.ShowWindow(hwnd, 6)  # SW_MINIMIZE
            return True
    except Exception as e:
        logger.warning(f"Minimize window failed: {e}")
    return False

def open_folder_in_vscode(path_or_query: str) -> bool:
    """Open given folder path or query in Visual Studio Code."""
    return launch_any_app(f"vscode {path_or_query}")

def open_url_in_browser(url: str, browser: str = "brave") -> bool:
    """
    Open URL in existing browser tab if browser is open, or launches browser if not running.
    Reuses the active tab by focusing the address bar, preventing multiple unwanted tabs.
    """
    # 1. Try activating existing browser window first
    is_open = activate_window(browser) or (browser.lower() == "brave" and activate_window("chrome"))
    
    if is_open:
        try:
            import pyperclip
            import pyautogui
            time.sleep(0.12)
            pyperclip.copy(url)
            # Focus address bar
            pyautogui.hotkey('ctrl', 'l')
            time.sleep(0.06)
            # Paste new destination URL
            pyautogui.hotkey('ctrl', 'v')
            time.sleep(0.04)
            # Navigate current tab
            pyautogui.press('enter')
            return True
        except Exception as e:
            logger.warning(f"In-place tab navigation notice: {e}")

    # 2. Browser was not open or automation fallback: Launch new instance
    brave_paths = [
        r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
        os.path.expandvars(r"%LocalAppData%\BraveSoftware\Brave-Browser\Application\brave.exe"),
        os.path.expandvars(r"%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe"),
    ]
    if browser.lower() == "brave":
        for bp in brave_paths:
            if os.path.exists(bp):
                try:
                    subprocess.Popen([bp, url])
                    time.sleep(0.4)
                    activate_window("brave")
                    return True
                except Exception:
                    pass

    webbrowser.open(url)
    return True

def search_web_or_youtube(query: str, engine: str = "google") -> bool:
    """Searches Google or YouTube in the active browser tab and brings window to front."""
    import urllib.parse
    clean_q = query.strip()
    encoded = urllib.parse.quote_plus(clean_q)
    if "youtube" in engine.lower() or "video" in engine.lower() or "play" in query.lower():
        url = f"https://www.youtube.com/results?search_query={encoded}"
    else:
        url = f"https://www.google.com/search?q={encoded}"
    
    return open_url_in_browser(url, browser="brave")

# -------------------------------------------------------------
# PC Screen Perception & Autonomous OS Desktop Manipulation
# -------------------------------------------------------------

def see_screen() -> Dict[str, Any]:
    """
    Captures the active Windows PC screen, inspects active window,
    computes screen resolution, and creates visual representation.
    """
    import base64
    import io
    from backend.digital.observer import live_observer
    active_win = live_observer.get_real_active_window()

    b64 = None
    res_str = "1920x1080"
    try:
        from PIL import ImageGrab
        screenshot = ImageGrab.grab()
        width, height = screenshot.size
        res_str = f"{width}x{height}"
        thumb = screenshot.copy()
        thumb.thumbnail((800, 450))
        buffer = io.BytesIO()
        thumb.save(buffer, format="JPEG", quality=75)
        b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    except Exception as e:
        logger.warning(f"Direct display pixel capture notice (using window geometry): {e}")
        try:
            import win32api, win32con
            w = win32api.GetSystemMetrics(win32con.SM_CXSCREEN)
            h = win32api.GetSystemMetrics(win32con.SM_CYSCREEN)
            res_str = f"{w}x{h}"
        except Exception:
            pass

    return {
        "success": True,
        "resolution": res_str,
        "active_window": active_win.model_dump(),
        "image_base64": b64,
        "summary": f"Active in {active_win.app_name}: '{active_win.title}' (Display: {res_str})"
    }

def type_on_screen(text: str, press_enter: bool = False, target_app: Optional[str] = None) -> bool:
    """
    Types text into the active Windows foreground window or target application.
    Uses clipboard paste for fast, 100% accurate typing with zero character drops.
    """
    import pyperclip
    import pyautogui

    try:
        if target_app:
            activate_window(target_app)
            time.sleep(0.15)

        # Fast and reliable text insertion via clipboard
        pyperclip.copy(text)
        time.sleep(0.04)
        pyautogui.hotkey('ctrl', 'v')

        if press_enter:
            time.sleep(0.04)
            pyautogui.press('enter')

        return True
    except Exception as e:
        logger.error(f"type_on_screen error: {e}")
        return False

def press_hotkey(*keys) -> bool:
    """Executes a hotkey sequence on the active window (e.g. 'ctrl', 's')."""
    import pyautogui
    try:
        pyautogui.hotkey(*keys)
        return True
    except Exception as e:
        logger.error(f"press_hotkey error: {e}")
        return False

def click_screen(x: int, y: int, clicks: int = 1) -> bool:
    """Moves mouse to (x, y) and performs click."""
    import pyautogui
    try:
        pyautogui.click(x=x, y=y, clicks=clicks)
        return True
    except Exception as e:
        logger.error(f"click_screen error: {e}")
        return False

def execute_desktop_task(instruction: str) -> Dict[str, Any]:
    """
    Autonomous Desktop Agent: Parses natural language OS instructions,
    manipulates windows, types text, launches applications, and conducts tasks.
    """
    raw = instruction.strip()
    lower = raw.lower()

    logger.info(f"[Desktop Agent Executing Task]: '{instruction}'")

    # 1. Type text into Notepad or active window
    if lower.startswith("type ") or "write " in lower:
        # Extract text to type
        text_to_type = raw
        target_app = None

        if " in notepad" in lower or " into notepad" in lower:
            target_app = "notepad"
            launch_any_app("notepad")
            time.sleep(0.3)
        elif " in vscode" in lower or " in vs code" in lower or " in code" in lower:
            target_app = "vscode"
            activate_window("vscode")
            time.sleep(0.2)

        # Clean instruction prefix
        for prefix in ["type ", "write ", "please type ", "please write "]:
            if lower.startswith(prefix):
                text_to_type = text_to_type[len(prefix):].strip()
                break

        # Remove trailing app target phrases
        for suffix in [" in notepad", " into notepad", " in vscode", " in vs code", " in code"]:
            if text_to_type.lower().endswith(suffix):
                text_to_type = text_to_type[:-len(suffix)].strip(' "\'')
                break

        text_to_type = text_to_type.strip(' "\'')
        success = type_on_screen(text_to_type, press_enter=True, target_app=target_app)
        return {
            "success": success,
            "action": "typed_text",
            "message": f"Typed '{text_to_type[:40]}' into {target_app or 'active window'}."
        }

    # 2. Search Web or YouTube
    if any(lower.startswith(w) for w in ["search for", "search", "google", "look up", "find", "play"]):
        search_web_or_youtube(raw)
        return {
            "success": True,
            "action": "web_search",
            "message": f"Searching for '{raw}'."
        }

    # 3. Open or Launch Application
    if lower.startswith("open ") or lower.startswith("launch "):
        app_name = raw.replace("open ", "").replace("launch ", "").strip()
        launch_any_app(app_name)
        return {
            "success": True,
            "action": "launch_app",
            "message": f"Opened {app_name}."
        }

    # 4. See / Read Screen
    if any(k in lower for k in ["see screen", "read screen", "look at my screen", "what's on my screen", "screenshot"]):
        screen_data = see_screen()
        return {
            "success": True,
            "action": "see_screen",
            "screen_info": screen_data,
            "message": screen_data.get("summary", "Screen inspected successfully.")
        }

    # 5. Window control (minimize, close)
    if "minimize" in lower:
        minimize_active_window()
        return {"success": True, "action": "minimize_window", "message": "Minimized active window."}

    if "close window" in lower or "close app" in lower:
        close_active_window()
        return {"success": True, "action": "close_window", "message": "Closed active window."}

    # 6. Save active document (Ctrl+S)
    if "save" in lower or "save file" in lower:
        press_hotkey('ctrl', 's')
        return {"success": True, "action": "save_file", "message": "Saved active file (Ctrl+S)."}

    # Default fallback: Type or search
    return {
        "success": True,
        "action": "generic_task",
        "message": f"Received desktop instruction: {instruction}"
    }


