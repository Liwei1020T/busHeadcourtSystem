-- ============================================================
-- Bus Optimizer PostgreSQL schema and seed data
-- Usage:
--   psql -U <user> -h <host> -p <port> -f init_postgres.sql
--   (ensure you are connected to the target database first)
-- ============================================================

-- Optional: create the database (uncomment if needed)
-- CREATE DATABASE bus_optimizer;
-- \c bus_optimizer;

-- Clean existing objects for repeatable runs
DROP VIEW IF EXISTS trip_summary;
DROP TABLE IF EXISTS trip_scans CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS buses CASCADE;

-- ------------------------------------------------------------
-- Table: buses
-- ------------------------------------------------------------
CREATE TABLE buses (
    bus_id        VARCHAR(50) PRIMARY KEY,
    plate_number  VARCHAR(50),
    route_name    VARCHAR(100),
    capacity      INTEGER DEFAULT 40
);

-- ------------------------------------------------------------
-- Table: trips
-- One row per bus per date per trip_code
-- ------------------------------------------------------------
CREATE TABLE trips (
    trip_id      SERIAL PRIMARY KEY,
    bus_id       VARCHAR(50) NOT NULL REFERENCES buses(bus_id) ON DELETE CASCADE,
    trip_date    DATE NOT NULL,
    trip_code    VARCHAR(50) NOT NULL,
    direction    VARCHAR(20) NOT NULL CHECK (direction IN ('to_factory', 'from_factory')),
    planned_time TIME,
    actual_time  TIMESTAMP,
    CONSTRAINT uq_bus_date_trip UNIQUE (bus_id, trip_date, trip_code)
);

CREATE INDEX idx_trips_date ON trips(trip_date);
CREATE INDEX idx_trips_bus_id ON trips(bus_id);

-- ------------------------------------------------------------
-- Table: trip_scans
-- Individual employee scans per trip
-- ------------------------------------------------------------
CREATE TABLE trip_scans (
    id           SERIAL PRIMARY KEY,
    trip_id      INTEGER NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
    employee_id  VARCHAR(50) NOT NULL,
    scan_time    TIMESTAMP NOT NULL,
    CONSTRAINT uq_trip_employee UNIQUE (trip_id, employee_id)
);

CREATE INDEX idx_trip_scans_trip_id ON trip_scans(trip_id);
CREATE INDEX idx_trip_scans_employee_id ON trip_scans(employee_id);

-- ------------------------------------------------------------
-- View: trip_summary
-- Aggregated trip metrics for reporting
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Seed data: initial buses (safe to re-run)
-- ------------------------------------------------------------
INSERT INTO buses (bus_id, plate_number, route_name, capacity) VALUES
    ('BUS_SP_01', 'WPL 1234', 'SP to Factory', 40),
    ('BUS_SP_02', 'WPL 1235', 'SP to Factory', 40),
    ('BUS_KL_01', 'WKL 5678', 'Kulim to Factory', 45),
    ('BUS_PG_01', 'PNG 9012', 'Penang to Factory', 50)
ON CONFLICT (bus_id) DO NOTHING;
