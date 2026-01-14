# Plant-Grouped Dashboard Design

## Goal
Deliver a light analytics dashboard (style B) focused on daily bus occupancy, trends, and drill-down roster detail. Group buses by plant (P1/P2/BK) instead of route/zone. Exclude employees with DayType Offday/Restday from all roster and attendance calculations.

## UX Layout (Style B)
- Light background, clean cards, soft borders, and compact typography.
- Top bar with date range, shift, bus multi-select, plant select, and Apply.
- KPI row with daily totals (Present, Absent, Utilization, Vans Active).
- Trend section with Present vs Absent line chart and Utilization line chart.
- Primary table grouped by Plant (P1, P2, BK, Mixed, Unassigned). Each group is collapsible.
- Bus rows show: Bus ID, Route (secondary), Bus Cap (fixed 42), Bus Present, Van Present, Total Present, Absent, Utilization (Total Present / 42), Van Count.
- Drill-down drawer lists employees on the bus with Present/Absent and details.

## Data Logic
- Add `day_type` to employee master list from DayType column (values: Offday, Restday, Regular). Store normalized lowercase; default to `regular` if missing or unknown.
- Exclude offday/restday from roster and present counts. Unknown batches remain counted.
- Plant grouping derived from regular roster only:
  - Single plant -> P1/P2/BK
  - Multiple plants -> Mixed
  - No plant -> Unassigned
- Bus capacity is always 42 for real buses (OWN/UNKN remain null). Van capacity is never added to total capacity.

## Backend Changes
- `employee_master` schema adds `day_type`.
- Master list upload stores DayType.
- Reporting endpoints filter out offday/restday and compute `plant` per bus.
- Occupancy response includes `plant` and uses 42 for capacity.

## Frontend Changes
- Replace route grouping with plant grouping.
- Update filters: remove route input, add plant select, keep bus multi-select.
- Update occupancy table and drill-down UI to use new fields and calculations.

