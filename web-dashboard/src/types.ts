/**
 * TypeScript types for the Bus Dashboard application.
 */

export type HeadcountRow = {
  date: string;
  shift: string;
  bus_id: string;
  route?: string | null;
  present: number;
  unknown_batch: number;
  unknown_shift: number;
  total: number;
};

export type HeadcountResponse = {
  rows: HeadcountRow[];
};

export type AttendanceRecord = {
  scanned_at: string;
  batch_id: number;
  employee_name?: string | null;
  bus_id?: string | null;
  van_id?: number | null;
  shift: string;
  status: string;
  source?: string | null;
};

export type FilterParams = {
  date_from: string;
  date_to: string;
  shift: string;
  bus_id: string[];
  plant: string;
};

export type BusInfo = {
  bus_id: string;
  plate_number?: string | null;
  route?: string | null;
  capacity?: number | null;
};

export type BusInput = {
  bus_id: string;
  route: string;
  plate_number?: string | null;
  capacity?: number | null;
};

export type EmployeeInfo = {
  id: number;
  batch_id: number;
  name: string;
  bus_id: string;
  van_id?: number | null;
  active: boolean;
  date_joined?: string | null;
  sap_id?: string | null;
  wdid?: string | null;
  transport_contractor?: string | null;
  address1?: string | null;
  postcode?: string | null;
  city?: string | null;
  state?: string | null;
  contact_no?: string | null;
  pickup_point?: string | null;
  transport?: string | null;
  route?: string | null;
  building_id?: string | null;
  nationality?: string | null;
  status?: string | null;
  terminate?: string | null;
};

export type EmployeeInput = {
  batch_id: number;
  name: string;
  bus_id: string;
  van_id?: number | null;
  active: boolean;
};

export type VanInfo = {
  id: number;
  van_code: string;
  bus_id: string;
  plate_number?: string | null;
  driver_name?: string | null;
  capacity?: number | null;
  active: boolean;
};

export type VanInput = {
  van_code: string;
  bus_id: string;
  plate_number?: string | null;
  driver_name?: string | null;
  capacity?: number | null;
  active: boolean;
};

export type UploadRowError = {
  row_number: number;
  personid?: number | null;
  message: string;
};

export type MasterListUploadResponse = {
  processed_rows: number;
  selected_sheet?: string | null;
  header_row_number?: number | null;
  buses_upserted: number;
  vans_upserted: number;
  employees_upserted: number;
  unassigned_rows?: number;
  skipped_missing_personid?: number;
  skipped_missing_name?: number;
  row_errors: UploadRowError[];
};

export type AttendanceUploadResponse = {
  processed_rows: number;
  selected_sheet?: string | null;
  header_row_number?: number | null;
  attendance_inserted: number;
  duplicates_ignored: number;
  unknown_personids: number;
  skipped_no_timein?: number;
  skipped_missing_date?: number;
  row_errors: UploadRowError[];
};

export type OccupancyBusRow = {
  bus_id: string;
  route?: string | null;
  plant?: string | null;
  bus_capacity: number;
  van_count: number;
  van_capacity: number;
  total_capacity: number;
  bus_present: number;
  van_present: number;
  total_present: number;
  bus_roster: number;
  van_roster: number;
  total_roster: number;
};

export type OccupancyResponse = {
  rows: OccupancyBusRow[];
  total_van_count: number;
  total_bus_capacity: number;
  total_van_capacity: number;
  total_capacity: number;
  total_bus_present: number;
  total_van_present: number;
  total_present: number;
  total_bus_roster: number;
  total_van_roster: number;
  total_roster: number;
};

export type BusRosterEntry = {
  personid: number;
  name?: string | null;
  category: string;
  van_code?: string | null;
  pickup_point?: string | null;
  contractor?: string | null;
  plant?: string | null;
  present: boolean;
  scanned_at?: string | null;
};

export type BusDetailResponse = {
  bus_id: string;
  route?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  shift?: string | null;
  roster_total: number;
  roster_bus: number;
  roster_van: number;
  present_total: number;
  present_bus: number;
  present_van: number;
  absent_total: number;
  absent_bus: number;
  absent_van: number;
  attendance_rate_pct: number;
  employees: BusRosterEntry[];
};
