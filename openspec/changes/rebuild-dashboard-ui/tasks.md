## 1. Backend
- [ ] Add `route` query param to `/api/report/headcount` and `/api/report/headcount/export`
- [ ] Add `route` query param to `/api/report/occupancy`
- [ ] Add tests or a minimal query verification script (if tests exist)

## 2. Frontend (Dashboard)
- [ ] Extend `FilterParams` with `route`
- [ ] Update `api.ts` calls to pass `route`
- [ ] Update `FiltersBar` UI:
  - [ ] Add Route filter input
  - [ ] Update active-filter badges/count for Route
  - [ ] Shift labels: “Morning”, “Night” (no time ranges)
- [ ] Rebuild `BusDashboard` layout:
  - [ ] KPI strip focuses on roster/present/absent/utilization
  - [ ] Occupancy table is primary view with clearer actions
  - [ ] Bus detail uses a drawer layout and supports export

## 3. QA
- [ ] Run `web-dashboard` build/lint
- [ ] Smoke test dashboard filters + bus drilldown

