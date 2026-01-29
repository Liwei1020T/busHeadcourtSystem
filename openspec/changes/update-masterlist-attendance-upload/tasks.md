## 1. Implementation
- [ ] 1.1 Add backend dependencies for Excel parsing (`openpyxl`) and a small helper to normalize column headers.
- [ ] 1.2 Backend: implement `POST /api/bus/master-list/upload` (multipart) to upsert buses, vans, and employees from the master list.
- [ ] 1.3 Backend: implement `POST /api/bus/attendance/upload` (multipart) to ingest `PersonId` + date rows and record attendance (no-match -> `unknown_batch`).
- [ ] 1.4 Backend: add a dashboard report endpoint (e.g. `GET /api/report/occupancy`) that returns per-bus capacity + actual (bus vs van breakdown) and overall totals.
- [ ] 1.5 Dashboard: remove Bus/Vans "add/edit" flows and replace with a "Uploads" page (master list + attendance upload) with success/error summaries.
- [ ] 1.6 Dashboard: update the main dashboard view to display bus vs van load and capacity/actual totals using the new report endpoint.
- [ ] 1.7 Update docs: required Excel templates, column rules, and the upload workflow.

## 2. Validation
- [ ] 2.1 Manual check: upload a sample master list and confirm buses/vans/employees are created/updated as expected.
- [ ] 2.2 Manual check: upload an attendance file for a date/shift and confirm dedupe + unknown handling.
- [ ] 2.3 Manual check: dashboard occupancy numbers match attendance rows for the same date/shift.
- [ ] 2.4 Dashboard: run `npm run lint` and `npm run build` in `web-dashboard/`.
