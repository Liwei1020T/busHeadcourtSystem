## Why
The current admin workflow requires manually maintaining buses and vans in the dashboard before employee assignments can be saved. Operations now have an authoritative employee master list and want to:
- upload it directly as the source of truth for employee↔transport assignments, and
- manually upload attendance from an Excel file when needed.

This also enables the dashboard to show capacity vs actual load per bus (including van breakdown) without manual vehicle management.

## What Changes
- Replace "Add/Edit Bus" and "Add/Edit Van" admin flows with a master list upload that upserts buses, vans, and employees in one operation (master list becomes the source of truth).
- Add a manual attendance upload endpoint that accepts an Excel file containing `PersonId` + attendance date and records attendance by matching against the master list.
- Update the dashboard to show, per bus:
  - bus passenger count and van passenger count (actual),
  - total seat capacity (bus + vans),
  - total actual passengers,
  - optional roster counts (assigned employees) to compare expected vs actual.

## Impact
- Affected specs: transport-masterdata, attendance-manual-upload, dashboard-occupancy
- Affected code:
  - Backend: `backend/app/api/bus.py`, `backend/app/api/report.py`, `backend/app/schemas/*`, `backend/requirements.txt`
  - Dashboard: `web-dashboard/src/api.ts`, `web-dashboard/src/types.ts`, `web-dashboard/src/pages/BusDashboard.tsx`, navigation/admin pages
  - Docs: `README.md` (upload format + usage)

## Open Questions (need confirmation before implementation)
## Confirmed Inputs
### Master List Columns
The employee master list Excel contains (headers are case-insensitive):
- `DateJoined`, `Name`, `PersonId`, `SAPId`, `Status`, `WDID`, `Transport Contractor`, `Address1`, `Postcode`, `City`, `State`, `ContactNo`, `PickupPoint`, `Transport`, `Route`, `BuildingId`, `Nationality`, `Terminate`

### Identity Naming
- `PersonId` is equivalent to the existing scan `batch_id`. External APIs/UI should standardize on the name `personid` while preserving backwards compatibility where needed.

### Attendance Upload Semantics
- The attendance Excel includes a date column.
- If `PersonId` does not match an employee in the master list, the row is recorded as `unknown_batch` (audit-friendly).

## Open Questions (need confirmation before implementation)
1. Master list transport mapping:
   - Confirmed mapping: `Route` (values like `Route-A13`) → `bus_id` (code extracted as `A13`), `Transport` → `van_code` (optional; if equal to bus_id then treated as bus-direct).
   - `Own Transport` / `(Own)` values map to `bus_id=OWN` with no van assignment.
2. Attendance upload columns:
   - What is the exact header name for the date column (e.g., `Date`, `AttendanceDate`, `ScannedOn`) and does it include time?
   - If time is not provided, should shift be provided at upload time or default to `unknown`?
3. Capacity source:
   - Are bus/van seat capacities included anywhere (in the master list or separate file), or should defaults be used (bus=40, van capacity empty)?
4. UI scope:
   - Remove the Bus/Vans admin pages entirely, or keep them as read-only lists?
