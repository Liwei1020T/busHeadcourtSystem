# System Design Document

## Overview

The Bus Passenger Counting & Optimization System is designed to track employee bus ridership at a factory facility. The system helps management make data-driven decisions about bus fleet optimization and cost reduction.

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

1. **Card Scan**: Employee taps card on bus reader
2. **Local Storage**: Pi agent stores scan in local SQLite (offline support)
3. **Upload**: When connected to factory Wi-Fi, Pi uploads pending scans
4. **Processing**: Backend deduplicates and stores in PostgreSQL
5. **Reporting**: Dashboard queries backend for summaries and details

## Components

### 1. Pi Agent (Raspberry Pi)

**Responsibilities:**
- Read employee cards via card reader
- Determine current trip based on time windows
- Store scans locally with offline support
- Upload to backend when network available
- Deduplicate scans (same employee + trip = 1 count)

**Technology:**
- Python 3.9+
- SQLite for local storage
- Requests for HTTP uploads

**Key Features:**
- Offline-first design
- Automatic trip detection by time
- Configurable via JSON file

### 2. Backend API (FastAPI)

**Responsibilities:**
- Receive and validate scans from Pi agents
- Store data in central PostgreSQL database
- Provide reporting APIs for dashboard
- API key authentication per bus

**Technology:**
- FastAPI (Python)
- SQLAlchemy ORM
- PostgreSQL database
- Uvicorn ASGI server

**API Endpoints:**
- `POST /api/bus/upload-scans` - Receive batch scans
- `GET /api/report/summary` - Trip summaries with KPIs
- `GET /api/report/scans` - Individual scan records

### 3. Web Dashboard (React)

**Responsibilities:**
- Display passenger statistics
- Show trip load factors
- Filter by date, route, direction
- Visualize optimization opportunities

**Technology:**
- React + TypeScript
- Tailwind CSS
- Vite build tool

**Key Views:**
- KPI cards (total passengers, avg load, trip count)
- Trip summary table
- Scan details table

## Database Schema

### Central Database (PostgreSQL)

```
buses
├── bus_id (PK)
├── plate_number
├── route_name
└── capacity

trips
├── trip_id (PK)
├── bus_id (FK)
├── trip_date
├── trip_code
├── direction
├── planned_time
└── actual_time
└── UNIQUE(bus_id, trip_date, trip_code)

trip_scans
├── id (PK)
├── trip_id (FK)
├── employee_id
├── scan_time
└── UNIQUE(trip_id, employee_id)
```

### Local Database (SQLite on Pi)

```
scans
├── id (PK)
├── bus_id
├── trip_date
├── trip_code
├── direction
├── employee_id
├── card_uid
├── scan_time
└── uploaded (0/1)
```

## Security

- Each bus has a unique API key
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

1. Employee ID mapping (card UID to employee name)
2. Real-time charts and analytics
3. Mobile companion app
4. Automated route optimization suggestions
5. Integration with HR systems
