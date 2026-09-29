"""
On-Device Whisper Speech Recognition Engine for Nori
Leverages faster-whisper (CTranslate2) for low-latency, 100% offline, privacy-first transcription.
All model weights are stored in D:\\hf_cache to preserve C: drive capacity.
"""

import os
import io
import logging
from typing import Optional

logger = logging.getLogger("nori.whisper")

def _get_default_cache_dir() -> str:
    if os.environ.get("HF_HOME"):
        return os.environ["HF_HOME"]
    if os.path.exists("D:\\"):
        return "D:\\hf_cache"
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    return os.path.join(project_root, ".cache", "hf_cache")

WHISPER_DOWNLOAD_ROOT = _get_default_cache_dir()
os.environ["HF_HOME"] = WHISPER_DOWNLOAD_ROOT

class WhisperASREngine:
    def __init__(self, model_size: str = "tiny.en", device: str = "auto", compute_type: str = "int8"):
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        self._model = None
        self._is_available = False

    def initialize(self) -> bool:
        if self._model is not None:
            return True
        # 1. Try faster-whisper (fastest CTranslate2 CPU int8)
        try:
            from faster_whisper import WhisperModel
            from huggingface_hub import snapshot_download

            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            local_model_dir = os.path.join(project_root, "backend", "models", "whisper_tiny_en")
            
            if os.path.exists(os.path.join(local_model_dir, "model.bin")) or os.path.exists(os.path.join(local_model_dir, "model.safetensors")):
                model_source = local_model_dir
            else:
                os.makedirs(local_model_dir, exist_ok=True)
                model_source = snapshot_download(repo_id=f"Systran/faster-whisper-{self.model_size}", local_dir=local_model_dir)

            self._model = WhisperModel(
                model_source,
                device="cpu",
                compute_type="int8"
            )
            self._engine_type = "faster_whisper"
            self._is_available = True
            logger.info(f"Faster-Whisper model '{self.model_size}' is ready (CPU INT8).")
            return True
        except Exception as e:
            logger.warning(f"Faster-Whisper init notice: {e}")

        # 2. Fallback to official openai-whisper
        try:
            import whisper
            self._model = whisper.load_model("tiny.en")
            self._engine_type = "openai_whisper"
            self._is_available = True
            logger.info("Official OpenAI Whisper model 'tiny.en' is ready.")
            return True
        except Exception as e:
            logger.warning(f"Could not load OpenAI Whisper: {e}")
            self._is_available = False
            return False

    @property
    def is_available(self) -> bool:
        return self._is_available

    def transcribe_wav_bytes(self, wav_bytes: bytes) -> Optional[str]:
        if not self.initialize() or self._model is None:
            return None
        
        # Handle official openai-whisper
        if getattr(self, '_engine_type', 'faster_whisper') == 'openai_whisper':
            import tempfile
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
                tmp.write(wav_bytes)
                tmp_path = tmp.name
            try:
                res = self._model.transcribe(tmp_path, fp16=False)
                text = res.get('text', '').strip()
                return text if text else None
            except Exception as e:
                logger.warning(f"OpenAI Whisper transcription notice: {e}")
                return None
            finally:
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass

        # Handle faster-whisper (CTranslate2)
        try:
            audio_stream = io.BytesIO(wav_bytes)
            segments, info = self._model.transcribe(
                audio_stream,
                beam_size=2,
                vad_filter=False
            )
            full_text = " ".join([segment.text for segment in segments]).strip()
            return full_text if full_text else None
        except Exception as e:
            logger.warning(f"Whisper transcription error: {e}. Switching to CPU mode...")
            # Reload on CPU if CUDA runtime error occurs
            try:
                from faster_whisper import WhisperModel
                self._model = WhisperModel(
                    self.model_size,
                    device="cpu",
                    compute_type="int8",
                    download_root=os.path.join(WHISPER_DOWNLOAD_ROOT, "whisper")
                )
                audio_stream = io.BytesIO(wav_bytes)
                segments, info = self._model.transcribe(
                    audio_stream,
                    beam_size=2,
                    vad_filter=False
                )
                full_text = " ".join([segment.text for segment in segments]).strip()
                return full_text if full_text else None
            except Exception as cpu_err:
                logger.error(f"CPU Whisper fallback error: {cpu_err}")
                return None

    def transcribe_speech_recognition_audio(self, audio_data) -> Optional[str]:
        """Direct adapter for speech_recognition.AudioData."""
        try:
            wav_bytes = audio_data.get_wav_data()
            return self.transcribe_wav_bytes(wav_bytes)
        except Exception as e:
            logger.warning(f"Error converting audio data to wav: {e}")
            return None

whisper_engine = WhisperASREngine()
