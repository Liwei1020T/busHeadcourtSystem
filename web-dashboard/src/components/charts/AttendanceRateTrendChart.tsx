// web-dashboard/src/components/charts/AttendanceRateTrendChart.tsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { TrendingUp } from 'lucide-react';
import { TrendDataPoint } from '../../types';

type AttendanceRateTrendChartProps = {
  data: TrendDataPoint[];
  previousData?: TrendDataPoint[];
  showComparison?: boolean;
};

export default function AttendanceRateTrendChart({
  data,
  previousData,
  showComparison = false,
}: AttendanceRateTrendChartProps) {
  // Format dates for display
  const chartData = data.map((d, index) => {
    const formatted: any = {
      ...d,
      dateDisplay: format(parseISO(d.date), 'MMM dd'),
      dayName: format(parseISO(d.date), 'EEE'), // Mon, Tue, Wed...
    };

    // Add previous period data if available and aligned
    if (showComparison && previousData && previousData[index]) {
      formatted.prev_roster = previousData[index].roster;
      formatted.prev_present = previousData[index].present;
      formatted.prev_attendance_rate = previousData[index].attendance_rate;
    }

    return formatted;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
          Attendance Trend Analysis
        </h3>
        {showComparison && previousData && (
          <span className="text-xs text-slate-500">
            Current period vs Previous period (dashed)
          </span>
        )}
      </div>

      {data.length < 2 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <TrendingUp className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm font-medium">Need at least 2 days of data</p>
          <p className="text-xs mt-1">Expand your date range to see trends</p>
        </div>
      ) : (
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 60, bottom: 40, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

              {/* Date X-axis */}
              <XAxis
                dataKey="dateDisplay"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />

              {/* Left Y-axis: Absolute numbers */}
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                label={{
                  value: 'People Count',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12, fill: '#64748b' },
                }}
              />

              {/* Right Y-axis: Percentage */}
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
                label={{
                  value: 'Attendance Rate %',
                  angle: 90,
                  position: 'insideRight',
                  style: { fontSize: 12, fill: '#64748b' },
                }}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  padding: '12px',
                }}
                labelStyle={{ color: '#1e293b', fontWeight: 600, marginBottom: '8px' }}
                formatter={(value: number, name: string) => {
                  if (name === 'attendance_rate') return [`${value.toFixed(1)}%`, 'Attendance Rate'];
                  if (name === 'roster') return [value.toLocaleString(), 'Roster'];
                  if (name === 'present') return [value.toLocaleString(), 'Actual'];
                  if (name === 'prev_attendance_rate') return [`${value.toFixed(1)}%`, 'Prev Rate'];
                  if (name === 'prev_roster') return [value.toLocaleString(), 'Prev Roster'];
                  if (name === 'prev_present') return [value.toLocaleString(), 'Prev Actual'];
                  return [value, name];
                }}
                labelFormatter={(label) => `Date: ${label}`}
              />

              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => {
                  if (value === 'roster') return 'Roster';
                  if (value === 'present') return 'Actual';
                  if (value === 'attendance_rate') return 'Attendance Rate %';
                  if (value === 'prev_roster') return 'Prev Roster';
                  if (value === 'prev_present') return 'Prev Actual';
                  if (value === 'prev_attendance_rate') return 'Prev Rate';
                  return value;
                }}
              />

              {/* Current period - Roster line (blue dashed) */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="roster"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#3b82f6', r: 3 }}
                activeDot={{ r: 5 }}
                name="roster"
              />

              {/* Current period - Present line (green solid) */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="present"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 3 }}
                activeDot={{ r: 5 }}
                name="present"
              />

              {/* Current period - Attendance rate line (purple solid) */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="attendance_rate"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', r: 3 }}
                activeDot={{ r: 5 }}
                name="attendance_rate"
              />

              {/* Previous period lines (if comparison enabled) */}
              {showComparison && previousData && (
                <>
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="prev_roster"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                    dot={false}
                    name="prev_roster"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="prev_present"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                    dot={false}
                    name="prev_present"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="prev_attendance_rate"
                    stroke="#8b5cf6"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                    dot={false}
                    name="prev_attendance_rate"
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
