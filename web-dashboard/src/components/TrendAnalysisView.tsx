// web-dashboard/src/components/TrendAnalysisView.tsx

import { useEffect, useState, useMemo } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths, addDays } from 'date-fns';
import toast from 'react-hot-toast';
import { Loader2, TrendingUp, TrendingDown, Users, UserCheck, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AttendanceRateTrendChart from './charts/AttendanceRateTrendChart';
import { fetchTrendData } from '../api';
import { TrendAnalysisData, FilterParams, TrendBreakdown, TrendView } from '../types';
import { aggregateToWeekly } from '../utils/weeklyAggregation';

type TrendAnalysisViewProps = {
  filters: FilterParams;
  onFilterChange: (filters: FilterParams) => void;
};

function StatCard({
  label,
  value,
  change,
  icon: Icon,
  valueColor = 'text-slate-800',
}: {
  label: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  valueColor?: string;
}) {
  const hasChange = change !== undefined && change !== null;
  const isPositive = hasChange && change > 0;
  const isNegative = hasChange && change < 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
        <div className="p-1.5 bg-slate-100 rounded-lg">
          <Icon className="w-4 h-4 text-slate-500" />
        </div>
      </div>
      <div className={`text-2xl font-bold font-mono ${valueColor}`}>{value}</div>
      {hasChange && (
        <div
          className={`flex items-center gap-1 mt-2 text-xs font-medium ${
            isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-slate-500'
          }`}
        >
          {isPositive ? (
            <>
              <TrendingUp className="w-3 h-3" />
              <span>+{change.toFixed(1)}%</span>
            </>
          ) : isNegative ? (
            <>
              <TrendingDown className="w-3 h-3" />
              <span>{change.toFixed(1)}%</span>
            </>
          ) : (
            <span>→ No change</span>
          )}
          <span className="text-slate-400">vs prev period</span>
        </div>
      )}
    </div>
  );
}

export default function TrendAnalysisView({ filters, onFilterChange }: TrendAnalysisViewProps) {
  const [trendData, setTrendData] = useState<TrendAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<TrendBreakdown>('none');
  const [view, setView] = useState<TrendView>('daily');
  const [showComparison, setShowComparison] = useState(true);

  // Load trend data when filters change
  useEffect(() => {
    const loadTrendData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTrendData({
          date_from: filters.date_from,
          date_to: filters.date_to,
          plants: filters.plants,
          shifts: filters.shifts,
          bus_ids: filters.bus_ids,
          routes: filters.routes,
          includePrevious: showComparison,
        });
        setTrendData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load trend data');
        toast.error(err.message || 'Failed to load trend data');
      } finally {
        setLoading(false);
      }
    };

    loadTrendData();
  }, [filters, showComparison]);

  // Calculate trend direction for display
  const trendDirection = useMemo(() => {
    if (!trendData?.summary.attendance_rate_change) return null;
    const change = trendData.summary.attendance_rate_change;
    if (Math.abs(change) < 0.1) return { label: 'Stable', icon: '→', color: 'text-slate-600' };
    if (change > 0)
      return { label: `Up ${change.toFixed(1)}%`, icon: '↑', color: 'text-emerald-600' };
    return { label: `Down ${Math.abs(change).toFixed(1)}%`, icon: '↓', color: 'text-red-600' };
  }, [trendData]);

  // Transform data based on view mode (daily vs weekly)
  const displayData = useMemo(() => {
    if (!trendData) return null;

    if (view === 'weekly') {
      return aggregateToWeekly(trendData.daily);
    }

    return trendData.daily;
  }, [trendData, view]);

  // Transform previous data for comparison
  const displayPreviousData = useMemo(() => {
    if (!trendData?.previous || !showComparison) return undefined;

    if (view === 'weekly') {
      return aggregateToWeekly(trendData.previous);
    }

    return trendData.previous;
  }, [trendData, view, showComparison]);

  // Export CSV handler
  const handleExport = () => {
    if (!trendData) return;

    const headers = ['Date', 'Expected (Roster)', 'Actual (Present)', 'Attendance Rate (%)'];
    const rows = trendData.daily.map(d => [
      d.date,
      d.roster.toString(),
      d.present.toString(),
      d.attendance_rate.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance-trends-${trendData.summary.date_from}-to-${trendData.summary.date_to}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800">Attendance Trends</h2>
          {filters.date_from && filters.date_to && (
            <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
              <Calendar className="w-3 h-3" />
              {filters.date_from} to {filters.date_to}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle: Daily vs Weekly */}
          <div className="flex bg-slate-100 rounded-lg p-1 text-xs">
            <button
              onClick={() => setView('daily')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                view === 'daily' ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-600'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setView('weekly')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                view === 'weekly' ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-600'
              }`}
            >
              Weekly
            </button>
          </div>

          {/* Comparison toggle */}
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showComparison}
              onChange={(e) => setShowComparison(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span>Show comparison</span>
          </label>

          {/* Export button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!trendData || loading}
            className="h-8"
          >
            <Download className="w-4 h-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Quick Date Selection */}
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
        <div className="text-xs font-medium text-slate-600 mb-2">Quick Date Selection:</div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              const today = format(new Date(), 'yyyy-MM-dd');
              onFilterChange({ ...filters, date_from: today, date_to: today });
            }}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-emerald-400 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => {
              const today = new Date();
              onFilterChange({
                ...filters,
                date_from: format(subDays(today, 6), 'yyyy-MM-dd'),
                date_to: format(today, 'yyyy-MM-dd'),
              });
            }}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-emerald-400 transition-colors"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => {
              const today = new Date();
              onFilterChange({
                ...filters,
                date_from: format(subDays(today, 29), 'yyyy-MM-dd'),
                date_to: format(today, 'yyyy-MM-dd'),
              });
            }}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-emerald-400 transition-colors"
          >
            Last 30 Days
          </button>
          <button
            onClick={() => {
              const today = new Date();
              onFilterChange({
                ...filters,
                date_from: format(startOfMonth(today), 'yyyy-MM-dd'),
                date_to: format(today, 'yyyy-MM-dd'),
              });
            }}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-emerald-400 transition-colors"
          >
            This Month
          </button>
          <button
            onClick={() => {
              const lastMonth = subMonths(new Date(), 1);
              onFilterChange({
                ...filters,
                date_from: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
                date_to: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
              });
            }}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-emerald-400 transition-colors"
          >
            Last Month
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && !trendData && (
        <div className="flex flex-col items-center justify-center py-20 text-emerald-600">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="text-sm font-medium">Loading trend data...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Error loading trend data</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Content */}
      {!loading && trendData && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Avg Attendance Rate"
              value={`${trendData.summary.avg_attendance_rate.toFixed(1)}%`}
              change={trendData.summary.attendance_rate_change}
              icon={TrendingUp}
              valueColor={
                trendData.summary.avg_attendance_rate >= 90
                  ? 'text-emerald-600'
                  : trendData.summary.avg_attendance_rate >= 70
                  ? 'text-amber-600'
                  : 'text-red-600'
              }
            />
            {trendDirection && (
              <StatCard
                label="Trend Direction"
                value={trendDirection.label}
                icon={trendDirection.label.includes('Up') ? TrendingUp : TrendingDown}
                valueColor={trendDirection.color}
              />
            )}
            <StatCard
              label="Total Expected"
              value={trendData.summary.total_roster.toLocaleString()}
              icon={Users}
            />
            <StatCard
              label="Total Actual"
              value={trendData.summary.total_present.toLocaleString()}
              icon={UserCheck}
              valueColor="text-emerald-600"
            />
          </div>

          {/* Main Chart */}
          <AttendanceRateTrendChart
            data={displayData}
            previousData={displayPreviousData}
            showComparison={showComparison && !!displayPreviousData}
            viewMode={view}
          />
        </>
      )}
    </div>
  );
}
