import { useState } from 'react';
import { ScanRecord } from '../types';
import { fetchScans } from '../api';

type ScanTableProps = {
  initialDate: string;
};

function DirectionBadge({ direction }: { direction: string }) {
  const isToFactory = direction === 'to_factory';
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isToFactory
          ? 'bg-green-100 text-green-800'
          : 'bg-orange-100 text-orange-800'
      }`}
    >
      {isToFactory ? 'To Factory' : 'From Factory'}
    </span>
  );
}

export default function ScanTable({ initialDate }: ScanTableProps) {
  const [date, setDate] = useState(initialDate);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDateChange = async (newDate: string) => {
    setDate(newDate);
    
    if (!newDate) {
      setScans([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchScans(newDate);
      setScans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scans');
      setScans([]);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Scan Details</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
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
                Employee ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bus ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trip Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Direction
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex justify-center items-center">
                    <svg className="animate-spin h-5 w-5 mr-2 text-primary-500" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading scans...
                  </div>
                </td>
              </tr>
            ) : scans.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  {date ? 'No scans found for this date.' : 'Select a date to view scans.'}
                </td>
              </tr>
            ) : (
              scans.map((scan, index) => (
                <tr key={`${scan.scan_time}-${scan.employee_id}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(scan.scan_time)}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {scan.employee_id}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                    {scan.bus_id}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                    {scan.trip_code}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <DirectionBadge direction={scan.direction} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {scans.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
          Showing {scans.length} scan(s)
        </div>
      )}
    </div>
  );
}
