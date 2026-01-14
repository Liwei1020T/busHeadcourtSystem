// web-dashboard/src/lib/theme.ts

export const colors = {
  // Background
  bgDark: '#1a1d21',
  bgLight: '#f5f5f5',
  bgWhite: '#ffffff',

  // Status
  critical: '#ef4444',
  criticalBg: '#fef2f2',
  warning: '#f59e0b',
  warningBg: '#fffbeb',
  normal: '#22c55e',
  normalBg: '#f0fdf4',
  info: '#3b82f6',

  // Accent
  accent: '#06b6d4',
  accentHover: '#0891b2',
} as const;

export const severityThresholds = {
  critical: { utilAbove: 120, utilBelow: 10 },
  warning: { utilAbove: 100, utilBelow: 30 },
} as const;

export type SeverityLevel = 'critical' | 'warning' | 'normal';

export function getSeverityLevel(utilization: number): SeverityLevel {
  if (utilization > severityThresholds.critical.utilAbove || utilization < severityThresholds.critical.utilBelow) {
    return 'critical';
  }
  if (utilization > severityThresholds.warning.utilAbove || utilization < severityThresholds.warning.utilBelow) {
    return 'warning';
  }
  return 'normal';
}

export function getSeverityColor(level: SeverityLevel): string {
  switch (level) {
    case 'critical': return colors.critical;
    case 'warning': return colors.warning;
    case 'normal': return colors.normal;
  }
}

export function getSeverityBgColor(level: SeverityLevel): string {
  switch (level) {
    case 'critical': return colors.criticalBg;
    case 'warning': return colors.warningBg;
    case 'normal': return colors.normalBg;
  }
}
