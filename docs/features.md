# Feature & Page Documentation

This document describes the current system features and the expected behavior of each backend endpoint and dashboard page. All times and shift derivations use Kuala Lumpur time.

## Features

### Entry Scanner Ingestion
- Purpose: Accept batch-ID scans from entry scanners (factory gate) and record attendance.
- Input: `POST /api/bus/upload-scans` with `X-API-KEY` and body:
  ```json
  {
    "scans": [
      {
        "id": 1,
        "batch_id": "BATCH-001",
        "scan_time": "2024-06-01T06:45:00+08:00",
        "card_uid": "optional-raw-id"
      }
    ]
  }
  ```
- Processing:
  - Auth via API key (label-based, not bus-specific).
  - Parse `scan_time`; if no tz, assume KL.
  - Derive shift: morning 04:00–10:00, night 16:00–21:00, else `unknown`.
  - Lookup employee by `batch_id`. Bus/van come from employee assignment.
  - Status: `present` if employee found and shift known; `unknown_batch` if employee missing; `unknown_shift` if shift outside windows.
  - Dedup: unique per (`batch_id`, `scanned_on`, `shift`); duplicates are ignored but IDs returned as success.
- Output: `{"success_ids": [1, ...]}`.
- Failure modes: invalid datetime (skipped), DB error (500), invalid/missing API key (401).

### Attendance & Headcount
- Data model: `attendances` store `scanned_batch_id`, `employee_id` (nullable), `bus_id`, `van_id`, `shift`, `status`, `scanned_at`, `scanned_on`.
- Shifts: morning 04:00–10:00, night 16:00–21:00, unknown otherwise.
- Status:
  - `present`: batch matched + shift known.
  - `unknown_batch`: batch not found (shift known).
  - `unknown_shift`: outside shift windows (even if batch matches).
- Deduplication: unique (`scanned_batch_id`, `scanned_on`, `shift`).

### Headcount Reporting
- Endpoint: `GET /api/report/headcount`
- Filters: `date` (YYYY-MM-DD), `shift` (morning/night), `bus_id` (optional).
- Returns aggregated rows per date+shift+bus with counts for `present`, `unknown_batch`, `unknown_shift`, `total`.
- Use cases: dashboard headcount cards/tables; export.

### Attendance Detail
- Endpoint: `GET /api/report/attendance`
- Filters: `date` (required), `shift` (optional), `bus_id` (optional).
- Returns per-scan detail: `scanned_at`, `batch_id`, `employee_name`, `bus_id`, `van_id`, `shift`, `status`, `source`.
- Use cases: drill-down from headcount, troubleshooting unknown batches/shifts.

### Admin Data Management
- Buses:
  - `GET /api/bus/buses`: list buses.
  - `POST /api/bus/buses`: upsert bus `{bus_id, route, plate_number?, capacity?}`.
- Vans:
  - `GET /api/bus/vans`: list vans and their bus assignment.
  - (Add/update via DB or future endpoint; bus assignment required, one-to-many.)
- Employees:
  - `GET /api/bus/employees`: list employees.
  - `POST /api/bus/employees`: upsert by `batch_id` `{batch_id, name, bus_id, van_id?, active?}`. Bus must exist; van (if provided) must belong to the bus.
- Purpose: keep authoritative bus/van assignments that are applied at scan time.

## Dashboard Pages (expected behavior)

### Dashboard / Headcount Overview
- Shows headcount per bus/shift/date with filters:
  - Date picker (defaults to today).
  - Shift selector (morning/night/all).
  - Bus filter (dropdown).
- Data source: `GET /api/report/headcount`.
- KPIs to surface:
  - Total present for filter.
  - Unknown batch count.
  - Unknown shift count.
- Table: rows per bus with counts; click-through opens Attendance Detail pre-filtered.

### Attendance Detail Page/Modal
- Filter controls: date (required), shift (optional), bus (optional).
- Data source: `GET /api/report/attendance`.
- Columns: scanned_at, batch_id, employee_name (or blank), bus_id, van_id, shift, status, source.
- Usage: investigate unknown batches/shifts; verify timing; export if needed.

### Admin – Buses
- Functions: list, create/update buses (id ≤4 chars, route text, plate, capacity).
- Data source: `GET /api/bus/buses`, `POST /api/bus/buses`.
- Validation: capacity > 0; bus_id length ≤4.

### Admin – Vans
- Functions: list vans and bus assignments.
- Data source: `GET /api/bus/vans`.
- Expected future: create/update vans (van_code unique, bus_id required).

### Admin – Employees
- Functions: list and create/update employees.
- Data source: `GET /api/bus/employees`, `POST /api/bus/employees`.
- Validation: bus must exist; van (if provided) must belong to the bus; batch_id unique.
- Purpose: sets bus/van assignment used at scan time.

## Operational Notes

- API keys: `API_KEYS` are label-based (e.g., `ENTRY_GATE:ENTRY_SECRET`); scanners send `X-API-KEY`.
- Time zone: all shift derivation uses `Asia/Kuala_Lumpur`; if `scan_time` lacks tzinfo, it is treated as KL local.
- Duplicate handling: replays of the same batch/date/shift are accepted but do not create new rows; IDs are returned as success.
- Unknown handling: unknown batches are recorded (`unknown_batch`); outside shift windows recorded as `unknown_shift`.

## Quick Examples

### Ingest Scan
```bash
curl -X POST http://localhost:8000/api/bus/upload-scans \
  -H "X-API-KEY: ENTRY_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"scans":[{"id":1,"batch_id":"BATCH-001","scan_time":"2024-06-01T06:45:00+08:00"}]}'
```

### Headcount
```bash
curl "http://localhost:8000/api/report/headcount?date=2024-06-01&shift=morning&bus_id=A01"
```

### Attendance Detail
```bash
curl "http://localhost:8000/api/report/attendance?date=2024-06-01&shift=morning&bus_id=A01"
```
