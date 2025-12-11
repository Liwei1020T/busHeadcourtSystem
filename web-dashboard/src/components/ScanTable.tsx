import { useEffect, useState } from 'react';
import { AttendanceRecord } from '../types';
import { exportAttendanceCsv, fetchAttendance } from '../api';

type ScanTableProps = {
  initialDate: string;
  initialBusId?: string;
  initialShift?: string;
  availableBuses?: string[];
};

const SHIFT_OPTIONS = [
  { value: '', label: 'All Shifts' },
  { value: 'morning', label: 'Morning' },
  { value: 'night', label: 'Night' },
  { value: 'unknown', label: 'Unknown' },
];

export default function ScanTable({
  initialDate,
  initialBusId = '',
  initialShift = '',
  availableBuses = [],
}: ScanTableProps) {
  const [date, setDate] = useState(initialDate);
  const [busId, setBusId] = useState(initialBusId);
  const [shift, setShift] = useState(initialShift);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBusId(initialBusId || '');
  }, [initialBusId]);

  useEffect(() => {
    setShift(initialShift || '');
  }, [initialShift]);

  useEffect(() => {
    if (!date) {
      setRecords([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const loadAttendance = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchAttendance(
          date,
          shift || undefined,
          busId || undefined
        );
        if (!cancelled) {
          setRecords(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load scans');
          setRecords([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAttendance();

    return () => {
      cancelled = true;
    };
  }, [date, shift, busId]);

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

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Scan Details</h3>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Bus:</label>
            <select
              value={busId}
              onChange={(e) => setBusId(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="">All Buses</option>
              {availableBuses.map((bus) => (
                <option key={bus} value={bus}>
                  {bus}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Shift:</label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              {SHIFT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExport}
            disabled={downloading}
            className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {downloading ? 'Downloading...' : 'Download CSV'}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto max-h-96">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scan Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Batch ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bus
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Van
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shift
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex justify-center items-center">
                    <svg className="animate-spin h-5 w-5 mr-2 text-primary-500" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading scans...
                  </div>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  {date ? 'No scans found for this date.' : 'Select a date to view scans.'}
                </td>
              </tr>
            ) : (
              records.map((record, index) => (
                <tr key={`${record.scanned_at}-${record.batch_id}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(record.scanned_at)}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.batch_id}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                    {record.employee_name || '-'}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                    {record.bus_id || '-'}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    {record.van_id ?? '-'}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {record.shift}
                    </span>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {records.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
          Showing {records.length} attendance record(s)
          {busId ? ` • Bus ${busId}` : ''}{shift ? ` • ${shift} shift` : ''} {date ? `on ${date}` : ''}
        </div>
      )}
    </div>
  );
}
