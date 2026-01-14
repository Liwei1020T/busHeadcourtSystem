# Dashboard Redesign - Plant-Based Grouping

## Summary
Complete redesign of the bus dashboard to group by plant (P1, P2, BK) instead of individual routes, with employee filtering by day type and updated capacity.

## Changes Made

### 1. Database Schema Updates

#### employee_master table
- **Added**: `day_type VARCHAR(50)` column to track employee work schedule (offday, restday, etc.)

#### buses table
- **Changed**: Default capacity from 40 to 42 (`capacity INTEGER DEFAULT 42`)

**Migration**: Run `backend/migrate_add_daytype.sql` on existing databases

### 2. Backend Changes

#### `backend/app/models/employee_master.py`
- Added `day_type` field to EmployeeMaster model

#### `backend/app/api/bus.py`
- Added parsing of `daytype` column from master list Excel uploads
- Added `day_type` to master_base dictionary
- Updates both personid and non-personid rows with day_type value

#### `backend/app/schemas/report.py`
- Added `building_id` field to `OccupancyBusRow` schema

#### `backend/app/api/report.py`
- **Employee Filtering**: Added join with EmployeeMaster in both attendance and roster queries
- **Day Type Filter**: Excludes employees where `day_type IN ('offday', 'restday', 'off day', 'rest day')`
- **Plant Assignment**: Added query to determine building_id (plant) for each bus based on employee_master data
- **Building ID**: Added building_id to OccupancyBusRow response

### 3. Frontend Changes

#### `web-dashboard/src/types.ts`
- Added `building_id?: string | null` to `OccupancyBusRow` type

#### `web-dashboard/src/pages/BusDashboard.tsx`
- **Complete Redesign**: Removed mode toggle and analytics view
- **Plant Grouping**: Groups buses by building_id (P1, P2, BK, Unknown)
- **Plant Cards**: Each plant displays as a separate card with:
  - Plant header with icon and bus count
  - Plant-level KPIs (Present, Utilization, Attendance)
  - Detailed bus table showing all buses for that plant
- **Exclusions**: OWN and UNKN buses are filtered out
- **Bus Table**: Clean table layout with:
  - Bus ID, Route, Capacity, Present, Roster, Utilization, Attendance columns
  - Color-coded metrics (green/amber/red based on thresholds)
  - Click to open bus detail drawer

### 4. Data Flow

```
Master List Upload (Excel)
  ↓ includes daytype column
EmployeeMaster table
  ↓ day_type field
Attendance Query (filters out offday/restday)
  ↓
Occupancy API (groups by bus, adds building_id)
  ↓
Frontend (groups by plant for display)
  ↓
Plant-Based Dashboard View
```

## Key Features

### Employee Filtering
- Automatically excludes employees with `day_type` = 'offday' or 'restday'
- Applies to both attendance counts and roster counts
- Case-insensitive matching (handles "off day", "rest day" variations)

### Plant Grouping
- Building ID is determined by the most common building_id among active employees for each bus
- Plants are sorted alphabetically (P1, P2, BK)
- Each plant shows aggregate metrics and individual bus details

### Capacity Update
- All new buses default to capacity 42
- Existing buses retain their current capacity unless updated
- Master list uploads can still override with specific capacity values

## Testing Checklist

- [ ] Run migration script on database
- [ ] Upload master list with daytype column
- [ ] Verify daytype values are saved to employee_master
- [ ] Verify offday/restday employees are excluded from counts
- [ ] Verify buses are grouped by plant (P1, P2, BK)
- [ ] Verify capacity shows 42 for new buses
- [ ] Verify utilization calculations are correct
- [ ] Verify bus detail drawer still works
- [ ] Test with different date ranges
- [ ] Test with shift filters

## Migration Steps

1. **Database**:
   ```bash
   psql -U your_user -d your_db -f backend/migrate_add_daytype.sql
   ```

2. **Backend**: Restart backend server to pick up model changes

3. **Frontend**: Rebuild frontend
   ```bash
   cd web-dashboard
   npm run build
   ```

4. **Master List**: Update Excel template to include "DayType" column

## UI/UX Improvements

- Clean, modern plant-based layout
- Color-coded metrics for quick visual assessment
- Collapsible plant sections for better organization
- Responsive design for mobile/tablet/desktop
- Sticky filters bar for easy access
- Real-time updates with last updated timestamp

## Notes

- OWN and UNKN buses are excluded from plant view
- Building ID is auto-detected from employee_master
- If a bus has no employees, it won't appear in any plant group
- Day type filtering is case-insensitive and handles variations
