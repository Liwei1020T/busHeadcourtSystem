// web-dashboard/src/utils/plants.ts

import { OccupancyBusRow } from '../types';
import { getSeverityLevel, SeverityLevel } from '../lib/theme';

export type PlantGroup = {
  plant: string;                // 'P1' | 'P2' | 'BK' | 'Unknown'
  buses: OccupancyBusRow[];
  totalBusCapacity: number;
  totalVanCapacity: number;
  totalBusPresent: number;
  totalVanPresent: number;
  totalPresent: number;
  totalRoster: number;
  avgUtilization: number;       // Based on bus_capacity only
  avgAttendanceRate: number;    // present/roster
  criticalCount: number;
  warningCount: number;
  normalCount: number;
};

/**
 * Extract plant from building_id or route name.
 * Normalizes to P1, P2, BK, or Unknown.
 *
 * IMPORTANT: If building_id is null/undefined/"UNKNOWN", always return 'Unknown'
 * This indicates the bus is not in master list (from unknown_attendances).
 */
export function extractPlant(buildingId?: string | null, _route?: string | null): string {
  // 1. If building_id is null/undefined or "UNKNOWN", it's an unknown bus (not in master list)
  if (!buildingId || buildingId.toUpperCase() === 'UNKNOWN') {
    return 'Unknown';
  }

  // 2. Check building_id for known plants
  const upper = buildingId.toUpperCase().trim();
  if (upper === 'P1') return 'P1';
  if (upper === 'P2') return 'P2';
  if (upper.startsWith('BK')) return 'BK';
  if (upper === 'JBMW') return 'JBMW';

  // 3. If building_id is something else (not null, not UNKNOWN), use it as-is
  return upper;
}

/**
 * Group buses by plant and calculate aggregate stats.
 * Utilization is calculated based on bus_capacity only (not van).
 */
export function groupByPlant(buses: OccupancyBusRow[]): PlantGroup[] {
  const groups = new Map<string, OccupancyBusRow[]>();

  buses.forEach((bus) => {
    const plant = extractPlant(bus.building_id, bus.route);
    if (!groups.has(plant)) {
      groups.set(plant, []);
    }
    groups.get(plant)!.push(bus);
  });

  const result: PlantGroup[] = [];

  groups.forEach((plantBuses, plant) => {
    let criticalCount = 0;
    let warningCount = 0;
    let normalCount = 0;
    let totalBusCapacity = 0;
    let totalVanCapacity = 0;
    let totalBusPresent = 0;
    let totalVanPresent = 0;
    let totalPresent = 0;
    let totalRoster = 0;

    plantBuses.forEach((bus) => {
      // Calculate utilization based on bus_capacity only, using total_present (bus + van passengers)
      const util = bus.bus_capacity > 0 ? (bus.total_present / bus.bus_capacity) * 100 : 0;
      const severity = getSeverityLevel(util);

      if (severity === 'critical') criticalCount++;
      else if (severity === 'warning') warningCount++;
      else normalCount++;

      totalBusCapacity += bus.bus_capacity;
      totalVanCapacity += bus.van_capacity;
      totalBusPresent += bus.bus_present;
      totalVanPresent += bus.van_present;
      totalPresent += bus.total_present;
      totalRoster += bus.total_roster;
    });

    // Sort buses within plant by severity (critical first)
    const sortedBuses = [...plantBuses].sort((a, b) => {
      const utilA = a.bus_capacity > 0 ? (a.total_present / a.bus_capacity) * 100 : 0;
      const utilB = b.bus_capacity > 0 ? (b.total_present / b.bus_capacity) * 100 : 0;
      const sevA = getSeverityLevel(utilA);
      const sevB = getSeverityLevel(utilB);

      const order: Record<SeverityLevel, number> = { critical: 0, warning: 1, normal: 2 };
      if (order[sevA] !== order[sevB]) return order[sevA] - order[sevB];

      // Within same severity, sort by utilization desc (most problematic first)
      return utilB - utilA;
    });

    result.push({
      plant,
      buses: sortedBuses,
      totalBusCapacity,
      totalVanCapacity,
      totalBusPresent,
      totalVanPresent,
      totalPresent,
      totalRoster,
      avgUtilization: totalBusCapacity > 0 ? (totalPresent / totalBusCapacity) * 100 : 0,
      avgAttendanceRate: totalRoster > 0 ? (totalPresent / totalRoster) * 100 : 0,
      criticalCount,
      warningCount,
      normalCount,
    });
  });

  // Sort plants: P1, P2, BK first, then others, Unknown last
  const plantOrder: Record<string, number> = { 'P1': 0, 'P2': 1, 'BK': 2, 'Unknown': 99 };
  return result.sort((a, b) => {
    const orderA = plantOrder[a.plant] ?? 50;
    const orderB = plantOrder[b.plant] ?? 50;
    if (orderA !== orderB) return orderA - orderB;
    // If same priority, sort by critical count desc
    if (a.criticalCount !== b.criticalCount) return b.criticalCount - a.criticalCount;
    return a.plant.localeCompare(b.plant);
  });
}
