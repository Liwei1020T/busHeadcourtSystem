// web-dashboard/src/components/charts/PlantCostAnalysisCard.tsx

import { TrendingDown, AlertTriangle, Factory } from 'lucide-react';
import { PlantGroup } from '../../utils/plants';

type PlantCostAnalysisCardProps = {
  plants: PlantGroup[];
};

const PLANT_COLORS: Record<string, string> = {
  P1: 'bg-blue-50 border-blue-200 text-blue-700',
  P2: 'bg-purple-50 border-purple-200 text-purple-700',
  BK: 'bg-orange-50 border-orange-200 text-orange-700',
  Unknown: 'bg-slate-50 border-slate-200 text-slate-700',
};

export default function PlantCostAnalysisCard({ plants }: PlantCostAnalysisCardProps) {
  // Calculate total metrics
  const totalEmptyBusSeats = plants.reduce(
    (sum, p) => sum + (p.totalBusCapacity - p.totalBusPresent),
    0
  );

  const underutilizedBuses = plants.reduce(
    (sum, p) => sum + p.buses.filter(b =>
      b.bus_capacity > 0 && (b.total_present / b.bus_capacity * 100) < 30
    ).length,
    0
  );

  const estimatedDailyWaste = totalEmptyBusSeats * 0.5; // RM 0.5 per seat
  const estimatedMonthlyWaste = estimatedDailyWaste * 22;

  // Per-plant waste breakdown
  const plantWaste = plants.map(p => {
    const emptySeats = p.totalBusCapacity - p.totalBusPresent;
    return {
      plant: p.plant,
      emptySeats,
      waste: emptySeats * 0.5,
      underutilized: p.buses.filter(b =>
        b.bus_capacity > 0 && (b.total_present / b.bus_capacity * 100) < 30
      ).length
    };
  }).sort((a, b) => b.emptySeats - a.emptySeats);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
        <TrendingDown className="w-4 h-4 text-red-500" />
        Cost Analysis by Plant
      </h3>

      <div className="space-y-4">
        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <div className="text-xs text-red-600 font-medium uppercase">Underutilized</div>
            <div className="text-2xl font-bold text-red-700 font-mono">{underutilizedBuses}</div>
            <div className="text-xs text-red-500">buses &lt;30%</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <div className="text-xs text-amber-600 font-medium uppercase">Empty Seats</div>
            <div className="text-2xl font-bold text-amber-700 font-mono">{totalEmptyBusSeats.toLocaleString()}</div>
            <div className="text-xs text-amber-500">bus seats/day</div>
          </div>
        </div>

        {/* Monthly waste */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium uppercase">Est. Monthly Waste</div>
              <div className="text-xl font-bold text-slate-800">
                RM {estimatedMonthlyWaste.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                RM {estimatedDailyWaste.toFixed(0)}/day × 22 days
              </div>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        {/* Per-plant breakdown */}
        {plantWaste.length > 0 && (
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase mb-2">
              Waste by Plant
            </div>
            <div className="space-y-2">
              {plantWaste.map((pw) => (
                <div
                  key={pw.plant}
                  className={`rounded-lg p-2 border ${PLANT_COLORS[pw.plant] || PLANT_COLORS.Unknown}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Factory className="w-3 h-3" />
                      <span className="font-semibold text-sm">{pw.plant}</span>
                      {pw.underutilized > 0 && (
                        <span className="text-xs">({pw.underutilized} underutil)</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-sm">{pw.emptySeats}</div>
                      <div className="text-xs">RM {pw.waste.toFixed(0)}/day</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
