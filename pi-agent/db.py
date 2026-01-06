"""
Database module for Pi Agent.
Handles local SQLite storage for offline scan records.
"""

import sqlite3
import logging
from datetime import datetime
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
            batch_id     INTEGER NOT NULL,
            card_uid     TEXT,
            scan_time    TEXT NOT NULL,
            scan_date    TEXT NOT NULL,
            uploaded     INTEGER DEFAULT 0
        )
    """)
    
    # Add scan_date column if it doesn't exist (migration for existing DBs)
    try:
        cursor.execute("ALTER TABLE scans ADD COLUMN scan_date TEXT")
        # Backfill scan_date for existing records
        cursor.execute("""
            UPDATE scans SET scan_date = substr(scan_time, 1, 10) 
            WHERE scan_date IS NULL
        """)
        logger.info("Migrated existing scans to include scan_date")
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    # Create index for faster queries
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_scans_uploaded 
        ON scans(uploaded)
    """)
    
    # Create unique index for deduplication by batch_id per day
    # This prevents the same employee from being recorded multiple times on the same day
    cursor.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_scans_batch_date 
        ON scans(batch_id, scan_date)
    """)
    
    # Drop old index if exists (batch_id + scan_time was too strict)
    try:
        cursor.execute("DROP INDEX IF EXISTS idx_scans_unique")
    except:
        pass
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")


def check_duplicate_today(batch_id: int) -> Optional[Dict]:
    """
    Check if a batch_id has already been scanned today.
    Returns the existing scan record if found, None otherwise.
    """
    today = datetime.now().strftime('%Y-%m-%d')
    
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, batch_id, card_uid, scan_time, uploaded
        FROM scans
        WHERE batch_id = ? AND scan_date = ?
    """, (batch_id, today))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "id": row["id"],
            "batch_id": row["batch_id"],
            "card_uid": row["card_uid"],
            "scan_time": row["scan_time"],
            "uploaded": bool(row["uploaded"])
        }
    return None


def insert_scan(
    batch_id: int,
    card_uid: str,
    scan_time: str
) -> Dict:
    """
    Insert a new scan record into the database.
    Returns a dict with:
        - inserted: True if newly inserted, False if duplicate
        - existing_scan: The existing scan record if duplicate
    """
    scan_date = scan_time[:10]  # Extract YYYY-MM-DD from ISO datetime
    
    # First check if duplicate exists
    existing = check_duplicate_today(batch_id)
    if existing:
        logger.debug(f"Duplicate scan detected: batch_id={batch_id} already scanned at {existing['scan_time']}")
        return {"inserted": False, "existing_scan": existing}
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO scans (batch_id, card_uid, scan_time, scan_date, uploaded)
            VALUES (?, ?, ?, ?, 0)
        """, (batch_id, card_uid, scan_time, scan_date))
        conn.commit()
        logger.info(f"Scan inserted: batch_id={batch_id}")
        return {"inserted": True, "existing_scan": None}
    except sqlite3.IntegrityError:
        # Duplicate scan - race condition, another process inserted first
        logger.debug(f"Duplicate scan ignored (race condition): batch_id={batch_id}")
        existing = check_duplicate_today(batch_id)
        return {"inserted": False, "existing_scan": existing}
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
        SELECT id, batch_id, card_uid, scan_time
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
            "batch_id": row["batch_id"],
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


def get_today_scan_count() -> Dict[str, int]:
    """Get count of today's uploaded and pending scans."""
    today = datetime.now().strftime('%Y-%m-%d')
    
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT COUNT(*) FROM scans 
        WHERE uploaded = 0 AND scan_time LIKE ?
    """, (f"{today}%",))
    pending = cursor.fetchone()[0]
    
    cursor.execute("""
        SELECT COUNT(*) FROM scans 
        WHERE uploaded = 1 AND scan_time LIKE ?
    """, (f"{today}%",))
    uploaded = cursor.fetchone()[0]
    
    conn.close()
    return {"pending": pending, "uploaded": uploaded, "total": pending + uploaded}


def get_recent_scans(limit: int = 50) -> List[Dict]:
    """
    Get recent scans (both uploaded and pending).
    Returns up to 'limit' records, ordered by most recent first.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, batch_id, card_uid, scan_time, uploaded
        FROM scans
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))
    
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for row in rows:
        result.append({
            "id": row["id"],
            "batch_id": row["batch_id"],
            "card_uid": row["card_uid"],
            "scan_time": row["scan_time"],
            "uploaded": bool(row["uploaded"])
        })
    
    return result
