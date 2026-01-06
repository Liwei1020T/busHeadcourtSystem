import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Card } from '@/components/ui/card';
import { HeadcountRow } from '../types';
import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';

interface AttendanceTrendChartProps {
  rows: HeadcountRow[];
  loading?: boolean;
}

export default function AttendanceTrendChart({ rows, loading }: AttendanceTrendChartProps) {
  // Aggregate data by date and shift
  const chartData = useMemo(() => {
    const dataMap = new Map<string, { date: string; morning: number; night: number }>();

    rows.forEach(row => {
      if (!dataMap.has(row.date)) {
        dataMap.set(row.date, { date: row.date, morning: 0, night: 0 });
      }

      const entry = dataMap.get(row.date)!;
      if (row.shift === 'morning') {
        entry.morning += row.present;
      } else if (row.shift === 'night') {
        entry.night += row.present;
      }
    });

    // Convert to array and sort by date
    return Array.from(dataMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => ({
        ...item,
        dateFormatted: format(parseISO(item.date), 'MMM dd'),
      }));
  }, [rows]);

  if (loading || chartData.length === 0) {
    return null;
  }

  return (
    <Card className="p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">Attendance Trend Over Time</h3>
          <p className="text-xs text-gray-500">Daily attendance by shift</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="dateFormatted"
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

          <Line
            type="monotone"
            dataKey="morning"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
            name="Morning Shift"
          />

          <Line
            type="monotone"
            dataKey="night"
            stroke="#14b8a6"
            strokeWidth={2}
            dot={{ fill: '#14b8a6', r: 4 }}
            activeDot={{ r: 6, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }}
            name="Night Shift"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
