# Bus Passenger Counting & Optimization System

A comprehensive system for counting bus passengers using employee cards, analyzing ridership data, and optimizing bus operations for cost reduction.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

### Purpose
This system tracks employee bus ridership at factory facilities to:
- Record attendance by shift using batch-ID card scans
- Track headcount per bus/shift/day
- Identify optimization opportunities for bus fleet management
- Generate reports for cost analysis and route planning

### Key Features
- **Offline-first Pi Agent**: Works without network, syncs when connected
- **Real-time Dashboard**: View passenger counts, load factors, and trends
- **Automatic Shift Derivation**: Assigns scans to morning/night based on KL time
- **Deduplication**: Prevents duplicate counting of same employee per day/shift

---

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Raspberry Pi      │     │   Backend API       │     │   Web Dashboard     │
│   + Card Reader     │────▶│   (FastAPI)         │◀────│   (React)           │
│   (entry scanner)   │     │   Port: 8000        │     │   Port: 5173        │
└─────────────────────┘     └──────────┬──────────┘     └─────────────────────┘
         │                             │
         │                    ┌────────▼────────┐
    Local SQLite              │   PostgreSQL    │
    (offline storage)         │   (or SQLite)   │
                              └─────────────────┘
```

### Data Flow
1. Employee taps card (batch ID) at the factory entry scanner
2. Pi Agent stores scan in local SQLite database
3. Every 60 seconds, Pi uploads pending scans to backend
4. Backend derives shift (KL time), resolves employee→bus/van, deduplicates per batch+date+shift, and stores attendance
5. Dashboard displays headcount and attendance statistics

---

## Project Structure

```
bus-optimizer/
├── README.md                     # This file
├── docs/
│   └── system-design.md          # Detailed system design document
├── pi-agent/                     # Raspberry Pi agent (Python)
│   ├── config.sample.json        # Sample configuration
│   ├── config.json               # Your configuration (create from sample)
│   ├── main.py                   # Main entry point
│   ├── db.py                     # Local SQLite database operations
│   ├── uploader.py               # HTTP upload to backend
│   ├── reader.py                 # Card reader abstraction
│   ├── run_agent.py              # Startup script
│   └── requirements.txt          # Python dependencies
├── backend/                      # FastAPI backend
│   ├── app/
│   │   ├── main.py               # FastAPI application
│   │   ├── api/
│   │   │   ├── bus.py            # POST /api/bus/upload-scans
│   │   │   └── report.py         # GET /api/report/*
│   │   ├── core/
│   │   │   ├── config.py         # Environment configuration
│   │   │   ├── db.py             # Database connection
│   │   │   └── security.py       # API key validation
│   │   ├── models/               # SQLAlchemy ORM models
│   │   │   ├── bus.py
│   │   │   ├── van.py
│   │   │   ├── employee.py
│   │   │   └── attendance.py
│   │   └── schemas/              # Pydantic request/response schemas
│   │       ├── bus.py
│   │       └── report.py
│   ├── run_server.py             # Startup script
│   ├── requirements.txt          # Python dependencies
│   └── .env.example              # Environment variables template
├── web-dashboard/                # React + Tailwind frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── api.ts                # API client
│   │   ├── types.ts              # TypeScript types
│   │   ├── pages/
│   │   │   └── BusDashboard.tsx  # Main dashboard page
│   │   └── components/
│   │       ├── FiltersBar.tsx    # Date/route/direction filters
│   │       ├── KpiCard.tsx       # KPI display cards
│   │       ├── TripTable.tsx     # Trip summary table
│   │       └── ScanTable.tsx     # Scan details table
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.cjs
└── infra/                        # Deployment configuration
    ├── docker-compose.yml
    ├── Dockerfile.backend
    ├── Dockerfile.web
    └── nginx.conf
```

---

## Database Schema

### PostgreSQL Schema (Central Database)

Schema is defined in `backend/init_postgres.sql` (summary below):

- `buses`: `bus_id` (PK, <=4 chars), `route` (inline text), `plate_number`, `capacity`
- `vans`: `id` (PK), `van_code` (unique), `bus_id` (FK), `plate_number`, `driver_name`, `capacity`, `active`
- `employees`: `id` (PK), `batch_id` (unique), `name`, `bus_id` (FK), `van_id` (FK, nullable), `active`
- `attendances`: `id` (PK), `scanned_batch_id`, `employee_id` (FK), `bus_id` (FK), `van_id` (FK), `shift` (enum morning/night/unknown), `status` (present/unknown_batch/unknown_shift), `scanned_at` (timestamptz), `scanned_on` (date, KL), unique on (`scanned_batch_id`,`scanned_on`,`shift`).

### SQLite Schema (Pi Agent Local Database)

```sql
-- Table: scans (Pi agent local SQLite)
CREATE TABLE IF NOT EXISTS scans (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id     TEXT NOT NULL,
    card_uid     TEXT,
    scan_time    TEXT NOT NULL,   -- ISO 8601 datetime
    uploaded     INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_scans_uploaded ON scans(uploaded);
CREATE UNIQUE INDEX IF NOT EXISTS idx_scans_unique 
ON scans(batch_id, scan_time);
```

---

## Installation

### Prerequisites

- Python 3.9+ 
- Node.js 18+
- PostgreSQL 13+ (optional, SQLite works for development)

### 1. Backend Setup

```powershell
# Navigate to project root
cd bus-optimizer

# Create virtual environment
python -m venv .venv

# Activate virtual environment (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Or for Command Prompt
.\.venv\Scripts\activate.bat

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Create .env file (optional - defaults to SQLite)
copy .env.example .env
# Edit .env if using PostgreSQL

# Start the backend server
python run_server.py
```

Backend will be available at: http://localhost:8000

API Documentation: http://localhost:8000/docs

### 2. Web Dashboard Setup

```powershell
# Open new terminal
cd bus-optimizer/web-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

Dashboard will be available at: http://localhost:5173

### 3. Pi Agent Setup

```powershell
# Open new terminal
cd bus-optimizer/pi-agent

# Activate the same virtual environment
..\.venv\Scripts\Activate.ps1

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Create configuration file
copy config.sample.json config.json

# Edit config.json to set your API key and upload interval

# Run the agent
python run_agent.py
```

### Quick Test

1. Start backend: `python run_server.py` (in backend folder)
2. Start dashboard: `npm run dev` (in web-dashboard folder)
3. Start Pi agent (entry scanner): `python run_agent.py` (in pi-agent folder)
4. In Pi agent terminal, type batch IDs: `BATCH-001`, `BATCH-002`
5. Wait 60 seconds for auto-upload, or type `status` to check
6. Hit `GET /api/report/headcount?date=YYYY-MM-DD` or refresh dashboard to see attendance

---

## Configuration

### Entry Scanner Configuration (config.json)

```json
{
  "api_base_url": "http://localhost:8000/api/bus",
  "api_key": "ENTRY_SECRET",
  "upload_interval_seconds": 60
}
```

| Field | Description |
|-------|-------------|
| `api_base_url` | Backend API endpoint |
| `api_key` | Authentication key (must match backend config) |
| `upload_interval_seconds` | How often to upload pending scans |

### Backend Environment Variables

Create `.env` file in backend folder:

```env
# Database URL
# For SQLite (default, good for development):
DATABASE_URL=sqlite:///./bus_optimizer.db

# For PostgreSQL (production):
# DATABASE_URL=postgresql://username:password@localhost:5432/bus_optimizer

# API Keys (format: LABEL:SECRET_KEY, comma-separated)
API_KEYS=ENTRY_GATE:ENTRY_SECRET

# Debug mode (set to false in production)
DEBUG=true
```

---

## API Reference

### Health Check

```
GET /health
```

Response:
```json
{"status": "healthy"}
```

### Upload Scans (Entry Scanner → Backend)

```
POST /api/bus/upload-scans
Header: X-API-KEY: <api_key>
Content-Type: application/json
```

Request Body:
```json
{
  "scans": [
    {
      "id": 1,
      "batch_id": "BATCH-001",
      "scan_time": "2025-11-28T06:45:00+08:00"
    }
  ]
}
```

Response:
```json
{
  "success_ids": [1]
}
```

### Get Summary Report

```
GET /api/report/headcount?date=2025-11-28&shift=morning&bus_id=A01
```

Query Parameters:
| Parameter | Required | Description |
|-----------|----------|-------------|
| `date` | No | Date (YYYY-MM-DD); defaults to all |
| `shift` | No | `morning` or `night` |
| `bus_id` | No | Filter by bus |

Response:
```json
{
  "rows": [
    {
      "date": "2025-11-28",
      "shift": "morning",
      "bus_id": "A01",
      "route": "Route A",
      "present": 35,
      "unknown_batch": 1,
      "unknown_shift": 0,
      "total": 36
    }
  ]
}
```

### Get Attendance Details

```
GET /api/report/attendance?date=2025-11-28&shift=morning&bus_id=A01
```

Query Parameters:
| Parameter | Required | Description |
|-----------|----------|-------------|
| `date` | Yes | Date to get scans for (YYYY-MM-DD) |
| `shift` | No | `morning` or `night` |
| `bus_id` | No | Filter by bus |

Response:
```json
[
  {
    "scanned_at": "2025-11-28T06:45:00+08:00",
    "batch_id": "BATCH-001",
    "employee_name": "Employee One",
    "bus_id": "A01",
    "van_id": 1,
    "shift": "morning",
    "status": "present",
    "source": "pi_agent"
  }
]
```

### CSV Exports

- Headcount export (matches `/api/report/headcount` filters):  
  `GET /api/report/headcount/export?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&shift=morning&bus_id=A01`
- Attendance export (requires `date`, optional shift/bus):  
  `GET /api/report/attendance/export?date=YYYY-MM-DD&shift=morning&bus_id=A01`

The web dashboard includes download buttons that pass the current filters to these endpoints.

---

## Production Deployment

### Using Docker Compose

```bash
cd infra
docker-compose up -d
```

This starts:
- PostgreSQL database (port 5432)
- Backend API (port 8000)
- Web dashboard (port 80)

### Pi Agent as Systemd Service (Raspberry Pi)

Create `/etc/systemd/system/bus-agent.service`:

```ini
[Unit]
Description=Bus Passenger Counter Agent
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/bus-optimizer/pi-agent
ExecStart=/home/pi/bus-optimizer/.venv/bin/python run_agent.py
Restart=always
RestartSec=10
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable bus-agent
sudo systemctl start bus-agent

# Check status
sudo systemctl status bus-agent

# View logs
sudo journalctl -u bus-agent -f
```

---

## Troubleshooting

### Backend won't start - "ModuleNotFoundError: No module named 'app'"

Make sure you're running from the correct directory:
```powershell
cd backend
python run_server.py
```

### Dashboard shows "Failed to load data"

1. Check backend is running: http://localhost:8000/health
2. Check browser console for errors
3. Ensure Vite proxy is configured correctly in `vite.config.ts`

### Scans not appearing in dashboard

1. Wait 60 seconds for auto-upload, or restart Pi agent
2. Check Pi agent logs for upload errors
3. Verify API key matches between Pi config and backend .env

### Port already in use

```powershell
# Find process using port 8000
Get-NetTCPConnection -LocalPort 8000 | Select-Object OwningProcess

# Kill the process
Stop-Process -Id <PID> -Force
```

---

## License

Internal use only - Factory Bus Optimization System

---

## Support

For issues and feature requests, contact the IT department.
