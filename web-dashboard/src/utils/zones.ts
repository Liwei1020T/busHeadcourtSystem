// web-dashboard/src/utils/zones.ts

import { OccupancyBusRow } from '../types';
import { getSeverityLevel, SeverityLevel } from '../lib/theme';

export type ZoneGroup = {
  zone: string;
  buses: OccupancyBusRow[];
  totalPresent: number;
  totalCapacity: number;
  avgUtilization: number;
  criticalCount: number;
  warningCount: number;
  normalCount: number;
};

/**
 * Extract zone prefix from bus_id or route.
 * Examples: "A01" -> "A", "BKA0" -> "BK", "E12" -> "E"
 */
export function extractZone(busId: string, route?: string | null): string {
  // Try to extract zone from bus_id first
  const match = busId.match(/^([A-Z]+)/i);
  if (match) {
    const prefix = match[1].toUpperCase();
    // Handle special cases like "BKA", "BKB", "BKC", "BKD" -> "BK"
    if (prefix.startsWith('BK')) return 'BK';
    return prefix;
  }

  // Fallback to route if available
  if (route) {
    const routeMatch = route.match(/^([A-Z]+)/i);
    if (routeMatch) return routeMatch[1].toUpperCase();
  }

  return 'OTHER';
}

/**
 * Group buses by zone and calculate aggregate stats.
 */
export function groupByZone(buses: OccupancyBusRow[]): ZoneGroup[] {
  const groups = new Map<string, OccupancyBusRow[]>();

  buses.forEach((bus) => {
    const zone = extractZone(bus.bus_id, bus.route);
    if (!groups.has(zone)) {
      groups.set(zone, []);
    }
    groups.get(zone)!.push(bus);
  });

  const result: ZoneGroup[] = [];

  groups.forEach((zoneBuses, zone) => {
    let criticalCount = 0;
    let warningCount = 0;
    let normalCount = 0;
    let totalPresent = 0;
    let totalCapacity = 0;

    zoneBuses.forEach((bus) => {
      const util = bus.total_capacity > 0 ? (bus.total_present / bus.total_capacity) * 100 : 0;
      const severity = getSeverityLevel(util);

      if (severity === 'critical') criticalCount++;
      else if (severity === 'warning') warningCount++;
      else normalCount++;

      totalPresent += bus.total_present;
      totalCapacity += bus.total_capacity;
    });

    // Sort buses within zone by severity (critical first)
    const sortedBuses = [...zoneBuses].sort((a, b) => {
      const utilA = a.total_capacity > 0 ? (a.total_present / a.total_capacity) * 100 : 0;
      const utilB = b.total_capacity > 0 ? (b.total_present / b.total_capacity) * 100 : 0;
      const sevA = getSeverityLevel(utilA);
      const sevB = getSeverityLevel(utilB);

      const order: Record<SeverityLevel, number> = { critical: 0, warning: 1, normal: 2 };
      if (order[sevA] !== order[sevB]) return order[sevA] - order[sevB];

      // Within same severity, sort by utilization desc (most problematic first)
      return utilB - utilA;
    });

    result.push({
      zone,
      buses: sortedBuses,
      totalPresent,
      totalCapacity,
      avgUtilization: totalCapacity > 0 ? (totalPresent / totalCapacity) * 100 : 0,
      criticalCount,
      warningCount,
      normalCount,
    });
  });

  // Sort zones by severity (zones with critical issues first)
  return result.sort((a, b) => {
    if (a.criticalCount !== b.criticalCount) return b.criticalCount - a.criticalCount;
    if (a.warningCount !== b.warningCount) return b.warningCount - a.warningCount;
    return a.zone.localeCompare(b.zone);
  });
}
