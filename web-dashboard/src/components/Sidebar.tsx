// web-dashboard/src/components/Sidebar.tsx

import { TrendingUp, Users, Filter } from 'lucide-react';
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
              onCheckedChange={(c: boolean | 'indeterminate') => onFilterChange('overloaded', !!c)}
              className="border-slate-600 data-[state=checked]:bg-cyan-500"
            />
            <span className="text-sm text-slate-300">Overloaded (&gt;100%)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={showUnderutilized}
              onCheckedChange={(c: boolean | 'indeterminate') => onFilterChange('underutilized', !!c)}
              className="border-slate-600 data-[state=checked]:bg-cyan-500"
            />
            <span className="text-sm text-slate-300">Underutilized (&lt;30%)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={showHighAbsent}
              onCheckedChange={(c: boolean | 'indeterminate') => onFilterChange('highAbsent', !!c)}
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
