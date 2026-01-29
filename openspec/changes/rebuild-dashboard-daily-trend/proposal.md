## Why
Operations need the dashboard to answer three daily questions quickly:
1) For a given day, how many passengers did each bus carry (bus vs van breakdown)?
2) Over time, what is the trend of passengers / utilization?
3) For a specific bus on a specific day, which employees rode (present) and which assigned employees were absent?

The current dashboard is not organized around the daily snapshot and makes trend + drilldown harder than needed.

## What Changes
- Rebuild the Dashboard page to be **daily‑first**:
  - A single “Selected Day” drives the occupancy table and bus drilldowns.
  - A separate “Trend Range” drives charts (present, absent, utilization over time).
  - Filters: Selected Day, Trend Range, Bus ID (optional), Route (substring).
- Improve occupancy data:
  - Include **active van count** per bus in the occupancy response.
- Improve drilldown:
  - From the daily table, open a right‑side drawer showing:
    - roster totals (bus/van), present totals (bus/van), absent totals (bus/van)
    - employee list for that bus and day (present/absent)

## Impact
- Affected code:
  - Backend: `backend/app/api/report.py`, `backend/app/schemas/report.py`
  - Frontend: `web-dashboard/src/pages/BusDashboard.tsx`, `web-dashboard/src/types.ts`, `web-dashboard/src/api.ts`
- No database schema changes.

## Assumptions
- “Present” means: the employee has at least one `Attendance(status='present')` record on the selected day for that bus.
- “Absent” means: employee is on the bus roster (active) but not present on that day.

