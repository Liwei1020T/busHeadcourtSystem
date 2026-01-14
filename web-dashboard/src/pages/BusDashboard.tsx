// web-dashboard/src/pages/BusDashboard.tsx

import { useEffect, useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

import DashboardHeader from '../components/DashboardHeader';
import AlertBanner from '../components/AlertBanner';
import Sidebar from '../components/Sidebar';
import ZoneTable from '../components/ZoneTable';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import BusDetailDrawer from '../components/BusDetailDrawer';
import { DashboardMode } from '../components/ModeToggle';

import { fetchOccupancy } from '../api';
import { OccupancyResponse, FilterParams, OccupancyBusRow } from '../types';
import { groupByZone } from '../utils/zones';
import { getSeverityLevel, SeverityLevel } from '../lib/theme';

function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export default function BusDashboard() {
  // Mode
  const [mode, setMode] = useState<DashboardMode>('live');

  // Filters
  const [filters, setFilters] = useState<FilterParams>({
    date_from: getTodayString(),
    date_to: getTodayString(),
    shift: '',
    bus_id: '',
    route: '',
  });
  const [activeFilters, setActiveFilters] = useState<FilterParams>(filters);

  // Data
  const [loading, setLoading] = useState(false);
  const [occupancy, setOccupancy] = useState<OccupancyResponse | null>(null);
  const [selectedBus, setSelectedBus] = useState<OccupancyBusRow | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Alert banner
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | null>(null);

  // Sidebar quick filters
  const [quickFilters, setQuickFilters] = useState({
    overloaded: false,
    underutilized: false,
    highAbsent: false,
    zone: '',
  });

  // Initial load
  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const currentFilters = { ...filters };
      const data = await fetchOccupancy(currentFilters);
      setOccupancy(data);
      setLastUpdated(new Date().toLocaleTimeString());
      setActiveFilters(currentFilters);
      setAlertDismissed(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Calculate severity counts
  const severityCounts = useMemo(() => {
    if (!occupancy) return { critical: 0, warning: 0, normal: 0 };

    let critical = 0, warning = 0, normal = 0;
    occupancy.rows.forEach((row) => {
      const util = row.total_capacity > 0 ? (row.total_present / row.total_capacity) * 100 : 0;
      const level = getSeverityLevel(util);
      if (level === 'critical') critical++;
      else if (level === 'warning') warning++;
      else normal++;
    });
    return { critical, warning, normal };
  }, [occupancy]);

  // Filter and group data
  const filteredRows = useMemo(() => {
    if (!occupancy) return [];

    return occupancy.rows.filter((row) => {
      // Hide OWN/UNKN
      if (row.route?.toUpperCase().includes('OWN') || row.bus_id.toUpperCase().includes('OWN')) {
        return false;
      }

      const util = row.total_capacity > 0 ? (row.total_present / row.total_capacity) * 100 : 0;
      const absentPct = row.total_roster > 0 ? ((row.total_roster - row.total_present) / row.total_roster) * 100 : 0;
      const severity = getSeverityLevel(util);

      // Severity filter from alert banner
      if (severityFilter && severity !== severityFilter) return false;

      // Quick filters
      if (quickFilters.overloaded && util <= 100) return false;
      if (quickFilters.underutilized && util >= 30) return false;
      if (quickFilters.highAbsent && absentPct <= 20) return false;

      return true;
    });
  }, [occupancy, severityFilter, quickFilters]);

  const zones = useMemo(() => {
    let rows = filteredRows;

    // Zone filter
    if (quickFilters.zone) {
      rows = rows.filter((row) => {
        const zone = row.bus_id.match(/^([A-Z]+)/i)?.[1]?.toUpperCase() || '';
        if (zone.startsWith('BK')) return quickFilters.zone === 'BK';
        return zone === quickFilters.zone;
      });
    }

    return groupByZone(rows);
  }, [filteredRows, quickFilters.zone]);

  // Extract unique zones for filter dropdown
  const allZones = useMemo(() => {
    if (!occupancy) return [];
    const zoneSet = new Set<string>();
    occupancy.rows.forEach((row) => {
      const match = row.bus_id.match(/^([A-Z]+)/i);
      if (match) {
        const prefix = match[1].toUpperCase();
        zoneSet.add(prefix.startsWith('BK') ? 'BK' : prefix);
      }
    });
    return Array.from(zoneSet).sort();
  }, [occupancy]);

  const handleQuickFilterChange = (filter: string, value: boolean | string) => {
    setQuickFilters((prev) => ({ ...prev, [filter]: value }));
  };

  // Totals
  const totalPresent = occupancy?.total_present ?? 0;
  const totalRoster = occupancy?.total_roster ?? 0;
  const totalCapacity = occupancy?.total_capacity ?? 0;
  const utilization = totalCapacity > 0 ? (totalPresent / totalCapacity) * 100 : 0;

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <DashboardHeader
        mode={mode}
        onModeChange={setMode}
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
        loading={loading}
        lastUpdated={lastUpdated}
      />

      {mode === 'live' && !alertDismissed && (
        <AlertBanner
          counts={severityCounts}
          onFilterClick={setSeverityFilter}
          activeFilter={severityFilter}
          onDismiss={() => setAlertDismissed(true)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {mode === 'live' && (
          <Sidebar
            present={totalPresent}
            roster={totalRoster}
            utilization={utilization}
            capacity={totalCapacity}
            criticalCount={severityCounts.critical}
            warningCount={severityCounts.warning}
            showOverloaded={quickFilters.overloaded}
            showUnderutilized={quickFilters.underutilized}
            showHighAbsent={quickFilters.highAbsent}
            selectedZone={quickFilters.zone}
            zones={allZones}
            onFilterChange={handleQuickFilterChange}
          />
        )}

        <main className="flex-1 overflow-auto p-4">
          {loading && !occupancy ? (
            <div className="flex flex-col items-center justify-center py-20 text-cyan-600">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-sm font-medium">Loading...</p>
            </div>
          ) : occupancy ? (
            mode === 'live' ? (
              <ZoneTable zones={zones} onBusClick={(bus) => setSelectedBus(bus)} />
            ) : (
              <AnalyticsDashboard
                zones={zones}
                totalPresent={totalPresent}
                totalRoster={totalRoster}
                totalCapacity={totalCapacity}
              />
            )
          ) : null}
        </main>
      </div>

      {selectedBus && (
        <BusDetailDrawer
          busId={selectedBus.bus_id}
          filters={activeFilters}
          onClose={() => setSelectedBus(null)}
        />
      )}
    </div>
  );
}
