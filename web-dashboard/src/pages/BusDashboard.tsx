import { useState, useEffect, useMemo } from 'react';
import FiltersBar from '../components/FiltersBar';
import KpiCard from '../components/KpiCard';
import TripTable from '../components/TripTable';
import ScanTable from '../components/ScanTable';
import { fetchHeadcount } from '../api';
import { HeadcountResponse, FilterParams } from '../types';

// Get today's date in YYYY-MM-DD format
function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Get date 7 days ago in YYYY-MM-DD format
function getWeekAgoString(): string {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().split('T')[0];
}

// Initial filter state
const getInitialFilters = (): FilterParams => ({
  date_from: getWeekAgoString(),
  date_to: getTodayString(),
  shift: '',
  bus_id: '',
});

export default function BusDashboard() {
  const today = getTodayString();
  
  const [filters, setFilters] = useState<FilterParams>(getInitialFilters());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [headcount, setHeadcount] = useState<HeadcountResponse>({
    rows: [],
  });

  // Extract unique buses from data for filter dropdowns
  const availableBuses = useMemo(() => {
    const buses = new Set(headcount.rows.map(t => t.bus_id).filter(Boolean));
    return Array.from(buses).sort();
  }, [headcount.rows]);

  // Apply local filters (bus only - shift/date handled server-side)
  const filteredRows = useMemo(() => {
    let rows = headcount.rows;
    if (filters.bus_id) {
      rows = rows.filter(t => t.bus_id === filters.bus_id);
    }
    return rows;
  }, [headcount.rows, filters.bus_id]);

  // Calculate KPIs from filtered rows
  const filteredKpis = useMemo(() => {
    if (filteredRows.length === 0) {
      return {
        total_present: 0,
        total_unknown_batch: 0,
        total_unknown_shift: 0,
        row_count: 0,
      };
    }

    let present = 0;
    let unknownBatch = 0;
    let unknownShift = 0;

    filteredRows.forEach(r => {
      present += r.present;
      unknownBatch += r.unknown_batch;
      unknownShift += r.unknown_shift;
    });

    return {
      total_present: present,
      total_unknown_batch: unknownBatch,
      total_unknown_shift: unknownShift,
      row_count: filteredRows.length,
    };
  }, [filteredRows]);

  // Load data on mount
  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      // Only pass API-supported filters to backend
      const data = await fetchHeadcount({
        date_from: filters.date_from,
        date_to: filters.date_to,
        shift: filters.shift,
        bus_id: filters.bus_id,
      });
      setHeadcount(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setHeadcount({ rows: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters(getInitialFilters());
  };

  // Check if local filters are active (showing filtered vs total)
  const hasLocalFilters = filters.bus_id;
  const showingFiltered = hasLocalFilters && filteredRows.length !== headcount.rows.length;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Bus Passenger Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Factory Bus Optimization System
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Today</p>
              <p className="text-lg font-semibold text-gray-900">{today}</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <FiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          onReset={handleReset}
          loading={loading}
          availableBuses={availableBuses}
        />

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Filtered Data Info */}
        {showingFiltered && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-700 text-sm">
            Showing <strong>{filteredTrips.length}</strong> of <strong>{summary.trips.length}</strong> trips based on local filters
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="Total Present"
            value={filteredKpis.total_present ?? '-'}
            subtitle={showingFiltered ? 'filtered results' : 'in selected period'}
            color="blue"
          />
          <KpiCard
            title="Unknown Batch"
            value={filteredKpis.total_unknown_batch ?? '-'}
            subtitle="needs mapping"
            color="yellow"
          />
          <KpiCard
            title="Unknown Shift"
            value={filteredKpis.total_unknown_shift ?? '-'}
            subtitle="outside shift window"
            color="red"
          />
          <KpiCard
            title="Row Count"
            value={filteredKpis.row_count ?? '-'}
            subtitle={showingFiltered ? `of ${headcount.rows.length} total` : 'aggregated rows'}
            color="green"
          />
        </div>

        {/* Middle Section - Trip Table and Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Trip Table - takes 2/3 of the space on large screens */}
          <div className="lg:col-span-2">
            <TripTable rows={filteredRows} loading={loading} />
          </div>

          {/* Chart Placeholder - takes 1/3 of the space on large screens */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 h-full min-h-[300px] flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Analytics
              </h3>
              <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="text-center text-gray-400">
                  <svg
                    className="mx-auto h-12 w-12 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <p className="text-sm">Chart area (placeholder)</p>
                  <p className="text-xs mt-1">Future analytics visualization</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Scan Details */}
        <div>
          <ScanTable initialDate={today} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Bus Passenger Counting & Optimization System - Internal Use Only
          </p>
        </div>
      </footer>
    </div>
  );
}
