# Van Management Page

## Overview
The Van Management page handles the administration of smaller transport vehicles (vans) that may operate in conjunction with or as alternatives to buses.

## Key Features

### 1. Van List
- Lists all registered vans.
- **Search**: Filter by Van Code, Plate Number, Driver Name, or Bus ID.
- **Bus Filter**: Filter vans associated with a specific bus.

### 2. Van Form
Interface for creating and editing van records:
- **Van Code**: Unique identifier for the van (Required).
- **Bus Association**: Links the van to a parent Bus ID (Required).
- **Plate Number**: License plate of the van.
- **Driver Name**: Name of the assigned driver.
- **Capacity**: Passenger capacity.
- **Active Status**: Toggle for van availability.

### 3. Statistics
- **Active Count**: Number of active vans.
- **Total Capacity**: Sum of capacity of all vans.

## Usage
1.  **Manage Fleet**: Add new vans or update driver/plate details for existing ones.
2.  **Link to Bus**: Ensure every van is correctly linked to a main Bus ID for route coordination.
3.  **Monitor Capacity**: Use the stats to gauge total available van capacity.

## Technical Details
- **File**: `src/pages/VanManagement.tsx`
- **Data Source**: `fetchVans`, `fetchBuses`, `saveVan` APIs.
- **Validation**: Requires Van Code and Bus ID.
