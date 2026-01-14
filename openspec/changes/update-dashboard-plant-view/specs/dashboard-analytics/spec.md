## MODIFIED Requirements
### Requirement: Occupancy Grouping
The dashboard SHALL group daily occupancy results by plant (P1, P2, BK) rather than route/zone.

#### Scenario: Mixed plant roster
- **WHEN** a bus roster contains Regular employees from multiple plants
- **THEN** the bus SHALL be grouped under "Mixed"

### Requirement: Capacity Calculation
The system SHALL treat every bus capacity as 42 and SHALL NOT add van capacity into total capacity.

#### Scenario: Van capacity excluded
- **WHEN** a bus has active vans assigned
- **THEN** total capacity for utilization calculations remains 42

## ADDED Requirements
### Requirement: DayType Exclusions
The system SHALL exclude employees whose DayType is Offday or Restday from roster, present, and absent calculations.

#### Scenario: Offday employee present
- **WHEN** an employee is marked Offday in the master list
- **THEN** they are excluded from roster and present counts for occupancy and bus detail

### Requirement: Plant Field in Occupancy
The occupancy response SHALL include a `plant` field per bus to enable plant filtering in the dashboard.

#### Scenario: Plant-filtered view
- **WHEN** a user filters by Plant (P1/P2/BK/Mixed)
- **THEN** only buses with matching plant labels are returned

