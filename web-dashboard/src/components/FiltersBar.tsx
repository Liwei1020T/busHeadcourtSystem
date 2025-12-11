import { FilterParams } from '../types';

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
  { value: '', label: 'All Shifts' },
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
  const handleChange = (field: keyof FilterParams, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const hasActiveFilters = Boolean(filters.shift || filters.bus_id);

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      {/* Primary Filters Row */}
      <div className="flex flex-wrap gap-4 items-end mb-4">
        {/* Date From */}
        <div className="w-full sm:flex-1 sm:min-w-[140px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date From
          </label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => handleChange('date_from', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Date To */}
        <div className="w-full sm:flex-1 sm:min-w-[140px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date To
          </label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => handleChange('date_to', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Shift Select */}
        <div className="w-full sm:flex-1 sm:min-w-[160px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shift
          </label>
          <select
            value={filters.shift}
            onChange={(e) => handleChange('shift', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {SHIFTS.map((shift) => (
              <option key={shift.value} value={shift.value}>
                {shift.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search Button */}
        <div className="w-full sm:w-auto flex gap-2">
          <button
            onClick={onSearch}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2 bg-primary-600 text-white font-medium rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Search'}
          </button>
          <button
            onClick={onToday}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 bg-white text-primary-700 border border-primary-200 font-medium rounded-md shadow-sm hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Today
          </button>
        </div>
      </div>

      {/* Advanced Filters Row (collapsible feel with divider) */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Bus ID Select */}
          <div className="w-full sm:flex-1 sm:min-w-[130px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bus ID
            </label>
            <select
              value={filters.bus_id}
              onChange={(e) => handleChange('bus_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Buses</option>
              {availableBuses.map((bus) => (
                <option key={bus} value={bus}>
                  {bus}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          <div className="w-full sm:w-auto">
            <button
              onClick={onReset}
              disabled={loading}
              className={`w-full sm:w-auto px-4 py-2 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                hasActiveFilters 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500' 
                  : 'bg-gray-100 text-gray-500 cursor-not-allowed'
              }`}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500">Active filters:</span>
            {filters.shift && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Shift: {filters.shift}
              </span>
            )}
            {filters.bus_id && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Bus: {filters.bus_id}
              </span>
            )}
            {(filters.date_from || filters.date_to) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Dates: {filters.date_from || 'Any'} → {filters.date_to || 'Any'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
