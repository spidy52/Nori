"""
NPU-Optimized YOLOv8 Vision Engine for Nori
Directly interfaces with Qualcomm Hexagon NPU via QNN Execution Provider
with automatic CPU fallback for development.
Performs vectorized letterbox preprocessing and decoupled NMS post-processing.
"""

import os
import time
import logging
import cv2
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from backend.inference.backend import get_inference_backend, BaseInferenceBackend

logger = logging.getLogger("nori.yolo_qnn")

# COCO 80 Class Names
COCO_CLASSES = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat", "traffic light",
    "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat", "dog", "horse", "sheep", "cow",
    "elephant", "bear", "zebra", "giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase", "frisbee",
    "skis", "snowboard", "sports ball", "kite", "baseball bat", "baseball glove", "skateboard", "surfboard",
    "tennis racket", "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair", "couch",
    "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse", "remote", "keyboard", "cell phone",
    "microwave", "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase", "scissors", "teddy bear",
    "hair drier", "toothbrush"
]

class YOLOv8QNNEngine:
    """
    High-Performance YOLOv8 inference engine designed for Qualcomm Hexagon HTP.
    Decouples raw static neural network forward pass (NPU) from NMS filtering (CPU).
    """

    def __init__(self, model_filename: str = "yolov8n_qnn.onnx", input_size: int = 640):
        self.input_size = input_size
        self.classes = COCO_CLASSES
        self.backend: BaseInferenceBackend = get_inference_backend()

        # Locate model file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(current_dir))
        self.model_path = os.path.join(project_root, "backend", "models", model_filename)

        if not os.path.exists(self.model_path):
            fallback_onnx = os.path.join(project_root, "backend", "models", "yolov8n.onnx")
            if os.path.exists(fallback_onnx):
                self.model_path = fallback_onnx
            else:
                try:
                    from export_yolo_qnn import export_qnn_compatible_yolo
                    logger.info("[YOLOv8QNN] QNN static model missing. Auto-generating on first run...")
                    export_qnn_compatible_yolo()
                except Exception as e:
                    logger.warning(f"[YOLOv8QNN] First-run auto-export notice: {e}")

        self.is_loaded = False
        if os.path.exists(self.model_path):
            self.is_loaded = self.backend.load_session("yolov8n", self.model_path, (1, 3, self.input_size, self.input_size))
        else:
            logger.error(f"[YOLOv8QNN] Model not found at: {self.model_path}")

    def letterbox(self, img: np.ndarray, new_shape: Tuple[int, int] = (640, 640), color: Tuple[int, int, int] = (114, 114, 114)) -> Tuple[np.ndarray, float, Tuple[float, float]]:
        """Resize and pad image while meeting stride-multiple constraints."""
        shape = img.shape[:2]  # current shape [height, width]
        r = min(new_shape[0] / shape[0], new_shape[1] / shape[1])
        new_unpad = (int(round(shape[1] * r)), int(round(shape[0] * r)))
        dw = new_shape[1] - new_unpad[0]
        dh = new_shape[0] - new_unpad[1]
        dw /= 2
        dh /= 2

        if shape[::-1] != new_unpad:
            img = cv2.resize(img, new_unpad, interpolation=cv2.INTER_LINEAR)
        
        top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
        left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
        img = cv2.copyMakeBorder(img, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color)
        return img, r, (dw, dh)

    def preprocess(self, img: np.ndarray) -> Tuple[np.ndarray, float, Tuple[float, float]]:
        """Prepares raw image into fixed static shape tensor [1, 3, 640, 640] in FP32 [0.0, 1.0]."""
        letterbox_img, ratio, (pad_w, pad_h) = self.letterbox(img, (self.input_size, self.input_size))
        # BGR to RGB, HWC to CHW
        rgb = cv2.cvtColor(letterbox_img, cv2.COLOR_BGR2RGB)
        tensor = rgb.transpose((2, 0, 1)).astype(np.float32) / 255.0
        tensor = np.expand_dims(tensor, axis=0)  # [1, 3, 640, 640]
        return np.ascontiguousarray(tensor), ratio, (pad_w, pad_h)

    def nms_fast(self, boxes: np.ndarray, scores: np.ndarray, iou_threshold: float = 0.45) -> List[int]:
        """Vectorized Non-Maximum Suppression on CPU."""
        if len(boxes) == 0:
            return []
        x1 = boxes[:, 0]
        y1 = boxes[:, 1]
        x2 = boxes[:, 2]
        y2 = boxes[:, 3]
        areas = (x2 - x1) * (y2 - y1)
        order = scores.argsort()[::-1]

        keep = []
        while order.size > 0:
            i = order[0]
            keep.append(i)
            xx1 = np.maximum(x1[i], x1[order[1:]])
            yy1 = np.maximum(y1[i], y1[order[1:]])
            xx2 = np.minimum(x2[i], x2[order[1:]])
            yy2 = np.minimum(y2[i], y2[order[1:]])

            w = np.maximum(0.0, xx2 - xx1)
            h = np.maximum(0.0, yy2 - yy1)
            inter = w * h
            iou = inter / (areas[i] + areas[order[1:]] - inter)

            inds = np.where(iou <= iou_threshold)[0]
            order = order[inds + 1]

        return keep

    def postprocess(self, output: np.ndarray, orig_shape: Tuple[int, int], ratio: float, pad: Tuple[float, float], conf_thresh: float = 0.25, iou_thresh: float = 0.45) -> List[Dict[str, Any]]:
        """
        Decodes raw output tensor [1, 84, 8400] into bounding boxes, class labels, and scores.
        """
        # Squeeze batch dimension: [84, 8400] -> Transpose to [8400, 84]
        preds = np.squeeze(output[0]).T  # shape: [8400, 84]
        
        # Split into coordinates [x_center, y_center, width, height] and class scores
        boxes_xywh = preds[:, :4]
        class_scores = preds[:, 4:]

        # Find best class per candidate anchor
        class_ids = np.argmax(class_scores, axis=1)
        confidences = class_scores[np.arange(len(class_scores)), class_ids]

        # Filter by confidence threshold
        mask = confidences >= conf_thresh
        if not np.any(mask):
            return []

        boxes_xywh = boxes_xywh[mask]
        confidences = confidences[mask]
        class_ids = class_ids[mask]

        # Convert [x_center, y_center, w, h] to [x1, y1, x2, y2]
        pad_w, pad_h = pad
        orig_h, orig_w = orig_shape

        x1 = (boxes_xywh[:, 0] - boxes_xywh[:, 2] / 2 - pad_w) / ratio
        y1 = (boxes_xywh[:, 1] - boxes_xywh[:, 3] / 2 - pad_h) / ratio
        x2 = (boxes_xywh[:, 0] + boxes_xywh[:, 2] / 2 - pad_w) / ratio
        y2 = (boxes_xywh[:, 1] + boxes_xywh[:, 3] / 2 - pad_h) / ratio

        # Clip to original image bounds
        x1 = np.clip(x1, 0, orig_w)
        y1 = np.clip(y1, 0, orig_h)
        x2 = np.clip(x2, 0, orig_w)
        y2 = np.clip(y2, 0, orig_h)

        boxes_xyxy = np.column_stack([x1, y1, x2, y2])

        # Apply Non-Max Suppression
        keep_indices = self.nms_fast(boxes_xyxy, confidences, iou_thresh)

        results = []
        for idx in keep_indices:
            cid = int(class_ids[idx])
            cname = self.classes[cid] if cid < len(self.classes) else f"class_{cid}"
            score = float(confidences[idx])
            box = boxes_xyxy[idx]
            bx = int(box[0])
            by = int(box[1])
            bw = int(box[2] - box[0])
            bh = int(box[3] - box[1])

            results.append({
                "class_id": cid,
                "label": cname,
                "confidence": round(score, 3),
                "bbox": [bx, by, bw, bh],
                "backend": self.backend.backend_id,
                "device": self.backend.device_name
            })

        return results

    def detect(self, img: np.ndarray, conf_thresh: float = 0.25, iou_thresh: float = 0.45) -> Tuple[List[Dict[str, Any]], float]:
        """
        Runs full detection pipeline:
        1. Static letterbox preprocessing
        2. Hardware tensor inference (QNN Hexagon NPU or Host CPU)
        3. Decoupled NMS post-processing
        Returns: (detections, latency_ms)
        """
        if not self.is_loaded:
            return [], 0.0

        orig_shape = img.shape[:2]
        t0 = time.perf_counter()

        # Step 1: Preprocess
        tensor, ratio, pad = self.preprocess(img)

        # Step 2: NPU Forward Pass
        outputs = self.backend.run("yolov8n", tensor)

        # Step 3: Decoupled Postprocess
        detections = self.postprocess(outputs[0], orig_shape, ratio, pad, conf_thresh, iou_thresh)

        latency_ms = (time.perf_counter() - t0) * 1000.0
        return detections, latency_ms
