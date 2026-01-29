-- Migration: Add 'offday' and 'absent' status to attendances table
-- Run this script on existing databases to allow offday and absent status values

BEGIN;

-- Drop the old constraint
ALTER TABLE attendances DROP CONSTRAINT IF EXISTS attendances_status_check;

-- Add new constraint with offday and absent status
ALTER TABLE attendances ADD CONSTRAINT attendances_status_check
    CHECK (status IN ('present', 'unknown_batch', 'unknown_shift', 'offday', 'absent'));

COMMIT;
