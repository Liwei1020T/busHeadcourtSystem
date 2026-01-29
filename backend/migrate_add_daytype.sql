-- Migration: Add day_type column to employee_master table
-- Run this script on existing databases to add the new day_type column

BEGIN;

-- Add day_type column to employee_master
ALTER TABLE employee_master ADD COLUMN IF NOT EXISTS day_type VARCHAR(50);

-- Update bus capacity default to 42
-- Note: This only affects new inserts, existing rows keep their current capacity
ALTER TABLE buses ALTER COLUMN capacity SET DEFAULT 42;

COMMIT;
