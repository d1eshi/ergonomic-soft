from __future__ import annotations

import time
from collections import deque
from dataclasses import dataclass
from typing import Optional, Any, Dict, List, Tuple

try:
    import mediapipe as mp  # type: ignore
    import cv2  # type: ignore
    import numpy as np  # type: ignore
except Exception:  # pragma: no cover - dependencias externas
    mp = None  # type: ignore
    cv2 = None  # type: ignore
    np = None  # type: ignore


@dataclass
class PoseLandmark:
    """Landmark de pose con visibilidad.

    Atributos normalizados en rango [0,1] según MediaPipe.
    """

    x: float
    y: float
    z: float
    visibility: float


class PoseDetector:
    """Detector de pose basado en MediaPipe con gestión de cámara y FPS.

    - Integración con `cv2.VideoCapture`.
    - Preprocesado de frame (resize, balance de contraste con CLAHE, conversión a RGB).
    - Medición de FPS con ventana deslizante.
    - Degradación graciosa: reduce resolución y complejidad del modelo si el tiempo por frame excede 33ms.

    Requisitos de rendimiento: 30fps objetivo en CPU. Cuando no hay consumidores, mantener uso de CPU <5% (cámara detenida).

    Ejemplo
    -------
    >>> detector = PoseDetector()
    >>> detector.start_camera()
    True
    >>> ok, frame = detector.read()
    >>> if ok:
    ...     res = detector.process_frame(frame)
    ...     fps = detector.get_frame_rate()
    >>> detector.stop_camera()
    """

    def __init__(self) -> None:
        self._pose = None
        self._mp_pose = None
        self._capture: Optional[Any] = None
        self._target_width = 640
        self._target_height = 360
        self._model_complexity = 1
        self._fps_window: deque[float] = deque(maxlen=60)
        self._last_frame_ms: float = 0.0
        self._lighting_status: str = "unknown"
        if mp is not None:
            self._mp_pose = mp.solutions.pose
            self._pose = self._create_pose(self._model_complexity)

    # ------------------------- Cámara -------------------------
    def start_camera(self, index: int = 0) -> bool:
        """Inicia la cámara.

        Devuelve True si se abrió correctamente.
        """
        if cv2 is None:
            return False
        if self._capture is not None:
            return True
        cap = cv2.VideoCapture(index)
        # Preferir MJPG para menor latencia si está disponible
        if hasattr(cv2, "CAP_PROP_FOURCC"):
            cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*"MJPG"))
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, float(self._target_width))
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, float(self._target_height))
        cap.set(cv2.CAP_PROP_FPS, 30.0)
        if not cap.isOpened():
            self._capture = None
            return False
        self._capture = cap
        return True

    def stop_camera(self) -> None:
        """Detiene y libera la cámara."""
        if self._capture is not None:
            try:
                self._capture.release()
            finally:
                self._capture = None
        self._fps_window.clear()

    def read(self) -> Tuple[bool, Optional[Any]]:
        """Lee un frame BGR de la cámara si está abierta."""
        if self._capture is None:
            return False, None
        ok, frame = self._capture.read()
        return ok, frame if ok else (False, None)

    # ----------------------- Procesamiento -----------------------
    def process_frame(self, frame_bgr: Any) -> Optional[Dict[str, Any]]:
        """Procesa un frame BGR y devuelve landmarks si hay detección.

        Aplica preprocesado y mide el tiempo de inferencia. Cuando el tiempo por
        frame excede 33ms de forma sostenida, reduce complejidad del modelo
        y/o resolución para mantener el tiempo objetivo.
        """
        if self._pose is None or cv2 is None:
            return None

        start_t = time.perf_counter()
        pre = self._preprocess(frame_bgr)
        rgb = cv2.cvtColor(pre, cv2.COLOR_BGR2RGB)
        results = self._pose.process(rgb)
        self._last_frame_ms = (time.perf_counter() - start_t) * 1000.0
        self._fps_window.append(time.perf_counter())

        # Degradación graciosa si se excede 33ms
        if self._last_frame_ms > 33.0:
            self._degrade_if_needed()

        if not results or not getattr(results, "pose_landmarks", None):
            return None

        landmarks = [
            {
                "x": lm.x,
                "y": lm.y,
                "z": lm.z,
                "visibility": lm.visibility,
            }
            for lm in results.pose_landmarks.landmark
        ]

        # Evaluación simple de iluminación
        self._lighting_status = self._estimate_lighting_status(pre)

        return {
            "landmarks": landmarks,
            "image_size": {"w": pre.shape[1], "h": pre.shape[0]},
            "inference_ms": round(self._last_frame_ms, 2),
            "lighting": self._lighting_status,
        }

    def get_frame_rate(self) -> float:
        """FPS estimados con ventana de 1-2 segundos."""
        if not self._fps_window:
            return 0.0
        times = list(self._fps_window)
        if len(times) < 2:
            return 0.0
        duration = times[-1] - times[0]
        if duration <= 0:
            return 0.0
        return (len(times) - 1) / duration

    # ----------------------- Utilidades internas -----------------------
    def _create_pose(self, model_complexity: int):
        assert self._mp_pose is not None
        return self._mp_pose.Pose(
            model_complexity=model_complexity,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

    def _recreate_pose(self) -> None:
        if self._mp_pose is None:
            return
        self._pose = self._create_pose(self._model_complexity)

    def _degrade_if_needed(self) -> None:
        # Reducir complejidad primero; luego resolución
        changed = False
        if self._model_complexity > 0:
            self._model_complexity = 0
            self._recreate_pose()
            changed = True
        elif self._target_width > 480:
            self._target_width = 480
            self._target_height = 270
            changed = True
        elif self._target_width > 320:
            self._target_width = 320
            self._target_height = 180
            changed = True
        # Aplicar nueva resolución a la cámara activa
        if changed and self._capture is not None and cv2 is not None:
            self._capture.set(cv2.CAP_PROP_FRAME_WIDTH, float(self._target_width))
            self._capture.set(cv2.CAP_PROP_FRAME_HEIGHT, float(self._target_height))

    def _preprocess(self, frame_bgr: Any) -> Any:
        if cv2 is None:
            return frame_bgr
        # Resize manteniendo proporción básica hacia target
        h, w = frame_bgr.shape[:2]
        scale = min(self._target_width / max(w, 1), self._target_height / max(h, 1))
        if scale < 1.0:
            new_size = (int(w * scale), int(h * scale))
            frame_bgr = cv2.resize(frame_bgr, new_size, interpolation=cv2.INTER_AREA)
        # CLAHE en canal L para mejorar contraste bajo baja luz
        try:
            lab = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            cl = clahe.apply(l)
            merged = cv2.merge((cl, a, b))
            frame_bgr = cv2.cvtColor(merged, cv2.COLOR_LAB2BGR)
        except Exception:
            pass
        return frame_bgr

    def _estimate_lighting_status(self, frame_bgr: Any) -> str:
        if cv2 is None:
            return "unknown"
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        mean = float(gray.mean())
        if mean < 40:
            return "poor"
        if mean < 80:
            return "dim"
        return "good"



