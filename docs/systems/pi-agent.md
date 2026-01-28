# Pi Agent System Documentation

## Overview
The Pi Agent is a Python-based client application designed to run on Raspberry Pi devices installed on buses. It acts as the primary data collection point for employee attendance.

## Technology Stack
- **Language:** Python
- **Local Database:** SQLite (for offline storage)
- **Hardware Integration:** Card Reader (RFID/NFC)

## Key Components (`pi-agent/`)

### 1. Core Modules
- **`main.py`**: The main entry point. Orchestrates the card reader loop, local storage, and background upload process.
- **`db.py`**: Manages the local SQLite database. Handles inserting scans and retrieving unuploaded scans.
- **`reader.py`**: Interface for the hardware card reader. Reads employee batch IDs.
- **`uploader.py`**: Handles the synchronization of data with the Backend API.

### 2. Configuration
- **`config.json`**: Stores device-specific configuration (e.g., API URL, device ID).

## Features
- **Offline Capability**: Stores scans locally in SQLite when network connectivity is unavailable.
- **Data Synchronization**: Automatically uploads pending scans to the backend when a connection is established.
- **Hardware Interface**: Continuously listens for card scans.
- **Shift Logic**: Shift determination is handled by the backend upon upload.

## Deployment
The agent is designed to run as a systemd service on the Raspberry Pi.

```ini
[Unit]
Description=Bus Passenger Counter Agent
After=network.target

[Service]
ExecStart=/home/pi/bus-system/pi-agent/venv/bin/python main.py
Restart=always
```
