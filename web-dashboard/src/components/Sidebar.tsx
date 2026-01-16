// web-dashboard/src/components/Sidebar.tsx

import { Filter, Bus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SidebarProps = {
  busPresent: number;
  busUtilization: number;
  busCapacity: number;
  criticalCount: number;
  warningCount: number;
  // Quick filters
  showOverloaded: boolean;
  showUnderutilized: boolean;
  selectedPlant: string;
  plants: string[];
  onFilterChange: (filter: string, value: boolean | string) => void;
};

export default function Sidebar({
  busPresent,
  busUtilization,
  busCapacity,
  criticalCount,
  warningCount,
  showOverloaded,
  showUnderutilized,
  selectedPlant,
  plants,
  onFilterChange,
}: SidebarProps) {
  const utilPct = Math.min(busUtilization, 100);

  return (
    <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Today's Status
        </h2>
      </div>

      {/* KPIs */}
      <div className="p-4 space-y-4 border-b border-slate-100">
        {/* Bus Utilization */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase">Bus Utilization</span>
            <Bus className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-800 font-mono">
            {busUtilization.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500">
            {busPresent.toLocaleString()} / {busCapacity.toLocaleString()} seats
          </div>
          <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                busUtilization > 100 ? 'bg-red-500' : busUtilization > 80 ? 'bg-emerald-500' : busUtilization < 30 ? 'bg-red-400' : 'bg-amber-500'
              }`}
              style={{ width: `${utilPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Problem Counts */}
      <div className="p-4 border-b border-slate-100">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Problem Buses
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-sm text-slate-600">Critical (&lt;30%)</span>
            </div>
            <span className="text-sm font-bold text-red-600 font-mono">{criticalCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-sm text-slate-600">Warning (30-70%)</span>
            </div>
            <span className="text-sm font-bold text-amber-600 font-mono">{warningCount}</span>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="p-4 flex-1">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" />
          Quick Filters
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={showOverloaded}
              onCheckedChange={(c: boolean | 'indeterminate') => onFilterChange('overloaded', !!c)}
              className="border-slate-300 data-[state=checked]:bg-emerald-600"
            />
            <span className="text-sm text-slate-600">Overloaded (&gt;100%)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={showUnderutilized}
              onCheckedChange={(c: boolean | 'indeterminate') => onFilterChange('underutilized', !!c)}
              className="border-slate-300 data-[state=checked]:bg-emerald-600"
            />
            <span className="text-sm text-slate-600">Underutilized (&lt;30%)</span>
          </label>

          <div className="pt-2">
            <Select
              value={selectedPlant || 'all'}
              onValueChange={(v) => onFilterChange('plant', v === 'all' ? '' : v)}
            >
              <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-700 h-9">
                <SelectValue placeholder="All Plants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plants</SelectItem>
                {plants.map((p) => (
                  <SelectItem key={p} value={p}>Plant {p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </aside>
  );
}
