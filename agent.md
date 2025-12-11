# AI Context & Memory Preservation

**IMPORTANT FOR AI ASSISTANT:**
To maintain context and avoid "memory loss" across sessions, you must **ALWAYS** consult the documentation files in the `docs/` folder before making changes or answering complex queries.

The `docs/` folder is the source of truth for this project.
- **Architecture & Systems:** `docs/systems/*.md`
- **Frontend Pages:** `docs/pages/*.md`
- **General Design:** `docs/system-design.md`

When asked to implement features or fix bugs:
1.  **Read** the relevant documentation first.
2.  **Update** the documentation if your changes modify the system behavior or architecture.
3.  **Ensure** your code aligns with the documented design constraints (e.g., No Chinese characters in code).

---

You are a senior full-stack engineer and architect.
You will implement a Bus Passenger Counting & Optimization System from scratch.
The system is used in a factory to count bus passengers using employee cards, then analyze the data to decide how to reduce buses or adjust trips.

Important constraint:
All generated source code (Pi agent, backend, frontend, configs) MUST NOT contain any Chinese characters.

No Chinese in comments.

No Chinese in variable names, function names, log messages, or string literals.

Only English is allowed in code and configuration files.
You may use Chinese only in high-level documentation text (like system-design.md) if really needed, but avoid mixing languages inside code.

1. Project overview

Main idea:

Employees use their existing employee cards when boarding the bus.

Each bus has a Raspberry Pi + card reader (provided by the factory) that can read a unique card UID.

The Raspberry Pi must work offline: it stores scan records in a local SQLite database.

When the bus arrives at the factory and connects to factory Wi-Fi, the Pi uploads all pending scans to a central backend via HTTP API.

The backend stores data in a central database (PostgreSQL preferred) and exposes reporting APIs.

An internal web Dashboard (React + Tailwind) consumes these APIs to show passenger counts, load factor, trip statistics, etc.

The system is only for bus optimization and cost analysis, not for attendance or performance evaluation.

2. Overall architecture & mono-repo structure

Main point: Use a mono-repo with three main subprojects: pi-agent, backend, web-dashboard.

Please create the following structure (you can adjust slightly if needed but keep it clear and organized):

bus-optimizer/
  README.md
  docs/
    system-design.md        # High-level system design (you can auto-generate a brief version)
  pi-agent/                 # Raspberry Pi agent (Python)
    config.sample.json
    main.py
    db.py
    uploader.py
    reader.py               # Reader abstraction (start with a fake/mock implementation)
    requirements.txt
  backend/                  # Backend API (FastAPI + SQLAlchemy + PostgreSQL)
    app/
      main.py
      api/
        bus.py              # /api/bus/upload-scans
        report.py           # /api/report/summary, /api/report/scans
      core/
        config.py
        db.py
        security.py         # API key validation (one key per bus, simple implementation)
      models/
        bus.py
        trip.py
        scan.py
      schemas/
        bus.py
        report.py
    tests/
    requirements.txt
  web-dashboard/            # React + Tailwind frontend
    src/
      App.tsx
      main.tsx
      pages/
        BusDashboard.tsx
      components/
        FiltersBar.tsx
        KpiCard.tsx
        TripTable.tsx
        ScanTable.tsx
    package.json
    tailwind.config.cjs
    postcss.config.cjs
    index.html
  infra/                    # Optional deployment config
    docker-compose.yml      # Optional: DB + backend + web


Requirements:

All code (Python, TypeScript, TSX, HTML, JSON, YAML, etc.) must be pure English only, no Chinese at all.

Project structure should be maintainable and easy to extend.

3. Raspberry Pi agent (pi-agent) requirements

Main point: A long-running Python service that reads cards, stores scans in SQLite, auto-selects trips by time, and uploads when online.

3.1 Configuration

The Pi agent loads a JSON config like:

{
  "bus_id": "BUS_SP_01",
  "api_base_url": "https://intranet.example.com/api/bus",
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


bus_id: unique ID per bus.

api_base_url: backend base URL.

api_key: simple shared secret for this bus.

trips: list of time windows and trip codes (e.g. morning and evening).

3.2 Local SQLite schema

Use a local SQLite database file (e.g. bus_log.db) with a table:

CREATE TABLE IF NOT EXISTS scans (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  bus_id       TEXT,
  trip_date    TEXT,     -- YYYY-MM-DD
  trip_code    TEXT,
  direction    TEXT,     -- to_factory / from_factory
  employee_id  TEXT,
  card_uid     TEXT,
  scan_time    TEXT,     -- ISO datetime string
  uploaded     INTEGER   -- 0 = not uploaded, 1 = uploaded
);


For now, you can set employee_id = card_uid. Later this can be extended to use a card-to-employee mapping.

3.3 Trip selection logic

Implement a function:

def get_current_trip(config) -> Optional[Dict]:
    """
    Returns the trip dict from config["trips"] whose [start, end] time window
    contains the current local time. Returns None if no trip matches.
    """


Parse start and end as HH:MM, compare to datetime.now().time().

If there is a match, use that trip_code and direction.

If no match, either skip recording or log a warning (do not crash).

3.4 Insert scan logic with de-duplication

When a card is scanned (we get a card_uid string):

Determine trip_date = today.

Call get_current_trip(config); if None, skip or log.

Use employee_id = card_uid (for now).

Insert into scans only if there is no existing record with the same
(bus_id, trip_date, trip_code, employee_id).

3.5 Upload logic

Every 60 seconds:

Fetch up to N (e.g. 200) rows from scans where uploaded = 0.

POST them to backend:

{
  "scans": [
    {
      "id": 1,
      "bus_id": "BUS_SP_01",
      "trip_date": "2025-11-27",
      "trip_code": "SP-0630-IN",
      "direction": "to_factory",
      "employee_id": "CARD12345",
      "card_uid": "CARD12345",
      "scan_time": "2025-11-27T06:10:00"
    }
  ]
}


Send X-API-KEY: <api_key> header.

On success, backend returns { "success_ids": [1, 2, 3] }.

Mark those rows as uploaded = 1.

3.6 Code structure

db.py: init_db(), insert_scan(), get_unuploaded_scans(), mark_uploaded().

uploader.py: upload_scans(api_base_url: str, api_key: str).

reader.py:

For now, implement a fake reader that uses input() or a simple loop to simulate card scans (e.g. user types card UID in the terminal).

Provide a clear interface so that later it can be replaced by a real hardware reader implementation.

main.py:

Load config, initialize DB, main loop: wait for card → handle scan → periodic upload.

Include TODO comments (in English only) for how to make it a systemd service.

All Python code must use only English names and English comments.

4. Backend (backend) requirements (FastAPI)

Main point: provide upload API for Pi agents and reporting APIs for the dashboard.

4.1 Tech stack

FastAPI

SQLAlchemy or SQLModel (pick one and be consistent)

PostgreSQL (connection string from environment variables)

Uvicorn for running the app in development

4.2 Database models

buses

bus_id       VARCHAR(50) PRIMARY KEY,
plate_number VARCHAR(50),
route_name   VARCHAR(100),
capacity     INT


trips

trip_id      SERIAL PRIMARY KEY,
bus_id       VARCHAR(50) REFERENCES buses(bus_id),
trip_date    DATE,
trip_code    VARCHAR(50),
direction    VARCHAR(20),
planned_time TIME,
actual_time  TIMESTAMP

UNIQUE (bus_id, trip_date, trip_code)


trip_scans

id           SERIAL PRIMARY KEY,
trip_id      INT REFERENCES trips(trip_id),
employee_id  VARCHAR(50),
scan_time    TIMESTAMP,
UNIQUE (trip_id, employee_id)


You can also define ORM models for these tables in app/models.

4.3 APIs

POST /api/bus/upload-scans

Request body: as defined in the Pi section ({"scans": [...]}).

Header X-API-KEY is validated using a simple in-memory config or env map.

For each scan:

Find or create a trip by (bus_id, trip_date, trip_code).

Insert a row into trip_scans if it does not violate the unique constraint (trip_id, employee_id).

Response:

{ "success_ids": [1, 2, 3] }


GET /api/report/summary

Query params: date_from, date_to, route, direction (all optional but at least a date range is recommended).

Response:

{
  "total_passengers": 1234,
  "avg_load_factor": 0.72,
  "trip_count": 56,
  "saving_estimate": 50000,
  "trips": [
    {
      "trip_date": "2025-11-27",
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


Implement an aggregate query using trips + buses + trip_scans.

GET /api/report/scans

Query param: date (required).

Response:

[
  {
    "scan_time": "2025-11-27T06:10:00",
    "employee_id": "CARD12345",
    "bus_id": "BUS_SP_01",
    "trip_code": "SP-0630-IN",
    "direction": "to_factory"
  }
]

4.4 Code organization

app/main.py: create FastAPI instance, include routers.

app/api/bus.py: implement /api/bus/upload-scans.

app/api/report.py: implement /api/report/summary and /api/report/scans.

app/core/db.py: database session management.

app/core/config.py: environment-based config (DB URL, API keys).

app/core/security.py: simple API key validation helper.

app/models/*.py: ORM models.

app/schemas/*.py: Pydantic schemas for request/response.

All backend code must be fully in English (identifiers, comments, messages).

5. Frontend (web-dashboard) requirements

Main point: React + Tailwind responsive dashboard consuming the backend report APIs.

5.1 Tech stack

React + TypeScript

Tailwind CSS

Vite or CRA (you can choose Vite for simplicity)

5.2 Main page: BusDashboard

Layout:

Top navbar

Title: Bus Passenger Dashboard

Subtitle: Factory Bus Optimization System

Show today's date on the right.

Filter bar (FiltersBar component)

dateFrom (start date)

dateTo (end date)

route select (e.g. SP-FACTORY, KULIM-FACTORY, or empty for all)

direction select ("", "to_factory", "from_factory")

Search button

On submit: call /api/report/summary with current filters and also refresh scans for dateFrom.

KPI cards (KpiCard component)

Total passengers

Average load factor (%)

Trip count

Saving estimate (e.g. RM 50000, can be a dummy value from backend for now)

Middle section

Left: TripTable

Columns: date, trip code, bus id, route, direction (badge), passenger count, capacity, load factor (%)

Right: a simple placeholder box for future charts (write "Chart area (placeholder)" in English).

Bottom section (ScanTable)

Date picker for detailDate.

Table: scan time, employee id, bus id, trip code, direction.

On date change, call /api/report/scans?date=....

All UI text should be in English.

5.3 Data types

Use TypeScript types like:

type TripSummary = {
  trip_date: string;
  trip_code: string;
  bus_id: string;
  route_name: string;
  direction: "to_factory" | "from_factory" | string;
  passenger_count: number | null;
  capacity: number | null;
  load_factor: number | null; // 0–1
};

type SummaryResponse = {
  total_passengers: number | null;
  avg_load_factor: number | null;
  trip_count: number | null;
  saving_estimate: number | null;
  trips: TripSummary[];
};

type ScanRecord = {
  scan_time: string;
  employee_id: string;
  bus_id: string;
  trip_code: string;
  direction: "to_factory" | "from_factory" | string;
};


Match these with the backend response formats.

6. README and docs

Main point: Provide simple instructions to run each part locally.

In README.md and/or docs/system-design.md, include at least:

How to run the backend locally:

Install dependencies.

Set DB connection string.

Run migrations or create tables.

Start FastAPI with uvicorn.

How to run the web dashboard locally:

Install npm dependencies.

Start dev server.

Configure API base URL if needed (e.g. proxy to backend).

How to run the Pi agent in dev mode:

Use the fake reader to simulate card scans via the terminal.

Confirm that scans appear in the database and in the dashboard.

A short note (in English) about turning the Pi agent into a systemd service.

Again: even in docs, avoid mixing Chinese inside code blocks.

7. Style and constraints (very important)

All code and configuration files MUST NOT contain any Chinese characters.

No Chinese in comments.

No Chinese in variable names, function names, log messages, user-facing strings, or JSON keys.

Use clear, maintainable English naming and comments.

Handle basic error cases gracefully (e.g. failed uploads should log and retry later, not crash).

Prefer simple and practical implementations over over-engineered patterns.

Keep API contracts consistent between Pi agent, backend, and frontend.

Based on all of the above, please:

Generate the initial mono-repo structure.

Provide code for the Pi agent, backend, and frontend that compiles/runs with minimal configuration.

Make sure all three parts (Pi agent → backend → frontend) work together logically and share consistent data formats.