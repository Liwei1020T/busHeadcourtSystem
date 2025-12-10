# System Design Document

## Overview

The Bus Optimizer now tracks employee attendance by shift (morning/night) per bus, with batch-ID scans, van-to-bus assignments, and headcount reporting. Routes are stored inline on buses, shifts are derived in Kuala Lumpur time, and unknown batch/shift scans are logged for investigation. Scanners now sit at the factory entry (not per-bus), and bus assignment is taken from the employee record. The goal remains to give management accurate ridership and headcount visibility for optimization.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Raspberry Pi  │     │   Backend API   │     │  Web Dashboard  │
│   + Card Reader │────▶│   (FastAPI)     │◀────│   (React)       │
│   (per bus)     │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                        ┌────────▼────────┐
                        │   PostgreSQL    │
                        │   Database      │
                        └─────────────────┘
```

## Data Flow

1. **Card Scan**: Employee batch ID is scanned at the factory entry scanner.
2. **Local Storage**: Pi agent stores scan in local SQLite (offline support).
3. **Upload**: When connected, Pi uploads pending scans to the backend.
4. **Processing**: Backend validates the entry API key, derives shift from KL local time (morning 04:00–10:00, night 16:00–21:00, otherwise unknown), resolves employee/bus/van, deduplicates per batch+date+shift, and stores attendance in PostgreSQL. Unknown batch/shift scans are recorded.
5. **Reporting**: Dashboard queries headcount and attendance detail with filters by date, shift, and bus; admin can manage buses, vans, and employees.

## Components

### 1. Pi Agent (Raspberry Pi)

**Responsibilities:**
- Read employee batch IDs via card reader at factory entry
- Store scans locally with offline support
- Upload to backend when network available
- Backend derives shift and dedupes per batch+date+shift; bus assignment comes from employee records

**Technology:**
- Python 3.9+
- SQLite for local storage
- Requests for HTTP uploads

**Key Features:**
- Offline-first design
- Lightweight payload: `{id, bus_id, batch_id, scan_time}`
- Configurable via JSON file

### 2. Backend API (FastAPI)

**Responsibilities:**
- Receive and validate scans from Pi agents
- Derive shifts by Kuala Lumpur time and categorize unknown shifts
- Resolve employees/buses/vans and store attendance
- Provide headcount/attendance reporting for the dashboard
- Manage buses, vans, employees
- API key authentication per bus

**Technology:**
- FastAPI (Python)
- SQLAlchemy ORM
- PostgreSQL database
- Uvicorn ASGI server

**API Endpoints:**
- `POST /api/bus/upload-scans` - Receive batch scans from entry scanners (batch_id-based; no bus_id in payload)
- `GET /api/bus/buses` / `POST /api/bus/buses` - List/upsert buses
- `GET /api/bus/vans` - List vans (bus assignment)
- `GET /api/bus/employees` / `POST /api/bus/employees` - List/upsert employees (batch_id, bus_id, van_id)
- `GET /api/report/headcount` - Per-bus headcount aggregated by date/shift
- `GET /api/report/attendance` - Detailed attendance records with filters

### 3. Web Dashboard (React)

**Responsibilities:**
- Display headcount per bus/shift/date
- Filter by date, shift, and bus; view attendance detail
- Manage buses, vans, employees (batch IDs, assignments)

**Technology:**
- React + TypeScript
- Tailwind CSS
- Vite build tool

**Key Views:**
- Headcount table/cards (present, unknown batch/shift)
- Attendance detail table (scans)
- Admin tables for buses, vans, employees

## Database Schema

### Central Database (PostgreSQL)

```
buses
├── bus_id (PK, <=4 chars, e.g., A02)
├── route (text, inline)
├── plate_number
└── capacity

vans
├── id (PK)
├── van_code (unique)
├── bus_id (FK -> buses)
├── plate_number
├── driver_name
├── capacity
└── active

employees
├── id (PK)
├── batch_id (unique, scannable)
├── name
├── bus_id (FK -> buses)
├── van_id (FK -> vans, nullable)
└── active

attendances
├── id (PK)
├── scanned_batch_id
├── employee_id (FK -> employees, nullable)
├── bus_id (FK -> buses, nullable)
├── van_id (FK -> vans, nullable)
├── shift (enum: morning/night/unknown, derived by KL time)
├── status (present/unknown_batch/unknown_shift)
├── scanned_at (timestamptz)
├── scanned_on (date, KL)
└── UNIQUE(scanned_batch_id, scanned_on, shift)
```

### Local Database (SQLite on Pi)

```
scans
├── id (PK)
├── bus_id
├── batch_id
├── card_uid (optional)
├── scan_time
└── uploaded (0/1)
```

## Security

- Entry scanners use shared API keys (labeled, not bus-specific)
- API keys validated via X-API-KEY header
- Keys stored as environment variables on backend
- Internal network only (no public exposure)

## Deployment

### Development
- Backend: uvicorn with reload
- Frontend: Vite dev server
- Pi Agent: Direct Python execution

### Production
- Backend: Docker container with Uvicorn
- Frontend: Static build served by Nginx
- Pi Agent: systemd service
- Database: PostgreSQL container or managed service

## Future Enhancements

1. Card UID to batch-ID resolution service on the backend (instead of Pi mapping)
2. Real-time charts and analytics
3. Mobile companion app
4. Automated route optimization suggestions
5. Integration with HR systems and roster imports
