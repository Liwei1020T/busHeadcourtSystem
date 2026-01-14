import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Bus, Gauge, UserMinus, Users, BusFront } from 'lucide-react';

import FiltersBar from '../components/FiltersBar';
import OccupancyTable from '../components/OccupancyTable';
import BusDetailDrawer from '../components/BusDetailDrawer';
import HeadcountChart from '../components/HeadcountChart';
import KpiCard from '../components/KpiCard';

import { fetchBuses, fetchHeadcount, fetchOccupancy } from '../api';
import { FilterParams, HeadcountRow, OccupancyBusRow, OccupancyResponse } from '../types';

function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export default function BusDashboard() {
  const initialFilters = useMemo<FilterParams>(() => {
    const today = getTodayString();
    return {
      date_from: today,
      date_to: today,
      shift: '',
      bus_id: [],
      plant: '',
    };
  }, []);

  const [filters, setFilters] = useState<FilterParams>(initialFilters);
  const [activeFilters, setActiveFilters] = useState<FilterParams>(initialFilters);
  const [availableBuses, setAvailableBuses] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [occupancy, setOccupancy] = useState<OccupancyResponse | null>(null);
  const [headcountRows, setHeadcountRows] = useState<HeadcountRow[]>([]);
  const [selectedBus, setSelectedBus] = useState<OccupancyBusRow | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    const loadBuses = async () => {
      try {
        const buses = await fetchBuses();
        setAvailableBuses(buses.map((bus) => bus.bus_id));
      } catch (err: any) {
        toast.error(err.message || 'Failed to load buses');
      }
    };

    loadBuses();
  }, []);

  const runSearch = useCallback(async (currentFilters: FilterParams) => {
    setLoading(true);
    try {
      const occupancyData = await fetchOccupancy(currentFilters);
      setOccupancy(occupancyData);

      const busIdsFromOccupancy = occupancyData.rows.map((row) => row.bus_id);
      const busIds = currentFilters.bus_id.length > 0 ? currentFilters.bus_id : busIdsFromOccupancy;
      const uniqueBusIds = Array.from(new Set(busIds));

      if (currentFilters.plant && uniqueBusIds.length === 0) {
        setHeadcountRows([]);
      } else {
        const headcount = await fetchHeadcount({
          date_from: currentFilters.date_from,
          date_to: currentFilters.date_to,
          shift: currentFilters.shift,
          bus_id: uniqueBusIds,
        });
        setHeadcountRows(headcount.rows);
      }

      setActiveFilters(currentFilters);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      toast.error(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    runSearch(filters);
  }, [filters, runSearch]);

  useEffect(() => {
    runSearch(initialFilters);
  }, [initialFilters, runSearch]);

  const handleToday = () => {
    const todayStr = getTodayString();
    setFilters((prev) => ({
      ...prev,
      date_from: todayStr,
      date_to: todayStr,
    }));
  };

  const handleReset = () => {
    setFilters(initialFilters);
  };

  const totals = useMemo(() => {
    const totalPresent = occupancy?.total_present ?? 0;
    const totalRoster = occupancy?.total_roster ?? 0;
    const totalCapacity = occupancy?.total_bus_capacity ?? 0;
    const totalVans = occupancy?.total_van_count ?? 0;
    const totalAbsent = Math.max(0, totalRoster - totalPresent);
    const utilization = totalCapacity > 0 ? (totalPresent / totalCapacity) * 100 : 0;

    return {
      totalPresent,
      totalAbsent,
      utilization,
      totalVans,
    };
  }, [occupancy]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
              <Bus className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Bus Dashboard</h1>
              <p className="text-xs text-gray-500">Plant occupancy and daily trends</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Updated: <span className="text-gray-700 font-medium">{lastUpdated || '—'}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        <FiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          onToday={handleToday}
          onReset={handleReset}
          loading={loading}
          availableBuses={availableBuses}
        />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Present"
            value={totals.totalPresent}
            icon={<Users className="h-5 w-5" />}
            color="green"
            variant="compact"
          />
          <KpiCard
            title="Absent"
            value={totals.totalAbsent}
            icon={<UserMinus className="h-5 w-5" />}
            color="red"
            variant="compact"
          />
          <KpiCard
            title="Utilization (%)"
            value={Number(totals.utilization.toFixed(1))}
            icon={<Gauge className="h-5 w-5" />}
            color="teal"
            variant="compact"
          />
          <KpiCard
            title="Active Vans"
            value={totals.totalVans}
            icon={<BusFront className="h-5 w-5" />}
            color="amber"
            variant="compact"
          />
        </section>

        <section>
          <HeadcountChart rows={headcountRows} loading={loading} />
        </section>

        <section>
          <OccupancyTable data={occupancy?.rows || []} onBusClick={(bus) => setSelectedBus(bus)} />
        </section>
      </main>

      {selectedBus && (
        <BusDetailDrawer busId={selectedBus.bus_id} filters={activeFilters} onClose={() => setSelectedBus(null)} />
      )}
    </div>
  );
}
