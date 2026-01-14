import { FilterParams } from '../types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { addDays, startOfMonth, format } from 'date-fns';
import { X } from 'lucide-react';

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
  { value: 'morning', label: 'Morning' },
  { value: 'night', label: 'Night' },
];
const PLANTS = ['P1', 'P2', 'BK', 'Mixed', 'Unassigned'];

export default function FiltersBar({
  filters,
  onFiltersChange,
  onSearch,
  onToday,
  onReset,
  loading,
  availableBuses,
}: FiltersBarProps) {
  const shiftValue = filters.shift || 'all';
  const busValue = filters.bus_id.length ? filters.bus_id[filters.bus_id.length - 1] : 'all';
  const plantValue = filters.plant || 'all';

  const handleChange = (field: keyof FilterParams, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const handleBusToggle = (value: string) => {
    if (value === 'all') {
      onFiltersChange({ ...filters, bus_id: [] });
      return;
    }
    const exists = filters.bus_id.includes(value);
    const next = exists ? filters.bus_id.filter((bus) => bus !== value) : [...filters.bus_id, value];
    onFiltersChange({ ...filters, bus_id: next });
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
      dateFrom = format(addDays(today, -(days - 1)), 'yyyy-MM-dd');
      dateTo = todayStr;
    }

    onFiltersChange({
      ...filters,
      date_from: dateFrom,
      date_to: dateTo,
    });
  };

  const hasActiveFilters = Boolean(filters.shift || filters.bus_id.length || filters.plant);

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 border-b border-emerald-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
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

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <div className="hidden sm:flex items-center gap-1">
                {filters.shift && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">{filters.shift}</Badge>
                )}
                {filters.bus_id.length > 0 && (
                  <Badge className="bg-teal-100 text-teal-700 border-0 text-xs">
                    {filters.bus_id.length} buses
                  </Badge>
                )}
                {filters.plant && (
                  <Badge className="bg-cyan-100 text-cyan-700 border-0 text-xs">{filters.plant}</Badge>
                )}
              </div>
            )}

            {hasActiveFilters && (
              <Button
                onClick={onReset}
                disabled={loading}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}

            <Button onClick={onSearch} disabled={loading} size="sm">
              {loading ? 'Loading...' : 'Search'}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <Input type="date" value={filters.date_from} onChange={(e) => handleChange('date_from', e.target.value)} />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <Input type="date" value={filters.date_to} onChange={(e) => handleChange('date_to', e.target.value)} />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
            <Select value={shiftValue} onValueChange={(value) => handleChange('shift', value === 'all' ? '' : value)}>
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue placeholder="All Shifts" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="all" className="focus:bg-emerald-50">
                  All Shifts
                </SelectItem>
                {SHIFTS.map((shift) => (
                  <SelectItem key={shift.value} value={shift.value} className="focus:bg-emerald-50">
                    {shift.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bus ID</label>
            <Select value={busValue} onValueChange={handleBusToggle}>
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue placeholder={filters.bus_id.length ? `${filters.bus_id.length} selected` : 'All Buses'} />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="all" className="focus:bg-emerald-50">
                  All Buses
                </SelectItem>
                {availableBuses.map((bus) => (
                  <SelectItem key={bus} value={bus} className="focus:bg-emerald-50">
                    {bus}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Plant</label>
            <Select value={plantValue} onValueChange={(value) => handleChange('plant', value === 'all' ? '' : value)}>
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue placeholder="All Plants" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="all" className="focus:bg-emerald-50">
                  All Plants
                </SelectItem>
                {PLANTS.map((plant) => (
                  <SelectItem key={plant} value={plant} className="focus:bg-emerald-50">
                    {plant}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <Button onClick={onToday} disabled={loading} variant="outline" size="sm">
            Jump to Today
          </Button>

          {(filters.date_from || filters.date_to) && (
            <div className="text-sm text-gray-500">
              Showing: <span className="text-emerald-600 font-medium">{filters.date_from || 'Any'}</span>
              {' → '}
              <span className="text-emerald-600 font-medium">{filters.date_to || 'Any'}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
