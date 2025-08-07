from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import os
from .models.db import (
    init_db,
    get_settings as db_get_settings,
    update_settings as db_update_settings,
    purge_old_data,
)
from .cv_engine.session_manager import cv_session

APP_VERSION = os.environ.get("APP_VERSION", "0.1.0")

app = FastAPI(title="Ergonomic App Backend", version=APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Solo desarrollo; en producción restringir
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()
    # Política de retención: borrar datos antiguos
    try:
        purge_old_data(30)
    except Exception:
        pass


@app.get("/health")
def health():
    return {"status": "ok", "service": "fastapi", "version": APP_VERSION}


# ---------------------- Endpoints de visión por computador ----------------------

@app.post("/api/cv/start-session")
def start_session():
    started = cv_session.start()
    return {"started": started, **cv_session.get_status()}


@app.post("/api/cv/stop-session")
def stop_session():
    cv_session.stop()
    return {"stopped": True, **cv_session.get_status()}


@app.get("/api/cv/current-analysis")
def current_analysis():
    return cv_session.get_current_analysis()


@app.get("/api/cv/camera-status")
def camera_status():
    return cv_session.get_status()


@app.post("/api/cv/calibrate")
def calibrate():
    # Usa el último análisis disponible como baseline si contiene ángulos
    data = cv_session.get_current_analysis()
    angles = data.get("angles")
    if angles:
        cv_session.analyzer.calibrate(angles)
        return {"ok": True, "baseline": angles}
    return {"ok": False, "reason": "no_angles"}


@app.get("/api/cv/settings")
def get_settings():
    return db_get_settings()


@app.post("/api/cv/settings")
def set_settings(settings: dict):
    autostart = bool(settings.get("autostart", False))
    notifications = bool(settings.get("notifications", True))
    db_update_settings(autostart, notifications)
    return {"ok": True, "settings": db_get_settings()}


@app.get("/api/privacy-policy")
def privacy_policy():
    return {
        "dataRetention": {
            "maxHistoryDays": 30,
            "aggregatedDataOnly": True,
            "localStorageOnly": True,
        },
        "userConsent": {
            "cameraAccess": True,
            "dataCollection": True,
            "analytics": True,
        },
    }


@app.websocket("/api/cv/stream")
async def ws_stream(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            payload = cv_session.get_current_analysis()
            await ws.send_json(payload)
            # simple ritmo ~10Hz para UI
            await asyncio_sleep(0.1)
    except WebSocketDisconnect:
        # Cliente desconectado, terminar
        return


# FastAPI no expone asyncio.sleep directamente
async def asyncio_sleep(seconds: float) -> None:
    import asyncio

    await asyncio.sleep(seconds)

