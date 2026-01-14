# Plant-Grouped Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace route/zone grouping with plant grouping, exclude offday/restday employees, and fix bus capacity to 42 with a light analytics dashboard layout.

**Architecture:** Add DayType to master list records, filter reporting queries to exclude offday/restday, compute plant per bus from roster, and update the dashboard UI to a light analytics layout with plant-based grouping and filters.

**Tech Stack:** FastAPI + SQLAlchemy + PostgreSQL, React + TypeScript + Tailwind.

---

### Task 1: Add DayType storage for the master list

**Files:**
- Modify: `backend/init_postgres.sql`
- Modify: `backend/app/models/employee_master.py`
- Modify: `backend/app/api/bus.py`

**Step 1: Write failing test**

```python
import unittest

from app.api.report import normalize_day_type

class TestDayTypeNormalization(unittest.TestCase):
    def test_day_type_values(self):
        self.assertEqual(normalize_day_type("Offday"), "offday")
        self.assertEqual(normalize_day_type("Restday"), "restday")
        self.assertEqual(normalize_day_type("Regular"), "regular")
        self.assertEqual(normalize_day_type(None), "regular")

if __name__ == "__main__":
    unittest.main()
```

**Step 2: Run test to verify it fails**

Run: `backend/.venv/bin/python -m unittest backend/tests/test_plant_logic.py -v`
Expected: FAIL (normalize_day_type missing)

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

Update master list ingestion to read `daytype` and persist `employee_master.day_type`. Update schema default capacity to 42 for non-OWN/UNKN buses.

**Step 4: Run test to verify it passes**

Run: `backend/.venv/bin/python -m unittest backend/tests/test_plant_logic.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/init_postgres.sql backend/app/models/employee_master.py backend/app/api/bus.py backend/tests/test_plant_logic.py
git commit -m "feat: store day type for master list"
```

---

### Task 2: Update reporting for plant grouping + capacity 42

**Files:**
- Modify: `backend/app/api/report.py`
- Modify: `backend/app/schemas/report.py`

**Step 1: Write failing test**

```python
import unittest

from app.api.report import derive_bus_plant

class TestPlantGrouping(unittest.TestCase):
    def test_derive_bus_plant(self):
        self.assertEqual(derive_bus_plant(["P1"]), "P1")
        self.assertEqual(derive_bus_plant(["P1", "P2"]), "Mixed")
        self.assertEqual(derive_bus_plant([]), "Unassigned")

if __name__ == "__main__":
    unittest.main()
```

**Step 2: Run test to verify it fails**

Run: `backend/.venv/bin/python -m unittest backend/tests/test_plant_logic.py -v`
Expected: FAIL (derive_bus_plant missing)

**Step 3: Implement reporting changes**

```python
# backend/app/api/report.py

def derive_bus_plant(plants: list[str]) -> str:
    unique = sorted({p for p in plants if p})
    if not unique:
        return "Unassigned"
    if len(unique) > 1:
        return "Mixed"
    return unique[0]
```

- Filter roster/present to exclude offday/restday.
- Compute plant per bus from regular roster only and include in OccupancyBusRow.
- Set bus capacity to 42 and total capacity to 42 (do not add van capacity).

**Step 4: Run test to verify it passes**

Run: `backend/.venv/bin/python -m unittest backend/tests/test_plant_logic.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/api/report.py backend/app/schemas/report.py backend/tests/test_plant_logic.py
git commit -m "feat: plant grouping and day type filters"
```

---

### Task 3: Update shared types + API filters

**Files:**
- Modify: `web-dashboard/src/types.ts`
- Modify: `web-dashboard/src/api.ts`

**Step 1: Update types**

```ts
export type FilterParams = {
  date_from: string;
  date_to: string;
  shift: string;
  bus_id: string;
  plant: string;
};

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

**Step 2: Update API queries**

```ts
if (params.plant) searchParams.append('plant', params.plant);
```

**Step 3: Commit**

```bash
git add web-dashboard/src/types.ts web-dashboard/src/api.ts
git commit -m "feat: add plant filter to dashboard types"
```

---

### Task 4: Rebuild dashboard UI to style B

**Files:**
- Modify: `web-dashboard/src/pages/BusDashboard.tsx`
- Modify: `web-dashboard/src/components/FiltersBar.tsx`
- Modify: `web-dashboard/src/components/OccupancyTable.tsx`
- Modify: `web-dashboard/src/components/BusDetailDrawer.tsx`

**Step 1: Update FiltersBar**
- Remove route input.
- Add plant select (P1/P2/BK/Mixed/Unassigned).
- Use bus multi-select.

**Step 2: Update OccupancyTable**
- Group rows by plant with collapsible sections.
- Display bus capacity as 42 only.
- Utilization = total_present / 42.

**Step 3: Update BusDetailDrawer**
- Exclude offday/restday from roster.
- Keep list and search behavior consistent with new data.

**Step 4: Update BusDashboard**
- Use light analytics layout (style B).
- Show KPIs, trend charts, and plant-grouped table.

**Step 5: Commit**

```bash
git add web-dashboard/src/pages/BusDashboard.tsx web-dashboard/src/components/FiltersBar.tsx web-dashboard/src/components/OccupancyTable.tsx web-dashboard/src/components/BusDetailDrawer.tsx
git commit -m "feat: rebuild dashboard layout for plant view"
```

---

### Task 5: Verification

**Step 1: Lint**
Run: `npm --prefix web-dashboard run lint`
Expected: PASS

**Step 2: Manual sanity checks**
- Upload master list with DayType column and confirm offday/restday exclusion.
- Verify plant grouping (P1/P2/BK/Mixed/Unassigned) and 42 capacity.
- Confirm filters (date, shift, bus multi-select, plant) update results.

**Step 3: Commit**

```bash
git add docs/plans/2026-01-14-plant-dashboard-design.md docs/plans/2026-01-14-plant-dashboard-implementation.md openspec/changes/update-dashboard-plant-view

git commit -m "docs: add plant dashboard design and plan"
```

