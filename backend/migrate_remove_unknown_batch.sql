-- Migration: Remove unused status values from attendances constraint
-- First delete existing unknown_batch records, then update constraint

BEGIN;

-- Delete existing unknown_batch records (these are from unknown PersonIds)
DELETE FROM attendances WHERE status = 'unknown_batch';

-- Drop the old constraint
ALTER TABLE attendances DROP CONSTRAINT IF EXISTS attendances_status_check;

-- Add new constraint with only used status values
-- Removed: 'unknown_batch' (no longer used, employees must be known)
ALTER TABLE attendances ADD CONSTRAINT attendances_status_check
    CHECK (status IN ('present', 'unknown_shift', 'offday', 'absent'));

COMMIT;
