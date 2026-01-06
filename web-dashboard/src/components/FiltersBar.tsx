import { useState } from 'react';
import { FilterParams } from '../types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SPACING } from '@/lib/design-system/tokens';
import { addDays, startOfMonth, format } from 'date-fns';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';

type FiltersBarProps = {
  filters: FilterParams;
  onFiltersChange: (filters: FilterParams) => void;
  onSearch: () => void;
  onToday: () => void;
  onReset: () => void;
  loading: boolean;
  availableBuses: string[];
};

const SHIFTS = [
  { value: 'morning', label: 'Morning (04:00-10:00)' },
  { value: 'night', label: 'Night (16:00-21:00)' },
];

export default function FiltersBar({
  filters,
  onFiltersChange,
  onSearch,
  onToday,
  onReset,
  loading,
  availableBuses
}: FiltersBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shiftValue = filters.shift || 'all';
  const busValue = filters.bus_id || 'all';

  const handleChange = (field: keyof FilterParams, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const handleQuickDate = (days: number | 'month' | 'today') => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    let dateFrom: string;
    let dateTo: string;

    if (days === 'today') {
      dateFrom = todayStr;
      dateTo = todayStr;
    } else if (days === 'month') {
      dateFrom = format(startOfMonth(today), 'yyyy-MM-dd');
      dateTo = todayStr;
    } else {
      dateFrom = format(addDays(today, -days), 'yyyy-MM-dd');
      dateTo = todayStr;
    }

    onFiltersChange({
      ...filters,
      date_from: dateFrom,
      date_to: dateTo,
    });
  };

  const hasActiveFilters = Boolean(filters.shift || filters.bus_id);
  const activeFilterCount = [filters.shift, filters.bus_id].filter(Boolean).length;

  return (
    <Card className="mb-6 overflow-hidden">
      {/* Compact Header */}
      <div className="p-4 bg-gradient-to-r from-emerald-50/80 to-teal-50/50">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          {/* Quick Date Buttons */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500 font-medium mr-1">Quick:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate('today')}
              disabled={loading}
              className="text-xs"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate(7)}
              disabled={loading}
              className="text-xs"
            >
              7 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate(30)}
              disabled={loading}
              className="text-xs"
            >
              30 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate('month')}
              disabled={loading}
              className="text-xs"
            >
              Month
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Active Filter Badges */}
            {hasActiveFilters && (
              <div className="hidden sm:flex items-center gap-1">
                {filters.shift && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                    {filters.shift}
                  </Badge>
                )}
                {filters.bus_id && (
                  <Badge className="bg-teal-100 text-teal-700 border-0 text-xs">
                    {filters.bus_id}
                  </Badge>
                )}
              </div>
            )}

            {/* Expand/Collapse Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter className="w-4 h-4 mr-1" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-xs">
                  {activeFilterCount}
                </span>
              )}
              {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>

            <Button
              onClick={onSearch}
              disabled={loading}
              size="sm"
            >
              {loading ? 'Loading...' : 'Search'}
            </Button>
          </div>
        </div>
      </div>

      {/* Expandable Filters Section */}
      <div
        className={`
          transition-all duration-300 ease-in-out overflow-hidden
          ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-4 pb-4 pt-4 border-t border-emerald-100 bg-white">
          {/* Primary Filters Row */}
          <div className={`flex flex-wrap ${SPACING.inlineLg} items-end mb-4`}>
            {/* Date From */}
            <div className="w-full sm:flex-1 sm:min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date From
              </label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleChange('date_from', e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="w-full sm:flex-1 sm:min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date To
              </label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleChange('date_to', e.target.value)}
              />
            </div>

            {/* Shift Select */}
            <div className="w-full sm:flex-1 sm:min-w-[160px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shift
              </label>
              <Select
                value={shiftValue}
                onValueChange={(value) => handleChange('shift', value === 'all' ? '' : value)}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="All Shifts" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all" className="focus:bg-emerald-50">All Shifts</SelectItem>
                  {SHIFTS.map((shift) => (
                    <SelectItem key={shift.value} value={shift.value} className="focus:bg-emerald-50">
                      {shift.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bus ID Select */}
            <div className="w-full sm:flex-1 sm:min-w-[130px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bus ID
              </label>
              <Select
                value={busValue}
                onValueChange={(value) => handleChange('bus_id', value === 'all' ? '' : value)}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="All Buses" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all" className="focus:bg-emerald-50">All Buses</SelectItem>
                  {availableBuses.map((bus) => (
                    <SelectItem key={bus} value={bus} className="focus:bg-emerald-50">
                      {bus}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={onToday}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                Jump to Today
              </Button>

              {hasActiveFilters && (
                <Button
                  onClick={onReset}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Date Range Display */}
            {(filters.date_from || filters.date_to) && (
              <div className="text-sm text-gray-500">
                Showing: <span className="text-emerald-600 font-medium">{filters.date_from || 'Any'}</span>
                {' → '}
                <span className="text-emerald-600 font-medium">{filters.date_to || 'Any'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
