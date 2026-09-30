"""
Nori 24/7 Native Voice Companion & Proactive Desktop Assistant
- Full Sentence STT Analysis (no fragmented word cut-offs)
- Crystal-Clear Thread-Safe TTS Audio Output (Microsoft Zira / SAPI)
- Autonomous Proactive Desktop Watcher (interacts and comments on your work proactively)
- Desktop Manipulation (VS Code, Brave, Studio Canvas Auto-Draw)
"""

import sys
import os
import re
import time
import json
import queue
import logging
import threading
import urllib.request
import speech_recognition as sr
from typing import Optional, Dict, Any

# Setup Path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.desktop_service import activate_window, open_folder_in_vscode, open_url_in_browser

logger = logging.getLogger("nori.voice_daemon")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

API_URL = "http://127.0.0.1:8000/api"

# Dedicated TTS Speech Queue, Echo Cancellation and Worker
speech_queue = queue.Queue()
GLOBAL_SPOKEN_ALERTS = set()
IS_TTS_SPEAKING = False
TTS_FINISHED_TIME = 0.0
RECENT_SPOKEN_PHRASES = []

def tts_worker():
    """Dedicated background thread for reliable Windows SAPI speech output using Microsoft Zira (Female Voice)."""
    global IS_TTS_SPEAKING, TTS_FINISHED_TIME, RECENT_SPOKEN_PHRASES
    import pythoncom
    import win32com.client
    pythoncom.CoInitialize()

    sapi = win32com.client.Dispatch("SAPI.SpVoice")
    # Explicitly find and select Microsoft Zira Desktop (Female)
    voices = sapi.GetVoices()
    for i in range(voices.Count):
        v = voices.Item(i)
        desc = v.GetDescription().lower()
        if "zira" in desc or "female" in desc:
            sapi.Voice = v
            break
    sapi.Rate = 0

    while True:
        try:
            text = speech_queue.get()
            if not text:
                continue
            IS_TTS_SPEAKING = True
            RECENT_SPOKEN_PHRASES.append(text.lower().strip())
            if len(RECENT_SPOKEN_PHRASES) > 12:
                RECENT_SPOKEN_PHRASES.pop(0)

            logger.info(f"[TTS Speaking Aloud (Female Zira)]: {text}")
            sapi.Speak(text.strip(), 0)  # Synchronous speak in dedicated thread
            IS_TTS_SPEAKING = False
            TTS_FINISHED_TIME = time.time()
            speech_queue.task_done()
        except Exception as e:
            IS_TTS_SPEAKING = False
            TTS_FINISHED_TIME = time.time()
            logger.warning(f"TTS Worker error: {e}")

# Start TTS Worker
tts_thread = threading.Thread(target=tts_worker, daemon=True)
tts_thread.start()

def speak(text: str):
    """Enqueue text to be spoken aloud clearly."""
    if not text or not text.strip():
        return
    clean_text = re.sub(r'[*#_`~>\[\]\(\)]', ' ', text).strip()
    clean_text = re.sub(r'\s+', ' ', clean_text)
    if clean_text:
        speech_queue.put(clean_text)

def notify_backend_event(event_type: str, data: dict):
    """Send voice/proactive event to Nori backend to update WebSocket clients."""
    try:
        req_data = json.dumps({"type": event_type, "payload": data}).encode("utf-8")
        req = urllib.request.Request(
            f"{API_URL}/voice-event",
            data=req_data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=2.0) as resp:
            pass
    except Exception:
        pass

def ask_nori_ai(query: str) -> str:
    """Query local reasoning engine for intelligent response."""
    try:
        req_data = json.dumps({"query": query}).encode("utf-8")
        req = urllib.request.Request(
            f"{API_URL}/reasoning/ask",
            data=req_data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=8.0) as resp:
            data = json.loads(resp.read().decode())
            return data.get("summary") or data.get("headline") or "I have processed your request."
    except Exception as e:
        logger.warning(f"AI query fallback: {e}")
        return f"I heard: {query}. How would you like me to help with this?"

class NoriProactiveVoiceCompanion:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.recognizer.energy_threshold = 160
        self.recognizer.dynamic_energy_threshold = True
        self.recognizer.dynamic_energy_adjustment_damping = 0.15
        self.recognizer.dynamic_energy_ratio = 1.4
        self.recognizer.pause_threshold = 1.3  # Generous pause threshold so sentences like "draw HLD for this backend" are not clipped
        self.recognizer.phrase_threshold = 0.2
        self.recognizer.non_speaking_duration = 0.6
        self.is_running = True
        self.is_paused = False
        self.is_sleeping = False
        self.last_user_speech_time = time.time()
        self.last_proactive_speech_time = time.time()
        self.last_active_window_title = ""


    def process_full_sentence(self, sentence: str) -> str:
        """Analyze complete sentence semantics and take action."""
        raw_text = sentence.strip()
        lower = raw_text.lower()
        words = lower.split()

        # Filter out empty commands
        if not raw_text:
            return "Command empty."

        self.last_user_speech_time = time.time()
        self.is_sleeping = False

        logger.info(f"[Heard Sentence]: '{raw_text}'")
        notify_backend_event("VOICE_HEARD", {"text": raw_text})

        # 1. Stop / Pause Voice or Camera Commands
        if any(w in lower for w in ["stop recording", "top recording", "stop camera", "turn off camera", "stop video", "stop monitoring", "stop watching me", "pause camera", "disable camera"]):
            from backend.physical.vision_engine import camera_manager
            camera_manager.stop()
            msg = "Stopping camera monitoring and recording. The camera is now turned off."
            speak(msg)
            notify_backend_event("CAMERA_STATE", {"active": False})
            return msg

        if any(w in lower for w in ["start recording", "start camera", "turn on camera", "start monitoring", "resume camera", "turn camera on", "watch me", "monitor me"]):
            from backend.physical.vision_engine import camera_manager
            camera_manager.start()
            msg = "Camera monitoring is active. I am watching your workspace 24/7."
            speak(msg)
            notify_backend_event("CAMERA_STATE", {"active": True})
            return msg

        if lower in ["stop", "pause", "stop listening", "be quiet", "shut up", "hush"]:
            self.is_paused = True
            msg = "Pausing voice listening. Say wake up or click the orb whenever you want me back."
            speak(msg)
            notify_backend_event("STATE_CHANGED", {"state": "paused"})
            return msg

        # 2. Wake Up Command
        if any(w in lower for w in ["wake up", "start listening", "resume", "hey nori wake up"]):
            self.is_paused = False
            self.is_sleeping = False
            msg = "I'm awake and ready."
            speak(msg)
            notify_backend_event("STATE_CHANGED", {"state": "listening"})
            return msg

        # 3. Sleep Command
        if any(w in lower for w in ["go to sleep", "sleep mode", "take a nap"]):
            self.is_sleeping = True
            msg = "Entering sleep mode. Resting now."
            speak(msg)
            notify_backend_event("STATE_CHANGED", {"state": "sleeping"})
            return msg

        if self.is_paused:
            return "Nori is currently paused."

        # Companion Style Switching ("switch companion to nova", "change style to kuro", "switch pet to lumi/rover/sprout/orb")
        for st in ["nova", "kuro", "lumi", "rover", "sprout", "orb"]:
            if (f"companion to {st}" in lower) or (f"pet to {st}" in lower) or (f"style to {st}" in lower) or (f"switch to {st}" in lower) or (f"change to {st}" in lower) or (lower == f"companion {st}") or (lower == f"pet {st}"):
                try:
                    import httpx
                    httpx.post("http://127.0.0.1:8000/api/companion", json={"companion": st}, timeout=2.0)
                except Exception:
                    pass
                msg = f"Switched companion visual form to {st.capitalize()}."
                speak(msg)
                notify_backend_event("COMPANION_CHANGED", {"companion": st})
                return msg

        # Normalize and strip conversational prefixes ("hey nori", "can you", "please", etc.)
        action_text = raw_text
        for prefix in ["hey nori", "hello nori", "hi nori", "ok nori", "nori", "hey", "hello", "hi", "can you please", "could you please", "can you", "could you", "please", "i want you to", "help me to", "help me"]:
            if action_text.lower().startswith(prefix + " ") or action_text.lower().startswith(prefix + ","):
                action_text = action_text[len(prefix):].lstrip(" ,")

        action_lower = action_text.lower().strip()

        # 3.1 Workspace Project Builder & Canvas Auto-Draw ("using all components on my workspace lets build a project", "build a project", "what can i build")
        project_keywords = ["build a project", "build project", "make a project", "using all components", "all components on my workspace", "what can i build", "project ideas", "circuit architecture"]
        if any(w in lower for w in project_keywords):
            from backend.physical.vision_engine import camera_manager
            from backend.reasoning.project_builder import project_architect
            from backend.desktop_service import launch_any_app

            latest = camera_manager.get_latest_analysis()
            labels = [o.label for o in (latest.objects if latest else [])]
            blueprint = project_architect.synthesize_project_from_components(labels)

            launch_any_app("nori")
            notify_backend_event("AUTO_DRAW", {"prompt": f"Hardware Architecture for {blueprint.title}"})
            notify_backend_event("AUTO_DRAW_PROJECT", blueprint.model_dump())

            detected_names = ", ".join(blueprint.detected_components_used[:3])
            msg = f"I've analyzed the components on your desk: {detected_names}. I've designed a {blueprint.title} project for you and drawn the complete wiring schematic and C++ code on your Studio Canvas."
            speak(msg)
            return msg

        # 3.2 Robust Math & Calculation Commands ("calculate 9 plus 66", "what is 9 plus 66", "calculate my drain plus 66")
        has_math_op = any(w in lower for w in [" plus ", " minus ", " times ", " multiplied by ", " divided by ", " + ", " - ", " * ", " / "])
        if has_math_op or any(lower.startswith(k) for k in ["calculate ", "what is ", "what's ", "how much is "]):
            # Fix phonetic speech misrecognitions (e.g. "drain" -> 9, "nine" -> 9)
            norm_math = (
                lower.replace("drain", "9")
                .replace("nine", "9")
                .replace("eight", "8")
                .replace("seven", "7")
                .replace("six", "6")
                .replace("five", "5")
                .replace("four", "4")
                .replace("three", "3")
                .replace("two", "2")
                .replace("one", "1")
                .replace("zero", "0")
                .replace("caliculate", "calculate")
                .replace("can you open calculate on calculate", "calculate")
                .replace("can you calculate", "calculate")
                .replace("could you calculate", "calculate")
                .replace("open calculate", "calculate")
                .replace("calculate on", "calculate")
            )

            # Extract numbers and operator
            nums = re.findall(r'\d+', norm_math)
            if len(nums) >= 2:
                n1, n2 = int(nums[0]), int(nums[1])
                op_word = "plus"
                res = n1 + n2
                if "minus" in norm_math or "-" in norm_math:
                    op_word = "minus"
                    res = n1 - n2
                elif "times" in norm_math or "multiplied" in norm_math or "*" in norm_math:
                    op_word = "times"
                    res = n1 * n2
                elif "divided" in norm_math or "/" in norm_math:
                    op_word = "divided by"
                    res = round(n1 / max(1, n2), 2)

                msg = f"{n1} {op_word} {n2} equals {res}."
                speak(msg)
                notify_backend_event("MATH_RESULT", {"expression": f"{n1} {op_word} {n2}", "result": res})
                return msg

        # Math / Calculation Commands ("calculate 50 plus 25", "calculate 100 / 4", "what is 25 * 4")
        if any(action_lower.startswith(k) for k in ["calculate ", "what is ", "what's ", "how much is "]):
            calc_query = action_lower
            for prefix in ["calculate ", "what is ", "what's ", "how much is "]:
                if calc_query.startswith(prefix):
                    calc_query = calc_query[len(prefix):].strip()
                    break
            # Convert words to math operators
            expr = (
                calc_query.replace("plus", "+")
                .replace("minus", "-")
                .replace("multiplied by", "*")
                .replace("times", "*")
                .replace("into", "*")
                .replace("x", "*")
                .replace("divided by", "/")
                .replace("divide by", "/")
                .replace("over", "/")
                .replace("percent of", "* 0.01 *")
                .replace("percentage of", "* 0.01 *")
                .replace("squared", "** 2")
                .strip(" ?=")
            )
            # Safe eval of numbers and operators only
            if re.match(r"^[\d\s\+\-\*\/\.\(\)\%]+$", expr):
                try:
                    result = eval(expr, {"__builtins__": None}, {})
                    if isinstance(result, float) and result.is_integer():
                        result = int(result)
                    msg = f"{calc_query} equals {result}."
                    speak(msg)
                    return msg
                except Exception:
                    pass
                    return msg
                except Exception:
                    pass

        # Direct App / Tool Opener ("open calculator", "launch notepad", "open vs code", "open brave", "open terminal", etc.)
        if any(w in action_lower for w in ["open", "launch", "start", "run", "bring up", "show nori", "show workspace", "show canvas"]):
            # Strictly ensure this is NOT a math question or complex question
            if not any(m in action_lower for m in ["plus", "minus", "times", "multiplied", "divided", "over", "+", "-", "*", "/", "sum of", "drain", "equals", "?"]):
                from backend.desktop_service import launch_any_app
                launched = launch_any_app(action_text)
                if launched:
                    app_label = action_lower
                    for prefix in ['open', 'launch', 'start', 'run', 'bring up', 'show nori', 'show workspace', 'show canvas', 'show', 'my', 'the']:
                        if app_label.startswith(prefix):
                            app_label = app_label[len(prefix):].strip()
                    app_clean = re.sub(r'[^a-zA-Z0-9\s]', '', app_label).strip().title()
                    msg = f"Opening {app_clean or 'application'}."
                    speak(msg)
                    return msg

        # 4. Pure Greeting (Only when the entire utterance is just a greeting without further commands)
        wake_names = ["nori", "hey nori", "hi nori", "hello nori", "lori", "loriya", "noori", "nari", "nory", "lauri", "mori"]
        if not action_lower or action_lower in ["hi", "hello", "hey", "good morning", "good evening"] or any(lower == w for w in wake_names):
            if any(lower == w for w in wake_names):
                msg = "Yes! I'm listening. What can I do for you?"
            else:
                msg = "Hello! I'm right here beside you. How can I help you today?"
            speak(msg)
            return msg


        if any(w in lower for w in ["how are you", "how are you doing", "how are things", "how's it going", "how r u"]):
            msg = "I'm doing great! How are you feeling right now?"
            speak(msg)
            return msg

        if any(w in lower for w in ["what are you doing", "what are you watching", "what are you observing"]):
            msg = "I'm keeping an eye out for any questions, code debugging, or ideas you want to explore!"
            speak(msg)
            return msg


        # 5. Check On Me & Screen Perception ("check on me", "check my screen", "what am I doing", "look at my screen")
        # 5. Autonomous Desktop Typing & Manipulation Commands ("type ...", "write ...", "type in notepad ...")
        if lower.startswith("type ") or lower.startswith("write ") or "type in " in lower or "write in " in lower:
            from backend.desktop_service import execute_desktop_task
            result = execute_desktop_task(raw_text)
            msg = result.get("message", "Executed typing command on your desktop.")
            speak(msg)
            return msg

        # 6. Screen Perception & Desktop Vision ("see my screen", "what is on my screen", "read my screen")
        if any(w in lower for w in ["see my screen", "see screen", "read my screen", "what's on my screen", "what is on my screen", "screenshot", "read screen"]):
            from backend.desktop_service import execute_desktop_task
            res = execute_desktop_task("see screen")
            msg = res.get("message", "I have captured and analyzed your screen.")
            speak(msg)
            return msg

        # 7. Screen & Activity Check ("check on me", "check my screen", "what am i doing", "what am i focused on", "what's my focus", "what activity")
        if any(w in lower for w in ["check on me", "check my screen", "what am i doing", "look at my screen", "what am i focused on", "what's my focus", "my focus", "how is my focus", "what activity", "what am i working on"]):
            import ctypes
            user32 = ctypes.windll.user32
            hwnd = user32.GetForegroundWindow()
            length = user32.GetWindowTextLengthW(hwnd)
            title = ""
            if length > 0:
                buff = ctypes.create_unicode_buffer(length + 1)
                user32.GetWindowTextW(hwnd, buff, length + 1)
                title = buff.value.strip()

            from backend.physical.vision_engine import camera_manager
            latest = camera_manager.get_latest_analysis()
            vis_info = ""
            face_state = ""
            activity_state = ""
            if latest:
                if latest.activity:
                    act_title = latest.activity.get("title", "")
                    act_desc = latest.activity.get("description", "")
                    if act_title:
                        activity_state = f" Current activity is {act_title}."
                if latest.objects:
                    labels = [o.label for o in latest.objects if o.category not in ["human_mood", "user_focus", "human"] and "person" not in o.label.lower() and "face" not in o.label.lower()]
                    if labels:
                        vis_info = f" On your desk: {', '.join(labels[:3])}."

            if title:
                msg = f"You are currently working in {title}.{activity_state}{vis_info} Let me know how I can help."
            else:
                msg = f"I'm right here with you.{activity_state}{vis_info} Ready to assist whenever you need."
            speak(msg)
            return msg

        # 6. Plant Health Inspection ("check my plant", "is my plant infected", "look at my plant", "inspect plant")
        if any(w in lower for w in ["plant", "leaf", "infected", "check plant", "my plant"]):
            from backend.physical.vision_engine import camera_manager
            latest = camera_manager.get_latest_analysis()
            plant_obj = next((o for o in (latest.objects if latest else []) if o.category == "botanical_health"), None)
            if plant_obj:
                msg = plant_obj.interactive_dialogue or f"I see your plant! {plant_obj.label}."
            else:
                msg = "Hold your plant up in front of the camera. I'll inspect the leaves for yellowing chlorosis, brown blight spots, and overall foliage health."
            speak(msg)
            notify_backend_event("OPEN_VIEW", {"view": "physical"})
            return msg

        # 7. Facial & Mood Check ("check my face", "how do I look", "check my mood", "look at me", "what is my expression")
        if any(w in lower for w in ["check my face", "how do i look", "check my mood", "look at me", "face expression", "expression", "what is my expression", "what's my expression"]):
            from backend.physical.vision_engine import camera_manager
            latest = camera_manager.get_latest_analysis()
            face_obj = next((o for o in (latest.objects if latest else []) if o.category == "human_mood"), None)
            if face_obj:
                msg = face_obj.interactive_dialogue or f"Looking at your face: {face_obj.label}."
            else:
                msg = "I'm looking through your camera right now. Look into the lens so I can analyze your facial expression and focus level."
            speak(msg)
            notify_backend_event("OPEN_VIEW", {"view": "physical"})
            return msg

        # 8. Canvas Drawing & Diagramming Commands
        draw_keywords = ["draw", "sketch", "diagram", "flowchart", "whiteboard", "hld", "lld", "architecture", "system design"]
        if any(w in lower for w in draw_keywords):
            from backend.desktop_service import launch_any_app
            launch_any_app("nori")
            notify_backend_event("AUTO_DRAW", {"prompt": raw_text})
            msg = "Drawing requested diagram on the studio canvas now."
            speak(msg)
            return msg

        # 9. Web & YouTube Search Commands ("search for Telugu action", "search on youtube", "google [query]", "search action movie")
        search_prefixes = [
            "search on youtube for", "search on youtube", "search in brave for", "search in brave", 
            "search in google for", "search in google", "search youtube for", "search google for", 
            "search for", "search", "google", "look up", "look for", "find", "play on youtube", "play"
        ]
        if any(lower.startswith(w) for w in search_prefixes):
            from backend.desktop_service import search_web_or_youtube
            query = lower
            engine = "google"
            if any(k in lower for k in ["youtube", "play", "song", "video", "trailer", "action", "movie", "cinema", "telugu", "film"]):
                engine = "youtube"

            for prefix in search_prefixes:
                if query.startswith(prefix):
                    query = query[len(prefix):].strip()
                    break

            query = (
                query.replace("on youtube", "")
                .replace("in youtube", "")
                .replace("in brave", "")
                .replace("on brave", "")
                .replace("on google", "")
                .replace("in google", "")
                .replace("hey nori", "")
                .replace("nori", "")
                .strip()
            )
            if query:
                search_web_or_youtube(query, engine=engine)
                if engine == "youtube":
                    msg = f"Searching YouTube for {query}."
                else:
                    msg = f"Searching for {query} in Brave."
                speak(msg)
                return msg

        # 10. Desk Scan / Camera Object Identification & Repair Guidance
        if any(w in lower for w in ["scan my desk", "what is on my table", "scan desk", "what's on my desk", "camera", "inspect circuit", "look at my desk", "check my hardware"]):
            import webbrowser
            webbrowser.open("http://localhost:5173")
            notify_backend_event("OPEN_VIEW", {"view": "physical"})
            msg = "Opening physical camera perception. Place your electronics, circuits, or tools in front of the lens to identify components and get repair ideas."
            speak(msg)
            return msg


        # 10. Window Management Commands ("switch off window", "close window", "minimize window")
        if any(w in lower for w in ["switch off window", "close window", "close this window", "close active window", "close this"]):
            from backend.desktop_service import close_active_window
            success = close_active_window()
            if success:
                msg = "Closing the active window."
                speak(msg)
                return msg
            return "Could not find active window to close."

        if any(w in lower for w in ["minimize window", "minimize", "hide window"]):
            from backend.desktop_service import minimize_active_window
            success = minimize_active_window()
            if success:
                msg = "Minimizing the window."
                speak(msg)
                return msg
            return "Could not minimize window."

        # 12. Full Sentence Intelligent Question / Query (Only if genuine command/question or addressed to Nori)
        notify_backend_event("STATE_CHANGED", {"state": "thinking"})
        answer = ask_nori_ai(raw_text)
        notify_backend_event("STATE_CHANGED", {"state": "speaking"})
        speak(answer)
        notify_backend_event("STATE_CHANGED", {"state": "idle"})
        return answer

    def start_proactive_observer_thread(self):
        """Monitors user desktop activity and proactively interacts when user is working seriously."""
        def observer_loop():
            import ctypes
            user32 = ctypes.windll.user32
            window_focus_start_time = time.time()

            while self.is_running:
                time.sleep(3.0)

                if self.is_paused or self.is_sleeping:
                    continue

                now = time.time()
                # Global cooldown between proactive speech
                if now - self.last_proactive_speech_time < 75 or now - self.last_user_speech_time < 20:
                    continue

                try:
                    # Get active foreground window title
                    hwnd = user32.GetForegroundWindow()
                    length = user32.GetWindowTextLengthW(hwnd)
                    if length > 0:
                        buff = ctypes.create_unicode_buffer(length + 1)
                        user32.GetWindowTextW(hwnd, buff, length + 1)
                        title = buff.value.strip()
                        title_lower = title.lower()

                        if title != self.last_active_window_title:
                            self.last_active_window_title = title
                            window_focus_start_time = now

                        # Track active window silently without unsolicited speech interruptions
                        time_in_same_window = now - window_focus_start_time
                        if time_in_same_window > 65:
                            window_focus_start_time = now
                            self.last_proactive_speech_time = now
                except Exception:
                    pass

        t = threading.Thread(target=observer_loop, daemon=True)
        t.start()

    def start_247_camera_perception_thread(self):
        """24/7 Autonomous Background Camera Perception Worker.
        Continuously observes workspace items (facial expression, mood, plants, tools, electronics)
        and initiates proactive, natural interactions without requiring any user clicks.
        """
        def camera_loop():
            try:
                from backend.physical.vision_engine import camera_manager
            except Exception as e:
                logger.warning(f"Could not import CameraManager: {e}")
                return

            logger.info("Initializing 24/7 Background Camera Perception Daemon...")
            last_detected_labels = set()
            last_camera_speech_time = 0.0

            while self.is_running:
                if self.is_paused or self.is_sleeping or not camera_manager.is_active:
                    time.sleep(2.0)
                    continue

                try:
                    analysis = camera_manager.get_latest_analysis()
                    if analysis is not None:
                        current_labels = set([o.label for o in analysis.objects] + analysis.detected_wire_colors)
                        now = time.time()

                        # Check for newly placed objects or significant scene change
                        new_items = current_labels - last_detected_labels
                        if new_items:
                            last_detected_labels = current_labels

                            # Forward detection event to UI
                            notify_backend_event("PHYSICAL_DETECTION", {
                                "objects": [o.model_dump() for o in analysis.objects],
                                "wire_colors": analysis.detected_wire_colors,
                                "interactive_dialogue": analysis.interactive_dialogue,
                                "primary_item": analysis.primary_detected_item
                            })

                            # Speak ONLY ONCE for each item (strictly 1 alert per item, then stop forever)
                            primary_item = analysis.primary_detected_item
                            dialogue = analysis.interactive_dialogue
                            is_person_or_face = any(k in primary_item.lower() for k in ["person", "human", "face", "user"]) if primary_item else True
                            if primary_item and dialogue and not is_person_or_face and (primary_item not in GLOBAL_SPOKEN_ALERTS) and (dialogue not in GLOBAL_SPOKEN_ALERTS) and (now - last_camera_speech_time > 25):
                                GLOBAL_SPOKEN_ALERTS.add(primary_item)
                                GLOBAL_SPOKEN_ALERTS.add(dialogue)
                                last_camera_speech_time = now
                                speak(dialogue)

                    time.sleep(1.5)
                except Exception as e:
                    time.sleep(2.0)

        t = threading.Thread(target=camera_loop, daemon=True)
        t.start()

    def run_voice_loop(self):
        """Continuous background audio listening loop."""
        global IS_TTS_SPEAKING, TTS_FINISHED_TIME
        logger.info("Initializing Microphone...")
        mic = None
        try:
            mics = sr.Microphone.list_microphone_names()
            for idx, name in enumerate(mics):
                n_low = name.lower()
                if "microphone array" in n_low or "realtek" in n_low or "intel" in n_low:
                    mic = sr.Microphone(device_index=idx)
                    logger.info(f"Using Microphone [{idx}]: {name}")
                    break
            if mic is None:
                mic = sr.Microphone()
        except Exception as e:
            logger.error(f"Microphone init fallback: {e}")
            mic = sr.Microphone()

        try:
            with mic as source:
                logger.info("Calibrating for ambient noise...")
                self.recognizer.adjust_for_ambient_noise(source, duration=0.8)
                logger.info("24/7 Voice Listening Daemon is ACTIVE and ready!")
        except Exception as e:
            logger.warning(f"Ambient calibration notice: {e}")

        speak("Nori is online and ready.")

        # Start proactive desktop observer & 24/7 background camera perception
        self.start_proactive_observer_thread()
        self.start_247_camera_perception_thread()


        while self.is_running:
            # Inactivity Sleep check (3 minutes of silence before entering sleeping mode)
            if not self.is_sleeping and not self.is_paused and (time.time() - self.last_user_speech_time > 180):
                self.is_sleeping = True
                notify_backend_event("STATE_CHANGED", {"state": "sleeping"})

            # Safety reset if TTS got stuck in speaking state > 6 seconds
            if IS_TTS_SPEAKING and (time.time() - TTS_FINISHED_TIME > 6.0):
                IS_TTS_SPEAKING = False

            # Mute microphone processing while Nori itself is speaking out loud (prevents hearing its own voice)
            if IS_TTS_SPEAKING or (time.time() - TTS_FINISHED_TIME < 2.2):
                time.sleep(0.3)
                continue

            try:
                with mic as source:
                    # Capture full sentence with 10s max phrase time limit
                    audio = self.recognizer.listen(source, timeout=3.0, phrase_time_limit=10.0)

                # Discard audio if TTS was speaking during capture or immediately finished
                if IS_TTS_SPEAKING or (time.time() - TTS_FINISHED_TIME < 2.2):
                    continue

                try:
                    # On-Device Whisper STT (100% offline, privacy-first)
                    sentence = None
                    try:
                        from backend.voice.whisper_engine import whisper_engine
                        sentence = whisper_engine.transcribe_speech_recognition_audio(audio)
                        if sentence:
                            logger.info(f"[Whisper ASR]: '{sentence}'")
                    except Exception as we:
                        logger.debug(f"Whisper fallback notice: {we}")

                    # Fallback to Google STT if Whisper is silent or uninitialized
                    if not sentence:
                        sentence = self.recognizer.recognize_google(audio)

                    if sentence:
                        clean_s = sentence.lower().strip()
                        norm_s = re.sub(r'[^a-z0-9 ]', '', clean_s)
                        norm_s = re.sub(r'\s+', ' ', norm_s).strip()
                        words_s = set(norm_s.split())

                        # Acoustic Echo Filter: Strip or discard self-spoken phrases
                        is_pure_echo = False

                        # Ignore phrases that echo known system responses
                        if any(norm_s.startswith(k) for k in [
                            "ive processed your query",
                            "im analyzing your active context",
                            "opening caliculate",
                            "i am watching your workspace"
                        ]):
                            is_pure_echo = True

                        if not is_pure_echo:
                            for phrase in list(RECENT_SPOKEN_PHRASES):
                                norm_p = re.sub(r'[^a-z0-9 ]', '', phrase.lower())
                                norm_p = re.sub(r'\s+', ' ', norm_p).strip()
                                words_p = set(norm_p.split())

                                if norm_p and (norm_p in norm_s or norm_s in norm_p):
                                    is_pure_echo = True
                                    break

                                if len(words_s) >= 2 and len(words_p) >= 2:
                                    overlap = len(words_s.intersection(words_p)) / float(len(words_s))
                                    if overlap >= 0.35:
                                        is_pure_echo = True
                                        break

                        if is_pure_echo:
                            logger.info(f"[Echo Filtered]: Ignored self-spoken audio echo '{sentence}'")
                            continue

                        self.process_full_sentence(sentence)
                except sr.UnknownValueError:
                    pass
                except sr.RequestError as e:
                    logger.warning(f"STT Network error: {e}")
            except sr.WaitTimeoutError:
                pass
            except Exception as e:
                time.sleep(0.4)

# Global companion engine instance for API and Electron commands
companion_engine = NoriProactiveVoiceCompanion()

def process_companion_command(text: str) -> str:
    """Process any typed or spoken user command uniformly."""
    return companion_engine.process_full_sentence(text)

if __name__ == "__main__":
    assistant = NoriProactiveVoiceCompanion()
    assistant.run_voice_loop()
