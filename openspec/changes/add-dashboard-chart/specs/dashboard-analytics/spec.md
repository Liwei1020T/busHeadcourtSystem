## ADDED Requirements
### Requirement: Headcount Visualization
The Bus Dashboard SHALL present a visual chart that summarizes headcount totals by date and shift using the currently applied headcount filters.

#### Scenario: Show filtered headcount chart
- **WHEN** a user loads headcount results with date, shift, or bus filters
- **THEN** the dashboard displays a chart that aggregates totals per date by shift using the same dataset as the headcount table
- **AND** the chart updates when filters change and shows a clear empty state when no data is available
