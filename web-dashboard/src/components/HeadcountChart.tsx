import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { HeadcountRow } from '../types';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TYPOGRAPHY } from '@/lib/design-system/tokens';

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
  night: '#6366f1',
  unknown: '#94a3b8',
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
        <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-600">
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
          tick={{ fill: '#475569', fontSize: 12 }}
          tickMargin={8}
        />
        <YAxis
          tick={{ fill: '#475569', fontSize: 12 }}
          allowDecimals={false}
        />
        <Tooltip
          labelFormatter={(label) => `Date: ${formatDateLabel(String(label))}`}
          formatter={(value) => (Number.isFinite(value) ? Number(value).toLocaleString() : value)}
        />
        <Legend />
      </>
    );

    return (
      <div className="w-full overflow-hidden rounded-xl border border-slate-100 bg-white">
        <ResponsiveContainer width="100%" height={380}>
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
    <Card className="h-full w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
        <div>
          <h3 className={TYPOGRAPHY.sectionTitle}>Headcount Trend</h3>
          <p className={`${TYPOGRAPHY.bodySm} mt-1`}>
            Totals by date and shift based on the current filters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChartMode('line')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              chartMode === 'line'
                ? 'bg-sky-600 text-white shadow-sm shadow-sky-100'
                : 'border border-slate-200 bg-white text-slate-800'
            }`}
            type="button"
          >
            Line
          </button>
          <button
            onClick={() => setChartMode('bar')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              chartMode === 'bar'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-100'
                : 'border border-slate-200 bg-white text-slate-800'
            }`}
            type="button"
          >
            Bar
          </button>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-[280px] w-full" />
          </div>
        ) : (
          renderChart()
        )}

        <div className="w-full rounded-lg border border-gray-200 bg-white/90 p-3 shadow-inner shadow-gray-50">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-6 rounded-full" style={{ background: SHIFT_COLORS.morning }} />
                Morning
              </span>
              <span className="text-sm text-gray-900">{totalsByShift.morning}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-6 rounded-full" style={{ background: SHIFT_COLORS.night }} />
                Night
              </span>
              <span className="text-sm text-gray-900">{totalsByShift.night}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-6 rounded-full" style={{ background: SHIFT_COLORS.unknown }} />
                Unknown
              </span>
              <span className="text-sm text-gray-900">{totalsByShift.unknown}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-amber-700 sm:col-span-2">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                Unknown (batch/shift)
              </span>
              <span className="text-sm">{totalsByShift.unknownIssues}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
