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
import { TYPOGRAPHY } from '@/lib/design-system/tokens';
import { HeadcountRow } from '../types';
import { useMemo } from 'react';

interface BusComparisonChartProps {
  rows: HeadcountRow[];
  loading?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
    <Card className="p-6">
      <h3 className={`${TYPOGRAPHY.sectionTitle} mb-4`}>
        Bus Performance Comparison
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          
          <XAxis
            dataKey="bus"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6b7280' }}
          />
          
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6b7280' }}
            label={{ value: 'Passengers', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
          />
          
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
            }}
            labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
          />
          
          <Legend
            wrapperStyle={{ fontSize: '14px', paddingTop: '16px' }}
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
