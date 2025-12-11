import { useState, useEffect, useMemo, useRef } from 'react';
import FiltersBar from '../components/FiltersBar';
import KpiCard from '../components/KpiCard';
import TripTable from '../components/TripTable';
import ScanTable from '../components/ScanTable';
import HeadcountChart from '../components/HeadcountChart';
import AttendanceTrendChart from '../components/AttendanceTrendChart';
import BusComparisonChart from '../components/BusComparisonChart';
import ShiftDistributionChart from '../components/ShiftDistributionChart';
import EmptyState from '../components/EmptyState';
import { exportHeadcountCsv, fetchBuses, fetchHeadcount } from '../api';
import { HeadcountResponse, FilterParams } from '../types';
import { Button } from '@/components/ui/button';
import { SPACING, TYPOGRAPHY } from '@/lib/design-system/tokens';
import { Users, AlertTriangle, Clock, Database } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const filtersRef = useRef<FilterParams>(getInitialFilters());

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [busOptions, setBusOptions] = useState<string[]>([]);
  
  const [headcount, setHeadcount] = useState<HeadcountResponse>({
    rows: [],
  });

  // Build dropdown options from master bus list plus any buses in the current dataset
  const availableBuses = useMemo(() => {
    const buses = new Set(busOptions);
    headcount.rows.forEach(row => {
      if (row.bus_id) {
        buses.add(row.bus_id);
      }
    });
    return Array.from(buses).sort();
  }, [busOptions, headcount.rows]);

  // Apply local filters to align UI with selected criteria
  const filteredRows = useMemo(() => {
    const from = filters.date_from ? new Date(filters.date_from) : null;
    const to = filters.date_to ? new Date(filters.date_to) : null;

    return headcount.rows.filter(row => {
      if (filters.bus_id && row.bus_id !== filters.bus_id) return false;
      if (filters.shift && row.shift !== filters.shift) return false;

      if (from) {
        const rowDate = new Date(row.date);
        if (rowDate < from) return false;
      }
      if (to) {
        const rowDate = new Date(row.date);
        if (rowDate > to) return false;
      }

      return true;
    });
  }, [headcount.rows, filters.bus_id, filters.shift, filters.date_from, filters.date_to]);

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

  const setAndCacheFilters = (next: FilterParams) => {
    filtersRef.current = next;
    setFilters(next);
  };

  const handleSearch = async (overrideFilters?: FilterParams) => {
    setLoading(true);

    const activeFilters = overrideFilters || filtersRef.current;

    try {
      // Only pass API-supported filters to backend
      const data = await fetchHeadcount({
        date_from: activeFilters.date_from,
        date_to: activeFilters.date_to,
        shift: activeFilters.shift,
        bus_id: activeFilters.bus_id,
      });
      setHeadcount(data);
      toast.success(`Loaded ${data.rows.length} records successfully`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      toast.error(message);
      setHeadcount({ rows: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAndCacheFilters(getInitialFilters());
  };

  const handleToday = async () => {
    const todayString = getTodayString();
    const todayFilters: FilterParams = {
      date_from: todayString,
      date_to: todayString,
      shift: '',
      bus_id: '',
    };
    setAndCacheFilters(todayFilters);
    await handleSearch(todayFilters);
  };

  // Load data on mount
  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep ref in sync if filters change for any reason
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Fetch available buses for dropdowns (independent of current headcount filter)
  useEffect(() => {
    let cancelled = false;

    const loadBuses = async () => {
      try {
        const buses = await fetchBuses();
        if (!cancelled) {
          const ids = buses.map(b => b.bus_id).filter(Boolean);
          setBusOptions(ids.sort());
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load buses';
          toast.error(message);
        }
      }
    };

    loadBuses();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleHeadcountExport = async () => {
    setExporting(true);
    const toastId = toast.loading('Generating CSV...');
    
    try {
      await exportHeadcountCsv({
        date_from: filters.date_from,
        date_to: filters.date_to,
        shift: filters.shift || undefined,
        bus_id: filters.bus_id || undefined,
      });
      toast.success(
        `Downloaded ${filteredRows.length} records successfully!`,
        { id: toastId }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export headcount';
      toast.error(message, { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  // Check if local filters are active (showing filtered vs total)
  const hasLocalFilters = Boolean(filters.bus_id || filters.shift);
  const showingFiltered = hasLocalFilters || filteredRows.length !== headcount.rows.length;

  return (
    <div className={SPACING.section}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className={TYPOGRAPHY.pageTitle}>Bus Passenger Dashboard</h1>
          <p className={TYPOGRAPHY.pageSubtitle}>Factory Bus Optimization System</p>
        </div>
        <div className="text-right">
          <p className={TYPOGRAPHY.kpiLabel}>Today</p>
          <p className="text-lg font-semibold text-gray-900">{today}</p>
        </div>
      </div>

      <FiltersBar
        filters={filters}
        onFiltersChange={setAndCacheFilters}
        onSearch={handleSearch}
        onToday={handleToday}
        onReset={handleReset}
        loading={loading}
        availableBuses={availableBuses}
      />

      <div className="flex flex-wrap justify-end gap-2 -mt-4 mb-2">
        <Button
          onClick={handleHeadcountExport}
          disabled={exporting}
          variant="outline"
        >
          {exporting ? 'Downloading...' : 'Download Headcount CSV'}
        </Button>
      </div>

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
          icon={<Users className="w-8 h-8" />}
        />
        <KpiCard
          title="Unknown Batch"
          value={filteredKpis.total_unknown_batch ?? '-'}
          subtitle="needs mapping"
          color="yellow"
          icon={<AlertTriangle className="w-8 h-8" />}
        />
        <KpiCard
          title="Unknown Shift"
          value={filteredKpis.total_unknown_shift ?? '-'}
          subtitle="outside shift window"
          color="red"
          icon={<Clock className="w-8 h-8" />}
        />
        <KpiCard
          title="Row Count"
          value={filteredKpis.row_count ?? '-'}
          subtitle={showingFiltered ? `of ${headcount.rows.length} total` : 'aggregated rows'}
          color="green"
          icon={<Database className="w-8 h-8" />}
        />
      </div>

      {filteredRows.length === 0 && !loading ? (
        <EmptyState
          title="No data found"
          description="Try adjusting your filters or selecting a different date range to see results"
          icon="search"
          actionLabel="Reset Filters"
          onAction={handleReset}
        />
      ) : (
        <>
          <div className="space-y-6">
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AttendanceTrendChart rows={filteredRows} loading={loading} />
              <ShiftDistributionChart rows={filteredRows} loading={loading} />
            </div>
            
            <BusComparisonChart rows={filteredRows} loading={loading} />
            
            {/* Table Section */}
            <TripTable rows={filteredRows} loading={loading} />
            <HeadcountChart rows={filteredRows} loading={loading} />
          </div>

          <div>
            <ScanTable
              initialDate={today}
              initialBusId={filters.bus_id}
              initialShift={filters.shift}
              availableBuses={availableBuses}
            />
          </div>
        </>
      )}
    </div>
  );
}
