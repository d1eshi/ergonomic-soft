import os
import sqlite3
from pathlib import Path
from typing import Optional


DB_PATH = Path(os.environ.get("ERGONOMIC_DB", Path(__file__).resolve().parent.parent / "ergonomic.db"))


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
        # KV opcional para preferencias adicionales
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS user_settings_kv (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
        )

        # Historial de sesiones (agregado, sin datos crudos)
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS analysis_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                average_posture_score REAL,
                alerts_triggered INTEGER,
                breaks_taken INTEGER
            );
            """
        )

        # Historial de alertas para aprendizaje de patrones
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS alert_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alert_type TEXT NOT NULL,
                triggered_at TIMESTAMP,
                dismissed_at TIMESTAMP,
                user_action TEXT,
                effectiveness_score INTEGER
            );
            """
        )
        # Asegurar fila única de settings
        cur.execute("INSERT OR IGNORE INTO user_settings (id) VALUES (1);")
        conn.commit()


def get_settings() -> dict:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT autostart, notifications FROM user_settings WHERE id = 1")
        row = cur.fetchone()
        if not row:
            return {"autostart": False, "notifications": True}
        return {"autostart": bool(row[0]), "notifications": bool(row[1])}


def update_settings(autostart: bool, notifications: bool) -> None:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            "UPDATE user_settings SET autostart = ?, notifications = ? WHERE id = 1",
            (1 if autostart else 0, 1 if notifications else 0),
        )
        conn.commit()


def settings_kv_set(key: str, value: str) -> None:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO user_settings_kv(key, value) VALUES(?, ?)\n"
            "ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP",
            (key, value),
        )
        conn.commit()


def insert_session_summary(
    start_time: str,
    end_time: str,
    average_posture_score: float,
    alerts_triggered: int,
    breaks_taken: int,
) -> int:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO analysis_sessions(start_time, end_time, average_posture_score, alerts_triggered, breaks_taken)
            VALUES(?, ?, ?, ?, ?)
            """,
            (start_time, end_time, average_posture_score, alerts_triggered, breaks_taken),
        )
        conn.commit()
        return int(cur.lastrowid)


def insert_alert_history(
    alert_type: str,
    triggered_at: str,
    dismissed_at: Optional[str],
    user_action: Optional[str],
    effectiveness_score: Optional[int],
) -> int:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO alert_history(alert_type, triggered_at, dismissed_at, user_action, effectiveness_score)
            VALUES(?, ?, ?, ?, ?)
            """,
            (alert_type, triggered_at, dismissed_at, user_action, effectiveness_score),
        )
        conn.commit()
        return int(cur.lastrowid)


def purge_old_data(max_history_days: int = 30) -> None:
    """Elimina datos antiguos respetando políticas de retención."""
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM analysis_sessions WHERE end_time IS NOT NULL AND end_time < datetime('now', ?)",
            (f'-{max_history_days} days',),
        )
        cur.execute(
            "DELETE FROM alert_history WHERE triggered_at < datetime('now', ?)",
            (f'-{max_history_days} days',),
        )
        conn.commit()



