-- Migration: Allow longer bus_id codes (up to 10 characters instead of 4)
-- This supports bus codes like BKA04, BKD5, etc.

BEGIN;

-- Drop the old constraint
ALTER TABLE buses DROP CONSTRAINT IF EXISTS buses_bus_id_check;

-- Add new constraint with 10 character limit
ALTER TABLE buses ADD CONSTRAINT buses_bus_id_check
    CHECK (char_length(bus_id) <= 10);

COMMIT;
