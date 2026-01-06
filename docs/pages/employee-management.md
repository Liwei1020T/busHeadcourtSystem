# Employee Management Page

## Overview
The Employee Management page is designed for managing the database of employees who use the bus service. It links employees to specific buses or vans and tracks their active status.

## Key Features

### 1. Employee List
- Displays a comprehensive list of employees.
- **Search**: Filter by Name or Batch ID.
- **Filters**:
    - **Bus**: Filter employees assigned to a specific bus.
    - **Status**: Filter by Active, Inactive, or All.

### 2. Employee Form
Provides a form to add or update employee details:
- **Batch ID**: Unique employee identifier (Required).
- **Name**: Full name of the employee.
- **Bus Assignment**: Dropdown to assign the employee to a specific bus.
- **Van Assignment**: Dropdown to assign the employee to a specific van (filtered by the selected bus).
- **Active Status**: Toggle to mark the employee as active or inactive.

### 3. Statistics
- Displays the count of currently active employees.

## Usage
1.  **Search/Filter**: Use the search bar or dropdowns to find specific employees.
2.  **Edit**: Select an employee from the list to edit their details.
3.  **Assign Transport**: Use the Bus and Van dropdowns to update transport assignments.
4.  **Deactivate**: Uncheck the "Active" toggle for employees no longer using the service.

## Technical Details
- **File**: `src/pages/EmployeeManagement.tsx`
- **Data Source**: `fetchEmployees`, `fetchBuses`, `fetchVans`, `saveEmployee` APIs.
- **Logic**: Van dropdown options are dynamically filtered based on the selected Bus.
