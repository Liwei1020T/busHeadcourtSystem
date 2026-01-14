# Master List Excel Template Requirements

## Required Columns

The following columns are **required** for the master list upload to work:

1. **PersonID** (required) - Unique employee identifier
2. **Name** (required) - Employee name
3. **Route** (required) - Bus route assignment (e.g., "Route-A13" → Bus A13)
4. **Transport** (required) - Transport type (e.g., "Bus", "Van", "Own Transport")

## Standard Columns

These columns are expected but not strictly required:

- **DateJoined** - Employee start date
- **SAPID** - SAP system ID
- **Status** - Employee status (Active, Inactive, Terminated, etc.)
- **WDID** - Workday ID
- **TransportContractor** - Name of transport contractor
- **Address1** - Employee address
- **Postcode** - Postal code
- **City** - City
- **State** - State
- **ContactNo** - Contact number
- **PickupPoint** - Bus pickup location
- **BuildingID** - Plant/building identifier (P1, P2, BK)
- **Nationality** - Employee nationality
- **Terminate** - Termination date

## New Column (After Migration)

- **DayType** - Work schedule type
  - Leave blank for regular working days
  - Set to "offday" or "restday" to exclude from bus capacity calculations
  - Examples: "offday", "restday", "off day", "rest day"

## Column Name Variations

The system is flexible with column names (case-insensitive, ignores spaces/underscores):
- "PersonID" = "personid" = "person_id" = "Person ID"
- "DateJoined" = "date joined" = "date_joined" = "DATEJOINED"

## Transport Field Logic

### Bus Assignment
- Route column value is parsed to extract bus ID
- Format: "Route-A13" → Bus "A13"
- Must be ≤ 4 alphanumeric characters

### Special Codes
- **OWN**: Assigned when Transport contains "own" (case-insensitive)
- **UNKN**: Assigned when route cannot be determined

### Van Assignment
- Transport column is checked for van patterns (e.g., "Van A", "V-123")
- Vans are linked to their associated bus route

## Status Logic

Employee is marked as **inactive** if:
- Terminate column has a date
- Status contains "inactive", "terminate", or "terminated"

Employee is marked as **active** if:
- Status is "active" or "current"
- No termination date
- Not explicitly marked inactive

## Example Data

```
PersonID | Name          | Route      | Transport  | BuildingID | DayType | Status
---------|---------------|------------|------------|------------|---------|--------
10001    | John Doe      | Route-A13  | Bus        | P1         |         | Active
10002    | Jane Smith    | Route-A13  | Van A      | P1         |         | Active
10003    | Bob Wilson    |            | Own        | P2         |         | Active
10004    | Alice Brown   | Route-B05  | Bus        | BK         | offday  | Active
10005    | Charlie Davis | Route-B05  | Bus        | BK         |         | Inactive
```

## Validation Rules

1. **PersonID** must be numeric and unique
2. **Route** should follow pattern "Route-XXX" where XXX is ≤ 4 chars
3. **BuildingID** should be one of: P1, P2, BK (or leave blank)
4. **DayType** should be blank or one of: offday, restday (case-insensitive)
5. **Status** determines active/inactive state
6. **Terminate** date marks employee as inactive

## Upload Process

1. System scans first 50 rows to find header row
2. Headers are normalized (lowercase, no spaces)
3. Required columns must be present
4. Data validation is performed per row
5. Buses are created/updated based on Route values
6. Vans are created/updated based on Transport values
7. Employees are linked to buses and vans
8. EmployeeMaster records are upserted with all fields including DayType

## Error Handling

The upload will report:
- Rows with missing PersonID (skipped)
- Rows with missing Name (skipped)
- Rows with invalid Route format
- Rows that couldn't be assigned to a bus
- Any processing errors with row numbers

## Best Practices

1. Keep PersonID numeric and consistent across uploads
2. Use standard route format: "Route-XXX"
3. Use consistent plant codes (P1, P2, BK)
4. Mark off-day employees explicitly in DayType column
5. Update Terminate date when employees leave
6. Keep Status field current (Active/Inactive)
7. Ensure Transport field clearly indicates bus vs van vs own
