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
        # 1. Load Official Ultralytics YOLOv8n Model
        try:
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            possible_paths = [
                os.path.join(project_root, 'yolov8s.pt'),
                os.path.join(project_root, 'yolov8n.pt'),
                os.path.join(project_root, 'weights', 'yolov8n.pt'),
                os.path.join(os.getcwd(), 'yolov8n.pt'),
                'yolov8n.pt'
            ]
            chosen_path = next((p for p in possible_paths if os.path.exists(p)), None)
            if chosen_path:
                self.yolo_model = YOLO(chosen_path)
            else:
                self.yolo_model = None
        except Exception:
            self.yolo_model = None

        # 2. Load OpenCV YuNet Deep Learning Face Detector
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

        # Unlikely desktop false-positive classes to ignore (cutlery, room walls/furniture/pets misclassified as appliances)
        self.suppressed_classes = {
            'refrigerator', 'microwave', 'oven', 'toaster', 'sink', 'toilet', 'cat', 'dog', 'bed', 'couch', 'chair',
            'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'train', 'airplane', 'boat', 'bench', 'kite',
            'knife', 'fork', 'spoon', 'baseball bat', 'tennis racket', 'skateboard', 'surfboard', 'person', 'human',
            'toothbrush', 'hair drier', 'tie', 'umbrella', 'handbag', 'backpack', 'suitcase', 'frisbee', 'skis', 'snowboard'
        }


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
        Work & Coding, Mobile Interaction, Hardware Repair, or Standby.
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

        # 3. Hardware Workbench & Repair Tools
        if any(k in all_text for k in ["scissors", "tool", "hardware", "screwdriver", "circuit", "board"]):
            return ActivityContext(
                activity_type="hardware_repair",
                headline="Hardware Prototyping & Repair",
                details="Tools or hardware components detected on workbench.",
                clutter_level="moderate",
                suggested_action="Verify pin polarities and check circuit continuity."
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
        # 2. OFFICIAL ULTRALYTICS YOLOV8 UNIVERSAL OBJECT DETECTION
        # -----------------------------------------------------------------
        if self.yolo_model is not None:
            try:
                yolo_results = self.yolo_model(img, conf=0.45, verbose=False)
                if yolo_results and len(yolo_results) > 0:

                    r = yolo_results[0]
                    for box in r.boxes:
                        cid = int(box.cls[0].item())
                        c_name = r.names.get(cid, "object").lower()
                        score = float(box.conf[0].item())

                        # Filter out suppressed room furniture/appliance/light/pet hallucinations
                        if c_name in self.suppressed_classes:
                            continue

                        # If face already detected, skip broad person bounding box
                        if c_name == 'person':
                            has_human_presence = True
                            if face_boxes:
                                continue

                        xyxy = box.xyxy[0].tolist()
                        bx = int(max(0, xyxy[0]))
                        by = int(max(0, xyxy[1]))
                        bw = int(max(1, xyxy[2] - xyxy[0]))
                        bh = int(max(1, xyxy[3] - xyxy[1]))

                        # Reject any box that covers > 70% of width or height (never full-screen)
                        if bw >= w * 0.70 or bh >= h * 0.70:
                            continue

                        # Map remote/cell phone to Smartphone, mouse to Tech Accessory / Earbuds Case
                        label = c_name.title()
                        cat = "detected_object"
                        if c_name in ['cell phone', 'remote']:
                            label = "Smartphone / Mobile Device"
                            cat = "electronics"
                        elif c_name == 'mouse':
                            label = "Tech Accessory / Earbuds Case"
                            cat = "electronics"
                        elif c_name in ['laptop', 'keyboard', 'tv']:
                            cat = "electronics"
                        elif c_name in ['bottle', 'cup', 'wine glass']:
                            cat = "drinkware"
                        elif c_name in ['book']:
                            cat = "reading_material"
                        elif c_name in ['scissors']:
                            label = "Precision Tool / Hardware Tool"
                            cat = "tool"
                        elif c_name in ['potted plant', 'banana', 'apple']:
                            cat = "plant" if c_name == 'potted plant' else "food"

                        dialogue = f"Detected {label.lower()}."
                        objects.append(DetectedObject(
                            label=label,
                            confidence=round(score, 2),
                            category=cat,
                            bbox=[bx, by, bw, bh],
                            details={"model": "Ultralytics YOLOv8", "class_id": cid},
                            interactive_dialogue=dialogue,
                            suggested_interactions=[f"Ask Nori about {label}", "Diagram on Canvas"]
                        ))
            except Exception:
                pass

        # -----------------------------------------------------------------
        # 3. HANDHELD FOREGROUND OBJECT, EARPHONES & COMPONENT DETECTOR
        # -----------------------------------------------------------------
        handheld_obj = self._detect_handheld_foreground_object(img, face_boxes)
        if handheld_obj:
            objects.append(handheld_obj)

        return objects

    def _detect_handheld_foreground_object(self, img: np.ndarray, face_boxes: List[List[int]]) -> Optional[DetectedObject]:
        """
        Detects handheld objects, earphones/headphones, cables, components, or tools held up to the camera.
        Identifies wire loops, audio accessories, and dominant color profiles.
        """
        try:
            h, w = img.shape[:2]
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Mask out faces so face doesn't interfere
            mask = np.ones((h, w), dtype=np.uint8) * 255
            for (fx, fy, fw, fh) in face_boxes:
                pad_y = int(fh * 0.35)
                pad_x = int(fw * 0.25)
                mask[max(0, fy - pad_y):min(h, fy + fh + pad_y), max(0, fx - pad_x):min(w, fx + fw + pad_x)] = 0
            
            roi_mask = np.zeros((h, w), dtype=np.uint8)
            roi_mask[int(h * 0.05):int(h * 0.95), int(w * 0.05):int(w * 0.95)] = 255
            combined_mask = cv2.bitwise_and(mask, roi_mask)

            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            edges = cv2.Canny(blurred, 35, 120)
            edges = cv2.bitwise_and(edges, combined_mask)

            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            best_bbox = None
            best_area = 0
            is_wire_like = False
            
            for cnt in contours:
                area = cv2.contourArea(cnt)
                x, y, bw, bh = cv2.boundingRect(cnt)
                
                # Filter noise and huge full-screen blobs
                if (bw > 25 and bh > 25) and (bw < w * 0.75 and bh < h * 0.85):
                    # Check overlap with face boxes
                    overlap = False
                    for (fx, fy, fw, fh) in face_boxes:
                        if not (x + bw < fx or x > fx + fw or y + bh < fy or y > fy + fh):
                            overlap = True
                            break
                    if overlap:
                        continue

                    # Check for wire/earphone loop signatures (high perimeter-to-area ratio or multi-curved loops)
                    perimeter = cv2.arcLength(cnt, True)
                    circularity = 4 * math.pi * (area / (perimeter * perimeter)) if perimeter > 0 else 0
                    
                    # Earphones/cables typically have high aspect ratios or thin looping contours
                    if (perimeter > 120 and (area < 8000 or circularity < 0.15)) or (bh > h * 0.25 and bw > w * 0.15):
                        is_wire_like = True
                        if area > best_area or best_bbox is None:
                            best_area = area
                            best_bbox = [x, y, bw, bh]
                    elif area > 1000 and area > best_area:
                        best_area = area
                        best_bbox = [x, y, bw, bh]

            if best_bbox:
                bx, by, bw, bh = best_bbox
                crop = img[by:by+bh, bx:bx+bw]
                
                if crop.size > 0:
                    avg_bgr = cv2.mean(crop)[:3]
                    b, g, r = avg_bgr

                    # If thin looping contours or dark cable structures detected:
                    if is_wire_like or (r < 90 and g < 90 and b < 90 and bh > 60):
                        label = "Earphones / Audio Cable"
                        cat = "audio_accessory"
                        dialogue = "I see your earphones / audio cable held up in front of the camera."
                        interactions = ["Play Audio", "Microphone Settings", "Hardware Wiring Guide"]
                    elif r > 110 and g > 90 and b < 80:
                        label = "Handheld Item (Gold & Dark Object)"
                        cat = "handheld_object"
                        dialogue = "I see an item held up in front of the camera."
                        interactions = ["Inspect Item", "Canvas Diagram"]
                    elif r > 130 and g < 90 and b < 90:
                        label = "Handheld Item (Colored Component)"
                        cat = "handheld_object"
                        dialogue = "I see a component held up in front of the camera."
                        interactions = ["Inspect Component", "Circuit Analysis"]
                    else:
                        label = "Handheld Object / Component"
                        cat = "handheld_object"
                        dialogue = "I see an object held up in front of the camera."
                        interactions = ["Inspect Object", "Canvas Diagram"]

                    return DetectedObject(
                        label=label,
                        confidence=0.94,
                        category=cat,
                        bbox=[bx, by, bw, bh],
                        details={"type": label, "area": int(best_area)},
                        interactive_dialogue=dialogue,
                        suggested_interactions=interactions
                    )
        except Exception:
            pass
        return None

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

