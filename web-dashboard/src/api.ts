/**
 * API service for communicating with the backend.
 */

import {
  HeadcountResponse,
  AttendanceRecord,
  FilterParams,
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
} from './types';

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
export async function fetchHeadcount(params: Partial<FilterParams>): Promise<HeadcountResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.date_from) searchParams.append('date_from', params.date_from);
  if (params.date_to) searchParams.append('date_to', params.date_to);
  if (params.shift) searchParams.append('shift', params.shift);
  if (params.bus_id && params.bus_id.length > 0) {
    searchParams.append('bus_id', params.bus_id.join(','));
  }
  
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
export async function exportHeadcountCsv(params: Partial<FilterParams>): Promise<void> {
  const searchParams = new URLSearchParams();
  if (params.date_from) searchParams.append('date_from', params.date_from);
  if (params.date_to) searchParams.append('date_to', params.date_to);
  if (params.shift) searchParams.append('shift', params.shift);
  if (params.bus_id && params.bus_id.length > 0) {
    searchParams.append('bus_id', params.bus_id.join(','));
  }

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

export async function fetchOccupancy(params: Partial<FilterParams>): Promise<OccupancyResponse> {
  const searchParams = new URLSearchParams();
  if (params.date_from) searchParams.append('date_from', params.date_from);
  if (params.date_to) searchParams.append('date_to', params.date_to);
  if (params.shift) searchParams.append('shift', params.shift);
  if (params.bus_id && params.bus_id.length > 0) {
    searchParams.append('bus_id', params.bus_id.join(','));
  }
  if (params.plant) searchParams.append('plant', params.plant);

  const url = `${API_BASE}/report/occupancy?${searchParams.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch occupancy: ${response.statusText}`);
  }

  return response.json();
}

export type BusDetailParams = {
  bus_id: string;
  include_inactive?: boolean;
  date_from?: string;
  date_to?: string;
  shift?: string;
};

export async function fetchBusDetail(params: BusDetailParams): Promise<BusDetailResponse> {
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
