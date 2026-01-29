## 1. Backend
- [ ] Add `van_count` to `/api/report/occupancy` rows and totals
- [ ] Update response schema types accordingly

## 2. Frontend
- [ ] Replace dashboard layout: daily snapshot + trend section + drilldown
- [ ] Add “Selected Day” control (drives occupancy + drilldown)
- [ ] Keep “Trend Range” controls (drives charts)
- [ ] Update occupancy table columns to include `van_count`
- [ ] Update bus detail drawer copy to emphasize “who rode” for selected day

## 3. QA
- [ ] `npm --prefix web-dashboard run build`
- [ ] `npm --prefix web-dashboard run lint`
- [ ] `python3 -m compileall backend/app`

