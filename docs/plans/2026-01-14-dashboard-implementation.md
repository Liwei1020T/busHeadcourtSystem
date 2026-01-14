# Bus Dashboard Redesign - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the bus dashboard with Live Ops/Analytics mode toggle, industrial styling, zone-grouped tables, and analytics charts.

**Architecture:** Mode-based single-page dashboard with shared header/filters. Live Ops mode has sidebar + zone-grouped table. Analytics mode has chart grid. State managed via React useState/useContext.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Recharts (already installed), Radix UI, Lucide icons

---

## Phase 1: Foundation & Styling

### Task 1: Create Design Tokens & Theme Constants

**Files:**
- Create: `web-dashboard/src/lib/theme.ts`

**Step 1: Create theme constants file**

```typescript
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
```

**Step 2: Verify file created**

Run: `cat web-dashboard/src/lib/theme.ts | head -20`
Expected: Theme constants visible

**Step 3: Commit**

```bash
git add web-dashboard/src/lib/theme.ts
git commit -m "feat(dashboard): add design tokens and severity helpers"
```

---

### Task 2: Create Mode Toggle Component

**Files:**
- Create: `web-dashboard/src/components/ModeToggle.tsx`

**Step 1: Create mode toggle component**

```tsx
// web-dashboard/src/components/ModeToggle.tsx

type DashboardMode = 'live' | 'analytics';

type ModeToggleProps = {
  mode: DashboardMode;
  onChange: (mode: DashboardMode) => void;
};

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
      <button
        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
          mode === 'live'
            ? 'bg-cyan-500 text-white shadow-md'
            : 'text-slate-400 hover:text-white'
        }`}
        onClick={() => onChange('live')}
      >
        Live Ops
      </button>
      <button
        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
          mode === 'analytics'
            ? 'bg-cyan-500 text-white shadow-md'
            : 'text-slate-400 hover:text-white'
        }`}
        onClick={() => onChange('analytics')}
      >
        Analytics
      </button>
    </div>
  );
}

export type { DashboardMode };
```

**Step 2: Verify file created**

Run: `cat web-dashboard/src/components/ModeToggle.tsx`
Expected: Component code visible

**Step 3: Commit**

```bash
git add web-dashboard/src/components/ModeToggle.tsx
git commit -m "feat(dashboard): add mode toggle component"
```

---

### Task 3: Create Alert Banner Component

**Files:**
- Create: `web-dashboard/src/components/AlertBanner.tsx`

**Step 1: Create alert banner component**

```tsx
// web-dashboard/src/components/AlertBanner.tsx

import { X } from 'lucide-react';
import { SeverityLevel } from '../lib/theme';

type StatusCounts = {
  critical: number;
  warning: number;
  normal: number;
};

type AlertBannerProps = {
  counts: StatusCounts;
  onFilterClick: (level: SeverityLevel | null) => void;
  activeFilter: SeverityLevel | null;
  onDismiss: () => void;
};

export default function AlertBanner({ counts, onFilterClick, activeFilter, onDismiss }: AlertBannerProps) {
  const hasIssues = counts.critical > 0 || counts.warning > 0;

  if (!hasIssues) return null;

  return (
    <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-slate-400 text-sm font-medium">Status:</span>

        <button
          onClick={() => onFilterClick(activeFilter === 'critical' ? null : 'critical')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold transition-all ${
            activeFilter === 'critical'
              ? 'bg-red-500 text-white'
              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500" />
          {counts.critical} Critical
        </button>

        <button
          onClick={() => onFilterClick(activeFilter === 'warning' ? null : 'warning')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold transition-all ${
            activeFilter === 'warning'
              ? 'bg-amber-500 text-white'
              : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          {counts.warning} Warning
        </button>

        <button
          onClick={() => onFilterClick(activeFilter === 'normal' ? null : 'normal')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold transition-all ${
            activeFilter === 'normal'
              ? 'bg-emerald-500 text-white'
              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {counts.normal} Normal
        </button>
      </div>

      <button
        onClick={onDismiss}
        className="text-slate-500 hover:text-slate-300 p-1"
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add web-dashboard/src/components/AlertBanner.tsx
git commit -m "feat(dashboard): add alert banner component"
```

---

### Task 4: Create Sidebar Component

**Files:**
- Create: `web-dashboard/src/components/Sidebar.tsx`

**Step 1: Create sidebar component**

```tsx
// web-dashboard/src/components/Sidebar.tsx

import { TrendingUp, Users, AlertTriangle, Filter } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SidebarProps = {
  present: number;
  roster: number;
  utilization: number;
  capacity: number;
  criticalCount: number;
  warningCount: number;
  // Quick filters
  showOverloaded: boolean;
  showUnderutilized: boolean;
  showHighAbsent: boolean;
  selectedZone: string;
  zones: string[];
  onFilterChange: (filter: string, value: boolean | string) => void;
};

export default function Sidebar({
  present,
  roster,
  utilization,
  capacity,
  criticalCount,
  warningCount,
  showOverloaded,
  showUnderutilized,
  showHighAbsent,
  selectedZone,
  zones,
  onFilterChange,
}: SidebarProps) {
  const presentPct = roster > 0 ? (present / roster) * 100 : 0;
  const utilPct = Math.min(utilization, 100);

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Today's Status
        </h2>
      </div>

      {/* KPIs */}
      <div className="p-4 space-y-4 border-b border-slate-700">
        {/* Present */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase">Present</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {present.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">vs {roster.toLocaleString()} roster</div>
          <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${presentPct}%` }}
            />
          </div>
        </div>

        {/* Utilization */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase">Utilization</span>
            <TrendingUp className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {utilization.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500">{capacity.toLocaleString()} capacity</div>
          <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                utilization > 100 ? 'bg-red-500' : utilization > 80 ? 'bg-emerald-500' : 'bg-slate-500'
              }`}
              style={{ width: `${utilPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Problem Counts */}
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Problem Buses
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-sm text-slate-300">Critical</span>
            </div>
            <span className="text-sm font-bold text-red-400 font-mono">{criticalCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-sm text-slate-300">Warning</span>
            </div>
            <span className="text-sm font-bold text-amber-400 font-mono">{warningCount}</span>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="p-4 flex-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" />
          Quick Filters
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={showOverloaded}
              onCheckedChange={(c) => onFilterChange('overloaded', !!c)}
              className="border-slate-600 data-[state=checked]:bg-cyan-500"
            />
            <span className="text-sm text-slate-300">Overloaded (&gt;100%)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={showUnderutilized}
              onCheckedChange={(c) => onFilterChange('underutilized', !!c)}
              className="border-slate-600 data-[state=checked]:bg-cyan-500"
            />
            <span className="text-sm text-slate-300">Underutilized (&lt;30%)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={showHighAbsent}
              onCheckedChange={(c) => onFilterChange('highAbsent', !!c)}
              className="border-slate-600 data-[state=checked]:bg-cyan-500"
            />
            <span className="text-sm text-slate-300">High Absent (&gt;20%)</span>
          </label>

          <div className="pt-2">
            <Select
              value={selectedZone || 'all'}
              onValueChange={(v) => onFilterChange('zone', v === 'all' ? '' : v)}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200 h-9">
                <SelectValue placeholder="All Zones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {zones.map((z) => (
                  <SelectItem key={z} value={z}>{z}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </aside>
  );
}
```

**Step 2: Commit**

```bash
git add web-dashboard/src/components/Sidebar.tsx
git commit -m "feat(dashboard): add sidebar component with KPIs and filters"
```

---

## Phase 2: Zone-Grouped Table

### Task 5: Create Zone Extraction Utility

**Files:**
- Create: `web-dashboard/src/utils/zones.ts`

**Step 1: Create zone utility**

```typescript
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
```

**Step 2: Commit**

```bash
git add web-dashboard/src/utils/zones.ts
git commit -m "feat(dashboard): add zone grouping utility"
```

---

### Task 6: Create Zone-Grouped Table Component

**Files:**
- Create: `web-dashboard/src/components/ZoneTable.tsx`

**Step 1: Create zone table component**

```tsx
// web-dashboard/src/components/ZoneTable.tsx

import { useState } from 'react';
import { ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import { OccupancyBusRow } from '../types';
import { ZoneGroup } from '../utils/zones';
import { getSeverityLevel, getSeverityColor, getSeverityBgColor } from '../lib/theme';

type ZoneTableProps = {
  zones: ZoneGroup[];
  onBusClick: (bus: OccupancyBusRow) => void;
};

function StatusDot({ level }: { level: 'critical' | 'warning' | 'normal' }) {
  const colors = {
    critical: 'bg-red-500',
    warning: 'bg-amber-500',
    normal: 'bg-emerald-500',
  };
  return <span className={`w-2.5 h-2.5 rounded-full ${colors[level]}`} />;
}

function ZoneHeader({
  zone,
  isExpanded,
  onToggle,
}: {
  zone: ZoneGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 hover:bg-slate-200 transition-colors border-b"
    >
      <div className="flex items-center gap-3">
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500" />
        )}
        <span className="font-bold text-slate-800 uppercase tracking-wide">
          Zone {zone.zone}
        </span>
        <span className="text-sm text-slate-500">({zone.buses.length} buses)</span>

        {/* Status indicators */}
        <div className="flex items-center gap-2 ml-4">
          {zone.criticalCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
              <StatusDot level="critical" />
              {zone.criticalCount}
            </span>
          )}
          {zone.warningCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
              <StatusDot level="warning" />
              {zone.warningCount}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="text-slate-600">
          <span className="font-semibold">{zone.avgUtilization.toFixed(0)}%</span>
          <span className="text-slate-400 ml-1">Util</span>
        </div>
        <div className="text-slate-600">
          <span className="font-semibold font-mono">{zone.totalPresent.toLocaleString()}</span>
          <span className="text-slate-400 ml-1">pax</span>
        </div>
      </div>
    </button>
  );
}

function BusRow({
  bus,
  onClick,
}: {
  bus: OccupancyBusRow;
  onClick: () => void;
}) {
  const utilization = bus.total_capacity > 0 ? (bus.total_present / bus.total_capacity) * 100 : 0;
  const absent = Math.max(0, bus.total_roster - bus.total_present);
  const severity = getSeverityLevel(utilization);

  const rowBgClass = {
    critical: 'bg-red-50 hover:bg-red-100',
    warning: 'bg-amber-50 hover:bg-amber-100',
    normal: 'hover:bg-slate-50',
  }[severity];

  return (
    <tr
      className={`cursor-pointer transition-colors ${rowBgClass}`}
      onClick={onClick}
    >
      <td className="px-4 py-3 w-12">
        <StatusDot level={severity} />
      </td>
      <td className="px-4 py-3">
        <div className="font-semibold text-slate-900">{bus.bus_id}</div>
        <div className="text-xs text-slate-500">{bus.route || '-'}</div>
      </td>
      <td className="px-4 py-3 text-right font-mono text-slate-600">
        {bus.total_capacity}
      </td>
      <td className="px-4 py-3 text-right font-mono font-semibold">
        {bus.total_present}
      </td>
      <td className={`px-4 py-3 text-right font-mono ${severity === 'critical' ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
        {utilization.toFixed(1)}%
      </td>
      <td className={`px-4 py-3 text-right font-mono ${absent > 0 ? 'text-red-500' : 'text-slate-400'}`}>
        {absent > 0 ? absent : '-'}
      </td>
      <td className="px-4 py-3 text-right">
        <ArrowRight className="w-4 h-4 text-slate-400 inline" />
      </td>
    </tr>
  );
}

export default function ZoneTable({ zones, onBusClick }: ZoneTableProps) {
  const [expandedZones, setExpandedZones] = useState<Set<string>>(() => {
    // Start with all zones expanded
    return new Set(zones.map((z) => z.zone));
  });

  const toggleZone = (zone: string) => {
    setExpandedZones((prev) => {
      const next = new Set(prev);
      if (next.has(zone)) {
        next.delete(zone);
      } else {
        next.add(zone);
      }
      return next;
    });
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {zones.map((zone) => (
        <div key={zone.zone}>
          <ZoneHeader
            zone={zone}
            isExpanded={expandedZones.has(zone.zone)}
            onToggle={() => toggleZone(zone.zone)}
          />

          {expandedZones.has(zone.zone) && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left w-12">Status</th>
                  <th className="px-4 py-2 text-left">Bus / Route</th>
                  <th className="px-4 py-2 text-right">Cap</th>
                  <th className="px-4 py-2 text-right">Actual</th>
                  <th className="px-4 py-2 text-right">Util</th>
                  <th className="px-4 py-2 text-right">Absent</th>
                  <th className="px-4 py-2 text-right w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {zone.buses.map((bus) => (
                  <BusRow
                    key={bus.bus_id}
                    bus={bus}
                    onClick={() => onBusClick(bus)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      {zones.length === 0 && (
        <div className="p-12 text-center text-slate-400">
          No buses found matching your filters.
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add web-dashboard/src/components/ZoneTable.tsx
git commit -m "feat(dashboard): add zone-grouped table component"
```

---

## Phase 3: Analytics Charts

### Task 7: Create Utilization Trend Chart

**Files:**
- Create: `web-dashboard/src/components/charts/UtilizationTrendChart.tsx`

**Step 1: Create chart component**

```tsx
// web-dashboard/src/components/charts/UtilizationTrendChart.tsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

type DataPoint = {
  date: string;
  utilization: number;
  previousUtilization?: number;
};

type UtilizationTrendChartProps = {
  data: DataPoint[];
  showComparison?: boolean;
};

export default function UtilizationTrendChart({ data, showComparison = false }: UtilizationTrendChartProps) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
          Utilization Trend
        </h3>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-cyan-500" />
            Current
          </span>
          {showComparison && (
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-slate-300 border-dashed" style={{ borderTop: '2px dashed' }} />
              Previous
            </span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Utilization']}
          />
          <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '100%', position: 'right', fontSize: 10, fill: '#ef4444' }} />

          {showComparison && (
            <Line
              type="monotone"
              dataKey="previousUtilization"
              stroke="#cbd5e1"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          )}
          <Line
            type="monotone"
            dataKey="utilization"
            stroke="#06b6d4"
            strokeWidth={2}
            dot={{ fill: '#06b6d4', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, fill: '#06b6d4' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Step 2: Create directory and commit**

```bash
mkdir -p web-dashboard/src/components/charts
git add web-dashboard/src/components/charts/UtilizationTrendChart.tsx
git commit -m "feat(analytics): add utilization trend chart"
```

---

### Task 8: Create Route Comparison Chart

**Files:**
- Create: `web-dashboard/src/components/charts/RouteComparisonChart.tsx`

**Step 1: Create chart component**

```tsx
// web-dashboard/src/components/charts/RouteComparisonChart.tsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getSeverityLevel } from '../../lib/theme';

type RouteData = {
  zone: string;
  utilization: number;
  busCount: number;
};

type RouteComparisonChartProps = {
  data: RouteData[];
};

export default function RouteComparisonChart({ data }: RouteComparisonChartProps) {
  const sortedData = [...data].sort((a, b) => b.utilization - a.utilization);

  const getBarColor = (util: number) => {
    const severity = getSeverityLevel(util);
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#22c55e';
    }
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">
        Route Comparison
      </h3>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 30, bottom: 5, left: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 'dataMax']}
          />
          <YAxis
            type="category"
            dataKey="zone"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value: number, name: string, props: any) => [
              `${value.toFixed(1)}% (${props.payload.busCount} buses)`,
              'Utilization',
            ]}
          />
          <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.utilization)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add web-dashboard/src/components/charts/RouteComparisonChart.tsx
git commit -m "feat(analytics): add route comparison chart"
```

---

### Task 9: Create Attendance Heatmap

**Files:**
- Create: `web-dashboard/src/components/charts/AttendanceHeatmap.tsx`

**Step 1: Create heatmap component**

```tsx
// web-dashboard/src/components/charts/AttendanceHeatmap.tsx

type HeatmapCell = {
  day: string;
  shift: string;
  value: number; // 0-100 attendance percentage
};

type AttendanceHeatmapProps = {
  data: HeatmapCell[];
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SHIFTS = ['Morning', 'Night'];

function getHeatColor(value: number): string {
  if (value >= 95) return 'bg-emerald-500';
  if (value >= 90) return 'bg-emerald-400';
  if (value >= 85) return 'bg-emerald-300';
  if (value >= 80) return 'bg-amber-300';
  if (value >= 70) return 'bg-amber-400';
  if (value >= 60) return 'bg-red-300';
  return 'bg-red-400';
}

export default function AttendanceHeatmap({ data }: AttendanceHeatmapProps) {
  const getValue = (day: string, shift: string): number | null => {
    const cell = data.find((d) => d.day === day && d.shift === shift);
    return cell?.value ?? null;
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">
        Attendance Heatmap
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-2 text-xs text-slate-500 font-medium"></th>
              {DAYS.map((day) => (
                <th key={day} className="p-2 text-xs text-slate-500 font-medium text-center">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map((shift) => (
              <tr key={shift}>
                <td className="p-2 text-xs text-slate-600 font-medium">{shift}</td>
                {DAYS.map((day) => {
                  const value = getValue(day, shift);
                  return (
                    <td key={day} className="p-1">
                      <div
                        className={`w-full h-8 rounded flex items-center justify-center text-xs font-semibold ${
                          value !== null
                            ? `${getHeatColor(value)} text-white`
                            : 'bg-slate-100 text-slate-400'
                        }`}
                        title={value !== null ? `${value.toFixed(1)}%` : 'No data'}
                      >
                        {value !== null ? `${Math.round(value)}%` : '-'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs">
        <span className="text-slate-500">Low</span>
        <div className="flex gap-1">
          <span className="w-4 h-4 rounded bg-red-400" />
          <span className="w-4 h-4 rounded bg-amber-400" />
          <span className="w-4 h-4 rounded bg-emerald-300" />
          <span className="w-4 h-4 rounded bg-emerald-500" />
        </div>
        <span className="text-slate-500">High</span>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add web-dashboard/src/components/charts/AttendanceHeatmap.tsx
git commit -m "feat(analytics): add attendance heatmap"
```

---

### Task 10: Create Cost Analysis Card

**Files:**
- Create: `web-dashboard/src/components/charts/CostAnalysisCard.tsx`

**Step 1: Create cost analysis component**

```tsx
// web-dashboard/src/components/charts/CostAnalysisCard.tsx

import { TrendingDown, AlertTriangle } from 'lucide-react';

type CostAnalysisProps = {
  underutilizedBuses: number;
  emptySeatsPerDay: number;
  estimatedMonthlyWaste: number;
  topWastefulRoutes: { zone: string; emptySeats: number }[];
};

export default function CostAnalysisCard({
  underutilizedBuses,
  emptySeatsPerDay,
  estimatedMonthlyWaste,
  topWastefulRoutes,
}: CostAnalysisProps) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
        <TrendingDown className="w-4 h-4 text-red-500" />
        Cost Analysis
      </h3>

      <div className="space-y-4">
        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
            <div className="text-xs text-red-600 font-medium uppercase">Underutilized</div>
            <div className="text-2xl font-bold text-red-700 font-mono">{underutilizedBuses}</div>
            <div className="text-xs text-red-500">buses &lt;30%</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
            <div className="text-xs text-amber-600 font-medium uppercase">Empty Seats</div>
            <div className="text-2xl font-bold text-amber-700 font-mono">{emptySeatsPerDay.toLocaleString()}</div>
            <div className="text-xs text-amber-500">per day avg</div>
          </div>
        </div>

        {/* Monthly waste */}
        <div className="bg-slate-50 rounded-lg p-3 border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium uppercase">Est. Monthly Waste</div>
              <div className="text-xl font-bold text-slate-800">
                RM {estimatedMonthlyWaste.toLocaleString()}
              </div>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        {/* Top wasteful routes */}
        {topWastefulRoutes.length > 0 && (
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase mb-2">
              Top Wasteful Routes
            </div>
            <div className="space-y-1">
              {topWastefulRoutes.slice(0, 3).map((route) => (
                <div key={route.zone} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 font-medium">Zone {route.zone}</span>
                  <span className="text-red-500 font-mono">{route.emptySeats} empty</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add web-dashboard/src/components/charts/CostAnalysisCard.tsx
git commit -m "feat(analytics): add cost analysis card"
```

---

## Phase 4: Analytics Mode Layout

### Task 11: Create Analytics Dashboard Component

**Files:**
- Create: `web-dashboard/src/components/AnalyticsDashboard.tsx`

**Step 1: Create analytics dashboard component**

```tsx
// web-dashboard/src/components/AnalyticsDashboard.tsx

import { TrendingUp, TrendingDown, Calendar, AlertTriangle } from 'lucide-react';
import UtilizationTrendChart from './charts/UtilizationTrendChart';
import RouteComparisonChart from './charts/RouteComparisonChart';
import AttendanceHeatmap from './charts/AttendanceHeatmap';
import CostAnalysisCard from './charts/CostAnalysisCard';
import { ZoneGroup } from '../utils/zones';

type AnalyticsDashboardProps = {
  zones: ZoneGroup[];
  totalPresent: number;
  totalRoster: number;
  totalCapacity: number;
  // For demo, we'll generate mock data. In production, this would come from API.
};

function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon: Icon,
}: {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
}) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="text-2xl font-bold text-slate-800 font-mono">{value}</div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${
          isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-slate-500'
        }`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : null}
          {isPositive ? '+' : ''}{change.toFixed(1)}%
          {changeLabel && <span className="text-slate-400 ml-1">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsDashboard({ zones, totalPresent, totalRoster, totalCapacity }: AnalyticsDashboardProps) {
  // Calculate metrics
  const avgUtilization = totalCapacity > 0 ? (totalPresent / totalCapacity) * 100 : 0;
  const underutilizedBuses = zones.reduce((acc, z) =>
    acc + z.buses.filter(b => b.total_capacity > 0 && (b.total_present / b.total_capacity) * 100 < 30).length, 0
  );
  const emptySeats = totalCapacity - totalPresent;
  const problemDays = 3; // Mock data

  // Generate mock trend data
  const trendData = Array.from({ length: 7 }, (_, i) => ({
    date: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    utilization: avgUtilization + (Math.random() - 0.5) * 20,
    previousUtilization: avgUtilization - 5 + (Math.random() - 0.5) * 20,
  }));

  // Generate route comparison data from zones
  const routeData = zones.map((z) => ({
    zone: z.zone,
    utilization: z.avgUtilization,
    busCount: z.buses.length,
  }));

  // Generate mock heatmap data
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const SHIFTS = ['Morning', 'Night'];
  const heatmapData = DAYS.flatMap((day) =>
    SHIFTS.map((shift) => ({
      day,
      shift,
      value: 75 + Math.random() * 25,
    }))
  );

  // Calculate wasteful routes
  const topWastefulRoutes = zones
    .map((z) => ({
      zone: z.zone,
      emptySeats: z.totalCapacity - z.totalPresent,
    }))
    .sort((a, b) => b.emptySeats - a.emptySeats)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Period Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Avg Utilization"
          value={`${avgUtilization.toFixed(1)}%`}
          change={3.2}
          icon={TrendingUp}
        />
        <StatCard
          label="Avg Present"
          value={totalPresent.toLocaleString()}
          change={-2.1}
          icon={Calendar}
        />
        <StatCard
          label="Problem Days"
          value={problemDays.toString()}
          change={-2}
          icon={AlertTriangle}
        />
        <StatCard
          label="Est. Waste"
          value={`RM ${Math.round(emptySeats * 0.5).toLocaleString()}`}
          change={-8.5}
          icon={TrendingDown}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UtilizationTrendChart data={trendData} showComparison />
        <RouteComparisonChart data={routeData} />
        <AttendanceHeatmap data={heatmapData} />
        <CostAnalysisCard
          underutilizedBuses={underutilizedBuses}
          emptySeatsPerDay={emptySeats}
          estimatedMonthlyWaste={Math.round(emptySeats * 0.5 * 22)}
          topWastefulRoutes={topWastefulRoutes}
        />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add web-dashboard/src/components/AnalyticsDashboard.tsx
git commit -m "feat(analytics): add analytics dashboard layout"
```

---

## Phase 5: Main Dashboard Integration

### Task 12: Create New Dashboard Header

**Files:**
- Create: `web-dashboard/src/components/DashboardHeader.tsx`

**Step 1: Create header component**

```tsx
// web-dashboard/src/components/DashboardHeader.tsx

import { Bus, RefreshCw } from 'lucide-react';
import ModeToggle, { DashboardMode } from './ModeToggle';
import { FilterParams, BusInfo } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

type DashboardHeaderProps = {
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  filters: FilterParams;
  onFiltersChange: (filters: FilterParams) => void;
  onSearch: () => void;
  loading: boolean;
  lastUpdated: string | null;
};

const SHIFTS = [
  { value: 'morning', label: 'Morning' },
  { value: 'night', label: 'Night' },
];

export default function DashboardHeader({
  mode,
  onModeChange,
  filters,
  onFiltersChange,
  onSearch,
  loading,
  lastUpdated,
}: DashboardHeaderProps) {
  const handleChange = (field: keyof FilterParams, value: string) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  return (
    <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Logo + Mode Toggle */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg hidden sm:block">Bus Ops</span>
          </div>

          <ModeToggle mode={mode} onChange={onModeChange} />
        </div>

        {/* Center: Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="w-[130px] h-8 bg-slate-700 border-slate-600 text-white text-sm"
              value={filters.date_from}
              onChange={(e) => handleChange('date_from', e.target.value)}
            />
            <span className="text-slate-500">-</span>
            <Input
              type="date"
              className="w-[130px] h-8 bg-slate-700 border-slate-600 text-white text-sm"
              value={filters.date_to}
              onChange={(e) => handleChange('date_to', e.target.value)}
            />
          </div>

          <Select
            value={filters.shift || 'all'}
            onValueChange={(v) => handleChange('shift', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-[100px] h-8 bg-slate-700 border-slate-600 text-white text-sm">
              <SelectValue placeholder="Shift" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shifts</SelectItem>
              {SHIFTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={onSearch}
            disabled={loading}
            size="sm"
            className="h-8 px-4 bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              'Apply'
            )}
          </Button>
        </div>

        {/* Right: Last Updated */}
        <div className="text-xs text-slate-500">
          {lastUpdated && `Updated: ${lastUpdated}`}
        </div>
      </div>
    </header>
  );
}
```

**Step 2: Commit**

```bash
git add web-dashboard/src/components/DashboardHeader.tsx
git commit -m "feat(dashboard): add new dashboard header with mode toggle"
```

---

### Task 13: Refactor Main Dashboard Page

**Files:**
- Modify: `web-dashboard/src/pages/BusDashboard.tsx`

**Step 1: Read current file to understand structure**

Already read in exploration phase.

**Step 2: Rewrite the dashboard page**

```tsx
// web-dashboard/src/pages/BusDashboard.tsx

import { useEffect, useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

import DashboardHeader from '../components/DashboardHeader';
import AlertBanner from '../components/AlertBanner';
import Sidebar from '../components/Sidebar';
import ZoneTable from '../components/ZoneTable';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import BusDetailDrawer from '../components/BusDetailDrawer';
import { DashboardMode } from '../components/ModeToggle';

import { fetchBuses, fetchOccupancy } from '../api';
import { BusInfo, OccupancyResponse, FilterParams, OccupancyBusRow } from '../types';
import { groupByZone, ZoneGroup } from '../utils/zones';
import { getSeverityLevel, SeverityLevel } from '../lib/theme';

function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export default function BusDashboard() {
  // Mode
  const [mode, setMode] = useState<DashboardMode>('live');

  // Filters
  const [filters, setFilters] = useState<FilterParams>({
    date_from: getTodayString(),
    date_to: getTodayString(),
    shift: '',
    bus_id: '',
    route: '',
  });
  const [activeFilters, setActiveFilters] = useState<FilterParams>(filters);

  // Data
  const [loading, setLoading] = useState(false);
  const [occupancy, setOccupancy] = useState<OccupancyResponse | null>(null);
  const [availableBuses, setAvailableBuses] = useState<BusInfo[]>([]);
  const [selectedBus, setSelectedBus] = useState<OccupancyBusRow | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Alert banner
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | null>(null);

  // Sidebar quick filters
  const [quickFilters, setQuickFilters] = useState({
    overloaded: false,
    underutilized: false,
    highAbsent: false,
    zone: '',
  });

  // Initial load
  useEffect(() => {
    fetchBuses()
      .then((buses) => setAvailableBuses(buses.sort((a, b) => a.bus_id.localeCompare(b.bus_id))))
      .catch(console.error);
    handleSearch();
  }, []);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const currentFilters = { ...filters };
      const data = await fetchOccupancy(currentFilters);
      setOccupancy(data);
      setLastUpdated(new Date().toLocaleTimeString());
      setActiveFilters(currentFilters);
      setAlertDismissed(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Calculate severity counts
  const severityCounts = useMemo(() => {
    if (!occupancy) return { critical: 0, warning: 0, normal: 0 };

    let critical = 0, warning = 0, normal = 0;
    occupancy.rows.forEach((row) => {
      const util = row.total_capacity > 0 ? (row.total_present / row.total_capacity) * 100 : 0;
      const level = getSeverityLevel(util);
      if (level === 'critical') critical++;
      else if (level === 'warning') warning++;
      else normal++;
    });
    return { critical, warning, normal };
  }, [occupancy]);

  // Filter and group data
  const filteredRows = useMemo(() => {
    if (!occupancy) return [];

    return occupancy.rows.filter((row) => {
      // Hide OWN/UNKN
      if (row.route?.toUpperCase().includes('OWN') || row.bus_id.toUpperCase().includes('OWN')) {
        return false;
      }

      const util = row.total_capacity > 0 ? (row.total_present / row.total_capacity) * 100 : 0;
      const absentPct = row.total_roster > 0 ? ((row.total_roster - row.total_present) / row.total_roster) * 100 : 0;
      const severity = getSeverityLevel(util);

      // Severity filter from alert banner
      if (severityFilter && severity !== severityFilter) return false;

      // Quick filters
      if (quickFilters.overloaded && util <= 100) return false;
      if (quickFilters.underutilized && util >= 30) return false;
      if (quickFilters.highAbsent && absentPct <= 20) return false;

      return true;
    });
  }, [occupancy, severityFilter, quickFilters]);

  const zones = useMemo(() => {
    let rows = filteredRows;

    // Zone filter
    if (quickFilters.zone) {
      rows = rows.filter((row) => {
        const zone = row.bus_id.match(/^([A-Z]+)/i)?.[1]?.toUpperCase() || '';
        if (zone.startsWith('BK')) return quickFilters.zone === 'BK';
        return zone === quickFilters.zone;
      });
    }

    return groupByZone(rows);
  }, [filteredRows, quickFilters.zone]);

  // Extract unique zones for filter dropdown
  const allZones = useMemo(() => {
    if (!occupancy) return [];
    const zoneSet = new Set<string>();
    occupancy.rows.forEach((row) => {
      const match = row.bus_id.match(/^([A-Z]+)/i);
      if (match) {
        const prefix = match[1].toUpperCase();
        zoneSet.add(prefix.startsWith('BK') ? 'BK' : prefix);
      }
    });
    return Array.from(zoneSet).sort();
  }, [occupancy]);

  const handleQuickFilterChange = (filter: string, value: boolean | string) => {
    setQuickFilters((prev) => ({ ...prev, [filter]: value }));
  };

  // Totals
  const totalPresent = occupancy?.total_present ?? 0;
  const totalRoster = occupancy?.total_roster ?? 0;
  const totalCapacity = occupancy?.total_capacity ?? 0;
  const utilization = totalCapacity > 0 ? (totalPresent / totalCapacity) * 100 : 0;

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <DashboardHeader
        mode={mode}
        onModeChange={setMode}
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
        loading={loading}
        lastUpdated={lastUpdated}
      />

      {mode === 'live' && !alertDismissed && (
        <AlertBanner
          counts={severityCounts}
          onFilterClick={setSeverityFilter}
          activeFilter={severityFilter}
          onDismiss={() => setAlertDismissed(true)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {mode === 'live' && (
          <Sidebar
            present={totalPresent}
            roster={totalRoster}
            utilization={utilization}
            capacity={totalCapacity}
            criticalCount={severityCounts.critical}
            warningCount={severityCounts.warning}
            showOverloaded={quickFilters.overloaded}
            showUnderutilized={quickFilters.underutilized}
            showHighAbsent={quickFilters.highAbsent}
            selectedZone={quickFilters.zone}
            zones={allZones}
            onFilterChange={handleQuickFilterChange}
          />
        )}

        <main className="flex-1 overflow-auto p-4">
          {loading && !occupancy ? (
            <div className="flex flex-col items-center justify-center py-20 text-cyan-600">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-sm font-medium">Loading...</p>
            </div>
          ) : occupancy ? (
            mode === 'live' ? (
              <ZoneTable zones={zones} onBusClick={(bus) => setSelectedBus(bus)} />
            ) : (
              <AnalyticsDashboard
                zones={zones}
                totalPresent={totalPresent}
                totalRoster={totalRoster}
                totalCapacity={totalCapacity}
              />
            )
          ) : null}
        </main>
      </div>

      {selectedBus && (
        <BusDetailDrawer
          busId={selectedBus.bus_id}
          filters={activeFilters}
          onClose={() => setSelectedBus(null)}
        />
      )}
    </div>
  );
}
```

**Step 3: Verify no TypeScript errors**

Run: `cd web-dashboard && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add web-dashboard/src/pages/BusDashboard.tsx
git commit -m "feat(dashboard): integrate new dashboard with mode toggle and zone table"
```

---

### Task 14: Update Checkbox Component Styling

**Files:**
- Modify: `web-dashboard/src/components/ui/checkbox.tsx`

**Step 1: Read current checkbox component**

Run: `cat web-dashboard/src/components/ui/checkbox.tsx`

**Step 2: Update to support dark theme**

The checkbox component should already work. If it uses Radix UI, just ensure the className props are passed through. This step may not be needed - verify by testing.

**Step 3: Test the application**

Run: `cd web-dashboard && npm run dev`
Expected: Application starts without errors, navigate to dashboard

**Step 4: Commit if changes were made**

```bash
git add -A
git commit -m "fix(ui): update checkbox styling for dark sidebar"
```

---

## Phase 6: Polish & Testing

### Task 15: Add Responsive Behavior

**Files:**
- Modify: `web-dashboard/src/components/Sidebar.tsx`

**Step 1: Add mobile responsive classes**

Update Sidebar to collapse on mobile:

```tsx
// Add to Sidebar.tsx - update the aside className:
<aside className="hidden lg:flex w-64 bg-slate-800 border-r border-slate-700 flex-col">
```

**Step 2: Update main dashboard for mobile**

In BusDashboard.tsx, the sidebar is already conditionally rendered for live mode, and will now be hidden on mobile.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(dashboard): add responsive behavior for mobile"
```

---

### Task 16: Manual Testing Checklist

**Step 1: Test Live Ops Mode**

- [ ] Mode toggle switches between Live/Analytics
- [ ] Alert banner shows with correct counts
- [ ] Clicking status pills filters the table
- [ ] Sidebar KPIs show correct values
- [ ] Quick filters (overloaded, underutilized, high absent) work
- [ ] Zone dropdown filters by zone
- [ ] Zone table expands/collapses
- [ ] Rows are color-coded by severity
- [ ] Clicking a row opens the detail drawer

**Step 2: Test Analytics Mode**

- [ ] Switching to Analytics shows chart grid
- [ ] Summary cards show with trend indicators
- [ ] Utilization trend chart renders
- [ ] Route comparison chart shows zones
- [ ] Heatmap displays attendance data
- [ ] Cost analysis card shows metrics

**Step 3: Test Responsiveness**

- [ ] Sidebar hides on mobile
- [ ] Header wraps properly
- [ ] Charts resize correctly

---

### Task 17: Final Cleanup and Commit

**Step 1: Remove legacy files**

```bash
rm -f web-dashboard/src/pages/BusDashboard_legacy.tsx
```

**Step 2: Run lint**

Run: `cd web-dashboard && npm run lint`
Fix any lint errors.

**Step 3: Run build**

Run: `cd web-dashboard && npm run build`
Expected: Build succeeds

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: cleanup legacy files and ensure build passes"
```

---

## Summary

This implementation plan covers:

1. **Phase 1**: Foundation (theme, mode toggle, alert banner, sidebar)
2. **Phase 2**: Zone-grouped table with severity indicators
3. **Phase 3**: Analytics charts (trend, comparison, heatmap, cost)
4. **Phase 4**: Analytics dashboard layout
5. **Phase 5**: Main dashboard integration
6. **Phase 6**: Polish and testing

Total: 17 tasks, approximately 13 commits.

Each task is designed to be completable in 2-5 minutes with clear file paths and code.
