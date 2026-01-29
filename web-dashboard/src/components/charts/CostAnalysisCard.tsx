// web-dashboard/src/components/charts/CostAnalysisCard.tsx

import { TrendingDown, AlertTriangle } from 'lucide-react';

type CostAnalysisProps = {
  underutilizedBuses: number;
  emptySeatsPerDay: number;
  estimatedMonthlyWaste: number;
  topWastefulRoutes: { zone: string; emptySeats: number }[];
};

export default function CostAnalysisCard({
  underutilizedBuses,
  emptySeatsPerDay,
  estimatedMonthlyWaste,
  topWastefulRoutes,
}: CostAnalysisProps) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
        <TrendingDown className="w-4 h-4 text-red-500" />
        Cost Analysis
      </h3>

      <div className="space-y-4">
        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
            <div className="text-xs text-red-600 font-medium uppercase">Underutilized</div>
            <div className="text-2xl font-bold text-red-700 font-mono">{underutilizedBuses}</div>
            <div className="text-xs text-red-500">buses &lt;30%</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
            <div className="text-xs text-amber-600 font-medium uppercase">Empty Seats</div>
            <div className="text-2xl font-bold text-amber-700 font-mono">{emptySeatsPerDay.toLocaleString()}</div>
            <div className="text-xs text-amber-500">per day avg</div>
          </div>
        </div>

        {/* Monthly waste */}
        <div className="bg-slate-50 rounded-lg p-3 border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium uppercase">Est. Monthly Waste</div>
              <div className="text-xl font-bold text-slate-800">
                RM {estimatedMonthlyWaste.toLocaleString()}
              </div>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        {/* Top wasteful routes */}
        {topWastefulRoutes.length > 0 && (
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase mb-2">
              Top Wasteful Routes
            </div>
            <div className="space-y-1">
              {topWastefulRoutes.slice(0, 3).map((route) => (
                <div key={route.zone} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 font-medium">Zone {route.zone}</span>
                  <span className="text-red-500 font-mono">{route.emptySeats} empty</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
