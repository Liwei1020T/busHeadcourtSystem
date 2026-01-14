// web-dashboard/src/components/DashboardHeader.tsx

import { Bus, RefreshCw } from 'lucide-react';
import ModeToggle, { DashboardMode } from './ModeToggle';
import { FilterParams } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
