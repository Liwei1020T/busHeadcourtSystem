// web-dashboard/src/components/charts/RouteComparisonChart.tsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getSeverityLevel } from '../../lib/theme';

type RouteData = {
  zone: string;
  utilization: number;
  busCount: number;
};

type RouteComparisonChartProps = {
  data: RouteData[];
};

export default function RouteComparisonChart({ data }: RouteComparisonChartProps) {
  const sortedData = [...data].sort((a, b) => b.utilization - a.utilization);

  const getBarColor = (util: number) => {
    const severity = getSeverityLevel(util);
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#22c55e';
    }
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">
        Route Comparison
      </h3>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 30, bottom: 5, left: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 'dataMax']}
          />
          <YAxis
            type="category"
            dataKey="zone"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value: number, name: string, props: any) => [
              `${value.toFixed(1)}% (${props.payload.busCount} buses)`,
              'Utilization',
            ]}
          />
          <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.utilization)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
