import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { HeadcountRow } from '../types';
import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';

interface BusComparisonChartProps {
  rows: HeadcountRow[];
  loading?: boolean;
}

const COLORS = ['#10b981', '#14b8a6', '#0d9488', '#059669', '#047857', '#065f46'];

export default function BusComparisonChart({ rows, loading }: BusComparisonChartProps) {
  // Aggregate data by bus_id
  const chartData = useMemo(() => {
    const dataMap = new Map<string, { bus: string; total: number; present: number; unknown: number }>();

    rows.forEach(row => {
      if (!row.bus_id) return;

      if (!dataMap.has(row.bus_id)) {
        dataMap.set(row.bus_id, {
          bus: row.bus_id,
          total: 0,
          present: 0,
          unknown: 0,
        });
      }

      const entry = dataMap.get(row.bus_id)!;
      entry.total += row.total;
      entry.present += row.present;
      entry.unknown += (row.unknown_batch + row.unknown_shift);
    });

    // Convert to array and sort by total (descending)
    return Array.from(dataMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10 buses
  }, [rows]);

  if (loading || chartData.length === 0) {
    return null;
  }

  return (
    <Card className="p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">Bus Performance Comparison</h3>
          <p className="text-xs text-gray-500">Top buses by passenger count</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="bus"
            stroke="#d1d5db"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6b7280' }}
          />

          <YAxis
            stroke="#d1d5db"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6b7280' }}
            label={{ value: 'Passengers', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '12px',
              color: '#1f2937',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            }}
            labelStyle={{ fontWeight: 600, marginBottom: '4px', color: '#1f2937' }}
          />

          <Legend
            wrapperStyle={{ fontSize: '14px', paddingTop: '16px', color: '#6b7280' }}
          />

          <Bar
            dataKey="present"
            fill="#10b981"
            name="Present"
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>

          <Bar
            dataKey="unknown"
            fill="#f59e0b"
            name="Unknown"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <p className="text-xs text-gray-500 mt-2 text-center">
        Top {Math.min(chartData.length, 10)} buses by total passengers
      </p>
    </Card>
  );
}
