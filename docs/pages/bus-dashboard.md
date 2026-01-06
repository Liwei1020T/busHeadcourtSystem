# Bus Dashboard Page

## Overview
The Bus Dashboard is the central hub for monitoring daily bus operations and passenger attendance. It provides a high-level view of the system's performance and allows for detailed drill-downs.

## Key Features

### 1. Filtering
Users can filter the displayed data using the following criteria:
- **Date Range**: `Date From` and `Date To` (Defaults to the last 7 days).
- **Shift**: Filter by specific work shifts.
- **Bus**: Filter by specific bus IDs.

### 2. Key Performance Indicators (KPIs)
The dashboard displays summary cards for quick insights:
- **Total Present**: The total number of employees scanned and accounted for.
- **Unknown Batch**: Number of scans where the employee Batch ID was not recognized.
- **Unknown Shift**: Number of scans where the shift could not be determined.
- **Row Count**: Total number of records currently displayed.

### 3. Data Visualization
- **Trip Table**: Shows a summary of trips based on the applied filters.
- **Scan Table**: (Likely available) Shows individual scan records.

## Usage
1.  **Navigate** to the Dashboard page.
2.  **Adjust Filters** in the top bar to narrow down the data.
3.  **Review KPIs** to check for anomalies (e.g., high "Unknown Batch" count).
4.  **Analyze Tables** for detailed operational data.

## Technical Details
- **File**: `src/pages/BusDashboard.tsx`
- **Data Source**: Fetches data via `fetchHeadcount` API.
- **State Management**: Uses local React state for filters and data.
