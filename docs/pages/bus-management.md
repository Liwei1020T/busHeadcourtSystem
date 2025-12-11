# Bus Management Page

## Overview
The Bus Management page allows administrators to manage the fleet of buses in the system. It provides functionality to view, search, create, and update bus records.

## Key Features

### 1. Bus List
- Displays a list of all registered buses.
- **Search**: Allows searching by Bus ID, Route, or Plate Number.
- **Selection**: Clicking a bus in the list populates the form for editing.

### 2. Bus Form
Allows creating new buses or editing existing ones with the following fields:
- **Bus ID**: Unique identifier for the bus (Required).
- **Route**: The route assigned to the bus (Required).
- **Plate Number**: License plate of the bus.
- **Capacity**: Maximum passenger capacity (Default: 40).

### 3. Actions
- **New**: Clears the form to register a new bus.
- **Save**: Persists the bus data to the backend.

## Usage
1.  **View**: Browse the list of buses on the left/main panel.
2.  **Search**: Type in the search box to find a specific bus.
3.  **Edit**: Click on a bus card/row to load its details into the form. Modify and click "Save".
4.  **Create**: Click the "New" button, fill in the details, and click "Save".

## Technical Details
- **File**: `src/pages/BusManagement.tsx`
- **Data Source**: `fetchBuses`, `saveBus` APIs.
- **Validation**: Checks for required Bus ID and Route before saving.
