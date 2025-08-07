from __future__ import annotations

import math
from typing import List, Dict

from backend.cv_engine.ergonomic_analyzer import ErgonomicAnalyzer, ERGONOMIC_STANDARDS


def _dummy_landmarks() -> List[Dict[str, float]]:
    # 33 landmarks inicializados al centro
    lms = [{"x": 0.5, "y": 0.5, "z": 0.0, "visibility": 1.0} for _ in range(33)]
    # hombros
    lms[11] = {"x": 0.45, "y": 0.55, "z": 0.0, "visibility": 1.0}
    lms[12] = {"x": 0.55, "y": 0.55, "z": 0.0, "visibility": 1.0}
    # orejas
    lms[7] = {"x": 0.48, "y": 0.45, "z": 0.0, "visibility": 1.0}
    lms[8] = {"x": 0.52, "y": 0.45, "z": 0.0, "visibility": 1.0}
    # caderas
    lms[23] = {"x": 0.47, "y": 0.70, "z": 0.0, "visibility": 1.0}
    lms[24] = {"x": 0.53, "y": 0.70, "z": 0.0, "visibility": 1.0}
    # codos y muñecas
    lms[13] = {"x": 0.42, "y": 0.60, "z": 0.0, "visibility": 1.0}
    lms[14] = {"x": 0.58, "y": 0.60, "z": 0.0, "visibility": 1.0}
    lms[15] = {"x": 0.42, "y": 0.65, "z": 0.0, "visibility": 1.0}
    lms[16] = {"x": 0.58, "y": 0.65, "z": 0.0, "visibility": 1.0}
    return lms


def test_analyzer_compute_angles():
    analyzer = ErgonomicAnalyzer(ERGONOMIC_STANDARDS)
    res = analyzer.calculate_angles(_dummy_landmarks())
    assert set(res.keys()) == {"neck_angle", "back_angle", "elbow_angle", "shoulder_alignment"}
    assert 0 <= res["neck_angle"] <= 90
    assert 60 <= res["back_angle"] <= 110
    assert 0 <= res["elbow_angle"] <= 180
    assert 0 <= res["shoulder_alignment"] <= 90


def test_analyzer_classification():
    analyzer = ErgonomicAnalyzer(ERGONOMIC_STANDARDS)
    detection = {"landmarks": _dummy_landmarks()}
    analysis = analyzer.analyze_pose(detection)
    assert "overall_severity" in analysis
    assert isinstance(analysis["recommendations"], list)


