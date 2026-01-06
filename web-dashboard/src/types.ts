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
  bus_id: string;
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
