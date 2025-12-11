# Backend System Documentation

## Overview
The Backend System is a FastAPI-based application that serves as the core API for the Bus Passenger Counting & Optimization System. It manages data persistence, business logic, and provides endpoints for both the Pi Agent and the Web Dashboard.

## Technology Stack
- **Language:** Python
- **Framework:** FastAPI
- **Database:** PostgreSQL (implied by `init_postgres.sql` and `db.py`)
- **ORM/Database Layer:** Likely SQLAlchemy or raw SQL (based on `app/core/db.py`)

## Key Components

### 1. Application Structure (`backend/app/`)
- **`main.py`**: The entry point of the application. Configures the FastAPI app, middleware (CORS), logging, and lifecycle events (startup/shutdown).
- **`api/`**: Contains the route definitions.
    - `bus.py`: Endpoints related to bus operations.
    - `report.py`: Endpoints for generating reports and analytics.
- **`core/`**: Core configuration and utilities.
    - `config.py`: Application settings and environment variable management.
    - `db.py`: Database connection and session management.
    - `security.py`: Security-related utilities (authentication/authorization).
- **`models/`**: Database models representing the schema.
    - `attendance.py`, `bus.py`, `employee.py`, `scan.py`, `trip.py`, `van.py`.
- **`schemas/`**: Pydantic models for request/response validation.
    - `bus.py`, `report.py`.

## Features
- **Data Management**: CRUD operations for Buses, Employees, Vans, and Trips.
- **Data Ingestion**: Receives scan data from the Pi Agent.
- **Reporting**: Provides aggregated data for the dashboard (headcounts, KPIs).
- **Database Initialization**: Automatically creates tables on startup if they don't exist.

## Running the Server
The server is typically started using `run_server.py` or via a WSGI/ASGI server like Uvicorn.

```bash
python run_server.py
```
