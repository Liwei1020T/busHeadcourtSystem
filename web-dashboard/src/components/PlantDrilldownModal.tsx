// web-dashboard/src/components/PlantDrilldownModal.tsx

import { X, Bus, Users, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { PlantGroup } from '../utils/plants';
import { getSeverityLevel } from '../lib/theme';

type PlantDrilldownModalProps = {
  plant: PlantGroup;
  onClose: () => void;
};

export default function PlantDrilldownModal({ plant, onClose }: PlantDrilldownModalProps) {
  const sortedBuses = [...plant.buses].sort((a, b) => {
    const utilA = a.bus_capacity > 0 ? (a.total_present / a.bus_capacity) * 100 : 0;
    const utilB = b.bus_capacity > 0 ? (b.total_present / b.bus_capacity) * 100 : 0;
    return utilB - utilA;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <span className="text-xl font-bold text-emerald-700">{plant.plant}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Plant {plant.plant} Details</h2>
              <p className="text-sm text-slate-500">{plant.buses.length} buses in this plant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{plant.buses.length}</div>
              <div className="text-xs text-slate-500">Total Buses</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                plant.avgUtilization > 80 ? 'text-emerald-600' :
                plant.avgUtilization < 30 ? 'text-red-600' : 'text-amber-600'
              }`}>
                {plant.avgUtilization.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500">Avg Utilization</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">
                {plant.totalPresent}/{plant.totalBusCapacity}
              </div>
              <div className="text-xs text-slate-500">Present/Capacity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{plant.criticalCount}</div>
              <div className="text-xs text-slate-500">Critical Buses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{plant.warningCount}</div>
              <div className="text-xs text-slate-500">Warning Buses</div>
            </div>
          </div>
        </div>

        {/* Bus List */}
        <div className="overflow-auto max-h-[50vh]">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Bus ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Route</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Present</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Capacity</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Utilization</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedBuses.map((bus) => {
                const utilization = bus.bus_capacity > 0
                  ? (bus.total_present / bus.bus_capacity) * 100
                  : 0;
                const severity = getSeverityLevel(utilization);

                return (
                  <tr key={bus.bus_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Bus className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-800">{bus.bus_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 max-w-[200px] truncate" title={bus.route || ''}>
                      {bus.route || '-'}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">{bus.total_present}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center text-slate-600">
                      {bus.bus_capacity}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              severity === 'critical' ? 'bg-red-500' :
                              severity === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                        <span className={`font-bold text-sm ${
                          severity === 'critical' ? 'text-red-600' :
                          severity === 'warning' ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {utilization.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      {severity === 'critical' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          Critical
                        </span>
                      ) : severity === 'warning' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                          <TrendingDown className="w-3 h-3" />
                          Warning
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                          <TrendingUp className="w-3 h-3" />
                          Good
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
