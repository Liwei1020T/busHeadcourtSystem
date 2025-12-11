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
import { TYPOGRAPHY } from '@/lib/design-system/tokens';
import { HeadcountRow } from '../types';
import { useMemo } from 'react';

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
    <Card className="p-6">
      <h3 className={`${TYPOGRAPHY.sectionTitle} mb-4`}>
        Attendance Trend Over Time
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          
          <XAxis
            dataKey="dateFormatted"
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
          
          <Line
            type="monotone"
            dataKey="morning"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Morning Shift"
          />
          
          <Line
            type="monotone"
            dataKey="night"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ fill: '#6366f1', r: 4 }}
            activeDot={{ r: 6 }}
            name="Night Shift"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
