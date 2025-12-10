"""
Bus Passenger Counter - Pi Agent
Main entry point for the Raspberry Pi agent.

This agent:
1. Reads employee cards via a card reader
2. Stores scans locally in SQLite (offline support)
3. Auto-selects trips based on configured time windows
4. Uploads pending scans to backend when network is available

TODO: To run as a systemd service, create /etc/systemd/system/bus-agent.service:
[Unit]
Description=Bus Passenger Counter Agent
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/bus-optimizer/pi-agent
ExecStart=/home/pi/bus-optimizer/pi-agent/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

Then run:
    sudo systemctl daemon-reload
    sudo systemctl enable bus-agent
    sudo systemctl start bus-agent
"""

import json
import logging
import os
import sys
import time
import threading
from datetime import datetime, date
from typing import Dict, Optional

from db import init_db, insert_scan, get_unuploaded_scans, mark_uploaded, get_scan_count
from uploader import upload_scans
from reader import get_reader

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("bus_agent.log")
    ]
)
logger = logging.getLogger(__name__)

# Upload interval in seconds
UPLOAD_INTERVAL = 60

# Configuration file path
CONFIG_FILE = "config.json"


def load_config(config_path: str = CONFIG_FILE) -> Dict:
    """Load configuration from JSON file."""
    if not os.path.exists(config_path):
        logger.error(f"Config file not found: {config_path}")
        logger.info("Please copy config.sample.json to config.json and edit it")
        sys.exit(1)
    
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)
    
    # Validate required fields
    required_fields = ["bus_id", "api_base_url", "api_key", "trips"]
    for field in required_fields:
        if field not in config:
            logger.error(f"Missing required config field: {field}")
            sys.exit(1)
    
    logger.info(f"Loaded config for bus: {config['bus_id']}")
    return config


def parse_time(time_str: str) -> datetime:
    """Parse a time string (HH:MM) into a datetime object for today."""
    parts = time_str.split(":")
    hour = int(parts[0])
    minute = int(parts[1])
    return datetime.now().replace(hour=hour, minute=minute, second=0, microsecond=0)


def get_current_trip(config: Dict) -> Optional[Dict]:
    """
    Returns the trip dict from config["trips"] whose [start, end] time window
    contains the current local time. Returns None if no trip matches.
    """
    now = datetime.now().time()
    
    for trip in config.get("trips", []):
        start_str = trip.get("start", "")
        end_str = trip.get("end", "")
        
        if not start_str or not end_str:
            continue
        
        try:
            start_parts = start_str.split(":")
            end_parts = end_str.split(":")
            
            start_time = datetime.now().replace(
                hour=int(start_parts[0]),
                minute=int(start_parts[1]),
                second=0,
                microsecond=0
            ).time()
            
            end_time = datetime.now().replace(
                hour=int(end_parts[0]),
                minute=int(end_parts[1]),
                second=0,
                microsecond=0
            ).time()
            
            # Check if current time is within the window
            if start_time <= now <= end_time:
                return trip
                
        except (ValueError, IndexError) as e:
            logger.warning(f"Invalid time format in trip config: {e}")
            continue
    
    return None


def handle_card_scan(config: Dict, card_uid: str) -> None:
    """
    Handle a card scan event.
    Determines the current trip and inserts the scan into the database.
    """
    # Handle special commands
    if card_uid == "__STATUS__":
        counts = get_scan_count()
        print(f"\nStatus: {counts['pending']} pending, {counts['uploaded']} uploaded\n")
        return
    
    # Get current trip based on time
    trip = get_current_trip(config)
    
    if trip is None:
        logger.warning(f"No active trip for current time - scan ignored: {card_uid}")
        print(f"WARNING: No active trip at this time. Scan not recorded.")
        return
    
    # Prepare scan data
    bus_id = config["bus_id"]
    trip_date = date.today().isoformat()
    trip_code = trip["trip_code"]
    direction = trip["direction"]
    employee_id = card_uid  # For now, use card UID as employee ID
    scan_time = datetime.now().isoformat()
    
    # Insert into local database
    inserted = insert_scan(
        bus_id=bus_id,
        trip_date=trip_date,
        trip_code=trip_code,
        direction=direction,
        employee_id=employee_id,
        card_uid=card_uid,
        scan_time=scan_time
    )
    
    if inserted:
        print(f"SCAN RECORDED: {card_uid} on {trip_code} ({direction})")
    else:
        print(f"DUPLICATE: {card_uid} already scanned for this trip")


def upload_worker(config: Dict) -> None:
    """
    Background worker that periodically uploads pending scans to the backend.
    """
    api_base_url = config["api_base_url"]
    api_key = config["api_key"]
    
    logger.info(f"Upload worker started (interval: {UPLOAD_INTERVAL}s)")
    
    while True:
        try:
            # Get unuploaded scans
            scans = get_unuploaded_scans(limit=200)
            
            if scans:
                logger.info(f"Found {len(scans)} scans to upload")
                
                # Try to upload
                success_ids = upload_scans(api_base_url, api_key, scans)
                
                if success_ids is not None and len(success_ids) > 0:
                    # Mark successful uploads
                    mark_uploaded(success_ids)
                elif success_ids is not None:
                    # Empty list means all scans were duplicates or invalid
                    # Mark all as uploaded to avoid retrying
                    all_ids = [s["id"] for s in scans]
                    mark_uploaded(all_ids)
                    logger.info("All scans were already processed by backend")
            else:
                logger.debug("No pending scans to upload")
                
        except Exception as e:
            logger.error(f"Upload worker error: {e}")
        
        # Wait before next upload cycle
        time.sleep(UPLOAD_INTERVAL)


def main():
    """Main entry point."""
    logger.info("=" * 50)
    logger.info("Bus Passenger Counter - Pi Agent Starting")
    logger.info("=" * 50)
    
    # Load configuration
    config = load_config()
    
    # Initialize database
    init_db()
    
    # Start upload worker in background thread
    upload_thread = threading.Thread(
        target=upload_worker,
        args=(config,),
        daemon=True
    )
    upload_thread.start()
    
    # Create card reader
    # TODO: Add config option to switch between fake and real reader
    reader = get_reader("fake")
    
    # Start reading cards
    try:
        reader.start(lambda card_uid: handle_card_scan(config, card_uid))
        
        # Keep main thread alive
        while reader.is_running():
            time.sleep(1)
            
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    finally:
        reader.stop()
    
    logger.info("Pi Agent stopped")


if __name__ == "__main__":
    main()
