## Why
Operations need a plant-focused view of daily bus occupancy. The current route/zone grouping and capacity rules make it harder to assess P1/P2/BK allocation and to exclude offday/restday employees from utilization.

## What Changes
- Add DayType support to the master list ingestion and store it on employee master records.
- Exclude Offday/Restday employees from roster, present, and absent calculations in reporting.
- Group occupancy by Plant (P1/P2/BK), with Mixed/Unassigned fallbacks.
- Fix bus capacity to 42 and stop adding van capacity into total capacity.
- Update the dashboard layout to a light analytics style (image B) with plant grouping and clearer KPIs.

## Impact
- Database schema: `employee_master` gains `day_type`.
- Backend: `backend/app/api/bus.py`, `backend/app/api/report.py`, `backend/app/schemas/report.py`, `backend/init_postgres.sql`.
- Frontend: `web-dashboard/src/pages/BusDashboard.tsx`, `web-dashboard/src/components/FiltersBar.tsx`, `web-dashboard/src/components/OccupancyTable.tsx`, `web-dashboard/src/components/BusDetailDrawer.tsx`, `web-dashboard/src/types.ts`, `web-dashboard/src/api.ts`.

