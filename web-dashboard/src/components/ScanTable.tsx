import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { AttendanceRecord } from '../types';
import { exportAttendanceCsv, fetchAttendance } from '../api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Download,
  RefreshCw,
  Search,
  ChevronRight,
  ChevronLeft,
  Clock,
  Sun,
  Moon,
  HelpCircle,
  User,
  Bus,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  ScanLine,
  Timer,
  Pause,
  Play,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { format, subDays, formatDistanceToNow } from 'date-fns';

type ScanTableProps = {
  initialDate: string;
  initialBusId?: string;
  initialShift?: string;
  availableBuses?: string[];
};

type SortField = 'scanned_at' | 'batch_id' | 'employee_name' | 'bus_id' | 'shift' | 'status';
type SortDirection = 'asc' | 'desc';

const SHIFT_OPTIONS = [
  { value: '', label: 'All Shifts', icon: null },
  { value: 'morning', label: 'Morning', icon: Sun },
  { value: 'night', label: 'Night', icon: Moon },
  { value: 'unknown', label: 'Unknown', icon: HelpCircle },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

export default function ScanTable({
  initialDate,
  initialBusId = '',
  initialShift = '',
  availableBuses = [],
}: ScanTableProps) {
  const [date, setDate] = useState(initialDate);
  const [busId, setBusId] = useState(initialBusId);
  const [shift, setShift] = useState(initialShift);
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('scanned_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination state
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setBusId(initialBusId || '');
  }, [initialBusId]);

  useEffect(() => {
    setShift(initialShift || '');
  }, [initialShift]);

  // Load attendance data
  const loadAttendance = useCallback(async (showLoading = true) => {
    if (!date) {
      setRecords([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (showLoading) setLoading(true);
    setIsRefreshing(true);
    setError(null);

    try {
      const data = await fetchAttendance(
        date,
        shift || undefined,
        busId || undefined
      );
      setRecords(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scans');
      setRecords([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [date, shift, busId]);

  // Initial load and on filter change
  useEffect(() => {
    loadAttendance();
    setCurrentPage(1); // Reset to first page on filter change
  }, [date, shift, busId, loadAttendance]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefresh && date) {
      refreshIntervalRef.current = setInterval(() => {
        loadAttendance(false); // Silent refresh without loading indicator
      }, AUTO_REFRESH_INTERVAL);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, date, loadAttendance]);

  // Statistics
  const stats = useMemo(() => {
    const morningCount = records.filter(r => r.shift === 'morning').length;
    const nightCount = records.filter(r => r.shift === 'night').length;
    const unknownCount = records.filter(r => r.shift === 'unknown').length;
    const presentCount = records.filter(r => r.status === 'present').length;
    return { total: records.length, morningCount, nightCount, unknownCount, presentCount };
  }, [records]);

  // Filtered and sorted records
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Search filter
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(r =>
        r.employee_name?.toLowerCase().includes(query) ||
        r.batch_id.toString().includes(query) ||
        r.bus_id?.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortField) {
        case 'scanned_at':
          aVal = a.scanned_at;
          bVal = b.scanned_at;
          break;
        case 'batch_id':
          aVal = a.batch_id;
          bVal = b.batch_id;
          break;
        case 'employee_name':
          aVal = a.employee_name || '';
          bVal = b.employee_name || '';
          break;
        case 'bus_id':
          aVal = a.bus_id || '';
          bVal = b.bus_id || '';
          break;
        case 'shift':
          aVal = a.shift;
          bVal = b.shift;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
      }

      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return result;
  }, [records, search, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRecords.slice(startIndex, startIndex + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleQuickDate = (type: 'today' | 'yesterday') => {
    const newDate = type === 'today' ? new Date() : subDays(new Date(), 1);
    setDate(format(newDate, 'yyyy-MM-dd'));
  };

  const handleRefresh = () => {
    loadAttendance(true);
  };

  const handleExport = async () => {
    if (!date) {
      setError('Select a date to export attendance');
      return;
    }
    setDownloading(true);
    try {
      await exportAttendanceCsv(date, shift || undefined, busId || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export attendance');
    } finally {
      setDownloading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-emerald-600 transition-colors"
    >
      {children}
      <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-emerald-600' : 'text-gray-400'}`} />
    </button>
  );

  const ShiftBadge = ({ shift }: { shift: string }) => {
    const config = {
      morning: { icon: Sun, bg: 'bg-emerald-100 text-emerald-700', label: 'Morning' },
      night: { icon: Moon, bg: 'bg-teal-100 text-teal-700', label: 'Night' },
      unknown: { icon: HelpCircle, bg: 'bg-amber-100 text-amber-700', label: 'Unknown' }
    };
    const c = config[shift as keyof typeof config] || config.unknown;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg}`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </span>
    );
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const isPresent = status === 'present';
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isPresent ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}>
        {isPresent ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
        {status}
      </span>
    );
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50/80 to-white border-b border-emerald-100">
        <div className="flex flex-col gap-4">
          {/* Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100">
                <ScanLine className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Scan Details</h3>
                <p className="text-xs text-gray-500">Click on a row to see more details</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => handleQuickDate('today')}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickDate('yesterday')}>
                Yesterday
              </Button>

              {/* Auto-refresh toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : ''}
              >
                {autoRefresh ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {autoRefresh ? 'Auto' : 'Auto'}
              </Button>

              {/* Manual refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Last Updated Time */}
          {lastUpdated && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Timer className="w-3.5 h-3.5" />
              <span>Last updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}</span>
              {autoRefresh && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Auto-refresh enabled (30s)
                </span>
              )}
            </div>
          )}

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Picker */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            {/* Bus Filter */}
            <select
              value={busId}
              onChange={(e) => setBusId(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              <option value="">All Buses</option>
              {availableBuses.map((bus) => (
                <option key={bus} value={bus}>
                  {bus}
                </option>
              ))}
            </select>

            {/* Shift Filter */}
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              {SHIFT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Search */}
            <div className="flex-1 min-w-[180px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search employee or batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Export Button */}
            <Button variant="outline" size="sm" onClick={handleExport} disabled={downloading}>
              <Download className="w-4 h-4 mr-1" />
              {downloading ? 'Exporting...' : 'CSV'}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Summary with Filter Count */}
      <div className="px-4 sm:px-5 py-3 bg-gray-50/50 border-b border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
          {/* Left side - Stats */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-emerald-600">{stats.total}</span>
              <span className="text-gray-500">total records</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-emerald-500" />
              <span className="text-gray-700">{stats.morningCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-teal-500" />
              <span className="text-gray-700">{stats.nightCount}</span>
            </div>
            {stats.unknownCount > 0 && (
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                <span className="text-amber-600">{stats.unknownCount}</span>
              </div>
            )}
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-gray-700">{stats.presentCount} present</span>
            </div>
          </div>

          {/* Right side - Filter indicator */}
          {search && (
            <div className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              Showing {filteredRecords.length} of {records.length} (filtered)
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 py-3 bg-red-50 border-b border-red-100 text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
            <tr>
              <th className="w-8 px-2"></th>
              <th className="px-4 py-3 text-left">
                <SortableHeader field="scanned_at">Time</SortableHeader>
              </th>
              <th className="px-4 py-3 text-left">
                <SortableHeader field="batch_id">PersonId</SortableHeader>
              </th>
              <th className="px-4 py-3 text-left">
                <SortableHeader field="employee_name">Employee</SortableHeader>
              </th>
              <th className="px-4 py-3 text-left">
                <SortableHeader field="bus_id">Bus</SortableHeader>
              </th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Van</th>
              <th className="px-4 py-3 text-left">
                <SortableHeader field="shift">Shift</SortableHeader>
              </th>
              <th className="px-4 py-3 text-left">
                <SortableHeader field="status">Status</SortableHeader>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                  <p className="text-gray-500">Loading scans...</p>
                </td>
              </tr>
            ) : paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <ScanLine className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-500">
                    {date ? (search ? 'No matching records found' : 'No scans found for this date') : 'Select a date to view scans'}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record, index) => {
                const recordId = `${record.scanned_at}-${record.batch_id}-${index}`;
                const isExpanded = expandedId === recordId;

                return (
                  <>
                    <tr
                      key={recordId}
                      onClick={() => toggleExpand(recordId)}
                      className={`
                        cursor-pointer transition-colors
                        ${isExpanded ? 'bg-emerald-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                        hover:bg-emerald-50/50
                      `}
                    >
                      <td className="px-2 py-3">
                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{formatTime(record.scanned_at)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {record.batch_id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {record.employee_name || <span className="text-gray-400">Unknown</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {record.bus_id || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                        {record.van_id ?? '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <ShiftBadge shift={record.shift} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={record.status} />
                      </td>
                    </tr>
                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <tr key={`${recordId}-detail`} className="bg-emerald-50/30">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="ml-6 p-4 bg-white rounded-xl border border-emerald-100 shadow-sm">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase">Full Timestamp</p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {new Date(record.scanned_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase">Employee</p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {record.employee_name || 'Unknown'} (#{record.batch_id})
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Bus className="w-4 h-4 text-gray-400" />
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase">Bus</p>
                                  <p className="text-sm font-medium text-gray-900">{record.bus_id || 'Not assigned'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-gray-400" />
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase">Van</p>
                                  <p className="text-sm font-medium text-gray-900">{record.van_id || 'Not assigned'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredRecords.length > 0 && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left side - Results info */}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span>
                Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredRecords.length)} of{' '}
                <span className="font-semibold text-gray-900">{filteredRecords.length}</span> records
              </span>
              {search && (
                <span className="text-emerald-600">(filtered from {records.length})</span>
              )}
            </div>

            {/* Right side - Pagination controls */}
            <div className="flex items-center gap-4">
              {/* Page size selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {PAGE_SIZE_OPTIONS.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              {/* Page navigation */}
              <div className="flex items-center gap-1">
                {/* First page */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="First page"
                >
                  <ChevronsLeft className="w-4 h-4 text-gray-600" />
                </button>

                {/* Previous page */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>

                {/* Page indicator */}
                <span className="px-3 py-1 text-sm font-medium text-gray-700">
                  {currentPage} / {totalPages || 1}
                </span>

                {/* Next page */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>

                {/* Last page */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Last page"
                >
                  <ChevronsRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
