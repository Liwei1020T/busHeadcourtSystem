// web-dashboard/src/components/RouteDrilldownModal.tsx

import { X, Bus, Users, TrendingUp } from 'lucide-react';
import { OccupancyBusRow } from '../types';

type RouteDrilldownModalProps = {
  route: string;
  buses: OccupancyBusRow[];
  onClose: () => void;
  onBusClick?: (bus: OccupancyBusRow) => void;
};

export default function RouteDrilldownModal({
  route,
  buses,
  onClose,
  onBusClick,
}: RouteDrilldownModalProps) {
  // Calculate route stats
  const totalPassengers = buses.reduce((acc, b) => acc + b.bus_present, 0);
  const totalCapacity = buses.reduce((acc, b) => acc + b.bus_capacity, 0);
  const avgUtilization = totalCapacity > 0 ? (totalPassengers / totalCapacity) * 100 : 0;

  const getUtilColor = (util: number) => {
    if (util > 80) return 'text-emerald-600 bg-emerald-50';
    if (util < 30) return 'text-red-600 bg-red-50';
    if (util < 50) return 'text-amber-600 bg-amber-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getUtilBarColor = (util: number) => {
    if (util > 100) return 'bg-red-500';
    if (util > 80) return 'bg-emerald-500';
    if (util < 30) return 'bg-red-400';
    return 'bg-blue-500';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Route: {route}</h2>
            <p className="text-sm text-slate-500">{buses.length} buses on this route</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3 p-4 border-b border-slate-100">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
              <Bus className="w-4 h-4" />
              <span className="text-xs font-medium">Buses</span>
            </div>
            <div className="text-xl font-bold text-slate-800">{buses.length}</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Passengers</span>
            </div>
            <div className="text-xl font-bold text-blue-600">{totalPassengers}</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Avg Utilization</span>
            </div>
            <div className={`text-xl font-bold ${avgUtilization > 80 ? 'text-emerald-600' : avgUtilization < 30 ? 'text-red-600' : 'text-amber-600'}`}>
              {avgUtilization.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Bus List */}
        <div className="overflow-auto max-h-[400px]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 font-semibold text-slate-600">Bus ID</th>
                <th className="text-right px-4 py-2 font-semibold text-slate-600">Passengers</th>
                <th className="text-right px-4 py-2 font-semibold text-slate-600">Capacity</th>
                <th className="text-right px-4 py-2 font-semibold text-slate-600">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {buses
                .sort((a, b) => {
                  const utilA = a.bus_capacity > 0 ? (a.bus_present / a.bus_capacity) * 100 : 0;
                  const utilB = b.bus_capacity > 0 ? (b.bus_present / b.bus_capacity) * 100 : 0;
                  return utilB - utilA;
                })
                .map((bus) => {
                  const util = bus.bus_capacity > 0 ? (bus.bus_present / bus.bus_capacity) * 100 : 0;
                  return (
                    <tr
                      key={bus.bus_id}
                      className={`hover:bg-slate-50 ${onBusClick ? 'cursor-pointer' : ''}`}
                      onClick={() => onBusClick?.(bus)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">{bus.bus_id}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {bus.bus_present}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        {bus.bus_capacity}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getUtilBarColor(util)}`}
                              style={{ width: `${Math.min(util, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${getUtilColor(util)}`}>
                            {util.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
