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
- Count passengers per trip using employee card scans
- Calculate bus utilization (load factor)
- Identify optimization opportunities for bus fleet management
- Generate reports for cost analysis and route planning

### Key Features
- **Offline-first Pi Agent**: Works without network, syncs when connected
- **Real-time Dashboard**: View passenger counts, load factors, and trends
- **Automatic Trip Detection**: Assigns scans to trips based on time windows
- **Deduplication**: Prevents duplicate counting of same employee per trip

---

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Raspberry Pi      │     │   Backend API       │     │   Web Dashboard     │
│   + Card Reader     │────▶│   (FastAPI)         │◀────│   (React)           │
│   (per bus)         │     │   Port: 8000        │     │   Port: 5173        │
└─────────────────────┘     └──────────┬──────────┘     └─────────────────────┘
         │                             │
         │                    ┌────────▼────────┐
    Local SQLite              │   PostgreSQL    │
    (offline storage)         │   (or SQLite)   │
                              └─────────────────┘
```

### Data Flow
1. Employee taps card on bus reader
2. Pi Agent stores scan in local SQLite database
3. Every 60 seconds, Pi uploads pending scans to backend
4. Backend deduplicates and stores in central database
5. Dashboard displays real-time statistics

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
│   │   │   ├── trip.py
│   │   │   └── scan.py
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

```sql
-- =============================================
-- Bus Optimizer Database Schema
-- PostgreSQL version
-- =============================================

-- Drop existing tables (for clean reinstall)
DROP TABLE IF EXISTS trip_scans CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS buses CASCADE;

-- =============================================
-- Table: buses
-- Stores information about each bus in the fleet
-- =============================================
CREATE TABLE buses (
    bus_id          VARCHAR(50) PRIMARY KEY,
    plate_number    VARCHAR(50),
    route_name      VARCHAR(100),
    capacity        INTEGER DEFAULT 40,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample buses
INSERT INTO buses (bus_id, plate_number, route_name, capacity) VALUES
    ('BUS_SP_01', 'WPL 1234', 'SP to Factory', 40),
    ('BUS_SP_02', 'WPL 1235', 'SP to Factory', 40),
    ('BUS_KL_01', 'WKL 5678', 'Kulim to Factory', 45),
    ('BUS_PG_01', 'PNG 9012', 'Penang to Factory', 50);

-- =============================================
-- Table: trips
-- Stores each bus trip (one record per bus per date per trip_code)
-- =============================================
CREATE TABLE trips (
    trip_id         SERIAL PRIMARY KEY,
    bus_id          VARCHAR(50) NOT NULL REFERENCES buses(bus_id),
    trip_date       DATE NOT NULL,
    trip_code       VARCHAR(50) NOT NULL,
    direction       VARCHAR(20) NOT NULL CHECK (direction IN ('to_factory', 'from_factory')),
    planned_time    TIME,
    actual_time     TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_bus_date_trip UNIQUE (bus_id, trip_date, trip_code)
);

-- Index for faster queries
CREATE INDEX idx_trips_date ON trips(trip_date);
CREATE INDEX idx_trips_bus_id ON trips(bus_id);

-- =============================================
-- Table: trip_scans
-- Stores individual employee scans for each trip
-- =============================================
CREATE TABLE trip_scans (
    id              SERIAL PRIMARY KEY,
    trip_id         INTEGER NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
    employee_id     VARCHAR(50) NOT NULL,
    scan_time       TIMESTAMP NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_trip_employee UNIQUE (trip_id, employee_id)
);

-- Index for faster queries
CREATE INDEX idx_trip_scans_trip_id ON trip_scans(trip_id);
CREATE INDEX idx_trip_scans_employee_id ON trip_scans(employee_id);

-- =============================================
-- View: trip_summary
-- Convenient view for trip statistics
-- =============================================
CREATE OR REPLACE VIEW trip_summary AS
SELECT 
    t.trip_id,
    t.trip_date,
    t.trip_code,
    t.bus_id,
    b.route_name,
    t.direction,
    b.capacity,
    COUNT(ts.id) AS passenger_count,
    ROUND(COUNT(ts.id)::NUMERIC / NULLIF(b.capacity, 0), 3) AS load_factor
FROM trips t
LEFT JOIN buses b ON t.bus_id = b.bus_id
LEFT JOIN trip_scans ts ON t.trip_id = ts.trip_id
GROUP BY t.trip_id, t.trip_date, t.trip_code, t.bus_id, b.route_name, t.direction, b.capacity
ORDER BY t.trip_date DESC, t.trip_code;

-- =============================================
-- Sample queries for reporting
-- =============================================

-- Get daily summary
-- SELECT trip_date, SUM(passenger_count) as total_passengers, AVG(load_factor) as avg_load
-- FROM trip_summary
-- WHERE trip_date BETWEEN '2025-11-01' AND '2025-11-30'
-- GROUP BY trip_date
-- ORDER BY trip_date;

-- Get underutilized trips (load factor < 50%)
-- SELECT * FROM trip_summary
-- WHERE load_factor < 0.5 AND trip_date >= CURRENT_DATE - INTERVAL '7 days'
-- ORDER BY load_factor;
```

### SQLite Schema (Pi Agent Local Database)

```sql
-- =============================================
-- Pi Agent Local Database Schema
-- SQLite version (stored in bus_log.db)
-- =============================================

-- Table: scans
-- Stores all card scans locally before upload
CREATE TABLE IF NOT EXISTS scans (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    bus_id       TEXT NOT NULL,
    trip_date    TEXT NOT NULL,          -- Format: YYYY-MM-DD
    trip_code    TEXT NOT NULL,
    direction    TEXT NOT NULL,          -- 'to_factory' or 'from_factory'
    employee_id  TEXT NOT NULL,
    card_uid     TEXT NOT NULL,
    scan_time    TEXT NOT NULL,          -- Format: ISO 8601 datetime
    uploaded     INTEGER DEFAULT 0       -- 0 = pending, 1 = uploaded
);

-- Index for faster upload queries
CREATE INDEX IF NOT EXISTS idx_scans_uploaded ON scans(uploaded);

-- Unique constraint to prevent duplicate scans
CREATE UNIQUE INDEX IF NOT EXISTS idx_scans_unique 
ON scans(bus_id, trip_date, trip_code, employee_id);
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

# Edit config.json to set your bus_id, API key, and trip schedules

# Run the agent
python run_agent.py
```

### Quick Test

1. Start backend: `python run_server.py` (in backend folder)
2. Start dashboard: `npm run dev` (in web-dashboard folder)
3. Start Pi agent: `python run_agent.py` (in pi-agent folder)
4. In Pi agent terminal, type card UIDs: `EMP001`, `EMP002`, `EMP003`
5. Wait 60 seconds for auto-upload, or type `status` to check
6. Refresh dashboard to see the scans

---

## Configuration

### Pi Agent Configuration (config.json)

```json
{
  "bus_id": "BUS_SP_01",
  "api_base_url": "http://localhost:8000/api/bus",
  "api_key": "BUS_SP_01_SECRET",
  "trips": [
    {
      "trip_code": "SP-0630-IN",
      "direction": "to_factory",
      "start": "05:30",
      "end": "08:00"
    },
    {
      "trip_code": "SP-1800-OUT",
      "direction": "from_factory",
      "start": "16:30",
      "end": "20:00"
    }
  ]
}
```

| Field | Description |
|-------|-------------|
| `bus_id` | Unique identifier for this bus |
| `api_base_url` | Backend API endpoint |
| `api_key` | Authentication key (must match backend config) |
| `trips` | Array of trip time windows |
| `trips[].trip_code` | Unique code for this trip |
| `trips[].direction` | `to_factory` or `from_factory` |
| `trips[].start` | Trip start time (HH:MM) |
| `trips[].end` | Trip end time (HH:MM) |

### Backend Environment Variables

Create `.env` file in backend folder:

```env
# Database URL
# For SQLite (default, good for development):
DATABASE_URL=sqlite:///./bus_optimizer.db

# For PostgreSQL (production):
# DATABASE_URL=postgresql://username:password@localhost:5432/bus_optimizer

# API Keys (format: BUS_ID:SECRET_KEY, comma-separated)
API_KEYS=BUS_SP_01:BUS_SP_01_SECRET,BUS_KL_01:BUS_KL_01_SECRET,BUS_PG_01:BUS_PG_01_SECRET

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

### Upload Scans (Pi Agent → Backend)

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
      "bus_id": "BUS_SP_01",
      "trip_date": "2025-11-28",
      "trip_code": "SP-0630-IN",
      "direction": "to_factory",
      "employee_id": "EMP001",
      "card_uid": "EMP001",
      "scan_time": "2025-11-28T06:45:00"
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
GET /api/report/summary?date_from=2025-11-01&date_to=2025-11-30&route=&direction=
```

Query Parameters:
| Parameter | Required | Description |
|-----------|----------|-------------|
| `date_from` | No | Start date (YYYY-MM-DD) |
| `date_to` | No | End date (YYYY-MM-DD) |
| `route` | No | Filter by route name |
| `direction` | No | Filter: `to_factory` or `from_factory` |

Response:
```json
{
  "total_passengers": 150,
  "avg_load_factor": 0.72,
  "trip_count": 10,
  "saving_estimate": 2500.0,
  "trips": [
    {
      "trip_date": "2025-11-28",
      "trip_code": "SP-0630-IN",
      "bus_id": "BUS_SP_01",
      "route_name": "SP to Factory",
      "direction": "to_factory",
      "passenger_count": 35,
      "capacity": 40,
      "load_factor": 0.875
    }
  ]
}
```

### Get Scan Details

```
GET /api/report/scans?date=2025-11-28
```

Query Parameters:
| Parameter | Required | Description |
|-----------|----------|-------------|
| `date` | Yes | Date to get scans for (YYYY-MM-DD) |

Response:
```json
[
  {
    "scan_time": "2025-11-28T06:45:00",
    "employee_id": "EMP001",
    "bus_id": "BUS_SP_01",
    "trip_code": "SP-0630-IN",
    "direction": "to_factory"
  }
]
```

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

### Pi Agent - "No active trip for current time"

Edit `config.json` to add a trip time window that includes the current time:
```json
{
  "trips": [
    {
      "trip_code": "TEST-TRIP",
      "direction": "to_factory",
      "start": "00:00",
      "end": "23:59"
    }
  ]
}
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
