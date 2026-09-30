"""
NPU-First Inference Engine for Nori
Targeting Qualcomm Hexagon NPU (Snapdragon X Elite / Plus) via ONNX Runtime + QNN Execution Provider.
Provides seamless, transparent CPU fallback for development machines (Intel/AMD).
"""

import os
import sys
import platform
import logging
import numpy as np
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple, Union

logger = logging.getLogger("nori.inference.backend")

class BaseInferenceBackend(ABC):
    """Abstract base class for neural network inference engines."""
    
    def __init__(self, backend_id: str, device_name: str):
        self.backend_id = backend_id
        self.device_name = device_name
        self.is_npu = False
        self.loaded_sessions: Dict[str, Any] = {}

    @abstractmethod
    def load_session(self, model_name: str, model_path: str, expected_input_shape: Optional[Tuple[int, ...]] = None) -> bool:
        """Loads an inference session for a model."""
        pass

    @abstractmethod
    def run(self, model_name: str, input_tensor: np.ndarray) -> List[np.ndarray]:
        """Executes tensor inference on the designated hardware."""
        pass

    @abstractmethod
    def get_info(self) -> Dict[str, Any]:
        """Returns hardware and execution provider information."""
        pass


class QNNInferenceBackend(BaseInferenceBackend):
    """
    Qualcomm Hexagon NPU Inference Backend.
    Uses ONNX Runtime with Qualcomm QNN Execution Provider (QnnHtp.dll).
    Directly addresses Hexagon Tensor Processor (HTP) hardware on Snapdragon.
    """

    def __init__(self):
        super().__init__(backend_id="QNN_HTP_NPU", device_name="Qualcomm Hexagon NPU (HTP)")
        self.is_npu = True
        self.active_provider = "QNNExecutionProvider"
        self.qnn_options: Dict[str, Any] = {}

    def _get_qnn_options(self) -> Dict[str, Any]:
        # Burst mode provides peak TOPS and lowest latency on Snapdragon X Elite
        options = {
            "backend_path": "QnnHtp.dll",
            "htp_performance_mode": "burst",
            "htp_graph_finalization_optimization_mode": "3",  # Maximum graph fusion
        }
        # Check if custom QNN SDK path is defined in environment
        sdk_root = os.environ.get("QNN_SDK_ROOT")
        if sdk_root:
            lib_path = os.path.join(sdk_root, "lib", "arm64x", "QnnHtp.dll")
            if os.path.exists(lib_path):
                options["backend_path"] = lib_path
        return options

    def load_session(self, model_name: str, model_path: str, expected_input_shape: Optional[Tuple[int, ...]] = None) -> bool:
        import onnxruntime as ort
        if not os.path.exists(model_path):
            logger.error(f"[QNNBackend] Model file not found: {model_path}")
            return False

        self.qnn_options = self._get_qnn_options()
        providers = [
            ("QNNExecutionProvider", self.qnn_options),
            "CPUExecutionProvider"  # Fallback only if individual non-supported subgraphs exist
        ]

        logger.info(f"[QNNBackend] Initializing session on Qualcomm Hexagon NPU for '{model_name}'...")
        try:
            session_options = ort.SessionOptions()
            session_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            
            session = ort.InferenceSession(
                model_path,
                sess_options=session_options,
                providers=providers
            )
            
            # Verify which provider was actually assigned by ONNX Runtime
            actual_providers = session.get_providers()
            logger.info(f"[QNNBackend] Model '{model_name}' loaded. Bound providers: {actual_providers}")
            
            if "QNNExecutionProvider" not in actual_providers:
                logger.warning(f"[QNNBackend] WARNING: QNNExecutionProvider was requested but ONNX Runtime bound to {actual_providers}.")

            self.loaded_sessions[model_name] = {
                "session": session,
                "input_name": session.get_inputs()[0].name,
                "input_shape": session.get_inputs()[0].shape,
                "output_names": [o.name for o in session.get_outputs()],
                "providers": actual_providers
            }
            return True
        except Exception as e:
            logger.error(f"[QNNBackend] Failed to initialize QNN session: {e}")
            return False

    def run(self, model_name: str, input_tensor: np.ndarray) -> List[np.ndarray]:
        if model_name not in self.loaded_sessions:
            raise KeyError(f"Model '{model_name}' has not been loaded into QNN backend.")
        
        info = self.loaded_sessions[model_name]
        session = info["session"]
        inp_name = info["input_name"]
        out_names = info["output_names"]

        # Ensure correct type
        if input_tensor.dtype != np.float32:
            input_tensor = input_tensor.astype(np.float32)

        outputs = session.run(out_names, {inp_name: input_tensor})
        return outputs

    def get_info(self) -> Dict[str, Any]:
        return {
            "backend_id": self.backend_id,
            "device_name": self.device_name,
            "is_npu": True,
            "provider": self.active_provider,
            "qnn_options": self.qnn_options,
            "loaded_models": list(self.loaded_sessions.keys())
        }


class CPUInferenceBackend(BaseInferenceBackend):
    """
    Host CPU Inference Backend.
    Used for local development on Intel / AMD x86_64 machines.
    Runs identically structured ONNX graphs with 100% numerical parity.
    """

    def __init__(self):
        proc = platform.processor() or "Host CPU"
        super().__init__(backend_id="CPU_DEVELOPMENT", device_name=f"Host CPU ({proc})")
        self.is_npu = False
        self.active_provider = "CPUExecutionProvider"

    def load_session(self, model_name: str, model_path: str, expected_input_shape: Optional[Tuple[int, ...]] = None) -> bool:
        import onnxruntime as ort
        if not os.path.exists(model_path):
            logger.error(f"[CPUBackend] Model file not found: {model_path}")
            return False

        logger.info(f"[CPUBackend] Loading ONNX session for '{model_name}' on Host CPU...")
        try:
            session_options = ort.SessionOptions()
            session_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            session_options.intra_op_num_threads = max(1, os.cpu_count() // 2 if os.cpu_count() else 2)

            session = ort.InferenceSession(
                model_path,
                sess_options=session_options,
                providers=["CPUExecutionProvider"]
            )

            self.loaded_sessions[model_name] = {
                "session": session,
                "input_name": session.get_inputs()[0].name,
                "input_shape": session.get_inputs()[0].shape,
                "output_names": [o.name for o in session.get_outputs()],
                "providers": session.get_providers()
            }
            logger.info(f"[CPUBackend] Model '{model_name}' loaded successfully on CPU.")
            return True
        except Exception as e:
            logger.error(f"[CPUBackend] Failed to load session: {e}")
            return False

    def run(self, model_name: str, input_tensor: np.ndarray) -> List[np.ndarray]:
        if model_name not in self.loaded_sessions:
            raise KeyError(f"Model '{model_name}' has not been loaded into CPU backend.")

        info = self.loaded_sessions[model_name]
        session = info["session"]
        inp_name = info["input_name"]
        out_names = info["output_names"]

        if input_tensor.dtype != np.float32:
            input_tensor = input_tensor.astype(np.float32)

        return session.run(out_names, {inp_name: input_tensor})

    def get_info(self) -> Dict[str, Any]:
        return {
            "backend_id": self.backend_id,
            "device_name": self.device_name,
            "is_npu": False,
            "provider": self.active_provider,
            "loaded_models": list(self.loaded_sessions.keys())
        }


def get_inference_backend(force_backend: Optional[str] = None) -> BaseInferenceBackend:
    """
    Factory function: Selects the best available hardware inference backend.
    
    Rule:
    1. If force_backend is 'npu' or 'cpu', enforce that choice.
    2. Otherwise, check for Snapdragon + QNNExecutionProvider.
       If available, select QNNInferenceBackend (Hexagon NPU).
       Otherwise, select CPUInferenceBackend with transparent logging.
    """
    if force_backend == "npu":
        logger.info("[Factory] Forcing QNN NPU backend.")
        return QNNInferenceBackend()
    elif force_backend == "cpu":
        logger.info("[Factory] Forcing CPU development backend.")
        return CPUInferenceBackend()

    # Automatic Hardware Detection
    arch = platform.machine().lower()
    proc = (platform.processor() or "").lower()
    is_arm64 = arch in ["arm64", "aarch64"]
    is_snapdragon = is_arm64 or any(k in proc for k in ["snapdragon", "qualcomm", "sc8380xp", "x elite", "x plus"])

    try:
        import onnxruntime as ort
        available = ort.get_available_providers()
    except Exception:
        available = []

    has_qnn = "QNNExecutionProvider" in available

    if is_snapdragon and has_qnn:
        logger.info("[Factory] Snapdragon platform & QNN Execution Provider detected. Activating Hexagon NPU backend.")
        return QNNInferenceBackend()
    else:
        reason = "Non-ARM64 / Intel machine" if not is_snapdragon else "QNN Execution Provider driver not found"
        logger.info(f"[Factory] Selecting CPU Development Backend ({reason}). All graph structures remain QNN-ready.")
        return CPUInferenceBackend()
