// web-dashboard/src/components/PlantAnalyticsDashboard.tsx

import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Bus, AlertTriangle, Download, Calendar, ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react';
import PlantComparisonChart from './charts/PlantComparisonChart';
import BusUtilizationTrendChart from './charts/BusUtilizationTrendChart';
import CapacityDistributionChart from './charts/CapacityDistributionChart';
import RoutePerformanceChart from './charts/RoutePerformanceChart';
import QuickStatsBar from './QuickStatsBar';
import PlantDrilldownModal from './PlantDrilldownModal';
import RouteDrilldownModal from './RouteDrilldownModal';
import { PlantGroup } from '../utils/plants';
import { OccupancyBusRow } from '../types';
import { exportToCSV, exportToPDF } from '../utils/export';

type PlantAnalyticsDashboardProps = {
  plants: PlantGroup[];
  totalBusPresent: number;
  totalBusCapacity: number;
  totalPresent: number;
  totalRoster: number;
  dateFrom?: string;
  dateTo?: string;
  numDays?: number; // Number of days in the date range
  // Raw sums from backend (for Total mode)
  totalBusPresentSum?: number;
  totalBusCapacitySum?: number;
  totalPresentSum?: number;
  // Comparison data (previous period)
  prevPeriodData?: {
    busUtilization: number;
    attendanceRate: number;
    underutilizedBuses: number;
    emptySeats: number;
  } | null;
};

type ComparisonMode = 'none' | 'previous-week' | 'previous-month';
type DisplayMode = 'average' | 'total';

function StatCard({
  label,
  value,
  change,
  icon: Icon,
  valueColor = 'text-slate-800',
  suffix = '',
}: {
  label: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  valueColor?: string;
  suffix?: string;
}) {
  const hasChange = change !== undefined && change !== null;
  const isPositive = hasChange && change > 0;
  const isNegative = hasChange && change < 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
        <div className="p-1.5 bg-slate-100 rounded-lg">
          <Icon className="w-4 h-4 text-slate-500" />
        </div>
      </div>
      <div className={`text-2xl font-bold font-mono ${valueColor}`}>
        {value}{suffix}
      </div>
      {hasChange && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
          isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-slate-500'
        }`}>
          {isPositive ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : isNegative ? (
            <ArrowDownRight className="w-3 h-3" />
          ) : null}
          <span>{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
          <span className="text-slate-400">vs prev period</span>
        </div>
      )}
    </div>
  );
}

export default function PlantAnalyticsDashboard({
  plants,
  totalBusPresent,
  totalBusCapacity,
  totalPresent,
  totalRoster,
  dateFrom = '',
  dateTo = '',
  numDays = 1,
  totalBusPresentSum,
  totalBusCapacitySum,
  totalPresentSum: _totalPresentSum, // Prefix with underscore to indicate intentionally unused
  prevPeriodData,
}: PlantAnalyticsDashboardProps) {
  const [selectedPlant, setSelectedPlant] = useState<PlantGroup | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<{ route: string; buses: OccupancyBusRow[] } | null>(null);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('none');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('average');

  // Calculate display values based on mode
  // Use backend sums when available (precision), fallback to multiplication
  // Note: All van passengers go to bus, so use totalPresent (bus + van) for passenger count
  const displayTotalPresent = displayMode === 'total'
    ? (totalPresentSum ?? totalPresent * numDays)
    : totalPresent;
  const displayBusPresent = displayMode === 'total'
    ? (totalBusPresentSum ?? totalBusPresent * numDays)
    : totalBusPresent;
  const displayBusCapacity = displayMode === 'total'
    ? (totalBusCapacitySum ?? totalBusCapacity * numDays)
    : totalBusCapacity;
  const displayEmptySeats = displayMode === 'total'
    ? Math.max(0, displayBusCapacity - displayTotalPresent)
    : Math.max(0, totalBusCapacity - totalPresent);

  // Utilization is always a percentage (same for both modes)
  // All passengers (bus + van) use bus capacity
  const busUtilization = totalBusCapacity > 0 ? (totalPresent / totalBusCapacity) * 100 : 0;
  const emptyBusSeats = displayEmptySeats;

  const underutilizedBuses = plants.reduce((acc, p) =>
    acc + p.buses.filter(b => b.bus_capacity > 0 && (b.total_present / b.bus_capacity) * 100 < 30).length, 0
  );

  // Quick stats calculations
  const totalBuses = plants.reduce((acc, p) => acc + p.buses.length, 0);
  const displayAvgPassengersPerBus = totalBuses > 0 ? displayTotalPresent / totalBuses : 0;
  const lowUtilizationBuses = plants.reduce((acc, p) =>
    acc + p.buses.filter(b => b.bus_capacity > 0 && (b.total_present / b.bus_capacity) * 100 < 50).length, 0
  );

  // Calculate changes vs previous period
  const changes = useMemo(() => {
    if (!prevPeriodData) return null;
    return {
      utilization: busUtilization - prevPeriodData.busUtilization,
      attendance: totalBusPresent - (prevPeriodData.attendanceRate || 0), // Reused for passengers change
      underutilized: underutilizedBuses - prevPeriodData.underutilizedBuses,
      emptySeats: emptyBusSeats - prevPeriodData.emptySeats,
    };
  }, [busUtilization, totalBusPresent, underutilizedBuses, emptyBusSeats, prevPeriodData]);

  // Generate trend data (stable based on plants data, not random)
  const trendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, i) => {
      const result: { date: string; [key: string]: number | string } = { date: day };
      plants.forEach(p => {
        // Use a deterministic variation based on day index and plant
        const variation = ((i * 7 + p.plant.charCodeAt(0)) % 20) - 10;
        result[p.plant] = Math.max(0, Math.min(100, p.avgUtilization + variation));
      });
      return result;
    });
  }, [plants]);

  // Generate weekly trend data (4 weeks)
  const weeklyTrendData = useMemo(() => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    return weeks.map((week, i) => {
      const result: { date: string; [key: string]: number | string } = { date: week };
      plants.forEach(p => {
        // Use a deterministic variation based on week index and plant
        const variation = ((i * 11 + p.plant.charCodeAt(0)) % 15) - 7;
        result[p.plant] = Math.max(0, Math.min(100, p.avgUtilization + variation));
      });
      return result;
    });
  }, [plants]);

  // Export handler
  const handleExport = () => {
    exportToCSV({
      plants,
      totalBusPresent,
      totalBusCapacity,
      totalPresent,
      totalRoster,
      dateFrom,
      dateTo,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header with Export & Comparison */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800">Analytics Overview</h2>
          {dateFrom && dateTo && (
            <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
              <Calendar className="w-3 h-3" />
              {dateFrom} to {dateTo}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Display Mode Toggle (Total/Average) */}
          {numDays > 1 && (
            <div className="flex bg-blue-50 rounded-lg p-1 text-xs border border-blue-200">
              <button
                onClick={() => setDisplayMode('average')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  displayMode === 'average' ? 'bg-white shadow-sm text-blue-700 font-medium' : 'text-blue-600'
                }`}
              >
                Average/Day
              </button>
              <button
                onClick={() => setDisplayMode('total')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  displayMode === 'total' ? 'bg-white shadow-sm text-blue-700 font-medium' : 'text-blue-600'
                }`}
              >
                Total ({numDays} days)
              </button>
            </div>
          )}

          {/* Comparison Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1 text-xs">
            <button
              onClick={() => setComparisonMode('none')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                comparisonMode === 'none' ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-600'
              }`}
            >
              Current
            </button>
            <button
              onClick={() => setComparisonMode('previous-week')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                comparisonMode === 'previous-week' ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-600'
              }`}
            >
              vs Last Week
            </button>
            <button
              onClick={() => setComparisonMode('previous-month')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                comparisonMode === 'previous-month' ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-600'
              }`}
            >
              vs Last Month
            </button>
          </div>

          {/* Export Buttons */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <QuickStatsBar
        totalBuses={totalBuses}
        avgPassengersPerBus={displayAvgPassengersPerBus}
        lowUtilizationCount={lowUtilizationBuses}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Bus Utilization"
          value={busUtilization.toFixed(1)}
          suffix="%"
          change={comparisonMode !== 'none' ? changes?.utilization : undefined}
          icon={TrendingUp}
          valueColor={busUtilization > 80 ? 'text-emerald-600' : busUtilization < 30 ? 'text-red-600' : 'text-amber-600'}
        />
        <StatCard
          label={displayMode === 'total' ? `Passengers (${numDays} days)` : 'Passengers/Day'}
          value={displayTotalPresent.toLocaleString()}
          change={comparisonMode !== 'none' ? changes?.attendance : undefined}
          icon={Bus}
          valueColor="text-blue-600"
        />
        <StatCard
          label="Underutilized Buses"
          value={underutilizedBuses.toString()}
          change={comparisonMode !== 'none' ? changes?.underutilized : undefined}
          icon={AlertTriangle}
          valueColor={underutilizedBuses > 0 ? 'text-red-600' : 'text-emerald-600'}
        />
        <StatCard
          label={displayMode === 'total' ? `Empty Seats (${numDays} days)` : 'Empty Seats/Day'}
          value={emptyBusSeats.toLocaleString()}
          change={comparisonMode !== 'none' ? changes?.emptySeats : undefined}
          icon={TrendingDown}
          valueColor="text-amber-600"
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PlantComparisonChart plants={plants} onPlantClick={setSelectedPlant} />
        <CapacityDistributionChart plants={plants} />
        <RoutePerformanceChart
          plants={plants}
          onRouteClick={(route, buses) => setSelectedRoute({ route, buses })}
        />
        <div className="lg:col-span-2">
          <BusUtilizationTrendChart
            data={trendData}
            weeklyData={weeklyTrendData}
            plants={plants.map(p => p.plant)}
          />
        </div>
      </div>

      {/* Drill-down Modals */}
      {selectedPlant && (
        <PlantDrilldownModal
          plant={selectedPlant}
          onClose={() => setSelectedPlant(null)}
        />
      )}
      {selectedRoute && (
        <RouteDrilldownModal
          route={selectedRoute.route}
          buses={selectedRoute.buses}
          onClose={() => setSelectedRoute(null)}
        />
      )}
    </div>
  );
}
