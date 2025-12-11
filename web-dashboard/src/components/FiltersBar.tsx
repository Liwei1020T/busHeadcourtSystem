import { FilterParams } from '../types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SPACING, TYPOGRAPHY } from '@/lib/design-system/tokens';
import { addDays, startOfMonth, format } from 'date-fns';

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

  return (
    <Card className="p-4 mb-6">
      {/* Quick Date Selector */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600 font-medium mr-2">Quick:</span>
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
            Last 7 Days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickDate(30)}
            disabled={loading}
            className="text-xs"
          >
            Last 30 Days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickDate('month')}
            disabled={loading}
            className="text-xs"
          >
            This Month
          </Button>
        </div>
      </div>
      
      {/* Primary Filters Row */}
      <div className={`flex flex-wrap ${SPACING.inlineLg} items-end mb-4`}>
        {/* Date From */}
        <div className="w-full sm:flex-1 sm:min-w-[140px]">
          <label className={`block ${TYPOGRAPHY.label} mb-1`}>
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
          <label className={`block ${TYPOGRAPHY.label} mb-1`}>
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
          <label className={`block ${TYPOGRAPHY.label} mb-1`}>
            Shift
          </label>
          <Select 
            value={shiftValue}
            onValueChange={(value) => handleChange('shift', value === 'all' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Shifts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shifts</SelectItem>
              {SHIFTS.map((shift) => (
                <SelectItem key={shift.value} value={shift.value}>
                  {shift.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Button */}
        <div className={`w-full sm:w-auto flex ${SPACING.inline}`}>
          <Button
            onClick={onSearch}
            disabled={loading}
            className="w-full sm:w-auto px-6"
          >
            {loading ? 'Loading...' : 'Search'}
          </Button>
          <Button
            onClick={onToday}
            disabled={loading}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Today
          </Button>
        </div>
      </div>

      {/* Advanced Filters Row */}
      <div className="border-t border-gray-200 pt-4">
        <div className={`flex flex-wrap ${SPACING.inlineLg} items-end`}>
          {/* Bus ID Select */}
          <div className="w-full sm:flex-1 sm:min-w-[130px]">
            <label className={`block ${TYPOGRAPHY.label} mb-1`}>
              Bus ID
            </label>
            <Select 
              value={busValue}
              onValueChange={(value) => handleChange('bus_id', value === 'all' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Buses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Buses</SelectItem>
                {availableBuses.map((bus) => (
                  <SelectItem key={bus} value={bus}>
                    {bus}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset Button */}
          <div className="w-full sm:w-auto">
            <Button
              onClick={onReset}
              disabled={loading || !hasActiveFilters}
              variant={hasActiveFilters ? 'destructive' : 'outline'}
              className="w-full sm:w-auto"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className={`flex flex-wrap ${SPACING.inline} items-center`}>
            <span className={TYPOGRAPHY.bodySm}>Active filters:</span>
            {filters.shift && (
              <Badge variant="default">
                Shift: {filters.shift}
              </Badge>
            )}
            {filters.bus_id && (
              <Badge variant="secondary">
                Bus: {filters.bus_id}
              </Badge>
            )}
            {(filters.date_from || filters.date_to) && (
              <Badge variant="outline">
                Dates: {filters.date_from || 'Any'} → {filters.date_to || 'Any'}
              </Badge>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
