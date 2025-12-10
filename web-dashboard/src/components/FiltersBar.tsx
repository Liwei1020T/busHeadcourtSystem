import { FilterParams } from '../types';

type FiltersBarProps = {
  filters: FilterParams;
  onFiltersChange: (filters: FilterParams) => void;
  onSearch: () => void;
  onReset: () => void;
  loading: boolean;
  availableBuses: string[];
  availableTripCodes: string[];
};

const ROUTES = [
  { value: '', label: 'All Routes' },
  { value: 'SP', label: 'SP to Factory' },
  { value: 'Kulim', label: 'Kulim to Factory' },
  { value: 'Penang', label: 'Penang to Factory' },
];

const DIRECTIONS = [
  { value: '', label: 'All Directions' },
  { value: 'to_factory', label: 'To Factory' },
  { value: 'from_factory', label: 'From Factory' },
];

const LOAD_FACTOR_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '0', label: '0%' },
  { value: '0.25', label: '25%' },
  { value: '0.5', label: '50%' },
  { value: '0.75', label: '75%' },
  { value: '1', label: '100%' },
];

export default function FiltersBar({ 
  filters, 
  onFiltersChange, 
  onSearch, 
  onReset,
  loading,
  availableBuses,
  availableTripCodes 
}: FiltersBarProps) {
  const handleChange = (field: keyof FilterParams, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const hasActiveFilters = filters.route || filters.direction || filters.bus_id || 
    filters.trip_code || filters.load_factor_min || filters.load_factor_max;

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      {/* Primary Filters Row */}
      <div className="flex flex-wrap gap-4 items-end mb-4">
        {/* Date From */}
        <div className="flex-1 min-w-[140px]">
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
        <div className="flex-1 min-w-[140px]">
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

        {/* Route Select */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Route
          </label>
          <select
            value={filters.route}
            onChange={(e) => handleChange('route', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {ROUTES.map((route) => (
              <option key={route.value} value={route.value}>
                {route.label}
              </option>
            ))}
          </select>
        </div>

        {/* Direction Select */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Direction
          </label>
          <select
            value={filters.direction}
            onChange={(e) => handleChange('direction', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {DIRECTIONS.map((dir) => (
              <option key={dir.value} value={dir.value}>
                {dir.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search Button */}
        <div className="flex gap-2">
          <button
            onClick={onSearch}
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white font-medium rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Advanced Filters Row (collapsible feel with divider) */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Bus ID Select */}
          <div className="flex-1 min-w-[130px]">
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

          {/* Trip Code Select */}
          <div className="flex-1 min-w-[130px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trip Code
            </label>
            <select
              value={filters.trip_code}
              onChange={(e) => handleChange('trip_code', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Trips</option>
              {availableTripCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>

          {/* Load Factor Min */}
          <div className="flex-1 min-w-[120px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Load Factor Min
            </label>
            <select
              value={filters.load_factor_min}
              onChange={(e) => handleChange('load_factor_min', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {LOAD_FACTOR_OPTIONS.map((opt) => (
                <option key={`min-${opt.value}`} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Load Factor Max */}
          <div className="flex-1 min-w-[120px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Load Factor Max
            </label>
            <select
              value={filters.load_factor_max}
              onChange={(e) => handleChange('load_factor_max', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {LOAD_FACTOR_OPTIONS.map((opt) => (
                <option key={`max-${opt.value}`} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          <div>
            <button
              onClick={onReset}
              disabled={loading}
              className={`px-4 py-2 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
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
            {filters.route && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Route: {filters.route}
              </span>
            )}
            {filters.direction && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {filters.direction === 'to_factory' ? 'To Factory' : 'From Factory'}
              </span>
            )}
            {filters.bus_id && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Bus: {filters.bus_id}
              </span>
            )}
            {filters.trip_code && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Trip: {filters.trip_code}
              </span>
            )}
            {(filters.load_factor_min || filters.load_factor_max) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Load: {filters.load_factor_min ? `${Number(filters.load_factor_min) * 100}%` : '0%'} - {filters.load_factor_max ? `${Number(filters.load_factor_max) * 100}%` : '100%'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
