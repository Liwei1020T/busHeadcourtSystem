# Bus Management Page

## Overview
The Bus Management page is deprecated. Bus records are now created/updated automatically from the uploaded employee master list.

## Current Behavior (Master List Driven)
- Bus IDs and routes are derived from the master list `Route` column (e.g. `Route-A13` -> `bus_id=A13`).
- Bus capacity defaults to 40 (unless configured elsewhere).

## Usage
Use the Uploads page to upload the employee master list; buses will be upserted automatically.

## Technical Details
- **Deprecated File**: `web-dashboard/src/pages/BusManagement.tsx`
- **Replacement UI**: `web-dashboard/src/pages/Uploads.tsx`
- **Backend**: `POST /api/bus/master-list/upload`
