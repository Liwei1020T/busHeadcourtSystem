// web-dashboard/src/components/charts/CapacityDistributionChart.tsx

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { PlantGroup } from '../../utils/plants';

type CapacityDistributionChartProps = {
  plants: PlantGroup[];
};

type DistributionSegment = {
  name: string;
  value: number;
  color: string;
  buses: string[];
};

const UTILIZATION_RANGES = [
  { label: 'Critical (0-30%)', min: 0, max: 30, color: '#ef4444' },
  { label: 'Low (30-50%)', min: 30, max: 50, color: '#f97316' },
  { label: 'Medium (50-70%)', min: 50, max: 70, color: '#eab308' },
  { label: 'Good (70-100%)', min: 70, max: 100, color: '#22c55e' },
  { label: 'Overloaded (>100%)', min: 100, max: Infinity, color: '#dc2626' },
];

export default function CapacityDistributionChart({ plants }: CapacityDistributionChartProps) {
  const distributionData = useMemo(() => {
    const segments: DistributionSegment[] = UTILIZATION_RANGES.map((range) => ({
      name: range.label,
      value: 0,
      color: range.color,
      buses: [],
    }));

    plants.forEach((plantGroup) => {
      plantGroup.buses.forEach((bus) => {
        if (bus.bus_capacity <= 0) return;

        const utilization = (bus.total_present / bus.bus_capacity) * 100;

        for (let i = 0; i < UTILIZATION_RANGES.length; i++) {
          const range = UTILIZATION_RANGES[i];
          if (utilization >= range.min && utilization < range.max) {
            segments[i].value += 1;
            segments[i].buses.push(bus.bus_id);
            break;
          }
        }
      });
    });

    // Filter out empty segments
    return segments.filter((s) => s.value > 0);
  }, [plants]);

  const totalBuses = distributionData.reduce((acc, s) => acc + s.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DistributionSegment;
      const percentage = totalBuses > 0 ? ((data.value / totalBuses) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
          <p className="font-medium text-slate-800">{data.name}</p>
          <p className="text-sm text-slate-600">
            {data.value} buses ({percentage}%)
          </p>
          {data.buses.length <= 5 && (
            <p className="text-xs text-slate-400 mt-1">
              {data.buses.join(', ')}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    if (percent < 0.05) return null; // Don't show label for small slices

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {distributionData[index].value}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-violet-50 rounded-lg">
          <PieChartIcon className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">
            Capacity Distribution
          </h3>
          <p className="text-xs text-slate-500">{totalBuses} buses by utilization range</p>
        </div>
      </div>

      {totalBuses === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
          No bus data available
        </div>
      ) : (
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span className="text-xs text-slate-600">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
        {distributionData.slice(0, 3).map((segment) => (
          <div key={segment.name} className="text-center">
            <div
              className="text-lg font-bold"
              style={{ color: segment.color }}
            >
              {segment.value}
            </div>
            <div className="text-xs text-slate-500 truncate" title={segment.name}>
              {segment.name.split(' ')[0]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
