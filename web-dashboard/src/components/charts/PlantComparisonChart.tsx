// web-dashboard/src/components/charts/PlantComparisonChart.tsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MousePointer2, BarChart as BarChartIcon } from 'lucide-react';
import { PlantGroup } from '../../utils/plants';

type PlantComparisonChartProps = {
  plants: PlantGroup[];
  onPlantClick?: (plant: PlantGroup) => void;
};

export default function PlantComparisonChart({ plants, onPlantClick }: PlantComparisonChartProps) {
  // Prepare data
  const chartData = plants.map(p => ({
    plant: p.plant,
    busUtilization: Number(p.avgUtilization.toFixed(1)),
    busCount: p.buses.length,
    capacity: p.totalBusCapacity,
    passengers: p.totalBusPresent,
    plantData: p,
  }));

  const handleBarClick = (data: any) => {
    if (onPlantClick && data && data.plantData) {
      onPlantClick(data.plantData as PlantGroup);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
          Bus Utilization by Plant
        </h3>
        {onPlantClick && chartData.length > 0 && (
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <MousePointer2 className="w-3 h-3" />
            Click bar for details
          </span>
        )}
      </div>

      {!chartData || chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <BarChartIcon className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm font-medium">No plant data available</p>
          <p className="text-xs mt-1">Check your filters</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

              <XAxis
                dataKey="plant"
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />

              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                formatter={(value: number, name: string) => {
                  if (name === 'busUtilization') {
                    return [`${value.toFixed(1)}%`, 'Bus Utilization'];
                  }
                  return [value, name];
                }}
                labelFormatter={(label) => `Plant ${label}`}
              />

              <Bar
                dataKey="busUtilization"
                name="Bus Utilization"
                radius={[4, 4, 0, 0]}
                cursor={onPlantClick ? 'pointer' : 'default'}
                onClick={handleBarClick}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-util-${index}`}
                    fill={entry.busUtilization > 80 ? '#22c55e' : entry.busUtilization < 30 ? '#ef4444' : '#3b82f6'}
                    className={onPlantClick ? 'hover:opacity-80 transition-opacity' : ''}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Bottom summary - clickable */}
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
            {chartData.slice(0, 6).map(d => (
              <button
                key={d.plant}
                onClick={() => onPlantClick?.(d.plantData)}
                className={`text-center p-2 rounded-lg transition-colors ${
                  onPlantClick ? 'hover:bg-slate-50 cursor-pointer' : ''
                }`}
              >
                <div className="font-semibold text-slate-700">{d.plant}</div>
                <div className="text-slate-500">{d.busCount} buses • {d.passengers} pax</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
