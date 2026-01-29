-- Migration: Allow NULL bus_id in employees table
-- Run this script on existing databases to allow employees without bus assignments
-- This change enables uploading all employees regardless of whether they have a valid bus code

BEGIN;

-- Allow bus_id to be NULL in employees table
ALTER TABLE employees ALTER COLUMN bus_id DROP NOT NULL;

-- Also allow bus_id to be NULL in vans table (in case vans are not assigned to a bus)
ALTER TABLE vans ALTER COLUMN bus_id DROP NOT NULL;

COMMIT;
