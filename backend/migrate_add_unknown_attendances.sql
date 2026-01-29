-- Migration: Add unknown_attendances table
-- Purpose: Track attendance records where PersonId is not found in master list
-- This allows tracking routes that appear in attendance but not in master list

-- Create enum type for unknown attendance shift (reuse existing values)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unknown_attendance_shift') THEN
        CREATE TYPE unknown_attendance_shift AS ENUM ('morning', 'night', 'unknown');
    END IF;
END$$;

-- Create unknown_attendances table
CREATE TABLE IF NOT EXISTS unknown_attendances (
    id BIGSERIAL PRIMARY KEY,
    scanned_batch_id BIGINT NOT NULL,
    route_raw VARCHAR(200),
    bus_id VARCHAR(10),
    shift unknown_attendance_shift NOT NULL DEFAULT 'unknown',
    scanned_at TIMESTAMPTZ NOT NULL,
    scanned_on DATE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kuala_Lumpur')::date,
    source VARCHAR(50)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_unknown_attendances_scanned_batch_id ON unknown_attendances(scanned_batch_id);
CREATE INDEX IF NOT EXISTS idx_unknown_attendances_bus_id ON unknown_attendances(bus_id);
CREATE INDEX IF NOT EXISTS idx_unknown_attendances_shift ON unknown_attendances(shift);
CREATE INDEX IF NOT EXISTS idx_unknown_attendances_scanned_on ON unknown_attendances(scanned_on);

-- Unique constraint to prevent duplicate entries
ALTER TABLE unknown_attendances
    DROP CONSTRAINT IF EXISTS uq_unknown_attendance_batch_date_shift;
ALTER TABLE unknown_attendances
    ADD CONSTRAINT uq_unknown_attendance_batch_date_shift
    UNIQUE (scanned_batch_id, scanned_on, shift);

-- Verification
SELECT 'unknown_attendances table created successfully' as status;
