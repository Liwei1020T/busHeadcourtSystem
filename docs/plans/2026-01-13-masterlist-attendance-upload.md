# Master List + Manual Attendance Upload Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace bus/van admin entry with master list uploads, add manual attendance uploads from Excel, and update the dashboard to show capacity vs actual occupancy per bus (including van breakdown).

**Architecture:** Keep the existing SQL tables (`buses`, `vans`, `employees`, `attendances`). Treat the master list upload as the source of truth that upserts these entities. Treat attendance uploads as additional `Attendance` rows with `source="manual_upload"`, reusing the existing dedupe uniqueness constraint.

**Tech Stack:** FastAPI + SQLAlchemy (backend), React + TypeScript + Vite + Tailwind (dashboard), `openpyxl` for `.xlsx` parsing.

## Assumptions to Confirm
- `PersonId` maps to the current scan `batch_id` (standardize external naming to `personid`).
- Attendance upload Excel includes a per-row date column; shift may be derived (if time exists) or provided at upload time (otherwise defaults to `unknown`).
- Bus and van identifiers come from the master list columns (needs final mapping confirmation; proposed `Route` → `bus_id`, `Transport` → `van_code`).

---

### Task 1: Baseline discovery + column contract

**Files:**
- Modify: `openspec/changes/update-masterlist-attendance-upload/proposal.md`
- Modify: `openspec/changes/update-masterlist-attendance-upload/tasks.md`

**Step 1: Collect 2 sample rows for each Excel**
- Master list: headers + 2 sample rows
- Attendance: headers + 2 sample rows

**Step 2: Lock an explicit header mapping**
- Define the accepted header aliases (case-insensitive), e.g. `personid|person_id|batch_id`.
- Define required vs optional columns.

**Step 3: Update proposal.md open questions to confirmed requirements**

---

### Task 2: Backend - master list upload endpoint

**Files:**
- Modify: `backend/app/api/bus.py`
- Modify: `backend/app/schemas/bus.py`
- Modify: `backend/requirements.txt`

**Step 1: Add a failing test (optional but recommended)**
- Create: `backend/tests/test_master_list_upload.py`
- Use FastAPI `TestClient` to upload a small `.xlsx` fixture and assert:
  - employees are upserted by `batch_id`,
  - buses/vans are created when missing,
  - employee bus/van assignments are applied.

**Step 2: Add Excel parsing helper**
- Use `openpyxl.load_workbook(file, read_only=True, data_only=True)`
- Normalize header names (`strip`, `lower`, replace spaces/underscores).

**Step 3: Implement `POST /api/bus/master-list/upload`**
- Multipart upload: `file: UploadFile`
- Behavior:
  - For each row, upsert `Bus` by `bus_id` (defaults: `route="Route {bus_id}"`, `capacity=40` unless provided)
  - Upsert `Van` by `van_code` if provided (defaults: `active=True`)
  - Upsert `Employee` by `batch_id` with `name`, `bus_id`, `van_id`, `active`
- Return a summary response: inserted/updated counts + row-level errors.

**Step 4: Manual test**
- Run backend and upload a sample master list via curl or the dashboard.

---

### Task 3: Backend - manual attendance upload endpoint

**Files:**
- Modify: `backend/app/api/bus.py`
- Modify: `backend/app/schemas/bus.py`

**Step 1: Add a failing test (optional but recommended)**
- Create: `backend/tests/test_attendance_upload.py`
- Assert:
  - present attendance is recorded for known employees,
  - unknown `personid` becomes `unknown_batch` (if chosen),
  - duplicates for same person/date/shift are ignored (unique constraint).

**Step 2: Implement `POST /api/bus/attendance/upload`**
- Multipart upload: `file: UploadFile`
- Query/body fields:
  - `date` (YYYY-MM-DD)
  - `shift` (morning/night/unknown)
- For each row, match employee by `batch_id` and insert `Attendance` with:
  - `status="present"` (or unknown status rules)
  - `bus_id`, `van_id`, `employee_id` from employee record
  - `source="manual_upload"`
- Use the existing dedupe uniqueness behavior.

---

### Task 4: Backend - occupancy report for dashboard

**Files:**
- Modify: `backend/app/api/report.py`
- Modify: `backend/app/schemas/report.py`

**Step 1: Add `GET /api/report/occupancy`**
- Input filters: `date_from/date_to` or `date`, plus optional `shift` and `bus_id`
- Output per bus:
  - `bus_capacity`, `van_capacity`, `total_capacity`
  - `bus_present`, `van_present`, `total_present`
  - optional `bus_roster`, `van_roster`, `total_roster`
- Include overall totals across returned buses.

**Step 2: Manual validation**
- Compare totals against `GET /api/report/headcount` for the same filters (present counts should match when summing).

---

### Task 5: Dashboard - uploads page and navigation update

**Files:**
- Modify: `web-dashboard/src/App.tsx`
- Modify: `web-dashboard/src/api.ts`
- Modify: `web-dashboard/src/types.ts`
- Create: `web-dashboard/src/pages/Uploads.tsx`

**Step 1: Add API functions**
- `uploadMasterList(file)`
- `uploadAttendance(file, date, shift)`

**Step 2: Replace Bus/Vans tabs**
- Remove bus/van management tabs from navigation.
- Add new "Uploads" tab.

**Step 3: Implement `Uploads.tsx`**
- Two cards:
  - Master list upload (shows summary counts + row errors)
  - Attendance upload (date + shift selectors + file upload)

---

### Task 6: Dashboard - occupancy display changes

**Files:**
- Modify: `web-dashboard/src/pages/BusDashboard.tsx`
- Modify: `web-dashboard/src/api.ts`
- Modify: `web-dashboard/src/types.ts`

**Step 1: Add `fetchOccupancy()`**
- Call `GET /api/report/occupancy` with active filters.

**Step 2: Show per-bus table**
- Columns: bus id, capacity (bus/van/total), actual (bus/van/total), utilization %

**Step 3: Update KPI cards**
- Show total capacity, total actual, utilization, and unknown batch/shift counts.

**Step 4: Frontend validation**
- Run: `npm run lint` and `npm run build` in `web-dashboard/`
