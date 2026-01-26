// web-dashboard/src/pages/BusDashboard.tsx

import { useEffect, useState, useCallback, useMemo } from 'react';
import { format, differenceInDays, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

import DashboardHeader from '../components/DashboardHeader';
import AlertBanner from '../components/AlertBanner';
import Sidebar from '../components/Sidebar';
import PlantTable from '../components/PlantTable';
import PlantAnalyticsDashboard from '../components/PlantAnalyticsDashboard';
import TrendAnalysisView from '../components/TrendAnalysisView';
import BusDetailDrawer from '../components/BusDetailDrawer';
import { DashboardMode } from '../components/ModeToggle';

import { fetchOccupancy, fetchFilterOptions } from '../api';
import { OccupancyResponse, FilterParams, FilterOptions, OccupancyBusRow } from '../types';
import { groupByPlant, extractPlant } from '../utils/plants';
import { getSeverityLevel, SeverityLevel } from '../lib/theme';

function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

const DEFAULT_FILTER_OPTIONS: FilterOptions = {
  buses: [],
  routes: [],
  plants: [],
  shifts: ['morning', 'night'],
};

export default function BusDashboard() {
  // Mode
  const [mode, setMode] = useState<DashboardMode>('live');

  // Filter options (for dropdowns)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(DEFAULT_FILTER_OPTIONS);

  // Filters (multi-select)
  const [filters, setFilters] = useState<FilterParams>({
    date_from: getTodayString(),
    date_to: getTodayString(),
    shifts: [],
    bus_ids: [],
    routes: [],
    plants: [],
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
    plant: '',
  });

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Load filter options on mount
  useEffect(() => {
    fetchFilterOptions()
      .then(setFilterOptions)
      .catch((err) => {
        console.error('Failed to load filter options:', err);
      });
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

  // Initial load
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  // Calculate severity counts (based on bus_capacity only)
  const severityCounts = useMemo(() => {
    if (!occupancy) return { critical: 0, warning: 0, normal: 0 };

    let critical = 0, warning = 0, normal = 0;
    occupancy.rows.forEach((row) => {
      const util = row.bus_capacity > 0 ? (row.total_present / row.bus_capacity) * 100 : 0;
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
      // Hide OWN/UNKN (own transport and unknown)
      const busIdUpper = row.bus_id.toUpperCase();
      const routeUpper = row.route?.toUpperCase() || '';
      if (
        busIdUpper === 'OWN' ||
        busIdUpper === 'UNKN' ||
        busIdUpper.includes('OWN') ||
        routeUpper.includes('OWN')
      ) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesBus = row.bus_id.toLowerCase().includes(query);
        const matchesRoute = (row.route || '').toLowerCase().includes(query);
        if (!matchesBus && !matchesRoute) return false;
      }

      const util = row.bus_capacity > 0 ? (row.total_present / row.bus_capacity) * 100 : 0;
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
  }, [occupancy, severityFilter, quickFilters, searchQuery]);

  const plants = useMemo(() => {
    let rows = filteredRows;

    // Plant filter from sidebar
    if (quickFilters.plant) {
      rows = rows.filter((row) => {
        const plantId = extractPlant(row.building_id, row.route);
        return plantId === quickFilters.plant;
      });
    }

    return groupByPlant(rows);
  }, [filteredRows, quickFilters.plant]);

  // Extract unique plants for filter dropdown
  const allPlants = useMemo(() => {
    if (!occupancy) return [];
    const plantSet = new Set<string>();
    occupancy.rows.forEach((row) => {
      const plant = extractPlant(row.building_id, row.route);
      if (plant !== 'Unknown') {
        plantSet.add(plant);
      }
    });
    return Array.from(plantSet).sort();
  }, [occupancy]);

  const handleQuickFilterChange = (filter: string, value: boolean | string) => {
    setQuickFilters((prev) => ({ ...prev, [filter]: value }));
  };

  // Calculate number of days in the date range (fallback)
  const calculatedNumDays = useMemo(() => {
    try {
      const from = parseISO(activeFilters.date_from);
      const to = parseISO(activeFilters.date_to);
      return Math.max(1, differenceInDays(to, from) + 1);
    } catch {
      return 1;
    }
  }, [activeFilters.date_from, activeFilters.date_to]);

  // Use backend num_days if available, otherwise fallback
  const numDays = occupancy?.num_days ?? calculatedNumDays;

  // Calculate totals from filtered plants (to match displayed data)
  const filteredTotals = useMemo(() => {
    const totals = {
      busPresent: 0,
      busCapacity: 0,
      vanPresent: 0,
      vanCapacity: 0,
      present: 0,
      roster: 0,
    };

    plants.forEach(plant => {
      totals.busPresent += plant.totalBusPresent;
      totals.busCapacity += plant.totalBusCapacity;
      totals.vanPresent += plant.totalVanPresent;
      totals.vanCapacity += plant.totalVanCapacity;
      totals.present += plant.totalPresent;
      totals.roster += plant.totalRoster;
    });

    return totals;
  }, [plants]);

  // Use filtered totals for display (consistent with what user sees)
  const totalBusPresent = filteredTotals.busPresent;
  const totalBusCapacity = filteredTotals.busCapacity;
  const totalPresent = filteredTotals.present;
  const totalRoster = filteredTotals.roster;

  const totalBusPresentSum = totalBusPresent * numDays;
  const totalBusCapacitySum = totalBusCapacity * numDays;
  const totalPresentSum = totalPresent * numDays;

  const busUtilization = totalBusCapacity > 0 ? (totalPresent / totalBusCapacity) * 100 : 0;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <DashboardHeader
        mode={mode}
        onModeChange={setMode}
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
        loading={loading}
        lastUpdated={lastUpdated}
        filterOptions={filterOptions}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
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
            busPresent={totalPresent}
            busUtilization={busUtilization}
            busCapacity={totalBusCapacity}
            criticalCount={severityCounts.critical}
            warningCount={severityCounts.warning}
            showOverloaded={quickFilters.overloaded}
            showUnderutilized={quickFilters.underutilized}
            selectedPlant={quickFilters.plant}
            plants={allPlants}
            onFilterChange={handleQuickFilterChange}
          />
        )}

        <main className="flex-1 overflow-auto p-4">
          {loading && !occupancy ? (
            <div className="flex flex-col items-center justify-center py-20 text-emerald-600">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-sm font-medium">Loading...</p>
            </div>
          ) : occupancy ? (
            mode === 'live' ? (
              <PlantTable plants={plants} onBusClick={(bus) => setSelectedBus(bus)} />
            ) : mode === 'analytics' ? (
              <PlantAnalyticsDashboard
                plants={plants}
                totalBusPresent={totalBusPresent}
                totalBusCapacity={totalBusCapacity}
                totalPresent={totalPresent}
                totalRoster={totalRoster}
                // Raw sums for accuracy
                totalBusPresentSum={totalBusPresentSum}
                totalBusCapacitySum={totalBusCapacitySum}
                totalPresentSum={totalPresentSum}
                dateFrom={activeFilters.date_from}
                dateTo={activeFilters.date_to}
                numDays={numDays}
              />
            ) : (
              <TrendAnalysisView
                filters={activeFilters}
                onFilterChange={setFilters}
              />
            )
          ) : null}
        </main>
      </div>

      {selectedBus && (
        <BusDetailDrawer
          busId={selectedBus.bus_id}
          filters={{
            date_from: activeFilters.date_from,
            date_to: activeFilters.date_to,
            shift: activeFilters.shifts.length === 1 ? activeFilters.shifts[0] : undefined,
          }}
          onClose={() => setSelectedBus(null)}
        />
      )}
    </div>
  );
}
