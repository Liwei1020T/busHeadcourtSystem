"""
Bus Passenger Counter - Pi Agent
Main entry point for the Raspberry Pi agent.

This agent:
1. Reads employee batch IDs via a card reader
2. Stores scans locally in SQLite (offline support)
3. Uploads pending scans to backend when network is available (shift derived by backend)

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
    required_fields = ["api_base_url", "api_key"]
    for field in required_fields:
        if field not in config:
            logger.error(f"Missing required config field: {field}")
            sys.exit(1)
    
    logger.info("Loaded config for entry scanner")
    return config


def handle_card_scan(config: Dict, card_uid: str) -> None:
    """
    Handle a card scan event.
    Inserts the scan into the database.
    """
    # Handle special commands
    if card_uid == "__STATUS__":
        counts = get_scan_count()
        print(f"\nStatus: {counts['pending']} pending, {counts['uploaded']} uploaded\n")
        return
    
    # Parse batch ID as integer
    try:
        batch_id = int(card_uid)
    except ValueError:
        logger.warning(f"Invalid batch_id (non-integer): {card_uid}")
        print(f"WARNING: Invalid batch_id. Scan not recorded.")
        return

    scan_time = datetime.now().isoformat()
    
    # Insert into local database
    result = insert_scan(
        batch_id=batch_id,
        card_uid=card_uid,
        scan_time=scan_time
    )
    
    if result["inserted"]:
        print(f"SCAN RECORDED: batch_id={batch_id}")
    else:
        existing_scan = result.get("existing_scan")
        if existing_scan:
            first_scan_time = existing_scan.get("scan_time", "unknown time")
            print(f"DUPLICATE: batch_id={batch_id} already scanned today at {first_scan_time}")


def upload_worker(config: Dict) -> None:
    """
    Background worker that periodically uploads pending scans to the backend.
    """
    api_base_url = config["api_base_url"]
    api_key = config["api_key"]
    
    upload_interval = config.get("upload_interval_seconds", 60)
    logger.info(f"Upload worker started (interval: {upload_interval}s)")
    
    while True:
        try:
            # Get unuploaded scans
            scans = get_unuploaded_scans(limit=200)
            
            if scans:
                logger.info(f"Found {len(scans)} scans to upload")
                
                # Try to upload
                success_ids = upload_scans(api_base_url, api_key, scans)
                
                if success_ids is not None and len(success_ids) > 0:
                    # Mark successful uploads only
                    mark_uploaded(success_ids)
                elif success_ids is not None and len(success_ids) == 0:
                    # Backend returned 200 but no IDs accepted; keep scans for retry
                    logger.warning("Upload returned no success IDs; retaining scans for retry")
            else:
                logger.debug("No pending scans to upload")
                
        except Exception as e:
            logger.error(f"Upload worker error: {e}")
        
        # Wait before next upload cycle
        time.sleep(upload_interval)


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
    reader_type = config.get("reader_type", "fake")
    reader = get_reader(reader_type)
    
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
