/**
 * API service for communicating with the backend.
 */

import { SummaryResponse, ScanRecord, FilterParams } from './types';

const API_BASE = '/api';

/**
 * Fetch summary report with optional filters.
 */
export async function fetchSummary(params: Partial<FilterParams>): Promise<SummaryResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.date_from) searchParams.append('date_from', params.date_from);
  if (params.date_to) searchParams.append('date_to', params.date_to);
  if (params.route) searchParams.append('route', params.route);
  if (params.direction) searchParams.append('direction', params.direction);
  
  const url = `${API_BASE}/report/summary?${searchParams.toString()}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch summary: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch scan records for a specific date.
 */
export async function fetchScans(date: string): Promise<ScanRecord[]> {
  const url = `${API_BASE}/report/scans?date=${encodeURIComponent(date)}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch scans: ${response.statusText}`);
  }
  
  return response.json();
}
