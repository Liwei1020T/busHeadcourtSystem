/**
 * API service for communicating with the backend.
 */

import { HeadcountResponse, AttendanceRecord, FilterParams } from './types';

const API_BASE = '/api';

/**
 * Fetch headcount with optional filters.
 */
export async function fetchHeadcount(params: Partial<FilterParams>): Promise<HeadcountResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.date_from) searchParams.append('date_from', params.date_from);
  if (params.date_to) searchParams.append('date_to', params.date_to);
  if (params.shift) searchParams.append('shift', params.shift);
  if (params.bus_id) searchParams.append('bus_id', params.bus_id);
  
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
