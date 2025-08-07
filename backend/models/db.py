import os
import sqlite3
from pathlib import Path


DB_PATH = Path(__file__).resolve().parent.parent / "ergonomic.db"


def get_conn() -> sqlite3.Connection:
    return sqlite3.connect(DB_PATH)


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS posture_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ts DATETIME DEFAULT CURRENT_TIMESTAMP,
                severity TEXT NOT NULL,
                message TEXT NOT NULL
            );
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS user_settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                autostart INTEGER DEFAULT 0,
                notifications INTEGER DEFAULT 1
            );
            """
        )
        # Asegurar fila única de settings
        cur.execute("INSERT OR IGNORE INTO user_settings (id) VALUES (1);")
        conn.commit()



