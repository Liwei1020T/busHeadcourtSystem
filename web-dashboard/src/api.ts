/**
 * API service for communicating with the backend.
 */

import {
  HeadcountResponse,
  AttendanceRecord,
  FilterParams,
  FilterOptions,
  LegacyFilterParams,
  BusInfo,
  BusInput,
  EmployeeInfo,
  EmployeeInput,
  VanInfo,
  VanInput,
  MasterListUploadResponse,
  AttendanceUploadResponse,
  OccupancyResponse,
  BusDetailResponse,
  TrendAnalysisData,
  TrendDataPoint,
} from './types';
import { format, parseISO, differenceInDays, eachDayOfInterval, subDays } from 'date-fns';

const API_BASE = '/api';

function buildFilenameFromHeader(headerValue: string | null, fallback: string) {
  if (!headerValue) return fallback;
  const match = /filename="?([^\";]+)"?/i.exec(headerValue);
  return match && match[1] ? match[1] : fallback;
}

async function downloadCsv(url: string, fallbackName: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download CSV: ${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  const filename = buildFilenameFromHeader(response.headers.get('content-disposition'), fallbackName);
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
}

/**
 * Fetch headcount with optional filters.
 */
export async function fetchHeadcount(params: LegacyFilterParams): Promise<HeadcountResponse> {
  const searchParams = new URLSearchParams();

  if (params.date_from) searchParams.append('date_from', params.date_from);
  if (params.date_to) searchParams.append('date_to', params.date_to);
  if (params.shift) searchParams.append('shift', params.shift);
  if (params.bus_id) searchParams.append('bus_id', params.bus_id);
  if (params.route) searchParams.append('route', params.route);
  
  const url = `${API_BASE}/report/headcount?${searchParams.toString()}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch headcount: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch attendance records for a specific date with optional filters.
 */
export async function fetchAttendance(date: string, shift?: string, bus_id?: string): Promise<AttendanceRecord[]> {
  const searchParams = new URLSearchParams();
  searchParams.append('date', date);
  if (shift) searchParams.append('shift', shift);
  if (bus_id) searchParams.append('bus_id', bus_id);

  const url = `${API_BASE}/report/attendance?${searchParams.toString()}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch attendance: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Download headcount CSV using the same filters as the JSON endpoint.
 */
export async function exportHeadcountCsv(params: LegacyFilterParams): Promise<void> {
  const searchParams = new URLSearchParams();
  if (params.date_from) searchParams.append('date_from', params.date_from);
  if (params.date_to) searchParams.append('date_to', params.date_to);
  if (params.shift) searchParams.append('shift', params.shift);
  if (params.bus_id) searchParams.append('bus_id', params.bus_id);
  if (params.route) searchParams.append('route', params.route);

  const url = `${API_BASE}/report/headcount/export?${searchParams.toString()}`;
  await downloadCsv(url, 'headcount.csv');
}

/**
 * Download attendance CSV for a date with optional filters.
 */
export async function exportAttendanceCsv(date: string, shift?: string, bus_id?: string): Promise<void> {
  if (!date) {
    throw new Error('Date is required to export attendance');
  }

  const searchParams = new URLSearchParams();
  searchParams.append('date', date);
  if (shift) searchParams.append('shift', shift);
  if (bus_id) searchParams.append('bus_id', bus_id);

  const url = `${API_BASE}/report/attendance/export?${searchParams.toString()}`;
  await downloadCsv(url, 'attendance.csv');
}

/**
 * Admin: fetch all employees.
 */
export async function fetchEmployees(): Promise<EmployeeInfo[]> {
  const response = await fetch(`${API_BASE}/bus/employees`);

  if (!response.ok) {
    throw new Error(`Failed to fetch employees: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Admin: create or update an employee.
 */
export async function saveEmployee(payload: EmployeeInput): Promise<EmployeeInfo> {
  const response = await fetch(`${API_BASE}/bus/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to save employee: ${response.statusText} ${detail}`.trim());
  }

  return response.json();
}

/**
 * Admin: fetch all buses.
 */
export async function fetchBuses(): Promise<BusInfo[]> {
  const response = await fetch(`${API_BASE}/bus/buses`);

  if (!response.ok) {
    throw new Error(`Failed to fetch buses: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Admin: create or update a bus.
 */
export async function saveBus(payload: BusInput): Promise<BusInfo> {
  const response = await fetch(`${API_BASE}/bus/buses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to save bus: ${response.statusText} ${detail}`.trim());
  }

  return response.json();
}

/**
 * Admin: fetch vans to populate dropdowns.
 */
export async function fetchVans(): Promise<VanInfo[]> {
  const response = await fetch(`${API_BASE}/bus/vans`);

  if (!response.ok) {
    throw new Error(`Failed to fetch vans: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Admin: create or update a van.
 */
export async function saveVan(payload: VanInput): Promise<VanInfo> {
  const response = await fetch(`${API_BASE}/bus/vans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to save van: ${response.statusText} ${detail}`.trim());
  }

  return response.json();
}

export async function uploadMasterList(file: File): Promise<MasterListUploadResponse> {
  const form = new FormData();
  form.append('file', file);

  const response = await fetch(`${API_BASE}/bus/master-list/upload`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to upload master list: ${response.status} ${detail}`.trim());
  }

  return response.json();
}

export async function uploadAttendance(file: File): Promise<AttendanceUploadResponse> {
  const form = new FormData();
  form.append('file', file);

  const response = await fetch(`${API_BASE}/bus/attendance/upload`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to upload attendance: ${response.status} ${detail}`.trim());
  }

  return response.json();
}

export async function deleteAttendanceByDate(dateFrom: string, dateTo?: string): Promise<{ deleted_count: number; date_from: string; date_to: string }> {
  const searchParams = new URLSearchParams();
  searchParams.append('date_from', dateFrom);
  if (dateTo) {
    searchParams.append('date_to', dateTo);
  }

  const response = await fetch(`${API_BASE}/bus/attendance/delete-by-date?${searchParams}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to delete attendance: ${response.status} ${detail}`.trim());
  }

  return response.json();
}

export async function fetchOccupancy(params: Partial<FilterParams>): Promise<OccupancyResponse> {
  const searchParams = new URLSearchParams();
  if (params.date_from) searchParams.append('date_from', params.date_from);
  if (params.date_to) searchParams.append('date_to', params.date_to);

  // Support multi-select arrays
  if (params.shifts && params.shifts.length > 0) {
    searchParams.append('shift', params.shifts.join(','));
  }
  if (params.bus_ids && params.bus_ids.length > 0) {
    searchParams.append('bus_id', params.bus_ids.join(','));
  }
  if (params.routes && params.routes.length > 0) {
    searchParams.append('route', params.routes.join(','));
  }
  if (params.plants && params.plants.length > 0) {
    searchParams.append('plant', params.plants.join(','));
  }

  const url = `${API_BASE}/report/occupancy?${searchParams.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch occupancy: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch available filter options for multi-select dropdowns.
 */
export async function fetchFilterOptions(): Promise<FilterOptions> {
  const response = await fetch(`${API_BASE}/report/occupancy/filters`);

  if (!response.ok) {
    throw new Error(`Failed to fetch filter options: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchBusDetail(
  params: { date_from?: string; date_to?: string; shift?: string; bus_id: string; include_inactive?: boolean },
): Promise<BusDetailResponse> {
  const searchParams = new URLSearchParams();
  if (params.date_from) searchParams.append('date_from', params.date_from);
  if (params.date_to) searchParams.append('date_to', params.date_to);
  if (params.shift) searchParams.append('shift', params.shift);
  if (params.include_inactive) searchParams.append('include_inactive', 'true');
  searchParams.append('bus_id', params.bus_id);

  const url = `${API_BASE}/report/bus-detail?${searchParams.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to fetch bus detail: ${response.status} ${detail}`.trim());
  }

  return response.json();
}

/**
 * Fetch trend analysis data for a date range with optional comparison to previous period.
 * Fetches occupancy data for each day and aggregates for trend visualization.
 */
export async function fetchTrendData(params: {
  date_from: string;
  date_to: string;
  plants?: string[];
  shifts?: string[];
  bus_ids?: string[];
  routes?: string[];
  includePrevious?: boolean; // Fetch previous period for comparison
}): Promise<TrendAnalysisData> {
  // 1. Validate date range (max 90 days)
  const startDate = parseISO(params.date_from);
  const endDate = parseISO(params.date_to);
  const daysDiff = differenceInDays(endDate, startDate);

  if (daysDiff < 0) {
    throw new Error('End date must be after start date');
  }

  if (daysDiff > 90) {
    throw new Error('Trend analysis limited to 90 days');
  }

  // 2. Generate date arrays for current and previous periods
  const currentDates = eachDayOfInterval({ start: startDate, end: endDate }).map(d => format(d, 'yyyy-MM-dd'));

  let previousDates: string[] = [];
  if (params.includePrevious) {
    const prevStart = subDays(startDate, daysDiff + 1);
    const prevEnd = subDays(endDate, daysDiff + 1);
    previousDates = eachDayOfInterval({ start: prevStart, end: prevEnd }).map(d => format(d, 'yyyy-MM-dd'));
  }

  // 3. Fetch occupancy for each day in parallel
  const fetchForDates = async (dates: string[]): Promise<TrendDataPoint[]> => {
    const dailyPromises = dates.map(date =>
      fetchOccupancy({
        date_from: date,
        date_to: date,
        plants: params.plants || [],
        shifts: params.shifts || [],
        bus_ids: params.bus_ids || [],
        routes: params.routes || [],
      })
    );

    const dailyResults = await Promise.all(dailyPromises);

    return dailyResults.map((dayData, index) => ({
      date: dates[index],
      roster: dayData.total_roster,
      present: dayData.total_present,
      attendance_rate: dayData.total_roster > 0
        ? (dayData.total_present / dayData.total_roster) * 100
        : 0,
    }));
  };

  const [currentDaily, previousDaily] = await Promise.all([
    fetchForDates(currentDates),
    params.includePrevious ? fetchForDates(previousDates) : Promise.resolve([]),
  ]);

  // 4. Calculate summary statistics
  const totalRoster = currentDaily.reduce((sum, d) => sum + d.roster, 0);
  const totalPresent = currentDaily.reduce((sum, d) => sum + d.present, 0);
  const avgAttendanceRate = totalRoster > 0 ? (totalPresent / totalRoster) * 100 : 0;

  let prevAvgAttendanceRate: number | undefined;
  let attendanceRateChange: number | undefined;

  if (previousDaily.length > 0) {
    const prevTotalRoster = previousDaily.reduce((sum, d) => sum + d.roster, 0);
    const prevTotalPresent = previousDaily.reduce((sum, d) => sum + d.present, 0);
    prevAvgAttendanceRate = prevTotalRoster > 0 ? (prevTotalPresent / prevTotalRoster) * 100 : 0;
    attendanceRateChange = avgAttendanceRate - prevAvgAttendanceRate;
  }

  return {
    daily: currentDaily,
    previous: previousDaily.length > 0 ? previousDaily : undefined,
    summary: {
      avg_attendance_rate: avgAttendanceRate,
      total_roster: totalRoster,
      total_present: totalPresent,
      date_from: params.date_from,
      date_to: params.date_to,
      prev_avg_attendance_rate: prevAvgAttendanceRate,
      attendance_rate_change: attendanceRateChange,
    },
  };
}

