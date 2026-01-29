## Why
The current dashboard mixes multiple table types and “advanced” visuals in a way that makes day‑to‑day operations harder:
- It’s not obvious (at a glance) which routes are under‑utilized vs over‑capacity.
- Roster vs actual vs absent is not consistently surfaced in the main view.
- Filtering is missing a first‑class Route filter, and Shift labels are noisy.

Operations need a clean, “standard” (enterprise) dashboard layout that prioritizes:
- fast scanning of route performance,
- quick drill‑down into a route/bus to see present + absent employees,
- minimal clutter and consistent table behavior.

## What Changes
- Rebuild the Dashboard page UI as a data‑dense, drill‑down oriented layout:
  - Sticky filter toolbar (Date range, Shift, Bus ID, **Route filter**).
  - KPI strip that prioritizes Roster / Present / Absent / Attendance% / Utilization.
  - Occupancy table as the main artifact, with sortable columns and quick “Problems only / Hide OWN+UNKN” toggles.
  - Bus detail becomes a right‑side drawer with a roster table (All/Present/Absent) and export.
- Shift dropdown labels become “Morning” / “Night” (remove time ranges).
- Add Route filtering to reporting endpoints used by the dashboard (`headcount`, `headcount/export`, `occupancy`).

## Impact
- Affected code:
  - Frontend: `web-dashboard/src/pages/BusDashboard.tsx`, `web-dashboard/src/components/FiltersBar.tsx`, `web-dashboard/src/api.ts`, `web-dashboard/src/types.ts`
  - Backend: `backend/app/api/report.py`
- No breaking database changes.

## Open Questions (confirm)
1. Date range semantics: when selecting multiple days, should **Present** mean:
   - A) “present at least once in the range” (current behavior), or
   - B) “present on every day” (strict), or
   - C) show “days present / days in range”?
2. Route filter meaning: should it match `buses.route` (e.g. `Route-A03`) only, or also match bus_id (e.g. `A03`)?

