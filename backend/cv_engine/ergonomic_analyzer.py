from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Dict, Any, List, Optional, Tuple


# Índices de MediaPipe Pose (v0.10+)
NOSE = 0
LEFT_EAR = 7
RIGHT_EAR = 8
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_ELBOW = 13
RIGHT_ELBOW = 14
LEFT_WRIST = 15
RIGHT_WRIST = 16
LEFT_HIP = 23
RIGHT_HIP = 24


ERGONOMIC_STANDARDS: Dict[str, Dict[str, float]] = {
    "neck_angle": {"optimal": 0, "acceptable": 15, "warning": 25, "critical": 35},
    "back_angle": {"optimal": 100, "acceptable": 90, "warning": 80, "critical": 70},
    "elbow_angle": {"optimal": 90, "acceptable": 80, "warning": 70, "critical": 60},
    "shoulder_alignment": {"optimal": 0, "acceptable": 5, "warning": 10, "critical": 15},
}


@dataclass
class AnalysisResult:
    angles: Dict[str, float]
    severity_by_metric: Dict[str, str]
    overall_severity: str
    recommendations: List[str]


class ErgonomicAnalyzer:
    """Analizador ergonómico basado en ISO 9241-5 y OSHA.

    Calcula métricas angulares a partir de landmarks MediaPipe normalizados y retorna un
    análisis con severidades y recomendaciones.

    Ejemplo
    -------
    >>> analyzer = ErgonomicAnalyzer(ERGONOMIC_STANDARDS)
    >>> lm = {"landmarks": [{"x": 0.5, "y": 0.5, "z": 0.0, "visibility": 1.0}] * 33}
    >>> res = analyzer.analyze_pose(lm)
    >>> isinstance(res, dict)
    True
    """

    def __init__(self, standards: Dict[str, Dict[str, float]]) -> None:
        self.standards = standards
        self._baseline: Dict[str, float] = {}

    def calibrate(self, angles: Dict[str, float]) -> None:
        """Guarda una línea base de ángulos del usuario."""
        self._baseline = angles.copy()

    def analyze_pose(self, detection: Dict[str, Any]) -> Dict[str, Any]:
        """Devuelve análisis con severidades y recomendaciones.

        Parameters
        ----------
        detection: Dict[str, Any]
            Estructura que contiene `landmarks` como lista de dicts {x,y,z,visibility}.
        """
        landmarks = detection.get("landmarks")
        if not landmarks:
            return {"severity": "no_pose", "message": "No se detectó postura"}

        angles = self.calculate_angles(landmarks)
        severity_by_metric = {k: self._classify(k, v) for k, v in angles.items()}
        overall = self._max_severity(list(severity_by_metric.values()))
        recs = self.generate_recommendations({"angles": angles, "severity_by_metric": severity_by_metric})
        return {
            "angles": angles,
            "severity_by_metric": severity_by_metric,
            "overall_severity": overall,
            "recommendations": recs,
        }

    def calculate_angles(self, landmarks: List[Dict[str, float]]) -> Dict[str, float]:
        """Calcula métricas principales: cuello, espalda, codos y alineación de hombros.

        Los ángulos se devuelven en grados.
        """
        # Helpers
        def get_xy(idx: int) -> Tuple[float, float]:
            lm = landmarks[idx]
            return float(lm["x"]), float(lm["y"])

        def vector(a: Tuple[float, float], b: Tuple[float, float]) -> Tuple[float, float]:
            return (b[0] - a[0], b[1] - a[1])

        def angle_between(u: Tuple[float, float], v: Tuple[float, float]) -> float:
            ux, uy = u
            vx, vy = v
            dot = ux * vx + uy * vy
            nu = math.hypot(ux, uy)
            nv = math.hypot(vx, vy)
            if nu == 0 or nv == 0:
                return 0.0
            cosang = max(-1.0, min(1.0, dot / (nu * nv)))
            return math.degrees(math.acos(cosang))

        # Puntos clave
        ls = get_xy(LEFT_SHOULDER)
        rs = get_xy(RIGHT_SHOULDER)
        le = get_xy(LEFT_ELBOW)
        re = get_xy(RIGHT_ELBOW)
        lw = get_xy(LEFT_WRIST)
        rw = get_xy(RIGHT_WRIST)
        lh = get_xy(LEFT_HIP)
        rh = get_xy(RIGHT_HIP)
        learp = get_xy(LEFT_EAR)
        rearp = get_xy(RIGHT_EAR)

        shoulder_mid = ((ls[0] + rs[0]) / 2.0, (ls[1] + rs[1]) / 2.0)
        hip_mid = ((lh[0] + rh[0]) / 2.0, (lh[1] + rh[1]) / 2.0)
        ear_mid = ((learp[0] + rearp[0]) / 2.0, (learp[1] + rearp[1]) / 2.0)

        # 1) Neck angle: vector hombros->orejas vs eje vertical hacia arriba (0, -1)
        neck_vec = vector(shoulder_mid, ear_mid)
        neck_angle = angle_between(neck_vec, (0.0, -1.0))

        # 2) Back angle (escala OSHA ~70-100):
        # Tomamos el vector tronco = caderas->hombros. Su desviación vs vertical = dv.
        # Mapeamos a 90 +/- dv según signo (reclinación vs encorvamiento) empleando
        # la relación de la cabeza respecto a las caderas para estimar el signo.
        trunk_vec = vector(hip_mid, shoulder_mid)
        dv = angle_between(trunk_vec, (0.0, -1.0))
        # Signo aproximado: si la cabeza está más adelantada en X que las caderas, asumimos encorvado
        sign = 1.0
        if abs(ear_mid[0] - hip_mid[0]) > 0.02:
            sign = -1.0 if ear_mid[0] > hip_mid[0] else 1.0
        back_angle = 90.0 + sign * dv
        back_angle = max(60.0, min(110.0, back_angle))

        # 3) Elbow angles (promedio izquierda/derecha)
        def joint_angle(a: Tuple[float, float], b: Tuple[float, float], c: Tuple[float, float]) -> float:
            # Ángulo en b formado por a-b-c
            ab = vector(b, a)
            cb = vector(b, c)
            return angle_between(ab, cb)

        elbow_left = joint_angle(ls, le, lw)
        elbow_right = joint_angle(rs, re, rw)
        elbow_angle = (elbow_left + elbow_right) / 2.0

        # 4) Shoulder alignment: ángulo de la línea entre hombros vs horizontal (en grados)
        shoulder_vec = vector(ls, rs)
        shoulder_alignment = abs(math.degrees(math.atan2(shoulder_vec[1], shoulder_vec[0])))

        return {
            "neck_angle": round(neck_angle, 2),
            "back_angle": round(back_angle, 2),
            "elbow_angle": round(elbow_angle, 2),
            "shoulder_alignment": round(shoulder_alignment, 2),
        }

    def generate_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        recs: List[str] = []
        angles = analysis["angles"]
        sev = analysis["severity_by_metric"]
        if sev.get("neck_angle") in {"warning", "critical"}:
            recs.append("Eleva la pantalla a la altura de los ojos y retrae la barbilla")
        if sev.get("back_angle") in {"warning", "critical"}:
            recs.append("Apoya la zona lumbar y reclina el respaldo ligeramente (95°–110°)")
        if sev.get("elbow_angle") in {"warning", "critical"}:
            recs.append("Ajusta la altura de la silla o el reposabrazos para mantener 90° en codos")
        if sev.get("shoulder_alignment") in {"warning", "critical"}:
            recs.append("Relaja hombros y centra el teclado para evitar inclinación lateral")
        if not recs and self._baseline:
            recs.append("Mantén tu postura actual; dentro de tu calibración personal")
        if not recs:
            recs.append("Postura dentro de rangos saludables")
        return recs

    # ------------------------ utilidades internas ------------------------
    def _classify(self, metric: str, value: float) -> str:
        s = self.standards.get(metric, {})
        if metric == "back_angle":
            # Cuanto más cercano a 100 mejor; 90 aceptable; <80 warning; <70 critical
            if value >= s.get("optimal", 100) - 2:
                return "optimal"
            if value >= s.get("acceptable", 90):
                return "acceptable"
            if value >= s.get("warning", 80):
                return "warning"
            return "critical"
        else:
            # Métricas donde 0 es óptimo y mayor es peor (cuello y hombros),
            # y codo donde óptimo ~90 y desviaciones grandes son peores.
            if metric == "elbow_angle":
                delta = abs(value - self.standards[metric]["optimal"])
                if delta <= 5:
                    return "optimal"
                if delta <= 10:
                    return "acceptable"
                if delta <= 20:
                    return "warning"
                return "critical"
            # neck_angle / shoulder_alignment
            if value <= s.get("acceptable", 15):
                if value <= s.get("optimal", 0) + 2:
                    return "optimal"
                return "acceptable"
            if value <= s.get("warning", 25):
                return "warning"
            return "critical"

    def _max_severity(self, severities: List[str]) -> str:
        order = {"optimal": 0, "acceptable": 1, "warning": 2, "critical": 3}
        return max(severities, key=lambda s: order.get(s, -1))



