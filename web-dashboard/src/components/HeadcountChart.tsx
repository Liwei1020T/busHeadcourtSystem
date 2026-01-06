import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { HeadcountRow } from '../types';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, BarChart3 } from 'lucide-react';

type HeadcountChartProps = {
  rows: HeadcountRow[];
  loading: boolean;
};

type ShiftKey = 'morning' | 'night' | 'unknown';

type ChartDay = {
  date: string;
  morning: number;
  night: number;
  unknown: number;
  unknownIssues: number;
  total: number;
};

const SHIFT_COLORS: Record<ShiftKey, string> = {
  morning: '#10b981',
  night: '#14b8a6',
  unknown: '#f59e0b',
};

function formatDateLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function HeadcountChart({ rows, loading }: HeadcountChartProps) {
  const [chartMode, setChartMode] = useState<'line' | 'bar'>('line');

  const chartData = useMemo<ChartDay[]>(() => {
    if (rows.length === 0) return [];

    const byDate = new Map<string, ChartDay>();

    rows.forEach((row) => {
      const shiftKey: ShiftKey = row.shift === 'morning' || row.shift === 'night' ? row.shift : 'unknown';
      const existing = byDate.get(row.date) ?? {
        date: row.date,
        morning: 0,
        night: 0,
        unknown: 0,
        unknownIssues: 0,
        total: 0,
      };

      const totalForRow = row.total || 0;
      const unknownForRow = (row.unknown_batch || 0) + (row.unknown_shift || 0);

      existing[shiftKey] += totalForRow;
      existing.unknownIssues += unknownForRow;
      existing.total += totalForRow;
      byDate.set(row.date, existing);
    });

    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [rows]);

  const totalsByShift = useMemo(
    () =>
      chartData.reduce(
        (acc, day) => {
          acc.morning += day.morning;
          acc.night += day.night;
          acc.unknown += day.unknown;
          acc.unknownIssues += day.unknownIssues;
          return acc;
        },
        { morning: 0, night: 0, unknown: 0, unknownIssues: 0 },
      ),
    [chartData],
  );

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
          No headcount data to visualize. Adjust filters and search again.
        </div>
      );
    }

    const commonAxes = (
      <>
        <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateLabel}
          tick={{ fill: '#6b7280', fontSize: 12 }}
          tickMargin={8}
          stroke="#d1d5db"
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 12 }}
          allowDecimals={false}
          stroke="#d1d5db"
        />
        <Tooltip
          labelFormatter={(label) => `Date: ${formatDateLabel(String(label))}`}
          formatter={(value) => (Number.isFinite(value) ? Number(value).toLocaleString() : value)}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '12px',
            color: '#1f2937',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          }}
          labelStyle={{ color: '#1f2937', fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ color: '#6b7280' }} />
      </>
    );

    return (
      <div className="w-full overflow-hidden rounded-xl border border-gray-100 bg-white">
        <ResponsiveContainer width="100%" height={300}>
          {chartMode === 'line' ? (
            <LineChart data={chartData} margin={{ top: 16, right: 16, left: 8, bottom: 16 }}>
              {commonAxes}
              <Line type="monotone" dataKey="morning" stroke={SHIFT_COLORS.morning} strokeWidth={3} dot={{ r: 4 }} name="Morning" />
              <Line type="monotone" dataKey="night" stroke={SHIFT_COLORS.night} strokeWidth={3} dot={{ r: 4 }} name="Night" />
              <Line type="monotone" dataKey="unknown" stroke={SHIFT_COLORS.unknown} strokeWidth={3} dot={{ r: 4 }} name="Unknown" />
            </LineChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 16, right: 16, left: 8, bottom: 16 }}>
              {commonAxes}
              <Bar dataKey="morning" fill={SHIFT_COLORS.morning} name="Morning" radius={[6, 6, 0, 0]} />
              <Bar dataKey="night" fill={SHIFT_COLORS.night} name="Night" radius={[6, 6, 0, 0]} />
              <Bar dataKey="unknown" fill={SHIFT_COLORS.unknown} name="Unknown" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Headcount Trend</h3>
            <p className="text-xs text-gray-500">Totals by date and shift</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setChartMode('line')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${chartMode === 'line'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            type="button"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Line
          </button>
          <button
            onClick={() => setChartMode('bar')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${chartMode === 'bar'
              ? 'bg-teal-100 text-teal-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            type="button"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Bar
          </button>
        </div>
      </div>

      {/* Chart Content */}
      <div className="flex-1 p-5">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-[280px] w-full" />
          </div>
        ) : (
          renderChart()
        )}
      </div>

      {/* Summary Footer */}
      <div className="px-5 pb-5">
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-gray-600">
                <span className="h-2.5 w-6 rounded-full" style={{ background: SHIFT_COLORS.morning }} />
                Morning
              </span>
              <span className="text-sm font-semibold text-emerald-600">{totalsByShift.morning}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-gray-600">
                <span className="h-2.5 w-6 rounded-full" style={{ background: SHIFT_COLORS.night }} />
                Night
              </span>
              <span className="text-sm font-semibold text-teal-600">{totalsByShift.night}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-gray-600">
                <span className="h-2.5 w-6 rounded-full" style={{ background: SHIFT_COLORS.unknown }} />
                Unknown
              </span>
              <span className="text-sm font-semibold text-amber-600">{totalsByShift.unknown}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-amber-600">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Issues
              </span>
              <span className="text-sm font-semibold text-amber-600">{totalsByShift.unknownIssues}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
