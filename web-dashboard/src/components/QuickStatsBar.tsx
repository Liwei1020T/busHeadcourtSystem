// web-dashboard/src/components/QuickStatsBar.tsx

import { Bus, Users, TrendingDown } from 'lucide-react';

type QuickStatsBarProps = {
  totalBuses: number;
  avgPassengersPerBus: number;
  lowUtilizationCount: number;
};

export default function QuickStatsBar({
  totalBuses,
  avgPassengersPerBus,
  lowUtilizationCount,
}: QuickStatsBarProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Bus className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <div className="text-lg font-bold text-slate-800 font-mono">{totalBuses}</div>
          <div className="text-xs text-slate-500">Buses Operating</div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex items-center gap-3">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <Users className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <div className="text-lg font-bold text-slate-800 font-mono">{avgPassengersPerBus.toFixed(1)}</div>
          <div className="text-xs text-slate-500">Avg Passengers/Bus</div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${lowUtilizationCount > 0 ? 'bg-amber-100' : 'bg-slate-100'}`}>
          <TrendingDown className={`w-4 h-4 ${lowUtilizationCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
        </div>
        <div>
          <div className={`text-lg font-bold font-mono ${lowUtilizationCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
            {lowUtilizationCount}
          </div>
          <div className="text-xs text-slate-500">Below 50% Capacity</div>
        </div>
      </div>
    </div>
  );
}
