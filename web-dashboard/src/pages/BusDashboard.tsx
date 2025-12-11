import { useState, useEffect, useMemo } from 'react';
import FiltersBar from '../components/FiltersBar';
import KpiCard from '../components/KpiCard';
import TripTable from '../components/TripTable';
import ScanTable from '../components/ScanTable';
import { exportHeadcountCsv, fetchHeadcount } from '../api';
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
  const [exporting, setExporting] = useState(false);
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

  const handleSearch = async (overrideFilters?: FilterParams) => {
    setLoading(true);
    setError(null);

    const activeFilters = overrideFilters || filters;

    try {
      // Only pass API-supported filters to backend
      const data = await fetchHeadcount({
        date_from: activeFilters.date_from,
        date_to: activeFilters.date_to,
        shift: activeFilters.shift,
        bus_id: activeFilters.bus_id,
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

  const handleToday = async () => {
    const todayString = getTodayString();
    const todayFilters: FilterParams = {
      date_from: todayString,
      date_to: todayString,
      shift: '',
      bus_id: '',
    };
    setFilters(todayFilters);
    await handleSearch(todayFilters);
  };

  // Load data on mount
  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHeadcountExport = async () => {
    setExporting(true);
    setError(null);
    try {
      await exportHeadcountCsv({
        date_from: filters.date_from,
        date_to: filters.date_to,
        shift: filters.shift || undefined,
        bus_id: filters.bus_id || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export headcount');
    } finally {
      setExporting(false);
    }
  };

  // Check if local filters are active (showing filtered vs total)
  const hasLocalFilters = filters.bus_id;
  const showingFiltered = hasLocalFilters && filteredRows.length !== headcount.rows.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bus Passenger Dashboard</h1>
          <p className="text-sm text-gray-500">Factory Bus Optimization System</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Today</p>
          <p className="text-lg font-semibold text-gray-900">{today}</p>
        </div>
      </div>

      <FiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
        onToday={handleToday}
        onReset={handleReset}
        loading={loading}
        availableBuses={availableBuses}
      />

      <div className="flex flex-wrap justify-end gap-2 -mt-4 mb-2">
        <button
          onClick={handleHeadcountExport}
          disabled={exporting}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? 'Downloading...' : 'Download Headcount CSV'}
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {showingFiltered && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-700 text-sm">
          Showing <strong>{filteredRows.length}</strong> of <strong>{headcount.rows.length}</strong> rows with the bus filter applied
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TripTable rows={filteredRows} loading={loading} />
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 h-full min-h-[300px] flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h3>
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

      <div>
        <ScanTable
          initialDate={today}
          initialBusId={filters.bus_id}
          initialShift={filters.shift}
          availableBuses={availableBuses}
        />
      </div>
    </div>
  );
}
