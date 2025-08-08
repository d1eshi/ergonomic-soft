from __future__ import annotations

import threading
import time
from typing import Any, Dict, Optional

from .pose_detector import PoseDetector
from .ergonomic_analyzer import ErgonomicAnalyzer, ERGONOMIC_STANDARDS


class CVSessionManager:
    """Gestiona una sesión de análisis ergonómico en segundo plano.

    - Inicia/detiene cámara y bucle de procesamiento a ~30fps.
    - Publica el último resultado de análisis para consumo por HTTP/WebSocket.
    - Maneja degradación graciosa y estados de error comunes.
    """

    def __init__(self) -> None:
        self.detector = PoseDetector()
        self.analyzer = ErgonomicAnalyzer(ERGONOMIC_STANDARDS)
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()
        self._last_detection: Optional[Dict[str, Any]] = None
        self._last_analysis: Optional[Dict[str, Any]] = None
        self._last_error: Optional[str] = None

    # ------------------------- ciclo de vida -------------------------
    def start(self) -> bool:
        """Inicia la sesión si no está corriendo. Devuelve True si queda activa."""
        with self._lock:
            if self._running:
                return True
            opened = self.detector.start_camera()
            if not opened:
                self._last_error = "camera_open_failed"
                self._running = False
                return False
            self._running = True
            self._thread = threading.Thread(target=self._loop, name="cv_loop", daemon=True)
            self._thread.start()
            return True

    def stop(self) -> None:
        """Detiene la sesión y libera la cámara."""
        with self._lock:
            self._running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=1.0)
        self.detector.stop_camera()
        with self._lock:
            self._thread = None

    # --------------------------- consultas ---------------------------
    def get_status(self) -> Dict[str, Any]:
        with self._lock:
            status = {
                "running": self._running,
                "fps": round(self.detector.get_frame_rate(), 2),
                "last_error": self._last_error,
            }
        return status

    def get_current_analysis(self) -> Dict[str, Any]:
        with self._lock:
            analysis = self._last_analysis.copy() if self._last_analysis else {
                "overall_severity": "idle",
                "message": "Sin análisis disponible",
            }
            if self._last_detection:
                analysis.update({
                    "inference_ms": self._last_detection.get("inference_ms"),
                    "lighting": self._last_detection.get("lighting"),
                    "image_size": self._last_detection.get("image_size"),
                    # Incluir landmarks para que el frontend pueda dibujar el esqueleto
                    "landmarks": self._last_detection.get("landmarks"),
                })
        return analysis

    # ------------------------ bucle de procesamiento ------------------------
    def _loop(self) -> None:
        target_fps = 30.0
        target_dt = 1.0 / target_fps
        while True:
            with self._lock:
                if not self._running:
                    break
            ok, frame = self.detector.read()
            if not ok or frame is None:
                # Cámara no entrega frames; intentar mantener bajo uso de CPU
                time.sleep(0.1)
                continue

            detection = self.detector.process_frame(frame)
            with self._lock:
                self._last_detection = detection
                if detection is None:
                    self._last_analysis = {"overall_severity": "no_pose"}
                else:
                    self._last_analysis = self.analyzer.analyze_pose(detection)

            # Mantener ritmo de 30fps
            elapsed = self.detector._last_frame_ms / 1000.0 if detection else 0.0
            sleep_time = max(0.0, target_dt - elapsed)
            if sleep_time > 0:
                time.sleep(sleep_time)


# Instancia global única para el backend
cv_session = CVSessionManager()


