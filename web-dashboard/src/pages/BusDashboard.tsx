import { useState, useEffect, useMemo } from 'react';
import FiltersBar from '../components/FiltersBar';
import KpiCard from '../components/KpiCard';
import TripTable from '../components/TripTable';
import ScanTable from '../components/ScanTable';
import HeadcountChart from '../components/HeadcountChart';
import { exportHeadcountCsv, fetchHeadcount } from '../api';
import { HeadcountResponse, FilterParams } from '../types';
import { Button } from '@/components/ui/button';
import { SPACING, TYPOGRAPHY } from '@/lib/design-system/tokens';
import { useToast } from '@/contexts/ToastContext';

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
  const { showToast } = useToast();
  
  const [filters, setFilters] = useState<FilterParams>(getInitialFilters());

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
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
      showToast('success', 'Data loaded successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      showToast('error', message);
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
    try {
      await exportHeadcountCsv({
        date_from: filters.date_from,
        date_to: filters.date_to,
        shift: filters.shift || undefined,
        bus_id: filters.bus_id || undefined,
      });
      showToast('success', 'Headcount CSV downloaded successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export headcount';
      showToast('error', message);
    } finally {
      setExporting(false);
    }
  };

  // Check if local filters are active (showing filtered vs total)
  const hasLocalFilters = filters.bus_id;
  const showingFiltered = hasLocalFilters && filteredRows.length !== headcount.rows.length;

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
        onFiltersChange={setFilters}
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

      <div className="space-y-6">
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
    </div>
  );
}
