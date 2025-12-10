"""
Database module for Pi Agent.
Handles local SQLite storage for offline scan records.
"""

import sqlite3
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

DB_FILE = "bus_log.db"


def get_connection() -> sqlite3.Connection:
    """Get a connection to the local SQLite database."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialize the database and create tables if they don't exist."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            bus_id       TEXT NOT NULL,
            trip_date    TEXT NOT NULL,
            trip_code    TEXT NOT NULL,
            direction    TEXT NOT NULL,
            employee_id  TEXT NOT NULL,
            card_uid     TEXT NOT NULL,
            scan_time    TEXT NOT NULL,
            uploaded     INTEGER DEFAULT 0
        )
    """)
    
    # Create index for faster queries
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_scans_uploaded 
        ON scans(uploaded)
    """)
    
    # Create unique index for deduplication
    cursor.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_scans_unique 
        ON scans(bus_id, trip_date, trip_code, employee_id)
    """)
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")


def insert_scan(
    bus_id: str,
    trip_date: str,
    trip_code: str,
    direction: str,
    employee_id: str,
    card_uid: str,
    scan_time: str
) -> bool:
    """
    Insert a new scan record into the database.
    Returns True if inserted, False if duplicate (already exists).
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO scans (bus_id, trip_date, trip_code, direction, employee_id, card_uid, scan_time, uploaded)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0)
        """, (bus_id, trip_date, trip_code, direction, employee_id, card_uid, scan_time))
        conn.commit()
        logger.info(f"Scan inserted: employee={employee_id}, trip={trip_code}")
        return True
    except sqlite3.IntegrityError:
        # Duplicate scan - same employee already scanned for this trip
        logger.debug(f"Duplicate scan ignored: employee={employee_id}, trip={trip_code}")
        return False
    finally:
        conn.close()


def get_unuploaded_scans(limit: int = 200) -> List[Dict]:
    """
    Get scans that have not been uploaded yet.
    Returns up to 'limit' records.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, bus_id, trip_date, trip_code, direction, employee_id, card_uid, scan_time
        FROM scans
        WHERE uploaded = 0
        ORDER BY id ASC
        LIMIT ?
    """, (limit,))
    
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for row in rows:
        result.append({
            "id": row["id"],
            "bus_id": row["bus_id"],
            "trip_date": row["trip_date"],
            "trip_code": row["trip_code"],
            "direction": row["direction"],
            "employee_id": row["employee_id"],
            "card_uid": row["card_uid"],
            "scan_time": row["scan_time"]
        })
    
    return result


def mark_uploaded(ids: List[int]) -> None:
    """Mark the given scan IDs as uploaded."""
    if not ids:
        return
    
    conn = get_connection()
    cursor = conn.cursor()
    
    placeholders = ",".join("?" * len(ids))
    cursor.execute(f"""
        UPDATE scans
        SET uploaded = 1
        WHERE id IN ({placeholders})
    """, ids)
    
    conn.commit()
    conn.close()
    logger.info(f"Marked {len(ids)} scans as uploaded")


def get_scan_count() -> Dict[str, int]:
    """Get count of uploaded and pending scans."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM scans WHERE uploaded = 0")
    pending = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM scans WHERE uploaded = 1")
    uploaded = cursor.fetchone()[0]
    
    conn.close()
    
    return {"pending": pending, "uploaded": uploaded}
