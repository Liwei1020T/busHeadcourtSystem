# Dashboard Rebuild (Practical, Data‑Dense) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the bus dashboard into a practical, standard operations dashboard with Route filtering, clearer KPIs, and drill‑down roster (present + absent).

**Architecture:** Keep existing backend report endpoints and data model; add a `route` filter to the report queries. On the frontend, refactor `BusDashboard` into smaller components (table + drawer) and extend `FilterParams` to include `route`.

**Tech Stack:** FastAPI + SQLAlchemy (backend), React + Vite + TypeScript + Tailwind + Radix UI (frontend).

---

### Task 1: Add `route` filter to report queries (backend)

**Files:**
- Modify: `backend/app/api/report.py`

**Step 1: Implement route param for headcount**
- Add `route: Optional[str] = Query(None, description="Filter by route (substring match)")` to:
  - `_query_headcount_rows`
  - `/headcount`
  - `/headcount/export`
- Apply filter: `query = query.filter(Bus.route.ilike(f"%{route}%"))` (only when `route` provided).

**Step 2: Implement route param for occupancy**
- Add `route` query param to `/occupancy`.
- When `route` provided:
  - Filter `bus_rows` query by `Bus.route.ilike(...)`
  - Filter `van_capacity_rows` by joining `Bus` and applying same route filter
  - Filter `attendance_query` by joining `Bus` (or filtering by bus_id set) and applying same route filter
  - Filter `roster_query` by joining `Bus` (or filtering by bus_id set) and applying same route filter

**Step 3: Quick local verification**
Run: `python3 -m compileall backend/app/api/report.py`
Expected: no syntax errors.

---

### Task 2: Extend dashboard filters to include `route` (frontend types + API)

**Files:**
- Modify: `web-dashboard/src/types.ts`
- Modify: `web-dashboard/src/api.ts`

**Step 1: Update types**
- Add `route: string` to `FilterParams`.

**Step 2: Update API callers**
- Update `fetchHeadcount`, `fetchOccupancy`, and `exportHeadcountCsv` to pass `route` when present.

**Step 3: Quick TS check**
Run: `npm --prefix web-dashboard run build`
Expected: TypeScript compilation succeeds.

---

### Task 3: Update FiltersBar (Route filter + shift labels)

**Files:**
- Modify: `web-dashboard/src/components/FiltersBar.tsx`

**Step 1: Shift label cleanup**
- Update shift labels to:
  - Morning
  - Night

**Step 2: Add Route filter control**
- Add an input (or combobox) labeled “Route”.
- Bind to `filters.route` and update `activeFilterCount` + badges to include it.

**Step 3: Build + quick UI smoke**
Run: `npm --prefix web-dashboard run dev`
Expected: Route appears under Filters and updates state.

---

### Task 4: Rebuild `BusDashboard` layout (data‑dense + drilldown)

**Files:**
- Modify: `web-dashboard/src/pages/BusDashboard.tsx`
- Create (optional): `web-dashboard/src/pages/dashboard/*` (split table + drawer components)

**Step 1: Define new layout**
- Top: page title + last updated timestamp (optional).
- Sticky Filters bar (existing component, updated).
- KPI strip (Roster / Present / Absent / Attendance% / Utilization).
- Main: Occupancy table with:
  - Search
  - “Problems only”
  - “Hide OWN/UNKN”
  - Click row → open drawer for roster details.

**Step 2: Ensure absent employees show**
- Bus detail drawer table must include employees with no present record in the period.

**Step 3: Export**
- Export bus roster (All/Present/Absent) as CSV.

---

### Task 5: Final verification

**Step 1: Lint & build**
Run:
- `npm --prefix web-dashboard run lint`
- `npm --prefix web-dashboard run build`

**Step 2: Backend import check**
Run: `python3 -m compileall backend/app`

