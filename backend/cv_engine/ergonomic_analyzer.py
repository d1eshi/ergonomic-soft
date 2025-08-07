from __future__ import annotations

from typing import Dict, Any


class ErgonomicAnalyzer:
    """Analizador ergonómico basado en ISO 9241-5 y OSHA (esqueleto).

    Recibe landmarks y devuelve un dict con niveles de severidad y métricas clave.
    """

    def analyze(self, landmarks: Dict[str, Any]) -> Dict[str, Any]:
        # TODO: implementar reglas reales basadas en ángulos, distancias, tiempos (scaffolding)
        return {
            "score": 0.0,
            "severity": "info",
            "hints": [
                "Coloca la pantalla a la altura de los ojos",
                "Ajusta el respaldo para mantener la curvatura natural"
            ],
        }



