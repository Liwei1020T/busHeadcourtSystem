import { useMemo } from 'react';
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

const SHIFT_LINES: { key: ShiftKey; label: string; stroke: string; dot: string }[] = [
  { key: 'morning', label: 'Morning', stroke: 'stroke-green-500', dot: 'fill-green-500' },
  { key: 'night', label: 'Night', stroke: 'stroke-indigo-500', dot: 'fill-indigo-500' },
  { key: 'unknown', label: 'Unknown', stroke: 'stroke-gray-400', dot: 'fill-gray-400' },
] as const;

function formatDateLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function HeadcountChart({ rows, loading }: HeadcountChartProps) {
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

  const maxTotal = useMemo(
    () => chartData.reduce((max, day) => Math.max(max, day.total), 0),
    [chartData],
  );
  const totalUnknown = useMemo(
    () => chartData.reduce((sum, day) => sum + day.unknownIssues, 0),
    [chartData],
  );

  const renderLegend = () => (
    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
      {SHIFT_LINES.map((line) => (
        <div key={line.key} className="flex items-center gap-2">
          <span className={`h-[3px] w-6 rounded-full ${line.stroke}`} aria-hidden />
          <span className="font-medium text-gray-700">{line.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 text-gray-700">
        <span className="h-3 w-3 rounded-sm bg-amber-400" aria-hidden />
        <span className="font-medium">
          Unknown (batch/shift): {totalUnknown}
        </span>
      </div>
    </div>
  );

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-600">
          No headcount data to visualize. Adjust filters and search again.
        </div>
      );
    }

    return (
      <ResponsiveLineChart data={chartData} maxTotal={maxTotal} />
    );
  };

  return (
    <Card className="h-full">
      <div className="border-b px-6 py-4">
        <h3 className={TYPOGRAPHY.sectionTitle}>Headcount Trend</h3>
        <p className={`${TYPOGRAPHY.bodySm} mt-1`}>
          Totals by date and shift based on the current filters.
        </p>
      </div>

      <div className="space-y-4 p-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <div className="flex items-end gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-48 w-16" />
              ))}
            </div>
          </div>
        ) : (
          renderChart()
        )}

        {renderLegend()}
      </div>
    </Card>
  );
}

type ResponsiveLineChartProps = {
  data: ChartDay[];
  maxTotal: number;
};

function ResponsiveLineChart({ data, maxTotal }: ResponsiveLineChartProps) {
  const width = Math.max(data.length * 80, 320);
  const height = 260;
  const margin = { top: 16, right: 16, bottom: 32, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const getX = (index: number) => {
    if (data.length === 1) return margin.left + innerWidth / 2;
    const ratio = index / (data.length - 1);
    return margin.left + ratio * innerWidth;
  };

  const getY = (value: number) => {
    if (!maxTotal) return margin.top + innerHeight;
    const scaled = value / maxTotal;
    return margin.top + innerHeight - scaled * innerHeight;
  };

  const tickValues = useMemo(() => {
    if (!maxTotal) return [0];
    const buckets = 3;
    return Array.from({ length: buckets + 1 }, (_, i) =>
      Math.round((maxTotal / buckets) * i),
    );
  }, [maxTotal]);

  const linePaths = SHIFT_LINES.map((line) => {
    const points = data.map((day, index) => ({
      x: getX(index),
      y: getY(day[line.key]),
    }));
    const path = points
      .map((point, idx) => `${idx === 0 ? 'M' : 'L'}${point.x},${point.y}`)
      .join(' ');
    return { ...line, points, path };
  });

  return (
    <div className="overflow-x-auto pb-2">
      <svg width={width} height={height} role="img" aria-label="Headcount line chart">
        {/* Grid lines */}
        {tickValues.map((tick) => {
          const y = getY(tick);
          return (
            <g key={tick}>
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={y}
                y2={y}
                className="stroke-gray-200"
                strokeDasharray="4 4"
              />
              <text
                x={margin.left - 8}
                y={y + 4}
                className="fill-gray-500 text-[10px]"
                textAnchor="end"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Lines */}
        {linePaths.map((line) => (
          <path
            key={line.key}
            d={line.path}
            className={`${line.stroke} fill-none`}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Points */}
        {linePaths.map((line) =>
          line.points.map((point, index) => (
            <circle
              key={`${line.key}-${index}`}
              cx={point.x}
              cy={point.y}
              r={3.5}
              className={line.dot}
            />
          )),
        )}

        {/* X-axis labels */}
        {data.map((day, index) => {
          const x = getX(index);
          return (
            <g key={day.date}>
              <text
                x={x}
                y={height - 14}
                className="fill-gray-500 text-[10px]"
                textAnchor="middle"
              >
                {formatDateLabel(day.date)}
              </text>
              <text
                x={x}
                y={height - 26}
                className="fill-gray-900 text-[11px] font-semibold"
                textAnchor="middle"
              >
                {day.total}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
