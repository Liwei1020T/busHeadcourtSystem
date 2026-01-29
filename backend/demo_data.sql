-- ============================================================
-- Bus System: Demo Data (Fictional Test Data)
-- This file provides FICTIONAL sample data for testing only
-- ALL NAMES, LOCATIONS, AND DETAILS ARE FICTIONAL
-- ============================================================

BEGIN;

SET TIME ZONE 'Asia/Kuala_Lumpur';

-- ------------------------------------------------------------
-- Demo Buses (Fictional Routes)
-- ------------------------------------------------------------
INSERT INTO buses (bus_id, route, plate_number, capacity) VALUES
('A01', 'Route A - North District → Factory', 'ABC 1234', 45),
('A02', 'Route A - South District → Factory', 'ABC 2345', 45),
('B01', 'Route B - East District → Factory', 'XYZ 3456', 40),
('B02', 'Route B - West District → Factory', 'XYZ 4567', 40),
('C01', 'Route C - Central Area → Factory', 'PQR 5678', 35),
('D01', 'Route D - Riverside → Factory', 'MNO 6789', 35),
('E01', 'Route E - Hillside → Factory', 'DEF 7890', 30)
ON CONFLICT (bus_id) DO UPDATE SET
    route = EXCLUDED.route,
    plate_number = EXCLUDED.plate_number,
    capacity = EXCLUDED.capacity;

-- ------------------------------------------------------------
-- Demo Vans (Fictional Details)
-- ------------------------------------------------------------
INSERT INTO vans (van_code, bus_id, plate_number, driver_name, capacity, active) VALUES
('A1A', 'A01', 'VAN 1111', 'Driver Alpha', 12, TRUE),
('A1B', 'A01', 'VAN 1112', 'Driver Beta', 12, TRUE),
('A1C', 'A01', 'VAN 1113', 'Driver Gamma', 12, TRUE),
('A2A', 'A02', 'VAN 2221', 'Driver Delta', 12, TRUE),
('A2B', 'A02', 'VAN 2222', 'Driver Epsilon', 12, TRUE),
('B1A', 'B01', 'VAN 3331', 'Driver Zeta', 12, TRUE),
('B1B', 'B01', 'VAN 3332', 'Driver Eta', 12, TRUE),
('B2A', 'B02', 'VAN 4441', 'Driver Theta', 12, TRUE),
('C1A', 'C01', 'VAN 5551', 'Driver Iota', 12, TRUE),
('C1B', 'C01', 'VAN 5552', 'Driver Kappa', 12, TRUE),
('D1A', 'D01', 'VAN 6661', 'Driver Lambda', 12, TRUE),
('E1A', 'E01', 'VAN 7771', 'Driver Mu', 12, TRUE)
ON CONFLICT (van_code) DO UPDATE SET
    bus_id = EXCLUDED.bus_id,
    plate_number = EXCLUDED.plate_number,
    driver_name = EXCLUDED.driver_name,
    capacity = EXCLUDED.capacity,
    active = EXCLUDED.active;

-- ------------------------------------------------------------
-- Demo Employees (Fictional Names)
-- Batch IDs start from 10001 for demo purposes
-- ALL NAMES ARE FICTIONAL - RANDOMLY GENERATED FOR TESTING
-- ------------------------------------------------------------
INSERT INTO employees (batch_id, name, bus_id, van_id, active) VALUES
-- Route A01 employees
(10001, 'Employee A001', 'A01', (SELECT id FROM vans WHERE van_code = 'A1A'), TRUE),
(10002, 'Employee A002', 'A01', (SELECT id FROM vans WHERE van_code = 'A1A'), TRUE),
(10003, 'Employee A003', 'A01', (SELECT id FROM vans WHERE van_code = 'A1A'), TRUE),
(10004, 'Employee A004', 'A01', (SELECT id FROM vans WHERE van_code = 'A1A'), TRUE),
(10005, 'Employee A005', 'A01', (SELECT id FROM vans WHERE van_code = 'A1B'), TRUE),
(10006, 'Employee A006', 'A01', (SELECT id FROM vans WHERE van_code = 'A1B'), TRUE),
(10007, 'Employee A007', 'A01', (SELECT id FROM vans WHERE van_code = 'A1B'), TRUE),
(10008, 'Employee A008', 'A01', (SELECT id FROM vans WHERE van_code = 'A1B'), TRUE),
(10009, 'Employee A009', 'A01', (SELECT id FROM vans WHERE van_code = 'A1C'), TRUE),
(10010, 'Employee A010', 'A01', (SELECT id FROM vans WHERE van_code = 'A1C'), TRUE),

-- Route A02 employees
(10011, 'Employee A011', 'A02', (SELECT id FROM vans WHERE van_code = 'A2A'), TRUE),
(10012, 'Employee A012', 'A02', (SELECT id FROM vans WHERE van_code = 'A2A'), TRUE),
(10013, 'Employee A013', 'A02', (SELECT id FROM vans WHERE van_code = 'A2A'), TRUE),
(10014, 'Employee A014', 'A02', (SELECT id FROM vans WHERE van_code = 'A2A'), TRUE),
(10015, 'Employee A015', 'A02', (SELECT id FROM vans WHERE van_code = 'A2B'), TRUE),
(10016, 'Employee A016', 'A02', (SELECT id FROM vans WHERE van_code = 'A2B'), TRUE),
(10017, 'Employee A017', 'A02', (SELECT id FROM vans WHERE van_code = 'A2B'), TRUE),
(10018, 'Employee A018', 'A02', (SELECT id FROM vans WHERE van_code = 'A2B'), TRUE),

-- Route B01 employees
(10019, 'Employee B001', 'B01', (SELECT id FROM vans WHERE van_code = 'B1A'), TRUE),
(10020, 'Employee B002', 'B01', (SELECT id FROM vans WHERE van_code = 'B1A'), TRUE),
(10021, 'Employee B003', 'B01', (SELECT id FROM vans WHERE van_code = 'B1A'), TRUE),
(10022, 'Employee B004', 'B01', (SELECT id FROM vans WHERE van_code = 'B1A'), TRUE),
(10023, 'Employee B005', 'B01', (SELECT id FROM vans WHERE van_code = 'B1B'), TRUE),
(10024, 'Employee B006', 'B01', (SELECT id FROM vans WHERE van_code = 'B1B'), TRUE),
(10025, 'Employee B007', 'B01', (SELECT id FROM vans WHERE van_code = 'B1B'), TRUE),

-- Route B02 employees
(10026, 'Employee B008', 'B02', (SELECT id FROM vans WHERE van_code = 'B2A'), TRUE),
(10027, 'Employee B009', 'B02', (SELECT id FROM vans WHERE van_code = 'B2A'), TRUE),
(10028, 'Employee B010', 'B02', (SELECT id FROM vans WHERE van_code = 'B2A'), TRUE),
(10029, 'Employee B011', 'B02', (SELECT id FROM vans WHERE van_code = 'B2A'), TRUE),

-- Route C01 employees
(10030, 'Employee C001', 'C01', (SELECT id FROM vans WHERE van_code = 'C1A'), TRUE),
(10031, 'Employee C002', 'C01', (SELECT id FROM vans WHERE van_code = 'C1A'), TRUE),
(10032, 'Employee C003', 'C01', (SELECT id FROM vans WHERE van_code = 'C1A'), TRUE),
(10033, 'Employee C004', 'C01', (SELECT id FROM vans WHERE van_code = 'C1A'), TRUE),
(10034, 'Employee C005', 'C01', (SELECT id FROM vans WHERE van_code = 'C1B'), TRUE),
(10035, 'Employee C006', 'C01', (SELECT id FROM vans WHERE van_code = 'C1B'), TRUE),

-- Route D01 employees
(10036, 'Employee D001', 'D01', (SELECT id FROM vans WHERE van_code = 'D1A'), TRUE),
(10037, 'Employee D002', 'D01', (SELECT id FROM vans WHERE van_code = 'D1A'), TRUE),
(10038, 'Employee D003', 'D01', (SELECT id FROM vans WHERE van_code = 'D1A'), TRUE),
(10039, 'Employee D004', 'D01', (SELECT id FROM vans WHERE van_code = 'D1A'), TRUE),

-- Route E01 employees
(10040, 'Employee E001', 'E01', (SELECT id FROM vans WHERE van_code = 'E1A'), TRUE),
(10041, 'Employee E002', 'E01', (SELECT id FROM vans WHERE van_code = 'E1A'), TRUE),
(10042, 'Employee E003', 'E01', (SELECT id FROM vans WHERE van_code = 'E1A'), TRUE),
(10043, 'Employee E004', 'E01', (SELECT id FROM vans WHERE van_code = 'E1A'), TRUE),

-- Own transport employees
(10044, 'Employee OWN01', 'OWN', NULL, TRUE),
(10045, 'Employee OWN02', 'OWN', NULL, TRUE),
(10046, 'Employee OWN03', 'OWN', NULL, TRUE),
(10047, 'Employee OWN04', 'OWN', NULL, TRUE),
(10048, 'Employee OWN05', 'OWN', NULL, TRUE)
ON CONFLICT (batch_id) DO UPDATE SET
    name = EXCLUDED.name,
    bus_id = EXCLUDED.bus_id,
    van_id = EXCLUDED.van_id,
    active = EXCLUDED.active;

-- ------------------------------------------------------------
-- Demo Attendance Records (Last 7 days)
-- Creating realistic attendance patterns with some variations
-- ------------------------------------------------------------

-- Helper function to generate dates for the last 7 days
DO $$
DECLARE
    date_record DATE;
    batch_record BIGINT;
    bus_record VARCHAR(10);
    van_record INTEGER;
    morning_time TIMESTAMPTZ;
    evening_time TIMESTAMPTZ;
BEGIN
    -- Loop through last 7 days
    FOR i IN 0..6 LOOP
        date_record := CURRENT_DATE - i;

        -- Morning shift attendances (85-95% attendance rate)
        FOR batch_record, bus_record, van_record IN
            SELECT batch_id, bus_id, van_id
            FROM employees
            WHERE active = TRUE
                AND bus_id != 'OWN'
                AND random() < 0.9  -- 90% attendance rate
        LOOP
            morning_time := date_record + TIME '06:30:00' + (random() * INTERVAL '90 minutes');

            INSERT INTO attendances (scanned_batch_id, employee_id, bus_id, van_id, shift, status, scanned_at, scanned_on, source)
            VALUES (
                batch_record,
                (SELECT id FROM employees WHERE batch_id = batch_record),
                bus_record,
                van_record,
                'morning',
                'present',
                morning_time,
                date_record,
                'demo_data'
            )
            ON CONFLICT (scanned_batch_id, scanned_on, shift) DO NOTHING;
        END LOOP;

        -- Evening shift attendances (80-90% attendance rate, slightly lower)
        FOR batch_record, bus_record, van_record IN
            SELECT batch_id, bus_id, van_id
            FROM employees
            WHERE active = TRUE
                AND bus_id != 'OWN'
                AND random() < 0.85  -- 85% attendance rate
        LOOP
            evening_time := date_record + TIME '18:00:00' + (random() * INTERVAL '120 minutes');

            INSERT INTO attendances (scanned_batch_id, employee_id, bus_id, van_id, shift, status, scanned_at, scanned_on, source)
            VALUES (
                batch_record,
                (SELECT id FROM employees WHERE batch_id = batch_record),
                bus_record,
                van_record,
                'night',
                'present',
                evening_time,
                date_record,
                'demo_data'
            )
            ON CONFLICT (scanned_batch_id, scanned_on, shift) DO NOTHING;
        END LOOP;

        -- Add some "Own Transport" attendances (random selection)
        FOR batch_record IN
            SELECT batch_id
            FROM employees
            WHERE bus_id = 'OWN'
                AND random() < 0.95  -- 95% attendance for own transport
        LOOP
            morning_time := date_record + TIME '07:00:00' + (random() * INTERVAL '60 minutes');

            INSERT INTO attendances (scanned_batch_id, employee_id, bus_id, van_id, shift, status, scanned_at, scanned_on, source)
            VALUES (
                batch_record,
                (SELECT id FROM employees WHERE batch_id = batch_record),
                'OWN',
                NULL,
                'morning',
                'present',
                morning_time,
                date_record,
                'demo_data'
            )
            ON CONFLICT (scanned_batch_id, scanned_on, shift) DO NOTHING;

            evening_time := date_record + TIME '18:30:00' + (random() * INTERVAL '90 minutes');

            INSERT INTO attendances (scanned_batch_id, employee_id, bus_id, van_id, shift, status, scanned_at, scanned_on, source)
            VALUES (
                batch_record,
                (SELECT id FROM employees WHERE batch_id = batch_record),
                'OWN',
                NULL,
                'night',
                'present',
                evening_time,
                date_record,
                'demo_data'
            )
            ON CONFLICT (scanned_batch_id, scanned_on, shift) DO NOTHING;
        END LOOP;

    END LOOP;
END $$;

COMMIT;

-- Display summary
SELECT
    'Buses' as entity,
    COUNT(*) as count
FROM buses
WHERE bus_id NOT IN ('OWN', 'UNKN')
UNION ALL
SELECT
    'Vans',
    COUNT(*)
FROM vans
UNION ALL
SELECT
    'Employees',
    COUNT(*)
FROM employees
UNION ALL
SELECT
    'Attendance Records',
    COUNT(*)
FROM attendances;

SELECT
    bus_id,
    COUNT(*) as employees_count,
    SUM(CASE WHEN van_id IS NULL THEN 0 ELSE 1 END) as with_van
FROM employees
WHERE active = TRUE
GROUP BY bus_id
ORDER BY bus_id;
