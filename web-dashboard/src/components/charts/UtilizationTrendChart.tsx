// web-dashboard/src/components/charts/UtilizationTrendChart.tsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

type DataPoint = {
  date: string;
  utilization: number;
  previousUtilization?: number;
};

type UtilizationTrendChartProps = {
  data: DataPoint[];
  showComparison?: boolean;
};

export default function UtilizationTrendChart({ data, showComparison = false }: UtilizationTrendChartProps) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
          Utilization Trend
        </h3>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-cyan-500" />
            Current
          </span>
          {showComparison && (
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-slate-300 border-dashed" style={{ borderTop: '2px dashed' }} />
              Previous
            </span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
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
            domain={[0, 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Utilization']}
          />
          <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '100%', position: 'right', fontSize: 10, fill: '#ef4444' }} />

          {showComparison && (
            <Line
              type="monotone"
              dataKey="previousUtilization"
              stroke="#cbd5e1"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          )}
          <Line
            type="monotone"
            dataKey="utilization"
            stroke="#06b6d4"
            strokeWidth={2}
            dot={{ fill: '#06b6d4', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, fill: '#06b6d4' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
