from __future__ import annotations

from typing import Optional, Any, Dict

try:
    import mediapipe as mp  # type: ignore
    import cv2  # type: ignore
except Exception:  # pragma: no cover - dependencias externas
    mp = None  # type: ignore
    cv2 = None  # type: ignore


class PoseDetector:
    """Contenedor simple sobre MediaPipe Pose.

    Esta clase prepara el detector y expone un método para detectar landmarks en un frame BGR de OpenCV.
    Implementación mínima para el scaffolding; se ampliará con FPS en tiempo real y pipelines.
    """

    def __init__(self) -> None:
        if mp is None:  # librerías no instaladas
            self.pose = None
        else:
            self._mp_pose = mp.solutions.pose
            self.pose = self._mp_pose.Pose(model_complexity=1, enable_segmentation=False)

    def detect(self, frame_bgr) -> Optional[Dict[str, Any]]:
        if self.pose is None:
            return None
        rgb = frame_bgr[:, :, ::-1]
        results = self.pose.process(rgb)
        if not results.pose_landmarks:
            return None
        # Convertir a estructura simple (x,y,z,visibility)
        landmarks = [
            {"x": lm.x, "y": lm.y, "z": lm.z, "v": lm.visibility}
            for lm in results.pose_landmarks.landmark
        ]
        return {"landmarks": landmarks}



