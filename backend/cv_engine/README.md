## CV Engine: Pose Detection & Ergonomic Analysis

Este módulo implementa el motor de visión por computador para análisis ergonómico en tiempo real, basado en MediaPipe Pose y OpenCV.

### Arquitectura
```
VideoCapture -> Preprocess (resize + CLAHE) -> MediaPipe Pose
            -> Angles (neck/back/elbow/shoulders) -> Rules (ISO/OSHA) -> Analysis
```

### Componentes
- `pose_detector.py`
  - `start_camera()` / `stop_camera()` / `read()`
  - `process_frame(frame_bgr)` devuelve: `landmarks`, `image_size`, `inference_ms`, `lighting`
  - Estimación de FPS (`get_frame_rate()`), degradación graciosa si `inference_ms > 33`

- `ergonomic_analyzer.py`
  - `calculate_angles(landmarks)` → `neck_angle`, `back_angle`, `elbow_angle`, `shoulder_alignment`
  - `analyze_pose(detection)` → severidades y recomendaciones
  - `ERGONOMIC_STANDARDS` basado en ISO 9241-5 y OSHA (valores por defecto), `calibrate()`

- `session_manager.py`
  - Hilo de fondo a ~30fps que lee cámara, procesa y publica último análisis
  - API de estado: `get_status()` / `get_current_analysis()`

### Endpoints (expuestos por FastAPI)
- POST `/api/cv/start-session` / POST `/api/cv/stop-session`
- GET `/api/cv/current-analysis` / GET `/api/cv/camera-status`
- POST `/api/cv/calibrate`
- WebSocket `/api/cv/stream`

### Rendimiento
- Objetivo: 30fps con <33ms por frame.
- Reduce `model_complexity` y resolución si el tiempo por frame crece.

### Pruebas
```bash
../../.venv/bin/python -m pytest ../tests -q
```

### Requisitos
Ver `backend/requirements.txt`.


