// web-dashboard/src/components/charts/BusUtilizationTrendChart.tsx

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

type TrendDataPoint = {
  date: string;
  [key: string]: number | string;
};

type TrendMode = 'daily' | 'weekly';

type BusUtilizationTrendChartProps = {
  data: TrendDataPoint[];
  weeklyData?: TrendDataPoint[];
  plants: string[];
};

const PLANT_COLORS: Record<string, string> = {
  P1: '#3b82f6',
  P2: '#8b5cf6',
  BK: '#f59e0b',
  Unknown: '#94a3b8',
};

export default function BusUtilizationTrendChart({ data, weeklyData, plants }: BusUtilizationTrendChartProps) {
  const [mode, setMode] = useState<TrendMode>('daily');

  // Use weekly data if available and mode is weekly, otherwise use daily
  const chartData = mode === 'weekly' && weeklyData ? weeklyData : data;
  const title = mode === 'daily' ? 'Last 7 Days' : 'Last 4 Weeks';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
          Bus Utilization Trend
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{title}</span>
          <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setMode('daily')}
              className={`px-3 py-1 rounded-md transition-colors ${
                mode === 'daily' ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-500'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setMode('weekly')}
              className={`px-3 py-1 rounded-md transition-colors ${
                mode === 'weekly' ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-500'
              }`}
            >
              Weekly
            </button>
          </div>
        </div>
      </div>

      {!chartData || chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <TrendingUp className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm font-medium">No trend data available</p>
          <p className="text-xs mt-1">Try selecting a different date range</p>
        </div>
      ) : (
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#64748b' }}
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
              labelStyle={{ color: '#1e293b', fontWeight: 600, marginBottom: '8px' }}
              itemStyle={{ fontSize: '12px', padding: '2px 0' }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />

            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="line"
            />

            {plants.map((plant) => (
              <Line
                key={plant}
                type="monotone"
                dataKey={plant}
                stroke={PLANT_COLORS[plant] || '#94a3b8'}
                strokeWidth={2}
                dot={{ fill: PLANT_COLORS[plant] || '#94a3b8', r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
