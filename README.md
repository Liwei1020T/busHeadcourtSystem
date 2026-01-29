<div align="center">

# Bus Passenger Counting & Optimization System

### An Intelligent Bus Fleet Management Platform for Factory Transportation

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

<p align="center">
  <strong>Track bus ridership, optimize fleet operations, and reduce transportation costs with real-time passenger counting and analytics.</strong>
</p>

[Quick Start](#-quick-start) | [Features](#-feature-showcase) | [API Docs](#api-reference) | [Deployment](#production-deployment) | [Configuration](#configuration) | [Troubleshooting](#troubleshooting)

</div>

---

## Table of Contents

- [What Is This?](#what-is-this)
- [Feature Showcase](#feature-showcase)
- [Architecture](#architecture)
- [Quick Start](#-quick-start)
- [Your First 5 Minutes](#your-first-5-minutes)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Production Deployment](#production-deployment)
- [Makefile Commands](#makefile-commands)
- [Data Flow & Business Logic](#data-flow--business-logic)
- [Security Features](#security-features)
- [Performance Optimizations](#performance-optimizations)
- [Troubleshooting](#troubleshooting)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)
- [License](#license)

---

## What Is This?

A comprehensive system for counting bus passengers using employee cards at factory facilities:

- **Track Bus Ridership** - Raspberry Pi-based card readers at factory entry gates
- **Optimize Fleet Operations** - Identify underutilized buses for consolidation
- **Reduce Transportation Costs** - Data-driven route planning and capacity analysis
- **Multi-Factory Support** - Centralized management across multiple plants
- **Real-Time Analytics** - Live passenger counts and capacity utilization

### Problem Statement

Factory transportation operations face several challenges:

1. **Unknown Ridership** - No accurate data on how many employees use each bus
2. **Underutilized Buses** - Some buses run at 30% capacity while others are full
3. **Manual Tracking** - Paper-based or Excel attendance is error-prone and delayed
4. **Multi-Plant Complexity** - Different plants have different routes and schedules
5. **Cost Optimization** - No data to make informed decisions about route consolidation

### Solution

This system provides:

- **Automated Counting** - RFID/NFC card readers capture attendance automatically
- **Real-Time Dashboard** - Live visibility into bus occupancy across all plants
- **Offline Resilience** - Scans stored locally, synced when network available
- **Data-Driven Decisions** - Reports and analytics for route optimization
- **Scalable Architecture** - Supports multiple plants, buses, and scanners

---

## Feature Showcase

### 1. Entry Scanner System (Pi Agent)

**Raspberry Pi-based card readers at factory entry gates**

| Feature | Description |
|---------|-------------|
| **Offline-First** | Scans stored locally in SQLite, uploaded when network available |
| **Auto Shift Detection** | Morning/night shifts derived from scan time (KL timezone) |
| **Duplicate Prevention** | One scan per employee per shift per day |
| **Unknown Batch Tracking** | Records unrecognized employee IDs for investigation |
| **Configurable Sync** | Upload interval customizable (default: 60 seconds) |

**Shift Detection Logic:**

| Time (KL Timezone) | Detected Shift |
|--------------------|----------------|
| 04:00 - 10:00 | Morning |
| 16:00 - 21:00 | Night |
| Other hours | Unknown |

**How It Works:**

```
┌──────────────────────────────────────────────────────────────────────┐
│  Employee taps card → Pi stores locally → Background sync → Backend  │
└──────────────────────────────────────────────────────────────────────┘
     │                      │                    │              │
     ▼                      ▼                    ▼              ▼
  Read batch_id       SQLite storage        Every 60s      Deduplicate
  from RFID/NFC       (offline-first)       POST upload    & store
```

---

### 2. Dashboard & Analytics

**Real-time visibility into bus operations**

**Plant Dashboard:**
- Multi-factory overview with key metrics
- Total headcount by plant and shift
- Bus utilization summary
- Quick filters by date range

**Bus Dashboard:**
- Detailed per-bus attendance analysis
- Load factor visualization
- Daily/weekly trends
- Capacity vs. actual ridership charts

**Interactive Features:**
- Filter by date range, shift, bus, route, plant
- CSV/Excel export with current filters
- Real-time statistics refresh
- Drill-down from plant overview to individual bus details

**Dashboard Components:**

| Component | Description |
|-----------|-------------|
| **PlantAnalyticsDashboard** | Multi-plant overview with capacity heatmaps |
| **OccupancyTable** | Bus-by-bus capacity utilization (virtualized for performance) |
| **BusDetailDrawer** | Per-bus roster drilldown with attendance status |
| **TrendAnalysisView** | Time-series attendance trends with comparison |

---

### 3. Data Management

**Complete control over your fleet data**

**Employee Management:**
- Bulk upload via Excel (PersonId, Name, Transport, Route)
- Automatic bus/van assignment from master list
- Unknown route reconciliation
- Search and filter employees
- Support for terminated employees and passport holders

**Bus Management:**
- Configure routes, plate numbers, capacity
- Track utilization metrics
- Manage route assignments
- Default capacity: 40 passengers

**Van Management:**
- Assign vans to buses
- Driver information tracking
- Capacity configuration (default: 12 passengers)
- Active/inactive status management

**Excel Upload Features:**
- Flexible column detection (case-insensitive)
- Auto-parsing: Route → bus_id, Transport → van_code
- Handles unknown routes (tracks as "UNKN")
- Handles "Own Transport" (bus_id = "OWN")
- Upsert logic: Updates existing records, creates new ones

---

### 4. Reporting & Export

**Comprehensive reporting for decision-making**

| Report Type | Description |
|-------------|-------------|
| **Headcount Reports** | Aggregated attendance by bus/shift/date |
| **Attendance Details** | Individual scan records with timestamps |
| **CSV Exports** | Download reports with current filter settings |
| **Route Analysis** | Unknown routes tracking and reconciliation |
| **Capacity Reports** | Utilization percentages and optimization opportunities |
| **Occupancy Analysis** | Bus vs van capacity breakdown with roster comparison |
| **Trend Analysis** | Daily attendance trends with period-over-period comparison |
| **Bus Detail Drilldown** | Per-bus roster with attendance status and pickup points |

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

### Component Overview

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Pi Agent** | Python 3.9+ | Offline-first card reader agent on Raspberry Pi |
| **Backend API** | FastAPI + SQLAlchemy | REST API for data management and reporting |
| **Web Dashboard** | React 18 + TypeScript | Real-time analytics and data management UI |
| **Database** | PostgreSQL / SQLite | Persistent storage for all system data |
| **Nginx** | nginx:alpine | Reverse proxy and static file serving |

### Data Flow

1. Employee taps card (batch ID) at the factory entry scanner
2. Pi Agent stores scan in local SQLite database
3. Every 60 seconds, Pi uploads pending scans to backend
4. Backend derives shift (KL time), resolves employee→bus/van, deduplicates
5. Dashboard displays headcount and attendance statistics

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Offline-First** | Factory environments may have unreliable network connectivity |
| **Shift Auto-Detection** | Reduces manual input and human error |
| **Duplicate Prevention** | One scan per employee per shift ensures accurate headcount |
| **Multi-Tenant Ready** | Building ID filtering supports multiple plants |
| **Unknown Route Tracking** | Captures data quality issues for reconciliation |

---

## Quick Start

### Option 1: Docker (Recommended)

```bash
git clone <your-repo-url>
cd bus-optimizer
cd deployment
docker-compose up -d
```

**Access Points:**

| Service | URL | Description |
|---------|-----|-------------|
| Web Dashboard | http://localhost:5175 | Main user interface |
| Backend API | http://localhost:8000 | REST API (Docker) |
| API Docs | http://localhost:8000/docs | Interactive Swagger UI |
| Database | localhost:5432 | PostgreSQL |

### Option 2: Manual Setup

**1. Backend Setup**

```bash
cd bus-optimizer

# Create virtual environment
python -m venv .venv

# Activate (macOS/Linux)
source .venv/bin/activate

# Activate (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Install dependencies
cd backend
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env for PostgreSQL connection

# Start backend
python run_server.py
```

Backend: http://localhost:8003 | API Docs: http://localhost:8003/docs

**2. Web Dashboard Setup**

```bash
cd bus-optimizer/web-dashboard
npm install
npm run dev
```

Dashboard: http://localhost:5175

**3. Pi Agent Setup (Optional)**

```bash
cd bus-optimizer/pi-agent
pip install -r requirements.txt
cp config.sample.json config.json
# Edit config.json with your API key
python run_agent.py
```

---

## Your First 5 Minutes

### 1. Load Demo Data

```bash
cd backend
./load_demo_data.sh
```

Demo data includes:
- 7 buses (Routes A-E) with fictional routes
- 12 vans with driver assignments
- 48 fictional employees
- 7 days of attendance records (85-95% patterns)

### 2. Explore the Dashboard

1. Visit http://localhost:5175
2. Check **Plant Dashboard** for overview
3. Drill into **Bus Dashboard** for details
4. Try the date range and shift filters

### 3. Test the Scanner

```bash
cd pi-agent
python run_agent.py
# Type employee batch IDs: BATCH-001, BATCH-002
# Type 'status' to check pending uploads
```

---

## Configuration

### Entry Scanner (config.json)

```json
{
  "api_base_url": "http://localhost:8003/api/bus",
  "api_key": "ENTRY_SECRET",
  "upload_interval_seconds": 60
}
```

| Field | Description |
|-------|-------------|
| `api_base_url` | Backend API endpoint |
| `api_key` | Authentication key (must match backend) |
| `upload_interval_seconds` | Sync frequency (default: 60) |

### Backend Environment (.env)

```env
# Database (SQLite for dev, PostgreSQL for production)
DATABASE_URL=sqlite:///./bus_optimizer.db
# DATABASE_URL=postgresql://user:pass@localhost:5432/bus_optimizer

# API Keys (format: LABEL:KEY)
API_KEYS=ENTRY_GATE:ENTRY_SECRET

# Debug mode
DEBUG=true
```

### Port Configuration

| Environment | Backend | Dashboard |
|-------------|---------|-----------|
| Development | 8003 | 5175 |
| Docker | 8000 | 5175 |

Customize Docker ports in `deployment/.env`:
```env
BACKEND_PORT=8000
WEB_PORT=5175
```

---

## API Reference

**Base URL:**
- Development: `http://localhost:8003`
- Docker: `http://localhost:8000`

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/api/bus/upload-scans` | POST | Upload scans from Pi agent |
| `/api/report/headcount` | GET | Headcount summary by bus/shift |
| `/api/report/attendance` | GET | Detailed attendance records |
| `/api/report/headcount/export` | GET | CSV export of headcount |
| `/api/report/attendance/export` | GET | CSV export of attendance |

### Upload Scans

```bash
curl -X POST http://localhost:8003/api/bus/upload-scans \
  -H "X-API-KEY: ENTRY_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "scans": [
      {"id": 1, "batch_id": "BATCH-001", "scan_time": "2025-01-28T06:45:00+08:00"}
    ]
  }'
```

### Get Headcount Report

```bash
curl "http://localhost:8003/api/report/headcount?date=2025-01-28&shift=morning"
```

**Query Parameters:**

| Parameter | Description |
|-----------|-------------|
| `date` | Single date (YYYY-MM-DD) |
| `date_from` / `date_to` | Date range |
| `shift` | `morning`, `night`, or `unknown` |
| `bus_id` | Filter by bus |
| `route` | Route substring match |

### Additional Endpoints

**Management Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bus/buses` | GET | List all buses |
| `/api/bus/buses` | POST | Create/update bus |
| `/api/bus/vans` | GET | List all vans |
| `/api/bus/vans` | POST | Create/update van |
| `/api/bus/employees` | GET | List all employees (enriched with master list) |
| `/api/bus/employees` | POST | Create/update employee |

**Upload Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bus/master-list/upload` | POST | Upload employee master list (.xlsx) |
| `/api/bus/attendance/upload` | POST | Upload attendance records (.xlsx) |
| `/api/bus/attendance/delete-by-date` | DELETE | Delete attendance by date range |

**Advanced Reporting:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/report/occupancy` | GET | Capacity vs actual occupancy (cached 60s) |
| `/api/report/occupancy/filters` | GET | Available filter options for multi-select |
| `/api/report/bus-detail` | GET | Per-bus roster with attendance |
| `/api/report/summary` | GET | Trend analysis with load factors |
| `/api/report/unknown-attendances` | GET | Query unknown attendance records |
| `/api/report/unknown-attendances/summary` | GET | Summary stats for unknown routes |

**Occupancy Endpoint Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `date_from` / `date_to` | string | Date range (YYYY-MM-DD) |
| `shifts` | string | Comma-separated: `morning,night,unknown` |
| `bus_ids` | string | Comma-separated bus IDs |
| `routes` | string | Comma-separated route names |
| `plants` | string | Comma-separated building IDs |

---

## Project Structure

```
bus-optimizer/
├── README.md                     # This file
├── Makefile                      # Docker and development commands
├── docs/
│   ├── system-design.md          # Detailed system design
│   ├── features.md               # Feature documentation
│   ├── pages/                    # Page-specific docs
│   └── plans/                    # Implementation plans
├── pi-agent/                     # Raspberry Pi agent (Python)
│   ├── config.sample.json        # Sample configuration
│   ├── main.py                   # Main entry point
│   ├── db.py                     # Local SQLite operations
│   ├── uploader.py               # HTTP upload to backend
│   └── reader.py                 # Card reader abstraction
├── backend/                      # FastAPI backend
│   ├── app/
│   │   ├── main.py               # FastAPI application
│   │   ├── api/                  # API routes
│   │   ├── core/                 # Config, DB, security
│   │   ├── models/               # SQLAlchemy models
│   │   └── schemas/              # Pydantic schemas
│   ├── run_server.py             # Startup script
│   └── requirements.txt
├── web-dashboard/                # React + Tailwind frontend
│   ├── src/
│   │   ├── pages/                # Dashboard pages
│   │   ├── components/           # UI components
│   │   ├── api.ts                # API client
│   │   └── types.ts              # TypeScript types
│   ├── package.json
│   └── vite.config.ts
└── deployment/                   # Docker configuration
    ├── docker-compose.yml
    ├── Dockerfile.backend
    ├── Dockerfile.web
    └── nginx.conf
```

---

## Database Schema

### PostgreSQL (Production)

| Table | Description |
|-------|-------------|
| `buses` | Bus routes and capacity |
| `vans` | Van assignments with drivers |
| `employees` | Employee master with bus/van links |
| `employee_master` | Raw master list data |
| `attendances` | Validated attendance records |
| `unknown_attendances` | Unrecognized scans for review |

### Table Details

**buses**
```sql
CREATE TABLE buses (
    bus_id       VARCHAR(10) PRIMARY KEY,  -- Max 4 chars effective
    route        VARCHAR(100),
    plate_number VARCHAR(20),
    capacity     INTEGER DEFAULT 40
);
-- Special values: "OWN" (own transport), "UNKN" (unassigned)
```

**vans**
```sql
CREATE TABLE vans (
    id           SERIAL PRIMARY KEY,
    van_code     VARCHAR(20) UNIQUE NOT NULL,
    bus_id       VARCHAR(10) REFERENCES buses,
    plate_number VARCHAR(20),
    driver_name  VARCHAR(100),
    capacity     INTEGER DEFAULT 12,
    active       BOOLEAN DEFAULT TRUE
);
```

**employees**
```sql
CREATE TABLE employees (
    id       SERIAL PRIMARY KEY,
    batch_id BIGINT UNIQUE,  -- Equals PersonId from master list
    name     VARCHAR(100) NOT NULL,
    bus_id   VARCHAR(10) REFERENCES buses,
    van_id   INTEGER REFERENCES vans,
    active   BOOLEAN DEFAULT TRUE
);
```

**attendances**
```sql
CREATE TABLE attendances (
    id               BIGSERIAL PRIMARY KEY,
    employee_id      INTEGER REFERENCES employees,
    bus_id           VARCHAR(10) REFERENCES buses,
    van_id           INTEGER REFERENCES vans,
    scanned_batch_id BIGINT NOT NULL,
    shift            attendance_shift NOT NULL,  -- morning, night, unknown
    status           VARCHAR(20),  -- present, unknown_shift, offday, absent
    scanned_at       TIMESTAMPTZ NOT NULL,
    scanned_on       DATE NOT NULL,  -- Date in KL timezone
    source           VARCHAR(50),  -- pi_agent, manual_upload
    UNIQUE (scanned_batch_id, scanned_on, shift)
);
```

**employee_master**
```sql
CREATE TABLE employee_master (
    id                   BIGSERIAL PRIMARY KEY,
    personid             BIGINT,  -- Nullable for passport holders
    name                 VARCHAR(200),
    transport            VARCHAR(100),
    route                VARCHAR(100),
    building_id          VARCHAR(50),
    pickup_point         VARCHAR(200),
    nationality          VARCHAR(50),
    status               VARCHAR(50),
    terminate            VARCHAR(50),
    -- Additional columns: sap_id, wdid, address1, postcode, city, state, contact_no, date_joined
    row_hash             VARCHAR(64) UNIQUE  -- For rows without PersonId
);
CREATE UNIQUE INDEX ON employee_master (personid) WHERE personid IS NOT NULL;
```

**unknown_attendances**
```sql
CREATE TABLE unknown_attendances (
    id               BIGSERIAL PRIMARY KEY,
    scanned_batch_id BIGINT NOT NULL,
    route_raw        VARCHAR(100),  -- Original route string
    bus_id           VARCHAR(10),   -- Normalized bus ID
    shift            unknown_attendance_shift NOT NULL,
    scanned_at       TIMESTAMPTZ NOT NULL,
    scanned_on       DATE NOT NULL,
    source           VARCHAR(50),
    UNIQUE (scanned_batch_id, scanned_on, shift)
);
```

### SQLite (Pi Agent Local)

```sql
CREATE TABLE scans (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id     TEXT NOT NULL,
    card_uid     TEXT,
    scan_time    TEXT NOT NULL,
    uploaded     INTEGER DEFAULT 0
);
```

---

## Production Deployment

### Docker Compose

```bash
cd deployment
docker-compose up -d
```

Services:
- PostgreSQL database (port 5432)
- Backend API (port 8000)
- Web dashboard (port 5175)

### Pi Agent as Systemd Service

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

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable bus-agent
sudo systemctl start bus-agent
```

---

## Makefile Commands

The project includes a comprehensive Makefile for Docker operations.

### Setup & Build

```bash
make setup      # Create .env from template
make build      # Build all Docker images
```

### Operations

```bash
make up         # Start all services
make down       # Stop all services
make restart    # Restart all services
make restart-backend  # Restart only backend
make restart-web      # Restart only web dashboard
make restart-db       # Restart only database
```

### Monitoring

```bash
make logs           # View logs from all services
make logs-backend   # View backend logs
make logs-web       # View web dashboard logs
make logs-db        # View database logs
make ps             # Show running containers
make stats          # Show resource usage
make test           # Run health checks
```

### Database

```bash
make backup             # Backup database to backups/
make restore FILE=...   # Restore from backup
make shell-db           # Access PostgreSQL shell
```

### Maintenance

```bash
make clean      # Stop & remove containers
make clean-all  # Remove containers, volumes, images
make rebuild    # Rebuild & restart
make update     # Pull code, rebuild, restart
```

---

## Data Flow & Business Logic

### Scan Upload Flow (Pi Agent → Backend)

```
Employee taps card
        │
        ▼
Pi Agent reads batch_id
        │
        ▼
Store in local SQLite
        │
        ▼
Duplicate check (same day/shift?)
        │
        ▼
Background worker (every 60s)
        │
        ├─── Fetch unuploaded scans (limit 200)
        │
        ├─── POST to /api/bus/upload-scans
        │
        ├─── Receive success_ids
        │
        └─── Mark as uploaded in local DB
                    │
                    ▼
            Backend processing
                    │
                    ├─── Parse timestamp, derive shift (KL timezone)
                    │
                    ├─── Find employee by batch_id
                    │
                    ├─── Attach bus_id, van_id from employee record
                    │
                    ├─── Check for duplicate (batch_id + date + shift)
                    │
                    └─── Insert attendance record
```

### Master List Upload Flow

```
User uploads .xlsx
        │
        ▼
Backend parses Excel
        │
        ├─── Auto-detect header row
        ├─── Extract columns (PersonId, Name, Route, Transport, etc.)
        └─── Fuzzy column matching (case-insensitive)
                    │
                    ▼
            Normalization
                    │
                    ├─── Route → bus_id (extract code, max 6 chars)
                    ├─── Transport → van_code
                    ├─── "Own Transport" → bus_id = "OWN"
                    ├─── Unknown routes → bus_id = None
                    └─── Terminated/Inactive → active = false
                                │
                                ▼
                        Upsert logic
                                │
                                ├─── Create missing buses (capacity 40)
                                ├─── Create missing vans (capacity 12)
                                ├─── Assign vans to buses
                                ├─── Create/update employees
                                └─── Store raw data in employee_master
```

### Special Cases

| Case | Handling |
|------|----------|
| **Unknown Routes** | Tracked in `unknown_attendances` table |
| **Own Transport** | Assigned bus_id = "OWN", no capacity tracking |
| **Passport Holders** | Stored in employee_master with row_hash (no PersonId) |
| **Offday** | Attendance with no TimeIn → status = "offday" |
| **Shift Unknown** | Scans outside defined hours → shift = "unknown" |
| **Multi-Day Averaging** | Occupancy for date ranges calculates daily averages |

---

## Security Features

### API Security

| Feature | Description |
|---------|-------------|
| **API Key Authentication** | Pi agents authenticate via `X-API-KEY` header |
| **Multiple API Keys** | Supports format: `LABEL1:KEY1,LABEL2:KEY2` |
| **CORS Middleware** | Configurable allowed origins |

### Data Integrity

| Feature | Description |
|---------|-------------|
| **Unique Constraints** | Prevent duplicate scans per day/shift |
| **Foreign Key Constraints** | Maintain referential integrity |
| **Transaction Support** | Atomic operations for data consistency |

### Web Security

| Feature | Description |
|---------|-------------|
| **Nginx Security Headers** | X-Frame-Options, X-Content-Type-Options, X-XSS-Protection |
| **Input Validation** | Pydantic schemas for all API inputs |
| **SQL Injection Prevention** | SQLAlchemy ORM parameterized queries |

---

## Performance Optimizations

### Backend

| Optimization | Description |
|--------------|-------------|
| **Response Caching** | 60s TTL for occupancy endpoint |
| **Batch Processing** | Chunked queries for large datasets |
| **Indexed Foreign Keys** | Fast lookups on bus_id, van_id, employee_id |
| **Connection Pooling** | SQLAlchemy connection pool |
| **Async Support** | FastAPI async endpoints |

### Frontend

| Optimization | Description |
|--------------|-------------|
| **React Virtualization** | react-window for large tables |
| **Parallel API Calls** | Trend analysis fetches concurrently |
| **Lazy Loading** | Components loaded on demand |
| **Memoization** | useMemo for expensive calculations |
| **Tree Shaking** | Vite optimized bundle size |

### Infrastructure

| Optimization | Description |
|--------------|-------------|
| **Gzip Compression** | Nginx gzip level 6 for text, JS, CSS |
| **Static Asset Caching** | 1 year expiry for immutable files |
| **Multi-Stage Builds** | Smaller Docker images |
| **Health Checks** | Prevent traffic to unhealthy containers |

---

## Troubleshooting

### Backend won't start

```bash
# Ensure correct directory
cd backend
python run_server.py
```

**Common Issues:**

| Issue | Solution |
|-------|----------|
| Module not found | Run `pip install -r requirements.txt` |
| Database connection failed | Check DATABASE_URL in .env |
| Port already in use | Kill the process using the port (see below) |

### Dashboard shows "Failed to load data"

1. Check backend: http://localhost:8003/health
2. Verify Vite proxy in `vite.config.ts`
3. Check browser console for errors
4. Ensure CORS is configured for your origin

### Scans not appearing

1. Wait 60 seconds for auto-upload
2. Check Pi agent logs for errors
3. Verify API key matches backend configuration
4. Check network connectivity from Pi to backend

### Port already in use

```bash
# macOS/Linux
lsof -i :8003

# Kill the process
kill -9 <PID>
```

### Docker Issues

| Issue | Solution |
|-------|----------|
| Container won't start | Run `make logs-<service>` to check logs |
| Database connection refused | Wait for health check, or run `make restart-db` |
| Changes not reflected | Run `make rebuild` |
| Disk space issues | Run `make clean-all` to remove unused images |

### Excel Upload Issues

| Issue | Solution |
|-------|----------|
| Column not detected | Check column names (case-insensitive matching) |
| PersonId missing | Ensure PersonId column exists or is empty (passport holders) |
| Route not recognized | Check route format: "Route A07" or similar |
| Duplicate errors | Employee already exists with same PersonId |

---

## Tech Stack

<table>
<tr>
<td valign="top" width="50%">

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.9+
- **Database**: PostgreSQL 13+ / SQLite
- **ORM**: SQLAlchemy
- **Validation**: Pydantic

</td>
<td valign="top" width="50%">

### Frontend
- **Library**: React 18
- **Language**: TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **UI Components**: Radix UI
- **Animations**: Framer Motion

</td>
</tr>
</table>

### Dependencies

**Backend (Python):**
- fastapi, uvicorn - Web framework
- sqlalchemy, psycopg2-binary - Database ORM
- pydantic, pydantic-settings - Validation
- openpyxl - Excel file handling
- python-dotenv - Environment variables
- tzdata - Timezone support

**Frontend (Node.js):**
- react, react-dom - UI library
- typescript - Type safety
- vite - Build tool
- tailwindcss - Styling
- recharts - Charts
- @radix-ui/* - Accessible UI components
- framer-motion - Animations
- date-fns - Date manipulation
- lucide-react - Icons
- react-hot-toast - Notifications
- react-window - Virtualization

---

## Key Highlights

| Feature | Description |
|---------|-------------|
| **Offline-First** | Scans work without network, sync when available |
| **Real-Time Dashboard** | Live passenger counts and utilization |
| **Multi-Factory** | Centralized management across plants |
| **Export Ready** | CSV exports with filter settings |
| **Docker Support** | Production-ready containerization |
| **Type-Safe** | TypeScript frontend with Pydantic validation |

---

## Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests and linting
5. Commit with descriptive messages
6. Push and create a Pull Request

### Code Style

**Backend (Python):**
- Follow PEP 8 style guide
- Use type hints for function parameters
- Write docstrings for complex functions

**Frontend (TypeScript):**
- Follow ESLint configuration
- Use TypeScript strict mode
- Component files use PascalCase
- Utility files use camelCase

### Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Include tests for new functionality
- Update documentation as needed
- Ensure CI passes before requesting review

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with FastAPI, React, and PostgreSQL**

Made for efficient factory transportation management

</div>
