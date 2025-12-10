/**
 * TypeScript types for the Bus Dashboard application.
 */

export type TripSummary = {
  trip_date: string;
  trip_code: string;
  bus_id: string;
  route_name: string;
  direction: "to_factory" | "from_factory" | string;
  passenger_count: number | null;
  capacity: number | null;
  load_factor: number | null; // 0-1
};

export type SummaryResponse = {
  total_passengers: number | null;
  avg_load_factor: number | null;
  trip_count: number | null;
  saving_estimate: number | null;
  trips: TripSummary[];
};

export type ScanRecord = {
  scan_time: string;
  employee_id: string;
  bus_id: string;
  trip_code: string;
  direction: "to_factory" | "from_factory" | string;
};

export type FilterParams = {
  date_from: string;
  date_to: string;
  route: string;
  direction: string;
  bus_id: string;
  trip_code: string;
  load_factor_min: string;
  load_factor_max: string;
};
