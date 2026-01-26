// web-dashboard/src/components/charts/RoutePerformanceChart.tsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Route, MousePointer2 } from 'lucide-react';
import { PlantGroup } from '../../utils/plants';
import { OccupancyBusRow } from '../../types';

type RoutePerformanceChartProps = {
  plants: PlantGroup[];
  onRouteClick?: (route: string, buses: OccupancyBusRow[]) => void;
};

type RouteData = {
  route: string;
  fullRoute: string;
  utilization: number;
  passengers: number;
  capacity: number;
  busCount: number;
  buses: OccupancyBusRow[];
};

export default function RoutePerformanceChart({ plants, onRouteClick }: RoutePerformanceChartProps) {
  // Aggregate data by route
  const routeMap = new Map<string, { passengers: number; capacity: number; busCount: number; buses: OccupancyBusRow[] }>();

  plants.forEach(plant => {
    plant.buses.forEach(bus => {
      const route = bus.route || 'Unknown';
      const existing = routeMap.get(route) || { passengers: 0, capacity: 0, busCount: 0, buses: [] };
      routeMap.set(route, {
        passengers: existing.passengers + bus.total_present,
        capacity: existing.capacity + bus.bus_capacity,
        busCount: existing.busCount + 1,
        buses: [...existing.buses, bus],
      });
    });
  });

  // Convert to array and calculate utilization
  const chartData: RouteData[] = Array.from(routeMap.entries())
    .map(([route, data]) => ({
      route: route.length > 15 ? route.substring(0, 12) + '...' : route,
      fullRoute: route,
      utilization: data.capacity > 0 ? (data.passengers / data.capacity) * 100 : 0,
      passengers: data.passengers,
      capacity: data.capacity,
      busCount: data.busCount,
      buses: data.buses,
    }))
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, 12); // Top 12 routes

  const getBarColor = (utilization: number) => {
    if (utilization > 80) return '#22c55e';
    if (utilization < 30) return '#ef4444';
    if (utilization < 50) return '#f59e0b';
    return '#3b82f6';
  };

  const handleBarClick = (data: RouteData) => {
    if (onRouteClick) {
      onRouteClick(data.fullRoute, data.buses);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <Route className="w-4 h-4 text-slate-500" />
          Route Performance
        </h3>
        <div className="flex items-center gap-2">
          {onRouteClick && chartData.length > 0 && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <MousePointer2 className="w-3 h-3" />
              Click for details
            </span>
          )}
          <span className="text-xs text-slate-400">Top {chartData.length} routes</span>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Route className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm font-medium">No route data available</p>
          <p className="text-xs mt-1">Apply filters or check your data selection</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, bottom: 5, left: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />

              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
              />

              <YAxis
                type="category"
                dataKey="route"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                width={75}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Utilization']}
                labelFormatter={(label) => `Route: ${label}`}
              />

              <Bar
                dataKey="utilization"
                name="Utilization"
                radius={[0, 4, 4, 0]}
                cursor={onRouteClick ? 'pointer' : 'default'}
                onClick={(data: any) => {
                  // Recharts passes the full data object from chartData
                  if (data && data.fullRoute) {
                    handleBarClick(data as RouteData);
                  }
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.utilization)}
                    className={onRouteClick ? 'hover:opacity-80 transition-opacity' : ''}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Summary footer */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{routeMap.size} total routes</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                &gt;80%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                50-80%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                30-50%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                &lt;30%
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
