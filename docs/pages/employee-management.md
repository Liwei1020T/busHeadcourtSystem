# Employee Management Page

## Overview
The Employee Directory page is designed for auditing the employee master list data and checking transport assignments. The master list upload is the source of truth for employee records and transport routing.

## Key Features

### 1. Employee List
- Displays a comprehensive list of employees.
- **Search**: Filter by Name, PersonId, contractor, pickup point, route, or transport code.
- **Filters**:
    - **Bus**: Filter employees assigned to a specific bus.
    - **Contractor**: Filter employees by transport contractor.
    - **Status**: Filter by Active, Inactive, or All.

### 2. Employee Details
- Opens a details dialog showing fields from the master list (address, contact, contractor, pickup point, and employment info).

### 3. Statistics
- Displays the count of currently active employees.

## Usage
1. **Upload master list**: Use the Uploads page to upload the employee master list.
2. **Search/filter**: Use the search bar and dropdowns to locate employees and groups.
3. **Details**: Click "Details" on a row to view master list fields.
4. **Eligibility**: Use "Activate/Deactivate" to toggle whether an employee is eligible for attendance counting.

## Technical Details
- **File**: `web-dashboard/src/pages/EmployeeManagement.tsx`
- **Data Source**: `fetchEmployees`, `fetchBuses`, `saveEmployee` APIs.
- **Backend Enrichment**: `GET /api/bus/employees` joins `employees` with `employee_master` when available.
