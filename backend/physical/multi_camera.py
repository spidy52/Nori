"""
Nori Multi-Camera Manager & Hardware Workbench Feed Coordinator
Detects all connected camera devices (built-in webcam, external USB overhead camera, desk lens)
and enables simultaneous or switchable multi-camera perception.
"""

import cv2
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("nori.multi_camera")

class MultiCameraManager:
    def __init__(self):
        self.active_camera_id: int = 0
        self.known_cameras: List[Dict[str, Any]] = []
        self.scan_cameras()

    def scan_cameras(self, max_probes: int = 4) -> List[Dict[str, Any]]:
        """Probes video capture indices to detect all connected webcams."""
        cameras = []
        for idx in range(max_probes):
            try:
                cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW if cv2.os.name == 'nt' else cv2.CAP_ANY)
                if cap is not None and cap.isOpened():
                    ret, _ = cap.read()
                    if ret:
                        name = f"Camera {idx} (Built-in / Front Lens)" if idx == 0 else f"Camera {idx} (External / Workbench Lens)"
                        cameras.append({
                            "id": idx,
                            "name": name,
                            "is_active": (idx == self.active_camera_id),
                            "status": "connected"
                        })
                    cap.release()
            except Exception as e:
                logger.debug(f"Camera probe {idx} exception: {e}")

        if not cameras:
            cameras.append({
                "id": 0,
                "name": "Camera 0 (Default Camera)",
                "is_active": True,
                "status": "default"
            })

        self.known_cameras = cameras
        logger.info(f"[MultiCamera] Discovered {len(cameras)} active camera device(s): {[c['name'] for c in cameras]}")
        return cameras

    def get_cameras(self) -> List[Dict[str, Any]]:
        for c in self.known_cameras:
            c["is_active"] = (c["id"] == self.active_camera_id)
        return self.known_cameras

    def set_active_camera(self, camera_id: int) -> bool:
        self.active_camera_id = camera_id
        for c in self.known_cameras:
            c["is_active"] = (c["id"] == camera_id)
        logger.info(f"[MultiCamera] Active camera switched to index {camera_id}.")
        return True

    def capture_frame(self, camera_id: Optional[int] = None) -> Optional[Any]:
        cid = camera_id if camera_id is not None else self.active_camera_id
        try:
            cap = cv2.VideoCapture(cid, cv2.CAP_DSHOW if cv2.os.name == 'nt' else cv2.CAP_ANY)
            if cap.isOpened():
                ret, frame = cap.read()
                cap.release()
                if ret and frame is not None:
                    return frame
        except Exception as e:
            logger.warning(f"[MultiCamera] Capture failed on camera {cid}: {e}")
        return None

multi_camera_hub = MultiCameraManager()
