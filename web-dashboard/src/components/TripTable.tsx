import { TripSummary } from '../types';

type TripTableProps = {
  trips: TripSummary[];
  loading: boolean;
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

function LoadFactorBar({ loadFactor }: { loadFactor: number | null }) {
  const percentage = loadFactor !== null ? Math.round(loadFactor * 100) : 0;
  
  let barColor = 'bg-green-500';
  if (percentage >= 80) barColor = 'bg-red-500';
  else if (percentage >= 60) barColor = 'bg-yellow-500';
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-gray-600">{percentage}%</span>
    </div>
  );
}

export default function TripTable({ trips, loading }: TripTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Trip Summary</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trip Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bus ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Route
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Direction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Passengers
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Load Factor
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trips.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No trips found. Adjust filters and search again.
                </td>
              </tr>
            ) : (
              trips.map((trip, index) => (
                <tr key={`${trip.trip_date}-${trip.trip_code}-${trip.bus_id}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trip.trip_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {trip.trip_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {trip.bus_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {trip.route_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <DirectionBadge direction={trip.direction} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trip.passenger_count ?? 0} / {trip.capacity ?? '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <LoadFactorBar loadFactor={trip.load_factor} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
