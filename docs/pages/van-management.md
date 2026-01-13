# Van Management Page

## Overview
The Van Management page is deprecated. Van records are now created/updated automatically from the uploaded employee master list.

## Current Behavior (Master List Driven)
- Van codes are derived from the master list `Transport` column (e.g. `B3C`).
- Vans are linked to buses based on the master list `Route` column (e.g. `Route-B3` -> `bus_id=B3`).
- "Own transport" rows do not create vans.
- Van capacity defaults to 12 (unless configured elsewhere).

## Usage
Use the Uploads page to upload the employee master list; vans will be upserted automatically.

## Technical Details
- **Deprecated File**: `web-dashboard/src/pages/VanManagement.tsx`
- **Replacement UI**: `web-dashboard/src/pages/Uploads.tsx`
- **Backend**: `POST /api/bus/master-list/upload`
