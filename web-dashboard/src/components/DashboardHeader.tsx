// web-dashboard/src/components/DashboardHeader.tsx

import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Calendar, Clock, MapPin, Bus, Search, Timer } from 'lucide-react';
import { format, subDays, startOfMonth } from 'date-fns';
import ModeToggle, { DashboardMode } from './ModeToggle';
import MultiSelect from './MultiSelect';
import { FilterParams, FilterOptions } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AutoRefreshInterval = 0 | 30 | 60 | 120;

type DashboardHeaderProps = {
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  filters: FilterParams;
  onFiltersChange: (filters: FilterParams) => void;
  onSearch: () => void;
  loading: boolean;
  lastUpdated: string | null;
  filterOptions: FilterOptions;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
};

export default function DashboardHeader({
  mode,
  onModeChange,
  filters,
  onFiltersChange,
  onSearch,
  loading,
  lastUpdated,
  filterOptions,
  searchQuery = '',
  onSearchQueryChange,
}: DashboardHeaderProps) {
  const [autoRefresh, setAutoRefresh] = useState<AutoRefreshInterval>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onSearchRef = useRef(onSearch);

  // Keep ref updated
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Auto-refresh logic
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (autoRefresh > 0) {
      intervalRef.current = setInterval(() => {
        onSearchRef.current();
      }, autoRefresh * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh]); // Only re-run when autoRefresh changes

  const handleDateChange = (field: 'date_from' | 'date_to', value: string) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const handleArrayChange = (field: keyof FilterParams, value: string[]) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const handleQuickDate = (range: 'today' | 'week' | 'month') => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    let fromStr = todayStr;

    if (range === 'week') {
      fromStr = format(subDays(today, 6), 'yyyy-MM-dd');
    } else if (range === 'month') {
      fromStr = format(startOfMonth(today), 'yyyy-MM-dd');
    }

    onFiltersChange({
      ...filters,
      date_from: fromStr,
      date_to: todayStr,
    });
  };

  // Convert filter options to MultiSelect format
  const plantOptions = filterOptions.plants.map((p) => ({ label: p, value: p }));
  const shiftOptions = filterOptions.shifts.map((s) => ({
    label: s.charAt(0).toUpperCase() + s.slice(1),
    value: s,
  }));
  const busOptions = filterOptions.buses.map((b) => ({ label: b, value: b }));
  const routeOptions = filterOptions.routes.map((r) => ({ label: r, value: r }));

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
      <div className="px-4 py-3 space-y-3">
        {/* Top Row: Mode & Global Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ModeToggle mode={mode} onChange={onModeChange} />
            <div className="h-6 w-px bg-slate-200" />
            <div className="text-sm text-slate-500 hidden sm:block">
              {lastUpdated && `Last updated: ${lastUpdated}`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Box */}
            {onSearchQueryChange && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search bus or route..."
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  className="pl-8 h-9 w-48 text-sm border-slate-200"
                />
              </div>
            )}

            {/* Auto Refresh Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <Timer className={`w-4 h-4 ml-1 ${autoRefresh > 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
              <select
                value={autoRefresh}
                onChange={(e) => setAutoRefresh(Number(e.target.value) as AutoRefreshInterval)}
                className="bg-transparent text-xs font-medium text-slate-600 border-none focus:ring-0 cursor-pointer pr-1"
              >
                <option value={0}>Off</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={120}>2m</option>
              </select>
            </div>

             {/* Quick Date Switches */}
            <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
              <button
                onClick={() => handleQuickDate('today')}
                className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all"
              >
                Today
              </button>
              <button
                onClick={() => handleQuickDate('week')}
                className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all"
              >
                Week
              </button>
              <button
                onClick={() => handleQuickDate('month')}
                className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all"
              >
                Month
              </button>
            </div>

            <Button
              onClick={onSearch}
              disabled={loading}
              size="sm"
              className="h-9 px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/50 shadow-lg font-medium"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                'Apply Filters'
              )}
            </Button>
          </div>
        </div>

        {/* Bottom Row: Filters */}
        <div className="flex flex-wrap gap-3 items-center bg-slate-50/50 p-2 rounded-xl border border-slate-100">
          {/* Date Range */}
          <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <Input
              type="date"
              className="w-[130px] h-8 border-none text-slate-700 text-sm focus-visible:ring-0 p-0"
              value={filters.date_from}
              onChange={(e) => handleDateChange('date_from', e.target.value)}
            />
            <span className="text-slate-300 text-sm">→</span>
            <Input
              type="date"
              className="w-[130px] h-8 border-none text-slate-700 text-sm focus-visible:ring-0 p-0"
              value={filters.date_to}
              onChange={(e) => handleDateChange('date_to', e.target.value)}
            />
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          {/* Plant Multi-select */}
          <div className="flex-1 min-w-[140px] max-w-[200px]">
            <MultiSelect
              options={plantOptions}
              value={filters.plants}
              onChange={(v) => handleArrayChange('plants', v)}
              placeholder="All Plants"
              icon={<MapPin className="w-4 h-4 text-slate-400" />}
            />
          </div>

          {/* Shift Multi-select */}
          <div className="flex-1 min-w-[140px] max-w-[200px]">
            <MultiSelect
              options={shiftOptions}
              value={filters.shifts}
              onChange={(v) => handleArrayChange('shifts', v)}
              placeholder="All Shifts"
              icon={<Clock className="w-4 h-4 text-slate-400" />}
            />
          </div>

          {/* Bus Multi-select */}
          <div className="flex-1 min-w-[140px] max-w-[200px]">
            <MultiSelect
              options={busOptions}
              value={filters.bus_ids}
              onChange={(v) => handleArrayChange('bus_ids', v)}
              placeholder="All Buses"
              icon={<Bus className="w-4 h-4 text-slate-400" />}
            />
          </div>

          {/* Route Multi-select */}
          <div className="flex-1 min-w-[140px] max-w-[200px]">
            <MultiSelect
              options={routeOptions}
              value={filters.routes}
              onChange={(v) => handleArrayChange('routes', v)}
              placeholder="All Routes"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
