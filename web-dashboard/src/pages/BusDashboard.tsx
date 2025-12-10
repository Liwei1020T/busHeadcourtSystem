import { useState, useEffect, useMemo } from 'react';
import FiltersBar from '../components/FiltersBar';
import KpiCard from '../components/KpiCard';
import TripTable from '../components/TripTable';
import ScanTable from '../components/ScanTable';
import { fetchSummary } from '../api';
import { SummaryResponse, FilterParams, TripSummary } from '../types';

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

// Format currency
function formatCurrency(value: number | null): string {
  if (value === null) return '-';
  return `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// Format percentage
function formatPercentage(value: number | null): string {
  if (value === null) return '-';
  return `${(value * 100).toFixed(1)}%`;
}

// Initial filter state
const getInitialFilters = (): FilterParams => ({
  date_from: getWeekAgoString(),
  date_to: getTodayString(),
  route: '',
  direction: '',
  bus_id: '',
  trip_code: '',
  load_factor_min: '',
  load_factor_max: '',
});

export default function BusDashboard() {
  const today = getTodayString();
  
  const [filters, setFilters] = useState<FilterParams>(getInitialFilters());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [summary, setSummary] = useState<SummaryResponse>({
    total_passengers: null,
    avg_load_factor: null,
    trip_count: null,
    saving_estimate: null,
    trips: [],
  });

  // Extract unique buses and trip codes from data for filter dropdowns
  const availableBuses = useMemo(() => {
    const buses = new Set(summary.trips.map(t => t.bus_id));
    return Array.from(buses).sort();
  }, [summary.trips]);

  const availableTripCodes = useMemo(() => {
    const codes = new Set(summary.trips.map(t => t.trip_code));
    return Array.from(codes).sort();
  }, [summary.trips]);

  // Apply local filters to trips (for filters not supported by API)
  const filteredTrips = useMemo(() => {
    let trips = summary.trips;

    // Filter by bus_id
    if (filters.bus_id) {
      trips = trips.filter(t => t.bus_id === filters.bus_id);
    }

    // Filter by trip_code
    if (filters.trip_code) {
      trips = trips.filter(t => t.trip_code === filters.trip_code);
    }

    // Filter by load_factor_min
    if (filters.load_factor_min) {
      const minLoad = parseFloat(filters.load_factor_min);
      trips = trips.filter(t => (t.load_factor ?? 0) >= minLoad);
    }

    // Filter by load_factor_max
    if (filters.load_factor_max) {
      const maxLoad = parseFloat(filters.load_factor_max);
      trips = trips.filter(t => (t.load_factor ?? 0) <= maxLoad);
    }

    return trips;
  }, [summary.trips, filters.bus_id, filters.trip_code, filters.load_factor_min, filters.load_factor_max]);

  // Calculate KPIs from filtered trips
  const filteredKpis = useMemo(() => {
    if (filteredTrips.length === 0) {
      return {
        total_passengers: 0,
        avg_load_factor: null,
        trip_count: 0,
        saving_estimate: 0,
      };
    }

    let totalPassengers = 0;
    let totalLoadFactor = 0;
    let validLoadFactors = 0;
    let underutilizedTrips = 0;

    filteredTrips.forEach(trip => {
      totalPassengers += trip.passenger_count ?? 0;
      if (trip.load_factor !== null) {
        totalLoadFactor += trip.load_factor;
        validLoadFactors++;
        if (trip.load_factor < 0.5) {
          underutilizedTrips++;
        }
      }
    });

    return {
      total_passengers: totalPassengers,
      avg_load_factor: validLoadFactors > 0 ? totalLoadFactor / validLoadFactors : null,
      trip_count: filteredTrips.length,
      saving_estimate: underutilizedTrips * 500,
    };
  }, [filteredTrips]);

  // Load data on mount
  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      // Only pass API-supported filters to backend
      const data = await fetchSummary({
        date_from: filters.date_from,
        date_to: filters.date_to,
        route: filters.route,
        direction: filters.direction,
      });
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setSummary({
        total_passengers: null,
        avg_load_factor: null,
        trip_count: null,
        saving_estimate: null,
        trips: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters(getInitialFilters());
  };

  // Check if local filters are active (showing filtered vs total)
  const hasLocalFilters = filters.bus_id || filters.trip_code || filters.load_factor_min || filters.load_factor_max;
  const showingFiltered = hasLocalFilters && filteredTrips.length !== summary.trips.length;

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
          availableTripCodes={availableTripCodes}
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
            title="Total Passengers"
            value={filteredKpis.total_passengers ?? '-'}
            subtitle={showingFiltered ? 'filtered results' : 'in selected period'}
            color="blue"
          />
          <KpiCard
            title="Average Load Factor"
            value={formatPercentage(filteredKpis.avg_load_factor)}
            subtitle="bus utilization"
            color={
              filteredKpis.avg_load_factor !== null && filteredKpis.avg_load_factor >= 0.7
                ? 'green'
                : filteredKpis.avg_load_factor !== null && filteredKpis.avg_load_factor >= 0.5
                ? 'yellow'
                : 'red'
            }
          />
          <KpiCard
            title="Trip Count"
            value={filteredKpis.trip_count ?? '-'}
            subtitle={showingFiltered ? `of ${summary.trips.length} total` : 'total trips'}
            color="blue"
          />
          <KpiCard
            title="Saving Estimate"
            value={formatCurrency(filteredKpis.saving_estimate)}
            subtitle="potential savings"
            color="green"
          />
        </div>

        {/* Middle Section - Trip Table and Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Trip Table - takes 2/3 of the space on large screens */}
          <div className="lg:col-span-2">
            <TripTable trips={filteredTrips} loading={loading} />
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
