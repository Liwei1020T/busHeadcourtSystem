## 1. Database + Master List
- [x] 1.1 Add `day_type` column to `employee_master` schema (`backend/init_postgres.sql`, `backend/app/models/employee_master.py`)
- [x] 1.2 Parse and store DayType during master list upload (`backend/app/api/bus.py`)

## 2. Reporting Logic
- [x] 2.1 Exclude offday/restday employees from roster/present calculations (`backend/app/api/report.py`)
- [x] 2.2 Compute Plant grouping (P1/P2/BK, Mixed, Unassigned) and return in occupancy response
- [x] 2.3 Fix bus capacity to 42 and remove van capacity from total capacity
- [x] 2.4 Update response schema to include `plant` (`backend/app/schemas/report.py`)

## 3. Dashboard UI
- [x] 3.1 Add plant filter and bus multi-select; remove route input (`web-dashboard/src/components/FiltersBar.tsx`, `web-dashboard/src/types.ts`)
- [x] 3.2 Update occupancy table to group by plant and show capacity 42 only (`web-dashboard/src/components/OccupancyTable.tsx`)
- [x] 3.3 Update bus detail drawer to match new roster logic (`web-dashboard/src/components/BusDetailDrawer.tsx`)
- [x] 3.4 Rebuild BusDashboard layout to style B and wire new filters/data (`web-dashboard/src/pages/BusDashboard.tsx`, `web-dashboard/src/api.ts`)

## 4. Verification
- [x] 4.1 Run `npm --prefix web-dashboard run lint`
- [ ] 4.2 Manually verify dashboard filters + plant grouping with sample data
