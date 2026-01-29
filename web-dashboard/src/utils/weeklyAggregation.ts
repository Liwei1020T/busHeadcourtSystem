// web-dashboard/src/utils/weeklyAggregation.ts

import { startOfWeek, format, parseISO } from 'date-fns';
import { TrendDataPoint } from '../types';

export type WeeklyDataPoint = {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;
  weekLabel: string; // "Jan 20-26"
  roster: number; // Daily average
  present: number; // Daily average
  attendance_rate: number;
  daysInWeek: number;
};

/**
 * Aggregate daily trend data into weekly averages.
 * Weeks start on Monday.
 */
export function aggregateToWeekly(daily: TrendDataPoint[]): TrendDataPoint[] {
  if (daily.length === 0) return [];

  // Group by week
  const weekGroups = new Map<string, TrendDataPoint[]>();

  daily.forEach((point) => {
    const date = parseISO(point.date);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const weekKey = format(weekStart, 'yyyy-MM-dd');

    if (!weekGroups.has(weekKey)) {
      weekGroups.set(weekKey, []);
    }
    weekGroups.get(weekKey)!.push(point);
  });

  // Aggregate each week
  const weeklyData: TrendDataPoint[] = Array.from(weekGroups.entries())
    .map(([weekStartStr, points]) => {
      const totalRoster = points.reduce((sum, p) => sum + p.roster, 0);
      const totalPresent = points.reduce((sum, p) => sum + p.present, 0);

      // Calculate daily averages
      const avgRoster = Math.round(totalRoster / points.length);
      const avgPresent = Math.round(totalPresent / points.length);

      return {
        date: weekStartStr,
        roster: avgRoster,
        present: avgPresent,
        attendance_rate: totalRoster > 0 ? (totalPresent / totalRoster) * 100 : 0,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return weeklyData;
}
