# Bus Passenger Counting & Optimization System

A comprehensive system for counting bus passengers using employee cards, analyzing ridership data, and optimizing bus operations for cost reduction.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Modules](#system-modules)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [API Reference](#api-reference)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

### Purpose
This system tracks employee bus ridership at factory facilities to:
- Record attendance by shift using employee ID card scans at factory entry
- Track headcount per bus/shift/day with real-time visibility
- Identify optimization opportunities for bus fleet management
- Generate reports for cost analysis and route planning
- Support multiple factories (plants) with centralized management

---

## Key Features

### 🚌 Passenger Tracking
- **Entry Scanner System**: Raspberry Pi-based card readers at factory entry gates
- **Offline-first Operation**: Scans stored locally, uploaded when network available
- **Automatic Shift Detection**: Morning/night shifts derived from scan time (KL timezone)
- **Duplicate Prevention**: One scan per employee per shift per day
- **Unknown Batch Tracking**: Records unrecognized employee IDs for investigation

### 📊 Dashboard & Analytics
- **Plant-level Overview**: Multi-factory summary with key metrics
- **Bus-level Dashboard**: Detailed per-bus attendance and load factors
- **Daily Trends**: Attendance patterns over time with visualizations
- **Real-time Statistics**: Live passenger counts and capacity utilization
- **Interactive Filters**: By date range, shift, bus, route, plant

### 👥 Data Management
- **Employee Master List**: Bulk upload via Excel (PersonId, Name, Transport, Route)
- **Bus Management**: Configure routes, plate numbers, capacity
- **Van Management**: Assign vans to buses with driver information
- **Employee Assignment**: Link employees to buses and vans

### 📈 Reporting & Export
- **Headcount Reports**: Aggregated attendance by bus/shift/date
- **Attendance Details**: Individual scan records with timestamps
- **CSV Exports**: Download reports with current filter settings
- **Route Analysis**: Unknown routes tracking and reconciliation

### 🔒 Security & Reliability
- **API Key Authentication**: Per-scanner access control
- **Data Validation**: Robust error handling and status tracking
- **Audit Trail**: Source tracking for all attendance records
- **Health Monitoring**: Service status checks and alerts

---

## System Modules

### 1. Entry Scanner (Pi Agent)
**Location**: Factory entry gates
**Function**: Scan employee cards and upload to backend
**Features**:
- Offline SQLite storage
- Configurable upload intervals
- Status monitoring commands
- Manual and automatic card reading modes

### 2. Backend API (FastAPI)
**Location**: Central server
**Function**: Process scans, manage data, serve dashboard
**Endpoints**:
- `/api/bus/*` - Scanner uploads, bus/van/employee management
- `/api/report/*` - Headcount, attendance, exports
- `/health` - Service health check

### 3. Web Dashboard (React)
**Location**: Browser-based interface
**Pages**:
- **Plant Dashboard**: Multi-factory overview
- **Bus Dashboard**: Per-bus detailed analysis
- **Bus Management**: Configure buses and routes
- **Van Management**: Manage van assignments
- **Employee Management**: Employee master list and assignments

### 4. Database (PostgreSQL)
**Tables**:
- `buses` - Bus routes and capacity
- `vans` - Van assignments with drivers
- `employees` - Employee master with bus/van links
- `employee_master` - Raw master list data
- `attendances` - Validated attendance records
- `unknown_attendances` - Unrecognized scans for review

---

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Raspberry Pi      │     │   Backend API       │     │   Web Dashboard     │
│   + Card Reader     │────▶│   (FastAPI)         │◀────│   (React)           │
│   (entry scanner)   │     │   Port: 8003        │     │   Port: 5175        │
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
├── Makefile                      # Docker and development commands
├── docs/
│   ├── system-design.md          # Detailed system design document
│   ├── features.md               # Feature documentation
│   ├── pages/                    # Page-specific documentation
│   └── plans/                    # Implementation plans
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
│   │   │   ├── bus.py            # Bus, van, employee, scan upload endpoints
│   │   │   └── report.py         # Reporting endpoints
│   │   ├── core/
│   │   │   ├── config.py         # Environment configuration
│   │   │   ├── db.py             # Database connection
│   │   │   ├── security.py       # API key validation
│   │   │   ├── excel.py          # Excel/CSV export utilities
│   │   │   └── cache.py          # Caching utilities
│   │   ├── models/               # SQLAlchemy ORM models
│   │   │   ├── bus.py
│   │   │   ├── van.py
│   │   │   ├── employee.py
│   │   │   ├── employee_master.py
│   │   │   ├── attendance.py
│   │   │   ├── unknown_attendance.py
│   │   │   ├── trip.py
│   │   │   └── scan.py
│   │   └── schemas/              # Pydantic request/response schemas
│   │       ├── bus.py
│   │       └── report.py
│   ├── run_server.py             # Startup script (port 8003)
│   ├── requirements.txt          # Python dependencies
│   └── .env.example              # Environment variables template
├── web-dashboard/                # React + Tailwind frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── api.ts                # API client
│   │   ├── types.ts              # TypeScript types
│   │   ├── pages/
│   │   │   ├── BusDashboard.tsx  # Main dashboard page
│   │   │   ├── PlantDashboard.tsx # Plant-level overview
│   │   │   ├── BusManagement.tsx # Bus management
│   │   │   ├── VanManagement.tsx # Van management
│   │   │   └── EmployeeManagement.tsx # Employee management
│   │   ├── components/
│   │   │   ├── charts/           # Chart components
│   │   │   ├── ui/               # Reusable UI components
│   │   │   └── ...               # Other components
│   │   ├── contexts/             # React contexts
│   │   ├── lib/                  # Libraries and utilities
│   │   └── utils/                # Utility functions
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.cjs
└── deployment/                   # Deployment configuration
    ├── docker-compose.yml
    ├── Dockerfile.backend
    ├── Dockerfile.web
    ├── Dockerfile.pi-agent
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

Backend will be available at: http://localhost:8003

API Documentation: http://localhost:8003/docs

### 2. Web Dashboard Setup

```powershell
# Open new terminal
cd bus-optimizer/web-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

Dashboard will be available at: http://localhost:5175

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
6. Visit http://localhost:5175 or hit `GET /api/report/headcount?date=YYYY-MM-DD` to see attendance

### Load Demo Data (Optional)

To populate the database with sample data for testing:

```bash
cd backend

# For development (SQLite or local PostgreSQL)
./load_demo_data.sh

# Or load directly with psql (PostgreSQL only)
psql -U postgres -d bus_optimizer -f demo_data.sql
```

Demo data includes:
- 7 buses (Routes A-E) with **fictional** routes (North/South/East/West Districts)
- 12 vans with **fictional** driver names (Driver Alpha, Beta, etc.)
- 48 **fictional** employees (Employee A001-E004, OWN01-05)
- Attendance records for the last 7 days with realistic patterns (85-95% attendance)

**Note**: All names, locations, and details in demo data are completely fictional and for testing purposes only.

After loading demo data, you can immediately explore the dashboard with realistic-looking information.

---

## Usage Guide

### Initial Setup Workflow

1. **Set up Infrastructure** (one-time)
   ```bash
   # Start backend and database
   cd backend
   python run_server.py

   # Start web dashboard (separate terminal)
   cd web-dashboard
   npm run dev
   ```

2. **Upload Employee Master List**
   - Navigate to **Employee Management** page
   - Click "Upload Master List"
   - Select Excel file with columns: PersonId, Name, Transport, Route, etc.
   - System automatically creates/updates buses, vans, and employees
   - Review unknown routes for reconciliation

3. **Configure Bus & Van Details** (optional)
   - Go to **Bus Management** to set plate numbers and capacity
   - Go to **Van Management** to assign drivers and plate numbers
   - Verify employee assignments are correct

4. **Set up Entry Scanners**
   - Install Pi agent at factory entry gates
   - Configure `config.json` with backend URL and API key
   - Test scanner: `python run_agent.py` and scan test cards
   - Set up as systemd service for automatic startup

5. **Start Monitoring**
   - Open **Plant Dashboard** for factory-wide overview
   - Open **Bus Dashboard** for detailed per-bus analysis
   - Set up daily/weekly report exports

### Daily Operations

#### For Factory Supervisors
1. **Monitor Attendance**
   - Check Plant Dashboard for today's headcount
   - Review any unknown batch IDs
   - Verify bus load factors and capacity utilization

2. **Generate Reports**
   - Use date filters to select reporting period
   - Download CSV exports for management review
   - Track attendance trends over time

#### For Transport Coordinators
1. **Optimize Routes**
   - Review consistent underutilized buses
   - Check for buses exceeding capacity
   - Analyze shift-specific patterns
   - Propose route consolidation or adjustments

2. **Manage Fleet**
   - Update bus assignments when routes change
   - Add/remove vans as needed
   - Reassign employees to different buses/vans

#### For IT Support
1. **Monitor System Health**
   - Check backend `/health` endpoint
   - Review Pi agent upload status
   - Monitor database size and performance

2. **Handle Issues**
   - Investigate unknown batch IDs
   - Resolve duplicate scans
   - Fix scanner connectivity issues

### Common Tasks

#### Upload New Employee Master List
```bash
# Web Dashboard
1. Go to Employee Management
2. Click "Upload Master List"
3. Select Excel file
4. Review processing results
5. Check Unknown Routes tab if any warnings
```

#### Add a New Bus Route
```bash
# Web Dashboard
1. Go to Bus Management
2. Click "Add Bus"
3. Fill in: Bus ID, Route name, Plate number, Capacity
4. Save
5. Assign employees to new bus in Employee Management
```

#### Export Monthly Report
```bash
# Web Dashboard - Plant/Bus Dashboard
1. Set date range (e.g., 2025-01-01 to 2025-01-31)
2. Select shift (or leave blank for all)
3. Click "Download CSV"
4. Open in Excel for further analysis
```

#### Check Scanner Status
```bash
# Pi Agent terminal
1. SSH to Raspberry Pi
2. Check service: sudo systemctl status bus-agent
3. View logs: sudo journalctl -u bus-agent -f
4. Or run manually: cd pi-agent && python run_agent.py
5. Type 'status' to see pending uploads
```

#### Manually Upload Scan
```bash
# Pi Agent - Manual mode
1. Run: python run_agent.py
2. Type employee ID (e.g., 10001)
3. System records scan with current timestamp
4. Automatic upload in next sync cycle (60 seconds)
```

---

## Configuration

### Entry Scanner Configuration (config.json)

```json
{
  "api_base_url": "http://localhost:8003/api/bus",
  "api_key": "ENTRY_SECRET",
  "upload_interval_seconds": 60
}
```

| Field | Description |
|-------|-------------|
| `api_base_url` | Backend API endpoint (should match backend URL) |
| `api_key` | Authentication key (must match backend API_KEYS config) |
| `upload_interval_seconds` | How often to upload pending scans (default: 60) |

**Note**: The scanner sits at the factory entry, not per-bus. Bus assignment is derived from employee records in the backend.

### Backend Environment Variables

Create `.env` file in backend folder:

```env
# Database URL
# For SQLite (default, good for development):
DATABASE_URL=sqlite:///./bus_optimizer.db

# For PostgreSQL (production):
# DATABASE_URL=postgresql://username:password@localhost:5432/bus_optimizer

# API Keys (format: LABEL:SECRET_KEY, comma-separated)
# Labels are descriptive only - all entry scanners share same key
API_KEYS=ENTRY_GATE:ENTRY_SECRET

# Debug mode (set to false in production)
DEBUG=true
```

**Important Notes:**
- The `API_KEYS` format is `LABEL:KEY`, where LABEL is descriptive only
- All entry scanners at the factory gate should use the same API key
- In development, backend runs on port 8003 (see `run_server.py`)
- In Docker production, backend runs on port 8000 inside container

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

Note: When running in development, backend is at port 8003. In Docker deployment, backend runs on port 8000 inside container, exposed as configured (default 8000).

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
| `date` | No | Single date (YYYY-MM-DD) |
| `date_from` | No | Start date for range (YYYY-MM-DD) |
| `date_to` | No | End date for range (YYYY-MM-DD) |
| `shift` | No | `morning`, `night`, or `unknown` |
| `bus_id` | No | Filter by bus |
| `route` | No | Filter by route (substring match) |

Note: Use either `date` for single day, or `date_from`/`date_to` for range. If none specified, returns all dates.

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

The system provides CSV export functionality for both headcount summaries and detailed attendance records.

**Headcount Export:**
```
GET /api/report/headcount/export?date_from=2025-11-01&date_to=2025-11-30&shift=morning&bus_id=A01
```

Supports same filters as `/api/report/headcount`:
- `date` - Single date
- `date_from` / `date_to` - Date range
- `shift` - morning/night/unknown
- `bus_id` - Specific bus
- `route` - Route substring match

**Attendance Export:**
```
GET /api/report/attendance/export?date=2025-11-28&shift=morning&bus_id=A01
```

Requires `date`, optional:
- `shift` - morning/night/unknown
- `bus_id` - Specific bus
- `route` - Route substring match

The web dashboard includes download buttons that automatically pass current filters to these endpoints.

---

## Production Deployment

### Port Configuration

The system uses different ports in different environments:

**Development Mode** (using `run_server.py`):
- Backend API: `http://localhost:8003`
- Web Dashboard: `http://localhost:5175` (proxies API to 8003)

**Docker Production** (using `docker-compose`):
- Backend API: `http://localhost:8000` (container internal port 8000, exposed as 8000)
- Web Dashboard: `http://localhost:5175` (nginx proxies API to backend:8000)

You can customize Docker ports via environment variables in `deployment/.env`:
```env
BACKEND_PORT=8000  # External port for backend
WEB_PORT=5175      # External port for web dashboard
```

### Using Docker Compose

```bash
cd deployment
docker-compose up -d
```

This starts:
- PostgreSQL database (port 5432)
- Backend API (internal port 8000, exposed as 8000 by default)
- Web dashboard (port 5175 by default, serves on port 80 inside container)

### Pi Agent as Systemd Service (Raspberry Pi)

Create `/etc/systemd/system/bus-agent.service`:

```ini
[Unit]
Description=Bus System Passenger Counter Agent
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/bus-system/pi-agent
ExecStart=/home/pi/bus-system/.venv/bin/python run_agent.py
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

Internal use only - Jabil Factory Bus System

---

## Support

For issues and feature requests, contact the IT department.
