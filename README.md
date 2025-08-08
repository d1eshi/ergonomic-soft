## Software de Monitoreo Ergonómico

### Requisitos
- Node 18+ (recomendado 20+)
- Python 3.9+

### Primer uso (instalación)
```bash
npm run setup
```

Este script crea `.venv`, actualiza `pip`, instala dependencias Python de `backend/requirements.txt` y ejecuta `npm ci`.

### Arranque en desarrollo
```bash
npm run dev:app
```

Qué sucede:
- Vite arranca el frontend en `http://localhost:5173`.
- `vite-plugin-electron` compila `electron/main.ts` y `electron/preload.ts` hacia `dist-electron`.
- Electron se levanta y, mediante `electron/python-manager.ts`, inicia el backend FastAPI con Uvicorn en `127.0.0.1:5175` (o el puerto definido).

### Puertos y variables
- `BACKEND_PORT`: puerto del backend (por defecto `5175`).
- `PYTHON_PATH`: ruta del ejecutable de Python a usar (si no está, se intenta `.venv` y luego el del sistema).

### Comprobaciones rápidas
- Backend: `GET http://127.0.0.1:5175/health` → `{ status: "ok" }`
- Stream CV: WebSocket `ws://127.0.0.1:5175/api/cv/stream` (emite análisis ~10Hz)

---

## Motor de Visión por Computador (CV) – Pose Detection & Ergonomic Analysis

El motor usa MediaPipe Pose (33 landmarks) y OpenCV, con preprocesado (resize + CLAHE) y degradación graciosa para mantener ~30fps en CPU. Todo el procesamiento se realiza en el dispositivo.

### Componentes
- `backend/cv_engine/pose_detector.py`: detección de pose, FPS, manejo de cámara, estimación de iluminación.
- `backend/cv_engine/ergonomic_analyzer.py`: cálculo de ángulos (cuello, espalda, codos, alineación de hombros), clasificación según ISO 9241-5 / OSHA y recomendaciones.
- `backend/cv_engine/session_manager.py`: bucle de procesamiento en hilo de fondo (~30fps), estado y último análisis disponibles para API/WS.

Diagrama (simplificado)
```
[Camera] -> [OpenCV Preprocess] -> [MediaPipe Pose] -> [Angles/Rules] -> [Analysis]
                 |                         |                 |
              Resize/CLAHE              33 landmarks     ISO/OSHA thresholds
```

### Endpoints FastAPI (CV)
- POST `/api/cv/start-session`: inicia la cámara y el bucle de análisis.
- POST `/api/cv/stop-session`: detiene la sesión y libera recursos.
- GET `/api/cv/current-analysis`: devuelve el último análisis (ángulos, severidades, recomendaciones, `inference_ms`, `lighting`).
- GET `/api/cv/camera-status`: estado de cámara/FPS/errores.
- POST `/api/cv/calibrate`: usa los ángulos actuales como baseline del usuario.
- GET `/api/cv/settings` y POST `/api/cv/settings`: ajustes persistidos en SQLite (`backend/ergonomic.db`).
- WebSocket `/api/cv/stream`: envía en tiempo real el análisis actual (≈10Hz) para UI.

### Uso rápido de la API (ejemplos)
```bash
# Iniciar sesión CV
curl -X POST http://127.0.0.1:5175/api/cv/start-session

# Obtener análisis actual
curl http://127.0.0.1:5175/api/cv/current-analysis

# Parar sesión CV
curl -X POST http://127.0.0.1:5175/api/cv/stop-session
```

### Ejecución backend manual (opcional)
Si prefieres arrancar el backend sin Electron:
```bash
./.venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 5175 --reload
```

### Tests
```bash
./.venv/bin/python -m pytest backend/tests -q
```

### Solución de problemas
- Cámara no detectada o permiso denegado: revisa permisos del sistema operativo y privacidad de la app.
- Iluminación pobre: el análisis agrega `lighting: dim/poor`. Mejora la iluminación frontal o reduce contraluces.
- Rendimiento bajo (<30fps): el motor reduce complejidad y resolución automáticamente; cierra apps que usen la cámara.
- Puerto ocupado (`5175`): define `BACKEND_PORT` en `npm run dev:app` o en el entorno.

### Privacidad y almacenamiento local
- No se envían imágenes ni landmarks fuera del dispositivo.
- Ajustes de usuario se guardan en SQLite: `backend/ergonomic.db`.

### Notas de rendimiento
- Objetivo: <33ms por frame en CPU. Cuando está detenido, la cámara se libera y el uso de CPU permanece <5%.
- Preprocesado con CLAHE para robustez en baja iluminación.


