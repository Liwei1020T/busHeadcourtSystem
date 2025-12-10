-- ============================================================
-- Bus Optimizer PostgreSQL schema and seed data
-- Usage:
--   psql -U <user> -h <host> -p <port> -f init_postgres.sql
--   (ensure you are connected to the target database first)
-- ============================================================

-- Optional: create the database (uncomment if needed)
-- CREATE DATABASE bus_optimizer;
-- \c bus_optimizer;

-- Use Kuala Lumpur time for generated dates
SET TIME ZONE 'Asia/Kuala_Lumpur';

-- Legacy helper: if you need to keep data and only convert batch_id to INTEGER,
-- uncomment and run the block below, then skip the DROP statements.
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='batch_id') THEN
--     ALTER TABLE employees ALTER COLUMN batch_id TYPE INTEGER USING batch_id::integer;
--   END IF;
--   IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendances' AND column_name='scanned_batch_id') THEN
--     ALTER TABLE attendances ALTER COLUMN scanned_batch_id TYPE INTEGER USING scanned_batch_id::integer;
--   END IF;
-- END $$;

-- Clean existing objects for repeatable runs (drops data)
DROP TABLE IF EXISTS attendances CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS vans CASCADE;
DROP TABLE IF EXISTS buses CASCADE;
DROP TYPE IF EXISTS attendance_shift;

-- ------------------------------------------------------------
-- Enum: attendance_shift
-- ------------------------------------------------------------
CREATE TYPE attendance_shift AS ENUM ('morning', 'night', 'unknown');

-- ------------------------------------------------------------
-- Table: buses
-- ------------------------------------------------------------
CREATE TABLE buses (
    bus_id       VARCHAR(10) PRIMARY KEY,
    route        TEXT NOT NULL,
    plate_number VARCHAR(50),
    capacity     INTEGER DEFAULT 40 CHECK (capacity > 0),
    CHECK (char_length(bus_id) <= 4)
);

-- ------------------------------------------------------------
-- Table: vans
-- A bus can have multiple vans that ferry employees to the bus
-- ------------------------------------------------------------
CREATE TABLE vans (
    id           SERIAL PRIMARY KEY,
    van_code     VARCHAR(20) UNIQUE NOT NULL,
    bus_id       VARCHAR(10) NOT NULL REFERENCES buses(bus_id) ON DELETE CASCADE,
    plate_number VARCHAR(50),
    driver_name  VARCHAR(100),
    capacity     INTEGER,
    active       BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_vans_bus_id ON vans(bus_id);

-- ------------------------------------------------------------
-- Table: employees
-- ------------------------------------------------------------
CREATE TABLE employees (
    id        SERIAL PRIMARY KEY,
    batch_id  INTEGER UNIQUE NOT NULL CHECK (batch_id > 0),
    name      VARCHAR(100) NOT NULL,
    bus_id    VARCHAR(10) NOT NULL REFERENCES buses(bus_id) ON DELETE RESTRICT,
    van_id    INTEGER REFERENCES vans(id),
    active    BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_employees_bus_id ON employees(bus_id);
CREATE INDEX idx_employees_van_id ON employees(van_id);

-- ------------------------------------------------------------
-- Table: attendances
-- One row per scan; shift derived from Kuala Lumpur local time
-- ------------------------------------------------------------
CREATE TABLE attendances (
    id               BIGSERIAL PRIMARY KEY,
    scanned_batch_id INTEGER NOT NULL CHECK (scanned_batch_id > 0),
    employee_id      INTEGER REFERENCES employees(id),
    bus_id           VARCHAR(10) REFERENCES buses(bus_id),
    van_id           INTEGER REFERENCES vans(id),
    shift            attendance_shift NOT NULL DEFAULT 'unknown',
    status           VARCHAR(30) NOT NULL CHECK (status IN ('present', 'unknown_batch', 'unknown_shift')),
    scanned_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    scanned_on       DATE NOT NULL DEFAULT ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kuala_Lumpur')::date),
    source           VARCHAR(50)
);

CREATE UNIQUE INDEX uq_attendance_batch_date_shift
    ON attendances (scanned_batch_id, scanned_on, shift);
CREATE INDEX idx_attendances_bus_shift_date
    ON attendances (bus_id, shift, scanned_on);
CREATE INDEX idx_attendances_scanned_on
    ON attendances (scanned_on);

-- ------------------------------------------------------------
-- Seed data: initial buses, vans, and employees (safe to re-run)
-- ------------------------------------------------------------
INSERT INTO buses (bus_id, route, plate_number, capacity) VALUES
    ('A01', 'Route A (Inbound)', 'WPL 1234', 40),
    ('B02', 'Route B (Outbound)', 'WKL 5678', 45)
ON CONFLICT (bus_id) DO NOTHING;

INSERT INTO vans (van_code, bus_id, plate_number, driver_name, capacity) VALUES
    ('VAN_A1', 'A01', 'VAN 1001', 'Ali', 12),
    ('VAN_B1', 'B02', 'VAN 2001', 'Bala', 12)
ON CONFLICT (van_code) DO NOTHING;

INSERT INTO employees (batch_id, name, bus_id, van_id) VALUES
    (1001, 'Employee One', 'A01', (SELECT id FROM vans WHERE van_code='VAN_A1')),
    (1002, 'Employee Two', 'B02', (SELECT id FROM vans WHERE van_code='VAN_B1'))
ON CONFLICT (batch_id) DO NOTHING;
