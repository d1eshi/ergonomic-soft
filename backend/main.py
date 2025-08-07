from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from .models.db import init_db

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


@app.get("/health")
def health():
    return {"status": "ok", "service": "fastapi", "version": APP_VERSION}


