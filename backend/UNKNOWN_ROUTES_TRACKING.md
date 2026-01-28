# Unknown Routes Tracking

## Feature Overview

Tracks records that appear in attendance files but whose **bus_id is not in the buses table**.

## Core Logic

### What is an Unknown Bus?

**Criteria:**
1. PersonId appears in the attendance file
2. PersonId **is not in the master list** (no corresponding employee found)
3. The bus_id parsed from the attendance route **is not in the buses table**

**Not Unknown if:**
- PersonId is not in master list, but bus_id exists in the buses table
  - Example: A new employee on A14 not in master list, but A14 bus already created by other employees
  - In this case, attendance is counted towards the known A14 bus

### Data Flow Examples

**Scenario 1: True Unknown Bus (A25)**
```
Attendance: PersonId=75553, Route="Route-A25 P2"
  ↓
Master list lookup: PersonId 75553 → Not found ❌
  ↓
Parse route: "Route-A25 P2" → bus_id = "A25"
  ↓
Buses table lookup: bus_id="A25" → Not found ❌
  ↓
Save to unknown_attendances table
  ↓
Dashboard displays: Plant Unknown → A25 (present=1, roster=0)
```

**Scenario 2: Unknown Employee but Known Bus (A14)**
```
Attendance: PersonId=30204, Route="Route-A14 P1"
  ↓
Master list lookup: PersonId 30204 → Not found ❌
  ↓
Parse route: "Route-A14 P1" → bus_id = "A14"
  ↓
Buses table lookup: bus_id="A14" → Found ✓ (building_id=P1)
  ↓
Save to unknown_attendances table (record unknown employee)
  ↓
Dashboard displays: Plant P1 → A14 (present includes this unknown employee)
```

## Database Table Structure

```sql
CREATE TABLE unknown_attendances (
    id               BIGSERIAL PRIMARY KEY,
    scanned_batch_id BIGINT NOT NULL,        -- PersonId from attendance
    route_raw        VARCHAR(200),            -- Original route string
    bus_id           VARCHAR(10),             -- Normalized bus code
    shift            unknown_attendance_shift NOT NULL,
    scanned_at       TIMESTAMPTZ NOT NULL,
    scanned_on       DATE NOT NULL,
    source           VARCHAR(50),

    UNIQUE (scanned_batch_id, scanned_on, shift)
);
```

## API Endpoints

### Query Unknown Attendances
```bash
GET /api/report/unknown-attendances
  ?date_from=2026-01-20
  &date_to=2026-01-26
  &bus_id=B12A
  &shift=morning
  &limit=100
  &offset=0
```

Response:
```json
{
  "total_count": 26,
  "limit": 100,
  "offset": 0,
  "records": [
    {
      "id": 1,
      "scanned_batch_id": 123456,
      "route_raw": "Route-B12AA",
      "bus_id": "B12A",
      "shift": "morning",
      "scanned_on": "2026-01-26",
      "scanned_at": "2026-01-26T07:30:00+08:00",
      "source": "manual_upload"
    }
  ]
}
```

### Get Summary Statistics
```bash
GET /api/report/unknown-attendances/summary
  ?date_from=2026-01-20
  &date_to=2026-01-26
```

Response:
```json
{
  "total_records": 26,
  "unique_personids": 18,
  "unique_routes": 2,
  "top_routes": [
    {
      "bus_id": "B12A",
      "route_raw": "Route-B12AA",
      "count": 14
    },
    {
      "bus_id": "P8D0",
      "route_raw": "Route-P8D02 (DV)",
      "count": 12
    }
  ]
}
```

## Use Cases

### Scenario 1: Discover New Routes
1. Upload attendance file
2. See "Unknown PersonIds: 26 (26 saved for tracking)"
3. Check "Plant Unknown" group in dashboard
4. Discover two new routes: B12A and P8D0
5. Add employees for these routes to the master list

### Scenario 2: Audit Unknown Routes
1. Call `/api/report/unknown-attendances/summary`
2. View most common unknown routes
3. Decide whether to add to master list

### Scenario 3: Clean Historical Data
```sql
-- Delete unknown attendances for a date range
DELETE FROM unknown_attendances
WHERE scanned_on >= '2026-01-01'
  AND scanned_on <= '2026-01-31';
```

## Important Notes

1. **Roster = 0**: Unknown buses always have roster of 0 (not in master list)
2. **Attendance Rate = 0%**: Since roster = 0, attendance_rate is always 0%
3. **Utilization**: Calculated using default capacity = 40
4. **Deduplication**: Based on unique constraint (scanned_batch_id, scanned_on, shift)
5. **Plant Classification**: building_id = null automatically classified as "Unknown"

## Future Optimizations (Optional)

1. Add batch PersonId → Employee import functionality
2. Add "Review Unknown Routes" button in dashboard
3. Allow manual marking of unknown attendances as reviewed
4. Send notifications when new unknown routes are detected
