## ADDED Requirements
### Requirement: Headcount CSV Export
The system SHALL provide a CSV download for headcount aggregates that matches the filters and calculations of `GET /api/report/headcount`.

#### Scenario: Export filtered headcount
- **WHEN** an authenticated user requests a headcount export with date and optional shift/bus filters
- **THEN** the backend returns a CSV file with columns: date, shift, bus_id, route, present, unknown_batch, unknown_shift, total
- **AND** values respect Kuala Lumpur shift derivation and deduplication rules identical to the JSON response
- **AND** the dashboard presents a download control that applies the active filters and triggers the file download

### Requirement: Attendance CSV Export
The system SHALL provide a CSV download for attendance detail that matches the filters of `GET /api/report/attendance`.

#### Scenario: Export attendance by date
- **WHEN** an authenticated user requests an attendance export for a given date with optional shift/bus filters
- **THEN** the backend returns a CSV file with columns: scanned_at (ISO, KL), batch_id, employee_name, bus_id, van_id, shift, status, source
- **AND** duplicates remain suppressed per batch_id, scanned_on, and shift consistent with stored records
- **AND** the dashboard presents a download control that applies the active filters and triggers the file download
