// web-dashboard/src/components/AnalyticsDashboard.tsx

import { TrendingUp, TrendingDown, Calendar, AlertTriangle } from 'lucide-react';
import UtilizationTrendChart from './charts/UtilizationTrendChart';
import RouteComparisonChart from './charts/RouteComparisonChart';
import AttendanceHeatmap from './charts/AttendanceHeatmap';
import CostAnalysisCard from './charts/CostAnalysisCard';
import { ZoneGroup } from '../utils/zones';

type AnalyticsDashboardProps = {
  zones: ZoneGroup[];
  totalPresent: number;
  totalRoster: number;
  totalCapacity: number;
};

function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon: Icon,
}: {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
}) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="text-2xl font-bold text-slate-800 font-mono">{value}</div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${
          isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-slate-500'
        }`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : null}
          {isPositive ? '+' : ''}{change.toFixed(1)}%
          {changeLabel && <span className="text-slate-400 ml-1">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsDashboard({ zones, totalPresent, totalCapacity }: AnalyticsDashboardProps) {
  // Calculate metrics
  const avgUtilization = totalCapacity > 0 ? (totalPresent / totalCapacity) * 100 : 0;
  const underutilizedBuses = zones.reduce((acc, z) =>
    acc + z.buses.filter(b => b.total_capacity > 0 && (b.total_present / b.total_capacity) * 100 < 30).length, 0
  );
  const emptySeats = totalCapacity - totalPresent;
  const problemDays = 3; // Mock data

  // Generate mock trend data
  const trendData = Array.from({ length: 7 }, (_, i) => ({
    date: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    utilization: avgUtilization + (Math.random() - 0.5) * 20,
    previousUtilization: avgUtilization - 5 + (Math.random() - 0.5) * 20,
  }));

  // Generate route comparison data from zones
  const routeData = zones.map((z) => ({
    zone: z.zone,
    utilization: z.avgUtilization,
    busCount: z.buses.length,
  }));

  // Generate mock heatmap data
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const SHIFTS = ['Morning', 'Night'];
  const heatmapData = DAYS.flatMap((day) =>
    SHIFTS.map((shift) => ({
      day,
      shift,
      value: 75 + Math.random() * 25,
    }))
  );

  // Calculate wasteful routes
  const topWastefulRoutes = zones
    .map((z) => ({
      zone: z.zone,
      emptySeats: z.totalCapacity - z.totalPresent,
    }))
    .sort((a, b) => b.emptySeats - a.emptySeats)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Period Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Avg Utilization"
          value={`${avgUtilization.toFixed(1)}%`}
          change={3.2}
          icon={TrendingUp}
        />
        <StatCard
          label="Avg Present"
          value={totalPresent.toLocaleString()}
          change={-2.1}
          icon={Calendar}
        />
        <StatCard
          label="Problem Days"
          value={problemDays.toString()}
          change={-2}
          icon={AlertTriangle}
        />
        <StatCard
          label="Est. Waste"
          value={`RM ${Math.round(emptySeats * 0.5).toLocaleString()}`}
          change={-8.5}
          icon={TrendingDown}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UtilizationTrendChart data={trendData} showComparison />
        <RouteComparisonChart data={routeData} />
        <AttendanceHeatmap data={heatmapData} />
        <CostAnalysisCard
          underutilizedBuses={underutilizedBuses}
          emptySeatsPerDay={emptySeats}
          estimatedMonthlyWaste={Math.round(emptySeats * 0.5 * 22)}
          topWastefulRoutes={topWastefulRoutes}
        />
      </div>
    </div>
  );
}
