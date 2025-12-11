## Why
Operations need auditable exports for headcount and attendance so they can share data with stakeholders and run offline analyses; today the dashboard and APIs only return JSON.

## What Changes
- Add CSV export support for headcount and attendance reports, aligned with existing filters
- Expose dashboard download controls that call the new exports and preserve applied filters
- Keep timezone/dedup semantics identical to current reporting APIs

## Impact
- Affected specs: reporting-export
- Affected code: backend report endpoints and serialization, dashboard reporting UI/API client
