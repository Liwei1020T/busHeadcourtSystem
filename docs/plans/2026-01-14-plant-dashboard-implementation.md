# Plant Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace route/zone grouping with plant grouping, exclude offday/restday employees, support multi-bus filters, fix bus capacity at 42 (bus only), and rebuild the dashboard with the approved style B layout.

**Architecture:** Store DayType on employee master rows, filter roster/present by regular day type only, derive plant from regular roster building_id, parse multi-bus filters, and update the dashboard UI to a light analytics layout with plant-based grouping, clean filters, and a working 7-day quick range.

**Tech Stack:** FastAPI + SQLAlchemy + PostgreSQL, React + TypeScript + Tailwind.

---

### Task 0: Confirm approvals and frontend test exception

**Files:**
- Read: `openspec/changes/update-dashboard-plant-view/proposal.md`

**Step 1: Confirm proposal approval**

Check that the proposal is marked approved. If not approved, stop and request approval.

**Step 2: Confirm frontend test approach**

This plan uses manual verification for UI layout changes (no frontend test runner exists). Obtain explicit approval for this exception before proceeding with UI layout tasks.

---

### Task 1: Add DayType storage for the master list

**Files:**
- Modify: `backend/init_postgres.sql`
- Modify: `backend/app/models/employee_master.py`
- Modify: `backend/app/api/bus.py`
- Create: `backend/tests/test_day_type.py`

**Step 1: Write failing tests**

```python
import unittest

from app.api.report import normalize_day_type
from app.models.employee_master import EmployeeMaster

class TestDayTypeNormalization(unittest.TestCase):
    def test_normalize_day_type(self):
        self.assertEqual(normalize_day_type("Offday"), "offday")
        self.assertEqual(normalize_day_type("Restday"), "restday")
        self.assertEqual(normalize_day_type("Regular"), "regular")
        self.assertEqual(normalize_day_type(None), "regular")

    def test_employee_master_has_day_type(self):
        self.assertTrue(hasattr(EmployeeMaster, "day_type"))

if __name__ == "__main__":
    unittest.main()
```

**Step 2: Run test to verify it fails**

Run: `backend/.venv/bin/python -m unittest backend/tests/test_day_type.py -v`
Expected: FAIL (normalize_day_type missing or day_type missing)

**Step 3: Implement DayType support**

```python
# backend/app/api/report.py

def normalize_day_type(value: str | None) -> str:
    if not value:
        return "regular"
    text = str(value).strip().lower()
    if text in {"offday", "restday", "regular"}:
        return text
    return "regular"
```

- Add `day_type` column to `employee_master` model and SQL schema.
- Update master list ingestion to read the DayType column (case-insensitive) and store `normalize_day_type(...)`.
- Default to `regular` when missing.

**Step 4: Run test to verify it passes**

Run: `backend/.venv/bin/python -m unittest backend/tests/test_day_type.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/init_postgres.sql backend/app/models/employee_master.py backend/app/api/bus.py backend/app/api/report.py backend/tests/test_day_type.py
git commit -m "feat: store day type for master list"
```

---

### Task 2: Add report helpers for plant, capacity, and bus filters

**Files:**
- Modify: `backend/app/api/report.py`
- Create: `backend/tests/test_report_helpers.py`

**Step 1: Write failing tests**

```python
import unittest

from app.api.report import derive_bus_plant, bus_capacity_for, parse_bus_id_filter

class TestReportHelpers(unittest.TestCase):
    def test_derive_bus_plant(self):
        self.assertEqual(derive_bus_plant(["P1"]), "P1")
        self.assertEqual(derive_bus_plant(["P1", "P2"]), "Mixed")
        self.assertEqual(derive_bus_plant([]), "Unassigned")

    def test_bus_capacity_for(self):
        self.assertEqual(bus_capacity_for("OWN"), 0)
        self.assertEqual(bus_capacity_for("UNKN"), 0)
        self.assertEqual(bus_capacity_for("A01"), 42)

    def test_parse_bus_id_filter(self):
        self.assertEqual(parse_bus_id_filter(None), [])
        self.assertEqual(parse_bus_id_filter("A01"), ["A01"])
        self.assertEqual(parse_bus_id_filter("A01, A02"), ["A01", "A02"])

if __name__ == "__main__":
    unittest.main()
```

**Step 2: Run test to verify it fails**

Run: `backend/.venv/bin/python -m unittest backend/tests/test_report_helpers.py -v`
Expected: FAIL (helpers missing)

**Step 3: Implement helpers**

```python
# backend/app/api/report.py

def parse_bus_id_filter(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]

def bus_capacity_for(bus_id: str | None) -> int:
    if not bus_id:
        return 0
    if bus_id in {"OWN", "UNKN"}:
        return 0
    return 42

def derive_bus_plant(plants: list[str]) -> str:
    unique = sorted({p for p in plants if p})
    if not unique:
        return "Unassigned"
    if len(unique) > 1:
        return "Mixed"
    return unique[0]
```

**Step 4: Run test to verify it passes**

Run: `backend/.venv/bin/python -m unittest backend/tests/test_report_helpers.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/api/report.py backend/tests/test_report_helpers.py
git commit -m "feat: add plant, capacity, and bus filter helpers"
```

---

### Task 3: Update reporting queries and schema

**Files:**
- Modify: `backend/app/api/report.py`
- Modify: `backend/app/schemas/report.py`
- Create: `backend/tests/test_report_schema.py`

**Step 1: Write failing test**

```python
import unittest

from app.schemas.report import OccupancyBusRow

class TestReportSchema(unittest.TestCase):
    def test_occupancy_bus_row_has_plant(self):
        fields = getattr(OccupancyBusRow, "model_fields", getattr(OccupancyBusRow, "__fields__", {}))
        self.assertIn("plant", fields)

if __name__ == "__main__":
    unittest.main()
```

**Step 2: Run test to verify it fails**

Run: `backend/.venv/bin/python -m unittest backend/tests/test_report_schema.py -v`
Expected: FAIL (plant missing)

**Step 3: Implement report updates**

- Filter roster and present counts with `EmployeeMaster.day_type == "regular"`.
- Derive plant from regular roster building_id and return in occupancy rows.
- Set `bus_capacity` and `total_capacity` to `bus_capacity_for(bus_id)` (do not add van capacity).
- Parse `bus_id` query filter using `parse_bus_id_filter` and filter with `IN (...)`.
- Add `plant` to `OccupancyBusRow`.

**Step 4: Run test to verify it passes**

Run: `backend/.venv/bin/python -m unittest backend/tests/test_report_schema.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/api/report.py backend/app/schemas/report.py backend/tests/test_report_schema.py
git commit -m "feat: add plant to occupancy schema and reporting filters"
```

---

### Task 4: Add frontend type TDD for filters and occupancy rows

**Files:**
- Create: `web-dashboard/src/__tests__/filters.tdd.ts`

**Step 1: Write failing type test**

```ts
import type { FilterParams, OccupancyBusRow } from '../types';

type Assert<T extends true> = T;
type IsBusIdArray = FilterParams['bus_id'] extends string[] ? true : false;
type HasPlant = 'plant' extends keyof OccupancyBusRow ? true : false;

const _busIdIsArray: Assert<IsBusIdArray> = true;
const _occupancyHasPlant: Assert<HasPlant> = true;
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix web-dashboard run build`
Expected: FAIL (bus_id not string[] or plant missing)

---

### Task 5: Update dashboard types and API filters

**Files:**
- Modify: `web-dashboard/src/types.ts`
- Modify: `web-dashboard/src/api.ts`

**Step 1: Update types**

```ts
export type FilterParams = {
  date_from: string;
  date_to: string;
  shift: string;
  bus_id: string[];
  plant: string;
};
```

```ts
export type OccupancyBusRow = {
  bus_id: string;
  route?: string | null;
  plant?: string | null;
  bus_capacity: number;
  van_count: number;
  bus_present: number;
  van_present: number;
  total_present: number;
  total_roster: number;
};
```

**Step 2: Update API query**

```ts
params.bus_id.forEach((busId) => {
  if (busId) searchParams.append('bus_id', busId);
});
if (params.plant) searchParams.append('plant', params.plant);
```

**Step 3: Run test to verify it passes**

Run: `npm --prefix web-dashboard run build`
Expected: PASS (type test satisfied)

**Step 4: Commit**

```bash
git add web-dashboard/src/types.ts web-dashboard/src/api.ts web-dashboard/src/__tests__/filters.tdd.ts
git commit -m "feat: add plant filter and bus multi-select types"
```

---

### Task 6: Update FiltersBar (manual UI verification exception)

**Files:**
- Modify: `web-dashboard/src/components/FiltersBar.tsx`

**Step 1: Update FiltersBar**
- Remove route input.
- Add plant select (P1, P2, BK, Mixed, Unassigned).
- Implement bus multi-select and store as string[].
- Fix 7-day quick range (date_from = today minus 6 days, date_to = today).
- Show shift labels without times ("Morning", "Night").

**Step 2: Commit**

```bash
git add web-dashboard/src/components/FiltersBar.tsx
git commit -m "feat: update filters for plant and bus multi-select"
```

---

### Task 7: Update occupancy table and bus detail drawer

**Files:**
- Modify: `web-dashboard/src/components/OccupancyTable.tsx`
- Modify: `web-dashboard/src/components/BusDetailDrawer.tsx`

**Step 1: Update OccupancyTable**
- Group rows by plant with collapsible sections.
- Show bus capacity as 42 only.
- Utilization = total_present / 42 (bus only).
- Keep route as secondary label.

**Step 2: Update BusDetailDrawer**
- Use roster/present already filtered to regular day type.
- Ensure lists show absent employees.

**Step 3: Commit**

```bash
git add web-dashboard/src/components/OccupancyTable.tsx web-dashboard/src/components/BusDetailDrawer.tsx
git commit -m "feat: update occupancy and bus detail for plant view"
```

---

### Task 8: Rebuild BusDashboard layout (style B)

**Files:**
- Modify: `web-dashboard/src/pages/BusDashboard.tsx`

**Step 1: Rebuild layout**
- Light analytics style B layout.
- KPI cards for Present, Absent, Utilization, Vans Active.
- Trend chart for daily totals.
- Plant-grouped occupancy table below.

**Step 2: Commit**

```bash
git add web-dashboard/src/pages/BusDashboard.tsx
git commit -m "feat: rebuild plant dashboard layout"
```

---

### Task 9: Verification

**Step 1: Backend tests**
Run: `backend/.venv/bin/python -m unittest backend/tests/test_day_type.py backend/tests/test_report_helpers.py backend/tests/test_report_schema.py -v`
Expected: PASS

**Step 2: Frontend checks**
Run: `npm --prefix web-dashboard run lint`
Expected: PASS

Run: `npm --prefix web-dashboard run build`
Expected: PASS

**Step 3: Manual sanity checks**
- Upload master list with DayType column and confirm offday/restday exclusion.
- Verify plant grouping (P1/P2/BK/Mixed/Unassigned) and 42 capacity.
- Confirm filters (date, shift, bus multi-select, plant) update results.
- Confirm 7-day quick range works as expected.

**Step 4: UI consistency checks**
- No emoji icons.
- All icons from Lucide.

**Step 5: Commit docs**

```bash
git add docs/plans/2026-01-14-plant-dashboard-design.md docs/plans/2026-01-14-plant-dashboard-implementation.md openspec/changes/update-dashboard-plant-view

git commit -m "docs: update plant dashboard plan"
```
