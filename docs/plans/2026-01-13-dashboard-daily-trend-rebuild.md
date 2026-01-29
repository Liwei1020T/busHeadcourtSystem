# Daily‑First Dashboard Rebuild Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the dashboard daily‑first: per‑day bus occupancy (bus vs van), trend charts, and per‑bus “who rode” drilldown.

**Architecture:** Keep backend reporting endpoints, extend occupancy response with `van_count`. Frontend uses a single “Selected Day” for the occupancy table and bus drawer, and a “Trend Range” for charts computed from headcount aggregates.

**Tech Stack:** FastAPI + SQLAlchemy, React + TypeScript + Tailwind + Recharts + Radix Dialog.

---

### Task 1: Backend — add `van_count` to occupancy

**Files:**
- Modify: `backend/app/api/report.py`
- Modify: `backend/app/schemas/report.py`

**Step 1: Update schema**
- Add `van_count: int` to `OccupancyBusRow`
- Add `total_van_count: int` to `OccupancyResponse`

**Step 2: Update query**
- In `/api/report/occupancy`, compute per‑bus active van count (group by `Van.bus_id`).
- Fill `row.van_count` and `total_van_count`.

**Step 3: Verify**
Run: `python3 -m compileall backend/app`
Expected: no errors.

---

### Task 2: Frontend — update types + API

**Files:**
- Modify: `web-dashboard/src/types.ts`
- Modify: `web-dashboard/src/api.ts` (if needed)

**Step 1: Types**
- Add `van_count` to `OccupancyBusRow`
- Add `total_van_count` to `OccupancyResponse`

**Step 2: Verify build**
Run: `npm --prefix web-dashboard run build`
Expected: passes.

---

### Task 3: Frontend — rebuild dashboard page (delete old layout)

**Files:**
- Replace: `web-dashboard/src/pages/BusDashboard.tsx`
- Create: `web-dashboard/src/pages/dashboard/DashboardToolbar.tsx`
- Create: `web-dashboard/src/pages/dashboard/DailyOccupancyTable.tsx`
- Create: `web-dashboard/src/pages/dashboard/TrendCharts.tsx`
- Create: `web-dashboard/src/pages/dashboard/BusDetailDrawer.tsx`

**Step 1: Toolbar**
- Controls:
  - Selected Day (date)
  - Trend Range (from/to + quick presets)
  - Bus ID (optional)
  - Route (substring)
- Actions: Refresh / Reset

**Step 2: Daily snapshot**
- Fetch occupancy for Selected Day only: `date_from=SelectedDay&date_to=SelectedDay`.
- Render table by bus with clear columns:
  - Bus, Route, Vans(#), Bus cap, Van cap, Total cap
  - Bus present, Van present, Total present
  - Absent, Attend%, Utilization%

**Step 3: Trend charts**
- Fetch headcount for Trend Range.
- Aggregate per day (sum across shifts) and compute:
  - Present per day
  - Unknown counts per day
  - Absent per day = roster_total − present (roster_total from occupancy snapshot for current filter)
  - Utilization% per day = present / capacity
- Render:
  - Line: Present vs Absent
  - Line: Utilization%

**Step 4: Drilldown “who rode”**
- Clicking a row opens a right‑side drawer.
- Call `/api/report/bus-detail` with Selected Day (date_from/to=SelectedDay).
- Show:
  - roster/present/absent bus+van
  - employee list filtered by present/absent (default: present)
  - export CSV

---

### Task 4: QA

Run:
- `npm --prefix web-dashboard run build`
- `npm --prefix web-dashboard run lint`
- `python3 -m compileall backend/app`

