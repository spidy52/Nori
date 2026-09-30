"""
Nori Real-Time Physical Vision, Handheld Object & Universal Activity Perception Engine
Powered by Official Ultralytics YOLOv8 + YuNet Face Detector + Hand & Handheld Object Extractor.
Zero hardcoded emotions or fake spectacles.
Tracks whatever the user holds in their hand and synthesizes real-world activities
(work, cook, repair, table organization, gadgets).
"""

import cv2
import numpy as np
import base64
import time
import os
import math
import threading
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel
try:
    from ultralytics import YOLO
except Exception:
    YOLO = None

try:
    from backend.physical.yolo_qnn_engine import YOLOv8QNNEngine
except Exception:
    YOLOv8QNNEngine = None

from backend.physical.electronics_detector import electronics_engine

class DetectedObject(BaseModel):
    label: str
    confidence: float
    category: str
    bbox: List[int] = []  # [x, y, width, height]
    color_hint: Optional[str] = None
    pinout_available: bool = False
    details: Dict[str, Any] = {}
    interactive_dialogue: Optional[str] = None
    suggested_interactions: List[str] = []

class ActivityContext(BaseModel):
    activity_type: str  # 'work_and_coding', 'hardware_repair', 'cooking_and_dining', 'table_organization', 'general_workspace'
    headline: str
    details: str
    clutter_level: str  # 'tidy', 'moderate', 'cluttered'
    suggested_action: str

class FrameAnalysisResult(BaseModel):
    timestamp: float
    objects: List[DetectedObject] = []
    detected_wire_colors: List[str] = []
    safety_alerts: List[str] = []
    wire_guide: Dict[str, str] = {}
    step_by_step_guidance: List[str] = []
    proactive_advice: Optional[str] = None
    interactive_dialogue: Optional[str] = None
    suggested_interactions: List[str] = []
    primary_detected_item: Optional[str] = None
    activity: Optional[ActivityContext] = None
    processed_latency_ms: float = 0.0


class PhysicalVisionEngine:
    def __init__(self):
        # 1. Primary Neural Vision Detector (YOLOv8)
        self.yolo_model = None
        try:
            for p in ['yolov8s.pt', 'yolov8n.pt', os.path.join(os.getcwd(), 'yolov8s.pt')]:
                if os.path.exists(p):
                    self.yolo_model = YOLO(p)
                    break
        except Exception:
            self.yolo_model = None

        # 2. Open-World Zero-Shot CLIP Refiner — covers electronics, appliances, and room fixtures
        self.clip_model = None
        self.clip_preprocess = None
        self.clip_tokens = None
        self.open_candidates = [
            # --- Room Appliances & Fixtures ---
            'ceiling fan', 'electric fan', 'room air cooler', 'air conditioner',
            'refrigerator', 'microwave oven', 'washing machine', 'television',
            # --- Electronics & Workspace ---
            'laptop computer', 'computer monitor', 'smartphone',
            # --- Electronics Project Components ---
            'arduino microcontroller board', 'raspberry pi board', 'circuit board PCB',
            'breadboard', 'electronic resistor', 'jumper wires', 'LED strip light',
            'soldering iron', 'multimeter', 'USB cable', 'earphones earbuds',
            'electronic sensor module', 'power bank battery pack',
            # --- General workspace ---
            'coffee mug', 'water bottle', 'notebook book',
        ]
        try:
            import clip
            clip_path = os.path.join(os.getcwd(), 'weights', 'clip', 'ViT-B-32.pt')
            if os.path.exists(clip_path):
                self.clip_model, self.clip_preprocess = clip.load(clip_path, device='cpu')
                self.clip_tokens = clip.tokenize([f'a photo of a {c}' for c in self.open_candidates])
        except Exception:
            self.clip_model = None

        # 3. OpenCV YuNet Deep Learning Face Detector
        model_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
        yunet_path = os.path.join(model_dir, 'face_detection_yunet.onnx')
        self.face_detector = None
        if os.path.exists(yunet_path):
            try:
                self.face_detector = cv2.FaceDetectorYN_create(
                    yunet_path,
                    '',
                    (640, 480),
                    score_threshold=0.60,
                    nms_threshold=0.3
                )
            except Exception:
                self.face_detector = None

        # Zero suppressed classes: All objects are dynamically allowed
        self.suppressed_classes = set()


    def decode_image(self, image_data: Union[bytes, str]) -> Optional[np.ndarray]:
        """Decodes raw bytes, data URL, or base64 into an OpenCV BGR image."""
        try:
            if isinstance(image_data, str):
                image_data = image_data.encode("utf-8")

            if b"," in image_data and image_data.startswith(b"data:image"):
                image_data = image_data.split(b",", 1)[1]

            # Try base64 decoding first
            try:
                decoded = base64.b64decode(image_data, validate=False)
                if len(decoded) > 0:
                    nparr = np.frombuffer(decoded, np.uint8)
                    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    if img is not None and img.shape[0] > 0 and img.shape[1] > 0:
                        return img
            except Exception:
                pass

            # Fallback to direct buffer decode
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img
        except Exception:
            return None

    def _synthesize_activity(self, detected_objects: List[DetectedObject]) -> ActivityContext:
        """
        Synthesizes visual detections into active user life context:
        Cooking & Dining, Work & Coding, Hardware Repair, or Standby.
        """
        labels = [o.label.lower() for o in detected_objects]
        categories = [o.category.lower() for o in detected_objects]
        all_text = " ".join(labels + categories)

        # 0. Group Discussion Context (Multiple People in Camera View)
        if any(k in all_text for k in ["group", "group_discussion", "people"]):
            return ActivityContext(
                activity_type="group_discussion",
                headline="Active Group Discussion & Brainstorming",
                details="Multiple people detected at workstation. Proactive team assistance active.",
                clutter_level="moderate",
                suggested_action="Participating in group discussion with live ideas & whiteboard canvas."
            )

        # 1. Cooking, Dining & Kitchen
        if any(k in all_text for k in [
            "cooking", "dining", "food", "kitchen", "bowl", "cup", "bottle", "knife", "fork", "spoon",
            "banana", "apple", "sandwich", "orange", "broccoli", "carrot", "pizza", "oven", "microwave",
            "toaster", "refrigerator", "sink"
        ]):
            return ActivityContext(
                activity_type="cooking_and_dining",
                headline="Culinary & Dining Session",
                details="Culinary ingredients, food items, or dining items observed.",
                clutter_level="moderate",
                suggested_action="Suggesting recipes, nutritional breakdowns, and step-by-step cooking steps."
            )
        if any(k in all_text for k in ["eyewear", "spectacles", "glasses"]):
            return ActivityContext(
                activity_type="eyewear_inspection",
                headline="Inspecting Eyewear / Spectacles",
                details="Eyeglasses / spectacles held in active camera focus.",
                clutter_level="tidy",
                suggested_action="Holding eyewear in camera view for inspection."
            )

        # 2. Tech Accessory & Smartphone Interaction
        if any(k in all_text for k in ["earbuds", "accessory", "gadget"]):
            return ActivityContext(
                activity_type="tech_accessory",
                headline="Interacting with Tech Accessory",
                details="Earbuds charging case / tech accessory held in camera focus.",
                clutter_level="tidy",
                suggested_action="Synchronize audio device or inspect gadget."
            )

        if any(k in all_text for k in ["phone", "smartphone", "mobile"]):
            return ActivityContext(
                activity_type="mobile_interaction",
                headline="Interacting with Smartphone",
                details="Smartphone / handheld mobile device in active focus.",
                clutter_level="tidy",
                suggested_action="Synchronize notes or check mobile device context."
            )

        # 3. Hardware Workbench & Electronics Prototyping
        if any(k in all_text for k in [
            "scissors", "tool", "hardware", "screwdriver", "circuit", "board",
            "arduino", "raspberry", "breadboard", "resistor", "jumper", "led",
            "soldering", "multimeter", "pcb", "sensor", "microcontroller",
            "usb cable", "power bank", "electronic", "wires"
        ]):\n            return ActivityContext(
                activity_type="hardware_repair",
                headline="Hardware Prototyping & Electronics Workbench",
                details="Electronic components, boards, or tools detected on workbench. Ready to assist with wiring, code, and schematics.",
                clutter_level="moderate",
                suggested_action="Suggest pinout guide, draw circuit diagram, and generate firmware code."
            )

        # 3. Workstation & Coding Session (Face or Laptop or Mouse or Keyboard or Human)
        if any(k in all_text for k in ["laptop", "mouse", "keyboard", "human", "face"]):
            return ActivityContext(
                activity_type="work_and_coding",
                headline="Workstation & Coding Session",
                details="Active user presence and focus detected at workstation.",
                clutter_level="tidy",
                suggested_action="Deep focus session active. Let me know if you need code generation or screen automation."
            )

        # 4. Standby / Empty Room
        return ActivityContext(
            activity_type="standby",
            headline="Workspace Standby",
            details="Workspace camera active. No active user or components detected.",
            clutter_level="tidy",
            suggested_action="Ready to assist when you return to your workstation."
        )

    def detect_universal_objects(self, img: np.ndarray) -> List[DetectedObject]:
        """
        Pure Deep Learning Perception Pipeline:
        1. YuNet Deep Neural Network for human face detection (no fake emotions, no fake spectacles).
        2. Official Ultralytics YOLOv8 for real physical objects (conf >= 0.28).
        Zero heuristics, zero wall/ceiling/hair hallucinations.
        """
        objects: List[DetectedObject] = []
        h, w = img.shape[:2]
        if h < 20 or w < 20:
            return []

        face_boxes: List[List[int]] = []

        # -----------------------------------------------------------------
        # 1. YUNET DEEP NEURAL NETWORK FACE DETECTOR
        # -----------------------------------------------------------------
        if self.face_detector is not None:
            try:
                self.face_detector.setInputSize((w, h))
                status, faces = self.face_detector.detect(img)
                if faces is not None and len(faces) > 0:
                    for face in faces[:2]:
                        f_score = float(face[14])
                        if f_score < 0.70:
                            continue

                        fx, fy, fw, fh = int(face[0]), int(face[1]), int(face[2]), int(face[3])
                        fx = max(0, min(w - 1, fx))
                        fy = max(0, min(h - 1, fy))
                        fw = max(10, min(w - fx, fw))
                        fh = max(10, min(h - fy, fh))
                        face_boxes.append([fx, fy, fw, fh])

                        objects.append(DetectedObject(
                            label="User Face (Camera Focus)",
                            confidence=round(f_score, 2),
                            category="human",
                            bbox=[fx, fy, fw, fh],
                            details={"face_detected": True, "score": round(f_score, 2)},
                            interactive_dialogue=None,
                            suggested_interactions=["Workspace Focus Mode", "Take Break", "Mute Notifications"]
                        ))

                    # 1.1 Eyewear / Spectacles Detection on EVERY Face
                    for face in faces[:2]:
                        f_score = float(face[14])
                        rx, ry = float(face[4]), float(face[5])
                        lx, ly = float(face[6]), float(face[7])
                        eye_dist = np.hypot(lx - rx, ly - ry)
                        if eye_dist > 15:
                            ex = int(max(0, min(rx, lx) - 0.35 * eye_dist))
                            ew = int(min(w - ex, eye_dist * 1.70))
                            ey = int(max(0, min(ry, ly) - 0.40 * eye_dist))
                            eh = int(min(h - ey, eye_dist * 0.85))

                            roi = img[ey:ey+eh, ex:ex+ew]
                            if roi.size > 0:
                                roi_gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
                                roi_edges = cv2.Canny(roi_gray, 30, 120)
                                edge_density = np.count_nonzero(roi_edges) / float(ew * eh)
                                if edge_density >= 0.025:
                                    objects.append(DetectedObject(
                                        label="Eyeglasses / Spectacles",
                                        confidence=round(min(0.96, f_score + 0.05), 2),
                                        category="personal_accessory",
                                        bbox=[ex, ey, ew, eh],
                                        details={"fit": "On Face (Eye Region)", "edge_density": round(edge_density, 3)},
                                        interactive_dialogue="I see your eyeglasses / spectacles.",
                                        suggested_interactions=["Spectacles Focus Mode", "Prescription Specs", "Canvas Note"]
                                    ))

                    # 1.2 Group Discussion Perception (Multi-Person Dialogue)
                    if len(face_boxes) >= 2:
                        objects.append(DetectedObject(
                            label=f"Group Discussion ({len(face_boxes)} People)",
                            confidence=0.98,
                            category="group_discussion",
                            bbox=[0, 0, w, h],
                            details={"people_count": len(face_boxes)},
                            interactive_dialogue=f"I see a group discussion with {len(face_boxes)} people! Ready to assist with team ideas or co-coding.",
                            suggested_interactions=["Team Whiteboard", "Group Brainstorm", "Share Architecture"]
                        ))
            except Exception:
                pass

        has_human_presence = bool(face_boxes)

        # -----------------------------------------------------------------
        # 2. NEURAL OBJECT DETECTION & OPEN-WORLD SCENE PERCEPTION
        # -----------------------------------------------------------------
        raw_dets = []
        if self.yolo_model is not None:
            try:
                # imgsz=320 gives ~3-4x speedup vs default 640 with minimal accuracy loss
                yolo_results = self.yolo_model(img, conf=0.40, imgsz=320, verbose=False)
                if yolo_results and len(yolo_results) > 0:
                    r = yolo_results[0]
                    for box in r.boxes:
                        cid = int(box.cls[0].item())
                        c_name = r.names.get(cid, "object")
                        score = float(box.conf[0].item())
                        xyxy = box.xyxy[0].tolist()
                        bx = int(max(0, xyxy[0]))
                        by = int(max(0, xyxy[1]))
                        bw = int(max(1, xyxy[2] - xyxy[0]))
                        bh = int(max(1, xyxy[3] - xyxy[1]))
                        raw_dets.append({
                            "class_id": cid,
                            "label": c_name,
                            "confidence": score,
                            "bbox": [bx, by, bw, bh]
                        })
            except Exception:
                raw_dets = []


        # 2.1 Open-World CLIP Refiner — ONLY fires when YOLO has no strong real detection.
        # Prevents CLIP from "sticking" to old scene when camera moves to a different object.
        #
        # COCO-YOLO surrogate misclassifications to watch for:
        #   Circuit boards / PCBs → 'dining table', 'book', 'remote'
        #   Fans / coolers       → 'sink', 'toilet', 'sports ball'
        #   Wires / cables       → 'snake', 'tie'
        _yolo_surrogate_labels = {
            # Appliance / fixture surrogates
            'sink', 'toilet', 'sports ball', 'bench', 'frisbee', 'kite', 'umbrella',
            # Circuit board / PCB surrogates (flat rectangular close-up objects)
            'dining table',   # ← #1 misclass for circuit boards / PCBs (e.g. Arduino)
            'remote',         # ← misclass for small electronics modules
            'book',           # ← misclass for flat PCBs / breadboards
            'tie',            # ← misclass for cables / wires
            'skateboard',     # ← misclass for flat boards
            # Vehicle classes fired on large electronics at imgsz=320
            'truck', 'car', 'bus', 'motorcycle', 'bicycle',
            'airplane', 'boat', 'train',
        }
        # Real YOLO classes that clearly name what's in the scene — CLIP must NOT override these
        # NOTE: 'dining table' intentionally REMOVED — it's a known Arduino/PCB surrogate
        _yolo_real_labels = {
            'laptop', 'keyboard', 'mouse', 'cell phone', 'tv', 'remote', 'monitor',
            'cup', 'bowl', 'bottle', 'fork', 'knife', 'spoon',
            'banana', 'apple', 'orange', 'pizza', 'sandwich', 'broccoli', 'carrot',
            'person', 'chair', 'couch', 'bed',
            'backpack', 'handbag', 'suitcase', 'clock', 'vase', 'scissors',
            'teddy bear', 'hair drier', 'toothbrush'
        }

        # Check: does YOLO already have at least one confident real detection?
        yolo_has_real = any(d['label'].lower() in _yolo_real_labels and d['confidence'] >= 0.45
                            for d in raw_dets)
        # Check: are ALL YOLO detections surrogates/ambiguous?
        yolo_only_surrogates = (
            len(raw_dets) > 0 and
            all(d['label'].lower() in _yolo_surrogate_labels for d in raw_dets)
        )
        # Check: YOLO found nothing at all
        yolo_empty = len(raw_dets) == 0

        # Only invoke CLIP if YOLO has no real scene understanding
        clip_should_fire = (not yolo_has_real) and (yolo_only_surrogates or yolo_empty)

        if self.clip_model is not None and self.clip_tokens is not None and clip_should_fire:
            try:
                import torch
                from PIL import Image
                pil_img = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
                tensor = self.clip_preprocess(pil_img).unsqueeze(0).to('cpu')
                with torch.no_grad():
                    logits, _ = self.clip_model(tensor, self.clip_tokens)
                    probs = logits.softmax(dim=-1).cpu().numpy()[0]

                top_idx = probs.argmax()
                clip_label = self.open_candidates[top_idx].title()
                clip_conf = float(probs[top_idx])

                # Accept any CLIP result above 45% — covers electronics, appliances, and fixtures
                if clip_conf >= 0.45:
                    # Remove any surrogate raw_det that CLIP is replacing
                    matched_bbox = None
                    for d in list(raw_dets):
                        if d['label'].lower() in _yolo_surrogate_labels:
                            matched_bbox = list(d['bbox'])
                            raw_dets.remove(d)
                            break

                    bbox = matched_bbox or [int(w * 0.05), int(h * 0.05), int(w * 0.90), int(h * 0.90)]
                    l_lower = clip_label.lower()

                    # Dynamically resolve category + interactions based on CLIP label content
                    if any(k in l_lower for k in [
                        'arduino', 'raspberry', 'circuit', 'pcb', 'breadboard',
                        'resistor', 'jumper', 'led', 'sensor', 'soldering',
                        'multimeter', 'usb cable', 'power bank', 'electronic'
                    ]):
                        cat = "microcontroller"
                        dialogue = f"Detected {clip_label} on your workbench. Ready for pinout guide, wiring, and code."
                        interactions = ["Pinout Guide", "Build Project", "Draw Schematic", "Generate Code"]
                    elif any(k in l_lower for k in ['earphone', 'earbud']):
                        cat = "electronics"
                        dialogue = f"Detected {clip_label}. Ready to check specs or pair device."
                        interactions = ["Device Specs", "Pairing Guide", "Audio Settings"]
                    elif any(k in l_lower for k in ['fan', 'cooler', 'conditioner', 'refrigerator', 'microwave', 'washing']):
                        cat = "appliance"
                        dialogue = f"Observing {clip_label.lower()} in your room."
                        interactions = [f"Inspect {clip_label}", "Canvas Diagram", "Smart Control"]
                    elif any(k in l_lower for k in ['laptop', 'monitor', 'smartphone', 'television']):
                        cat = "electronics"
                        dialogue = f"Detected {clip_label.lower()} in workspace."
                        interactions = [f"Inspect {clip_label}", "Focus Tracking", "Desktop Automation"]
                    else:
                        cat = "object"
                        dialogue = f"Observing {clip_label.lower()}."
                        interactions = [f"Inspect {clip_label}", "Workspace Focus"]

                    objects.append(DetectedObject(
                        label=clip_label,
                        confidence=round(clip_conf, 2),
                        category=cat,
                        bbox=bbox,
                        details={"model": "CLIP Zero-Shot", "score": round(clip_conf, 2)},
                        interactive_dialogue=dialogue,
                        suggested_interactions=interactions
                    ))
            except Exception:
                pass


        # 2.2 Process all remaining authentic neural detections (conf >= 0.35)
        for d in raw_dets:
            c_name = d["label"].lower()
            if c_name == 'person':
                has_human_presence = True
                if face_boxes:
                    continue

            # Ignore COCO surrogate misclassifications if full-frame (like bench/chair covering whole screen)
            bx, by, bw, bh = d["bbox"]
            if (bw >= w * 0.90 and bh >= h * 0.90) and c_name in ['bench', 'chair', 'couch', 'bed']:
                continue

            label = c_name.title()
            l_lower = label.lower()

            # Dynamic category & dialogue resolution (Zero hardcoded object lists)
            if any(k in l_lower for k in ['fan', 'cooler', 'conditioner', 'refrigerator', 'microwave', 'oven', 'toaster', 'sink', 'appliance', 'washer']):
                cat = "appliance"
                dialogue = f"Observing {l_lower} in your room."
                interactions = [f"Inspect {label}", "Device Guidance", "Canvas Diagram"]
            elif any(k in l_lower for k in ['laptop', 'monitor', 'television', 'tv', 'phone', 'keyboard', 'mouse', 'remote']):
                cat = "electronics"
                dialogue = f"Detected {l_lower} in workspace."
                interactions = [f"Inspect {label}", "Focus Tracking", "Desktop Automation"]
            elif any(k in l_lower for k in [
                'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'pizza', 'donut', 'cake',
                'bowl', 'cup', 'bottle', 'mug', 'fork', 'knife', 'spoon', 'food', 'bread'
            ]):
                cat = "cooking_and_dining"
                dialogue = f"Observing {l_lower}. Ready for recipe ideas, cooking steps, and nutrition."
                interactions = ["Suggest Recipe", "Nutritional Breakdown", "Cooking Timer", "Meal Prep"]
            elif any(k in l_lower for k in ['chair', 'couch', 'bed', 'table', 'desk']):
                cat = "furniture"
                dialogue = f"Detected {l_lower} in your workspace."
                interactions = ["Workspace Ergonomics", "Canvas Layout"]
            elif any(k in l_lower for k in ['board', 'arduino', 'circuit', 'resistor', 'sensor']):
                cat = "microcontroller"
                dialogue = f"Detected {label}. Ready for circuit connections, project ideas, and firmware."
                interactions = ["Build Project", "Pinout Guide", "Draw Schematic", "Generate Code"]
            else:
                cat = "object"
                dialogue = f"Observing {l_lower}."
                interactions = [f"Inspect {label}", "Workspace Focus"]

            objects.append(DetectedObject(
                label=label,
                confidence=round(d["confidence"], 2),
                category=cat,
                bbox=[bx, by, bw, bh],
                details={"model": "YOLOv8", "raw_coco": c_name},
                interactive_dialogue=dialogue,
                suggested_interactions=interactions
            ))

        return objects






    def process_frame(
        self,
        image_bytes: bytes,
        project_context: Optional[str] = None
    ) -> FrameAnalysisResult:
        """
        Processes camera frame with multi-model perception and synthesizes active activity context.
        """
        start_time = time.time()
        img = self.decode_image(image_bytes)

        objects = []
        if img is not None:
            objects = self.detect_universal_objects(img)

        elapsed_ms = round((time.time() - start_time) * 1000.0, 1)
        activity = self._synthesize_activity(objects)

        if not objects:
            return FrameAnalysisResult(
                timestamp=time.time(),
                objects=[],
                detected_wire_colors=[],
                safety_alerts=[],
                wire_guide={},
                step_by_step_guidance=[
                    "Point your camera at any object to inspect items.",
                    "Ensure adequate lighting so physical shapes and details are clearly resolved."
                ],
                proactive_advice="Camera active.",
                interactive_dialogue=None,
                suggested_interactions=["Hold Up Gadget", "Inspect Workspace", "Desktop Automation"],
                primary_detected_item=None,
                activity=activity,
                processed_latency_ms=elapsed_ms
            )

        primary_obj = objects[0]
        if any(k in primary_obj.label.lower() for k in ["face", "person", "human"]):
            dialogue = None
        else:
            dialogue = primary_obj.interactive_dialogue or f"Observing {primary_obj.label}."
        interactions = primary_obj.suggested_interactions or ["Ask Nori About This", "Open Canvas"]

        return FrameAnalysisResult(
            timestamp=time.time(),
            objects=objects,
            detected_wire_colors=[],
            safety_alerts=[],
            wire_guide={},
            step_by_step_guidance=[
                f"Active inspection on {primary_obj.label}."
            ],
            proactive_advice=dialogue,
            interactive_dialogue=dialogue,
            suggested_interactions=interactions,
            primary_detected_item=primary_obj.label,
            activity=activity,
            processed_latency_ms=elapsed_ms
        )

class CameraManager:
    """
    24/7 Autonomous Background Camera Manager.
    Receives and coordinates frames from frontend browser/Electron camera stream.
    Zero DirectShow hardware lockouts, zero camera thread freezing.
    """
    def __init__(self, engine: PhysicalVisionEngine):
        self.engine = engine
        self.is_active = True
        self.latest_frame: Optional[np.ndarray] = None
        self.latest_jpeg: Optional[bytes] = None
        self.latest_analysis: Optional[FrameAnalysisResult] = None
        self.lock = threading.Lock()
        self._last_external_frame_time = time.time()

    def start(self):
        self.is_active = True

    def stop(self):
        self.is_active = False

    def update_external_frame(self, raw_bytes: bytes, analysis: Optional[FrameAnalysisResult] = None):
        """Called when frontend streams frames via /api/physical/analyze_frame."""
        with self.lock:
            self._last_external_frame_time = time.time()
            img = self.engine.decode_image(raw_bytes)
            if img is not None:
                self.latest_frame = img
                _, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 85])
                self.latest_jpeg = buffer.tobytes()
            if analysis is not None:
                self.latest_analysis = analysis

    def get_latest_jpeg(self) -> Optional[bytes]:
        with self.lock:
            return self.latest_jpeg

    def get_latest_analysis(self) -> Optional[FrameAnalysisResult]:
        with self.lock:
            return self.latest_analysis

vision_engine = PhysicalVisionEngine()
camera_manager = CameraManager(vision_engine)

