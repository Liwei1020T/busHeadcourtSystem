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
