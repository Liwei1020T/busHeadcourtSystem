-- ============================================================
-- Bus Optimizer: PostgreSQL schema (master-list driven)
-- Usage:
--   psql -U <user> -h <host> -p <port> -f init_postgres.sql
--
-- NOTE: This script DROPS tables for a clean re-init.
-- ============================================================

BEGIN;

SET TIME ZONE 'Asia/Kuala_Lumpur';

-- ------------------------------------------------------------
-- Clean existing objects for repeatable runs (drops data)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS unknown_attendances CASCADE;
DROP TABLE IF EXISTS attendances CASCADE;
DROP TABLE IF EXISTS employee_master CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS vans CASCADE;
DROP TABLE IF EXISTS buses CASCADE;
DROP TYPE IF EXISTS unknown_attendance_shift;
DROP TYPE IF EXISTS attendance_shift;

-- ------------------------------------------------------------
-- Enum: attendance_shift
-- ------------------------------------------------------------
CREATE TYPE attendance_shift AS ENUM ('morning', 'night', 'unknown');

-- ------------------------------------------------------------
-- Table: buses
-- - bus_id is a short code (<= 4), derived from master list Route (e.g. Route-A13 -> A13)
-- - OWN is reserved for "Own Transport" rows (no capacity)
-- ------------------------------------------------------------
CREATE TABLE buses (
    bus_id       VARCHAR(10) PRIMARY KEY,
    route        TEXT NOT NULL,
    plate_number VARCHAR(50),
    capacity     INTEGER DEFAULT 40 CHECK (capacity IS NULL OR capacity > 0),
    CHECK (char_length(bus_id) <= 10)
);

-- ------------------------------------------------------------
-- Table: vans
-- - van_code is derived from master list Transport (e.g. B3C)
-- ------------------------------------------------------------
CREATE TABLE vans (
    id           SERIAL PRIMARY KEY,
    van_code     VARCHAR(20) UNIQUE NOT NULL,
    bus_id       VARCHAR(10) REFERENCES buses(bus_id) ON DELETE CASCADE,
    plate_number VARCHAR(50),
    driver_name  VARCHAR(100),
    capacity     INTEGER DEFAULT 12 CHECK (capacity IS NULL OR capacity > 0),
    active       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_vans_bus_id ON vans(bus_id);
CREATE INDEX idx_vans_active_bus_id ON vans(active, bus_id);

-- ------------------------------------------------------------
-- Table: employees
-- - batch_id is the scan identifier and equals master list PersonId
-- ------------------------------------------------------------
CREATE TABLE employees (
    id        SERIAL PRIMARY KEY,
    batch_id  BIGINT UNIQUE NOT NULL CHECK (batch_id > 0),
    name      VARCHAR(100) NOT NULL,
    bus_id    VARCHAR(10) REFERENCES buses(bus_id) ON DELETE RESTRICT,
    van_id    INTEGER REFERENCES vans(id),
    active    BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_employees_bus_id ON employees(bus_id);
CREATE INDEX idx_employees_van_id ON employees(van_id);
CREATE INDEX idx_employees_active_bus_id ON employees(active, bus_id);

-- ------------------------------------------------------------
-- Table: employee_master
-- Stores raw master-list fields for audit and reporting.
-- This table is updated by the master list upload endpoint.
-- ------------------------------------------------------------
CREATE TABLE employee_master (
    id                    BIGSERIAL PRIMARY KEY,
    personid              BIGINT,
    row_hash              TEXT,
    date_joined           DATE,
    name                  VDARCHAR(100),
    sap_id                VARCHAR(50),
    status                VARCHAR(30),
    wdid                  VARCHAR(50),
    transport_contractor  VARCHAR(100),
    address1              TEXT,
    postcode              VARCHAR(20),
    city                  VARCHAR(100),
    state                 VARCHAR(100),
    contact_no            VARCHAR(50),
    pickup_point          TEXT,
    transport             VARCHAR(50),
    route                 VARCHAR(100),
    building_id           VARCHAR(50),
    nationality           VARCHAR(50),
    terminate             DATE,
    CHECK ((personid IS NULL) OR (personid > 0)),
    CHECK (
        (personid IS NOT NULL AND row_hash IS NULL)
        OR
        (personid IS NULL AND row_hash IS NOT NULL)
    )
);

CREATE UNIQUE INDEX uq_employee_master_personid ON employee_master(personid) WHERE personid IS NOT NULL;
CREATE INDEX idx_employee_master_transport ON employee_master(transport);
CREATE INDEX idx_employee_master_route ON employee_master(route);
CREATE INDEX idx_employee_master_contractor ON employee_master(transport_contractor);

-- ------------------------------------------------------------
-- Table: attendances
-- One row per (person, date, shift), deduplicated by a unique index.
-- ------------------------------------------------------------
CREATE TABLE attendances (
    id               BIGSERIAL PRIMARY KEY,
    scanned_batch_id BIGINT NOT NULL CHECK (scanned_batch_id > 0),
    employee_id      INTEGER REFERENCES employees(id),
    bus_id           VARCHAR(10) REFERENCES buses(bus_id),
    van_id           INTEGER REFERENCES vans(id),
    shift            attendance_shift NOT NULL DEFAULT 'unknown',
    status           VARCHAR(30) NOT NULL CHECK (status IN ('present', 'unknown_shift', 'offday', 'absent')),
    scanned_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    scanned_on       DATE NOT NULL DEFAULT ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kuala_Lumpur')::date),
    source           VARCHAR(50)
);

CREATE UNIQUE INDEX uq_attendance_batch_date_shift ON attendances (scanned_batch_id, scanned_on, shift);
CREATE INDEX idx_attendances_bus_shift_date ON attendances (bus_id, shift, scanned_on);
CREATE INDEX idx_attendances_scanned_on ON attendances (scanned_on);

-- ------------------------------------------------------------
-- Enum: unknown_attendance_shift (same values as attendance_shift)
-- ------------------------------------------------------------
CREATE TYPE unknown_attendance_shift AS ENUM ('morning', 'night', 'unknown');

-- ------------------------------------------------------------
-- Table: unknown_attendances
-- Tracks attendance records where PersonId is NOT found in master list.
-- This allows tracking routes that appear in attendance but not in master list.
-- ------------------------------------------------------------
CREATE TABLE unknown_attendances (
    id               BIGSERIAL PRIMARY KEY,
    scanned_batch_id BIGINT NOT NULL CHECK (scanned_batch_id > 0),
    route_raw        VARCHAR(200),
    bus_id           VARCHAR(10),
    shift            unknown_attendance_shift NOT NULL DEFAULT 'unknown',
    scanned_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    scanned_on       DATE NOT NULL DEFAULT ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kuala_Lumpur')::date),
    source           VARCHAR(50)
);

CREATE UNIQUE INDEX uq_unknown_attendance_batch_date_shift ON unknown_attendances (scanned_batch_id, scanned_on, shift);
CREATE INDEX idx_unknown_attendances_bus_id ON unknown_attendances (bus_id);
CREATE INDEX idx_unknown_attendances_scanned_on ON unknown_attendances (scanned_on);

-- ------------------------------------------------------------
-- Minimal seed (optional)
-- Keeps OWN bus available for "Own Transport" rows and UNKN for missing route rows.
-- ------------------------------------------------------------
INSERT INTO buses (bus_id, route, plate_number, capacity)
VALUES ('OWN', 'Own Transport', NULL, NULL)
ON CONFLICT (bus_id) DO NOTHING;

INSERT INTO buses (bus_id, route, plate_number, capacity)
VALUES ('UNKN', 'Unassigned', NULL, NULL)
ON CONFLICT (bus_id) DO NOTHING;

COMMIT;
