import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { format, parseISO, subDays, eachDayOfInterval } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import PageHeader from '../components/PageHeader';
import SectionHeader from '../components/SectionHeader';
import KpiCard from '../components/KpiCard';
import { fetchBuses, fetchBusDetail, fetchHeadcount, fetchOccupancy } from '../api';
import { BusDetailResponse, HeadcountResponse, OccupancyResponse } from '../types';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bus as BusIcon, RefreshCw, TrendingUp, Users, AlertTriangle, Layers } from 'lucide-react';

function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function getWeekAgoString(): string {
  return format(subDays(new Date(), 7), 'yyyy-MM-dd');
}

type ShiftValue = '' | 'morning' | 'night';

const SHIFT_OPTIONS: { value: ShiftValue; label: string }[] = [
  { value: '', label: 'All Shifts' },
  { value: 'morning', label: 'Morning' },
  { value: 'night', label: 'Night' },
];

type TrendPoint = {
  date: string;
  present: number;
  absent: number;
  utilization_pct: number;
};

export default function BusDashboard() {
  const today = getTodayString();

  const [selectedDay, setSelectedDay] = useState(today);
  const [trendFrom, setTrendFrom] = useState(getWeekAgoString());
  const [trendTo, setTrendTo] = useState(today);
  const [shift, setShift] = useState<ShiftValue>('');
  const [busIds, setBusIds] = useState<string[]>([]);
  const [route, setRoute] = useState('');

  const [loading, setLoading] = useState(false);
  const [busOptions, setBusOptions] = useState<string[]>([]);
  const [routeOptions, setRouteOptions] = useState<string[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancyResponse | null>(null);
  const [headcount, setHeadcount] = useState<HeadcountResponse>({ rows: [] });
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [tableSearch, setTableSearch] = useState('');
  const [tableProblemsOnly, setTableProblemsOnly] = useState(false);
  const [tableHideUnassigned, setTableHideUnassigned] = useState(true);

  const requestRef = useRef(0);

  const busIdParam = useMemo(() => (busIds.length ? busIds.join(',') : ''), [busIds]);

  const loadAll = useCallback(async (notify = false) => {
    const currentRequest = ++requestRef.current;
    setLoading(true);
    setLoadError(null);
    try {
      const [occRes, hcRes] = await Promise.allSettled([
        fetchOccupancy({
          date_from: selectedDay,
          date_to: selectedDay,
          shift,
          bus_id: busIdParam,
          route,
        }),
        fetchHeadcount({
          date_from: trendFrom,
          date_to: trendTo,
          shift,
          bus_id: busIdParam,
          route,
        }),
      ]);

      if (requestRef.current !== currentRequest) return;

      if (occRes.status === 'fulfilled') {
        setOccupancy(occRes.value);
      } else {
        setOccupancy(null);
        if (notify) toast.error(`Failed to load daily occupancy`);
      }

      if (hcRes.status === 'fulfilled') {
        setHeadcount(hcRes.value);
      } else {
        setHeadcount({ rows: [] });
        if (notify) toast.error(`Failed to load trend data`);
      }

      setLastUpdated(new Date().toISOString());
      if (occRes.status !== 'fulfilled' || hcRes.status !== 'fulfilled') {
        setLoadError('Some dashboard data failed to load. Check your filters or retry.');
      }
    } catch (err) {
      if (requestRef.current !== currentRequest) return;
      const message = err instanceof Error ? err.message : 'Failed to load dashboard';
      if (notify) toast.error(message);
      setLoadError(message);
      setOccupancy(null);
      setHeadcount({ rows: [] });
    } finally {
      if (requestRef.current === currentRequest) setLoading(false);
    }
  }, [busIdParam, route, selectedDay, shift, trendFrom, trendTo]);

  const reset = () => {
    setSelectedDay(today);
    setTrendFrom(getWeekAgoString());
    setTrendTo(today);
    setShift('');
    setBusIds([]);
    setRoute('');
  };

  useEffect(() => {
    const handle = window.setTimeout(() => {
      loadAll(false);
    }, 350);
    return () => window.clearTimeout(handle);
  }, [selectedDay, trendFrom, trendTo, shift, busIds, route, loadAll]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const buses = await fetchBuses();
        if (cancelled) return;
        const ids = buses.map((b) => b.bus_id).filter(Boolean);
        setBusOptions(ids.sort());

        const routes = new Set<string>();
        buses.forEach((b) => {
          if (b.route) routes.add(b.route);
        });
        setRouteOptions(Array.from(routes).sort((a, b) => a.localeCompare(b)));
      } catch {
        if (!cancelled) {
          setBusOptions([]);
          setRouteOptions([]);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const dailyTotals = useMemo(() => {
    const totalRoster = occupancy?.total_roster ?? 0;
    const totalPresent = occupancy?.total_present ?? 0;
    const totalCapacity = occupancy?.total_capacity ?? 0;
    const absent = Math.max(totalRoster - totalPresent, 0);
    const utilization = totalCapacity > 0 ? Math.round((totalPresent / totalCapacity) * 1000) / 10 : 0;
    const attendanceRate = totalRoster > 0 ? Math.round((totalPresent / totalRoster) * 1000) / 10 : 0;
    return {
      totalRoster,
      totalPresent,
      totalAbsent: absent,
      totalCapacity,
      utilization_pct: utilization,
      attendance_rate_pct: attendanceRate,
      totalVanCount: occupancy?.total_van_count ?? 0,
      totalBusPresent: occupancy?.total_bus_present ?? 0,
      totalVanPresent: occupancy?.total_van_present ?? 0,
    };
  }, [occupancy]);

  const occupancyRows = useMemo(() => {
    if (!occupancy) return [];
    const query = tableSearch.trim().toLowerCase();
    return occupancy.rows.filter((row) => {
      if (tableHideUnassigned && (row.bus_id === 'UNKN' || row.bus_id === 'OWN')) return false;
      if (tableProblemsOnly) {
        const absent = Math.max(row.total_roster - row.total_present, 0);
        if (absent <= 0) return false;
      }
      if (!query) return true;
      return row.bus_id.toLowerCase().includes(query) || (row.route || '').toLowerCase().includes(query);
    });
  }, [occupancy, tableSearch, tableProblemsOnly, tableHideUnassigned]);

  const trendSeries: TrendPoint[] = useMemo(() => {
    if (!trendFrom || !trendTo) return [];
    let start: Date;
    let end: Date;
    try {
      start = parseISO(trendFrom);
      end = parseISO(trendTo);
    } catch {
      return [];
    }
    if (start > end) return [];

    const byDay = new Map<string, number>();
    for (const row of headcount.rows) {
      const d = row.date;
      byDay.set(d, (byDay.get(d) || 0) + (row.present || 0));
    }

    const rosterTotal = dailyTotals.totalRoster;
    const capacityTotal = dailyTotals.totalCapacity;

    return eachDayOfInterval({ start, end }).map((day) => {
      const d = format(day, 'yyyy-MM-dd');
      const present = byDay.get(d) || 0;
      const absent = Math.max(rosterTotal - present, 0);
      const utilization = capacityTotal > 0 ? Math.round((present / capacityTotal) * 1000) / 10 : 0;
      return {
        date: d,
        present,
        absent,
        utilization_pct: utilization,
      };
    });
  }, [headcount.rows, trendFrom, trendTo, dailyTotals.totalRoster, dailyTotals.totalCapacity]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailBusId, setDetailBusId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detail, setDetail] = useState<BusDetailResponse | null>(null);
  const [detailTab, setDetailTab] = useState<'present' | 'absent' | 'all'>('present');
  const [detailType, setDetailType] = useState<'all' | 'bus' | 'van'>('all');
  const [detailSearch, setDetailSearch] = useState('');
  const [detailIncludeInactive, setDetailIncludeInactive] = useState(false);

  const [busDropdownOpen, setBusDropdownOpen] = useState(false);
  const [busDropdownSearch, setBusDropdownSearch] = useState('');
  const busDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!busDropdownOpen) return;
    const onDown = (e: MouseEvent) => {
      const el = busDropdownRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setBusDropdownOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [busDropdownOpen]);

  const filteredBusOptions = useMemo(() => {
    const q = busDropdownSearch.trim().toLowerCase();
    if (!q) return busOptions;
    return busOptions.filter((b) => b.toLowerCase().includes(q));
  }, [busDropdownSearch, busOptions]);

  useEffect(() => {
    if (!detailOpen || !detailBusId) return;
    const load = async () => {
      setDetailLoading(true);
      setDetailError(null);
      setDetail(null);
      try {
        const result = await fetchBusDetail({
          bus_id: detailBusId,
          date_from: selectedDay,
          date_to: selectedDay,
          shift: shift || undefined,
          include_inactive: detailIncludeInactive,
        });
        setDetail(result);
      } catch (err) {
        setDetailError(err instanceof Error ? err.message : 'Failed to load bus detail');
      } finally {
        setDetailLoading(false);
      }
    };
    load();
  }, [detailOpen, detailBusId, selectedDay, shift, detailIncludeInactive]);

  const exportDetailCsv = (rows: BusDetailResponse['employees'], filename: string) => {
    const header = ['personid', 'name', 'type', 'van_code', 'pickup_point', 'contractor', 'plant', 'present', 'scanned_at'];
    const csvLines = [header.join(',')];
    for (const r of rows) {
      const line = [
        r.personid,
        r.name || '',
        r.category,
        r.van_code || '',
        r.pickup_point || '',
        r.contractor || '',
        r.plant || '',
        r.present ? 'present' : 'absent',
        r.scanned_at || '',
      ]
        .map((v) => `"${String(v).replace(/\"/g, '""')}"`)
        .join(',');
      csvLines.push(line);
    }
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const detailFilteredRows = useMemo(() => {
    if (!detail) return [];
    const q = detailSearch.trim().toLowerCase();
    return detail.employees.filter((e) => {
      if (detailTab === 'present' && !e.present) return false;
      if (detailTab === 'absent' && e.present) return false;
      if (detailType !== 'all' && e.category !== detailType) return false;
      if (!q) return true;
      return (
        String(e.personid).includes(q) ||
        (e.name || '').toLowerCase().includes(q) ||
        (e.pickup_point || '').toLowerCase().includes(q) ||
        (e.contractor || '').toLowerCase().includes(q) ||
        (e.plant || '').toLowerCase().includes(q) ||
        (e.van_code || '').toLowerCase().includes(q)
      );
    });
  }, [detail, detailSearch, detailTab, detailType]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Bus Occupancy"
        subtitle="Focus on one day: capacity vs actual, plus rider drilldown and trend."
        rightContent={
          <div className="text-right">
            <p className="text-xs text-slate-400">Last updated</p>
            <p className="text-sm font-semibold text-slate-700">{lastUpdated ? format(parseISO(lastUpdated), 'yyyy-MM-dd HH:mm') : '—'}</p>
          </div>
        }
      />

      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Selected Day</label>
            <Input type="date" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} />
          </div>

          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Trend Range</label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={trendFrom} onChange={(e) => setTrendFrom(e.target.value)} />
              <Input type="date" value={trendTo} onChange={(e) => setTrendTo(e.target.value)} />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
            <Select value={shift || 'all'} onValueChange={(v) => setShift((v === 'all' ? '' : (v as ShiftValue)))} >
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue placeholder="All Shifts" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="all" className="focus:bg-emerald-50">All Shifts</SelectItem>
                {SHIFT_OPTIONS.filter((s) => s.value !== '').map((s) => (
                  <SelectItem key={s.value} value={s.value} className="focus:bg-emerald-50">{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bus ID</label>
            <div className="relative" ref={busDropdownRef}>
              <Button
                variant="outline"
                className="w-full justify-between bg-white border-gray-300"
                onClick={() => setBusDropdownOpen((v) => !v)}
                type="button"
              >
                <span className="truncate">
                  {busIds.length === 0 ? 'All Buses' : busIds.length === 1 ? `Bus ${busIds[0]}` : `${busIds.length} buses selected`}
                </span>
                <span className="text-gray-400">{busDropdownOpen ? '▲' : '▼'}</span>
              </Button>

              {busDropdownOpen && (
                <div className="absolute z-40 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
                  <div className="p-2 border-b border-gray-100">
                    <Input
                      value={busDropdownSearch}
                      onChange={(e) => setBusDropdownSearch(e.target.value)}
                      placeholder="Search bus id..."
                    />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => setBusIds(busOptions)}
                        disabled={busOptions.length === 0}
                      >
                        Select all
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => setBusIds([])}
                        disabled={busIds.length === 0}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto p-2">
                    {filteredBusOptions.length === 0 ? (
                      <div className="px-2 py-6 text-center text-sm text-gray-500">No buses.</div>
                    ) : (
                      filteredBusOptions.map((b) => {
                        const checked = busIds.includes(b);
                        return (
                          <label
                            key={b}
                            className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-emerald-50/50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setBusIds((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-gray-900">{b}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
            <Select value={route || 'all'} onValueChange={(v) => setRoute(v === 'all' ? '' : v)}>
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue placeholder="All Routes" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="all" className="focus:bg-emerald-50">All Routes</SelectItem>
                {routeOptions.map((r) => (
                  <SelectItem key={r} value={r} className="focus:bg-emerald-50">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const d = getTodayString();
                setSelectedDay(d);
              }}
              disabled={loading}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const d = getTodayString();
                setTrendFrom(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
                setTrendTo(d);
              }}
              disabled={loading}
            >
              7 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const d = getTodayString();
                setTrendFrom(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
                setTrendTo(d);
              }}
              disabled={loading}
            >
              30 days
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {(shift || busIds.length > 0 || route || selectedDay !== today || trendFrom !== getWeekAgoString() || trendTo !== today) && (
              <Button variant="outline" size="sm" onClick={reset} disabled={loading}>
                Reset
              </Button>
            )}
            <Button size="sm" onClick={() => loadAll(true)} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </Card>

      {loadError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-2 text-sm text-rose-800">
          {loadError}
        </div>
      ) : null}

      <SectionHeader title={`Selected Day: ${selectedDay}`} color="emerald" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard
          title="Total Present"
          value={dailyTotals.totalPresent}
          subtitle={`bus ${dailyTotals.totalBusPresent} · van ${dailyTotals.totalVanPresent}`}
          color="green"
          icon={<Users className="w-5 h-5" />}
          variant="compact"
        />
        <KpiCard
          title="Total Absent"
          value={dailyTotals.totalAbsent}
          subtitle={`roster ${dailyTotals.totalRoster}`}
          color={dailyTotals.totalAbsent > 0 ? 'red' : 'green'}
          icon={<AlertTriangle className="w-5 h-5" />}
          variant="compact"
        />
        <KpiCard
          title="Attendance Rate"
          value={dailyTotals.attendance_rate_pct}
          subtitle="% of roster"
          color={dailyTotals.attendance_rate_pct >= 90 ? 'green' : dailyTotals.attendance_rate_pct >= 80 ? 'amber' : 'red'}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="compact"
        />
        <KpiCard
          title="Utilization"
          value={dailyTotals.utilization_pct}
          subtitle="% of capacity"
          color={dailyTotals.utilization_pct >= 85 ? 'red' : dailyTotals.utilization_pct >= 65 ? 'amber' : 'green'}
          icon={<BusIcon className="w-5 h-5" />}
          variant="compact"
        />
        <KpiCard
          title="Vans (Active)"
          value={dailyTotals.totalVanCount}
          subtitle="assigned to buses"
          color="teal"
          icon={<Layers className="w-5 h-5" />}
          variant="compact"
        />
      </div>

      <section>
        <div className="flex items-center justify-between gap-3">
          <SectionHeader title="Daily Occupancy (by Bus)" color="emerald" />
          <div className="text-sm text-gray-500">
            Click a row to see <span className="font-semibold text-gray-900">who rode</span>.
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <div className="px-5 py-3 border-b border-emerald-100 bg-white flex flex-wrap items-center justify-between gap-3">
            <Input value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} placeholder="Search bus id or route" className="max-w-sm" />
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={tableProblemsOnly}
                  onChange={(e) => setTableProblemsOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Problems only (absent &gt; 0)
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={tableHideUnassigned}
                  onChange={(e) => setTableHideUnassigned(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Hide OWN/UNKN
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bus</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Vans</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Cap (bus)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Cap (van)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Cap (total)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actual (bus)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actual (van)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actual (total)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Absent</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Attend%</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Util%</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Roster</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : !occupancy ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-gray-500">
                      No data for selected day.
                    </td>
                  </tr>
                ) : (
                  <>
                    {occupancyRows.map((row, index) => {
                      const absent = Math.max(row.total_roster - row.total_present, 0);
                      const attendPct = row.total_roster > 0 ? Math.round((row.total_present / row.total_roster) * 1000) / 10 : 0;
                      const utilPct = row.total_capacity > 0 ? Math.round((row.total_present / row.total_capacity) * 1000) / 10 : 0;
                      const utilColor = utilPct >= 85 ? 'text-rose-700' : utilPct >= 65 ? 'text-amber-700' : 'text-emerald-700';

                      return (
                        <tr
                          key={row.bus_id}
                          className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-emerald-50/50 transition-colors cursor-pointer`}
                          onClick={() => {
                            setDetailBusId(row.bus_id);
                            setDetailTab('present');
                            setDetailType('all');
                            setDetailSearch('');
                            setDetailIncludeInactive(false);
                            setDetailOpen(true);
                          }}
                        >
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900">
                            <div className="flex flex-col">
                              <span>{row.bus_id}</span>
                              <span className="text-xs font-medium text-gray-500">{row.route || ''}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900 text-right tabular-nums">{row.van_count}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900 text-right tabular-nums">{row.bus_capacity}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900 text-right tabular-nums">{row.van_capacity}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900 text-right tabular-nums">{row.total_capacity}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900 text-right tabular-nums">{row.bus_present}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900 text-right tabular-nums">{row.van_present}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900 text-right tabular-nums">{row.total_present}</td>
                          <td className={`px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-right tabular-nums ${absent > 0 ? 'text-rose-700' : 'text-gray-500'}`}>
                            {absent}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900 text-right tabular-nums">
                            {attendPct}%
                          </td>
                          <td className={`px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-right ${utilColor}`}>
                            <div className="flex items-center justify-end gap-2">
                              <span className="tabular-nums">{utilPct}%</span>
                              <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className={`h-full ${utilPct >= 85 ? 'bg-rose-500' : utilPct >= 65 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.min(Math.max(utilPct, 0), 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700 text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-semibold text-gray-900 tabular-nums">{row.total_roster}</span>
                              <span className="text-xs text-gray-500">
                                bus {row.bus_roster} · van {row.van_roster}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    <tr className="bg-emerald-50/40 border-t border-emerald-100">
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900">TOTAL</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900 text-right tabular-nums">{occupancy.total_van_count}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900 text-right tabular-nums">{occupancy.total_bus_capacity}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900 text-right tabular-nums">{occupancy.total_van_capacity}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900 text-right tabular-nums">{occupancy.total_capacity}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900 text-right tabular-nums">{occupancy.total_bus_present}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900 text-right tabular-nums">{occupancy.total_van_present}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900 text-right tabular-nums">{occupancy.total_present}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-rose-700 text-right tabular-nums">
                        {Math.max(occupancy.total_roster - occupancy.total_present, 0)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900 text-right tabular-nums">
                        {occupancy.total_roster > 0 ? `${Math.round((occupancy.total_present / occupancy.total_roster) * 1000) / 10}%` : '0%'}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-emerald-700 text-right tabular-nums">
                        {occupancy.total_capacity > 0 ? `${Math.round((occupancy.total_present / occupancy.total_capacity) * 1000) / 10}%` : '0%'}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900 text-right tabular-nums">{occupancy.total_roster}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Trend" color="emerald" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">Present vs Absent</div>
                <div className="text-xs text-gray-500">{trendFrom} → {trendTo}</div>
              </div>
              <div className="flex items-center gap-2">
                {busIds.length ? (
                  <Badge className="bg-teal-100 text-teal-700 border-0">
                    {busIds.length === 1 ? `Bus ${busIds[0]}` : `${busIds.length} buses`}
                  </Badge>
                ) : null}
                {route ? <Badge className="bg-cyan-100 text-cyan-700 border-0">{route}</Badge> : null}
                {shift ? <Badge className="bg-emerald-100 text-emerald-700 border-0">{shift}</Badge> : null}
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="present" stroke="#10B981" fill="#10B981" fillOpacity={0.15} strokeWidth={2} />
                  <Area type="monotone" dataKey="absent" stroke="#F43F5E" fill="#F43F5E" fillOpacity={0.12} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">Utilization %</div>
                <div className="text-xs text-gray-500">{trendFrom} → {trendTo}</div>
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="utilization_pct" stroke="#0EA5E9" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </section>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-none w-full sm:w-[min(100vw,980px)] h-[100vh] overflow-y-auto left-auto right-0 top-0 translate-x-0 translate-y-0 rounded-none sm:rounded-l-2xl data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0">
          <DialogHeader>
            <DialogTitle>
              Bus {detailBusId ? <span className="font-extrabold text-emerald-700">{detailBusId}</span> : ''}
              <span className="text-gray-500 font-medium"> · {selectedDay}</span>
              {detail?.route ? <span className="text-gray-500 font-medium"> · {detail.route}</span> : null}
            </DialogTitle>
          </DialogHeader>

          {detailError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{detailError}</div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
            <Card className="p-4">
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Roster</div>
              <div className="mt-1 text-2xl font-extrabold text-gray-900">{detail?.roster_total ?? '—'}</div>
              <div className="mt-1 text-xs text-gray-500">bus {detail?.roster_bus ?? '—'} · van {detail?.roster_van ?? '—'}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Present</div>
              <div className="mt-1 text-2xl font-extrabold text-emerald-700">{detail?.present_total ?? '—'}</div>
              <div className="mt-1 text-xs text-gray-500">bus {detail?.present_bus ?? '—'} · van {detail?.present_van ?? '—'}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Absent</div>
              <div className="mt-1 text-2xl font-extrabold text-rose-700">{detail?.absent_total ?? '—'}</div>
              <div className="mt-1 text-xs text-gray-500">bus {detail?.absent_bus ?? '—'} · van {detail?.absent_van ?? '—'}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Attendance Rate</div>
              <div className="mt-1 text-2xl font-extrabold text-gray-900">{detail ? `${detail.attendance_rate_pct}%` : '—'}</div>
              <div className="mt-1 text-xs text-gray-500">present / roster</div>
            </Card>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Button variant={detailTab === 'present' ? 'default' : 'outline'} size="sm" onClick={() => setDetailTab('present')}>
                Present
              </Button>
              <Button variant={detailTab === 'absent' ? 'default' : 'outline'} size="sm" onClick={() => setDetailTab('absent')}>
                Absent
              </Button>
              <Button variant={detailTab === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setDetailTab('all')}>
                All
              </Button>
              <span className="w-px h-8 bg-gray-200 mx-1" />
              <Button variant={detailType === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setDetailType('all')}>
                All types
              </Button>
              <Button variant={detailType === 'bus' ? 'default' : 'outline'} size="sm" onClick={() => setDetailType('bus')}>
                Bus
              </Button>
              <Button variant={detailType === 'van' ? 'default' : 'outline'} size="sm" onClick={() => setDetailType('van')}>
                Van
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={detailIncludeInactive}
                  onChange={(e) => setDetailIncludeInactive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Include inactive
              </label>
              <Input
                value={detailSearch}
                onChange={(e) => setDetailSearch(e.target.value)}
                placeholder="Search name/PersonId/pickup/van/contractor"
                className="max-w-sm"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!detail || detailLoading}
                onClick={() => {
                  if (!detail) return;
                  const base = `bus-${detail.bus_id}_${selectedDay}`;
                  exportDetailCsv(detailFilteredRows, `${base}_${detailTab}.csv`);
                }}
              >
                Export
              </Button>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PersonId</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Van</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pickup</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contractor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Plant</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {detailLoading ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : !detail ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                        No data.
                      </td>
                    </tr>
                  ) : detailFilteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                        No matching employees.
                      </td>
                    </tr>
                  ) : (
                    detailFilteredRows.map((e) => (
                      <tr key={e.personid} className="hover:bg-emerald-50/30">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 tabular-nums">{e.personid}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{e.name || ''}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{e.category}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{e.van_code || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{e.pickup_point || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{e.contractor || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{e.plant || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${e.present ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {e.present ? 'Present' : 'Absent'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {e.scanned_at ? format(parseISO(e.scanned_at), 'yyyy-MM-dd HH:mm') : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
