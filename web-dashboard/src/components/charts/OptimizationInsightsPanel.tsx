// web-dashboard/src/components/charts/OptimizationInsightsPanel.tsx

import { useMemo } from 'react';
import { Merge, Route, MinusCircle, Bus, ArrowRight } from 'lucide-react';
import { PlantGroup } from '../../utils/plants';
import { OccupancyBusRow } from '../../types';

type OptimizationInsightsPanelProps = {
  plants: PlantGroup[];
  busCapacityMax?: number; // Default 42
};

type ConsolidationSuggestion = {
  route: string;
  plant: string;
  buses: { busId: string; passengers: number; utilization: number }[];
  combinedPassengers: number;
  combinedUtilization: number;
  busesRemovable: number;
};

type RouteEfficiency = {
  route: string;
  plant: string;
  busCount: number;
  avgUtilization: number;
  totalPassengers: number;
  totalCapacity: number;
  optimalBusCount: number;
  removableBuses: number;
};

type FleetReductionByPlant = {
  plant: string;
  currentBuses: number;
  removableBuses: number;
  afterOptimization: number;
};

export default function OptimizationInsightsPanel({
  plants,
  busCapacityMax = 42,
}: OptimizationInsightsPanelProps) {
  // Calculate consolidation suggestions
  const consolidationSuggestions = useMemo(() => {
    const suggestions: ConsolidationSuggestion[] = [];

    // Group all buses by route
    const busesByRoute = new Map<string, { plant: string; buses: OccupancyBusRow[] }>();

    plants.forEach((plantGroup) => {
      plantGroup.buses.forEach((bus) => {
        const routeKey = bus.route || 'Unknown Route';
        if (!busesByRoute.has(routeKey)) {
          busesByRoute.set(routeKey, { plant: plantGroup.plant, buses: [] });
        }
        busesByRoute.get(routeKey)!.buses.push(bus);
      });
    });

    // Find routes with multiple underutilized buses that could merge
    busesByRoute.forEach((data, route) => {
      const underutilizedBuses = data.buses.filter((b) => {
        const util = b.bus_capacity > 0 ? (b.bus_present / b.bus_capacity) * 100 : 0;
        return util < 70 && b.bus_present > 0; // Less than 70% utilized
      });

      if (underutilizedBuses.length >= 2) {
        // Sort by passengers descending
        const sorted = [...underutilizedBuses].sort((a, b) => b.bus_present - a.bus_present);

        // Try to combine buses
        let combinedPassengers = 0;
        const busesToCombine: { busId: string; passengers: number; utilization: number }[] = [];

        for (const bus of sorted) {
          if (combinedPassengers + bus.bus_present <= busCapacityMax) {
            combinedPassengers += bus.bus_present;
            const util = bus.bus_capacity > 0 ? (bus.bus_present / bus.bus_capacity) * 100 : 0;
            busesToCombine.push({
              busId: bus.bus_id,
              passengers: bus.bus_present,
              utilization: Math.round(util),
            });
          }
        }

        if (busesToCombine.length >= 2) {
          suggestions.push({
            route,
            plant: data.plant,
            buses: busesToCombine,
            combinedPassengers,
            combinedUtilization: Math.round((combinedPassengers / busCapacityMax) * 100),
            busesRemovable: busesToCombine.length - 1,
          });
        }
      }
    });

    // Sort by removable buses descending
    return suggestions.sort((a, b) => b.busesRemovable - a.busesRemovable).slice(0, 5);
  }, [plants, busCapacityMax]);

  // Calculate route efficiency
  const routeEfficiency = useMemo(() => {
    const routeMap = new Map<string, RouteEfficiency>();

    plants.forEach((plantGroup) => {
      plantGroup.buses.forEach((bus) => {
        const routeKey = bus.route || 'Unknown Route';

        if (!routeMap.has(routeKey)) {
          routeMap.set(routeKey, {
            route: routeKey,
            plant: plantGroup.plant,
            busCount: 0,
            avgUtilization: 0,
            totalPassengers: 0,
            totalCapacity: 0,
            optimalBusCount: 0,
            removableBuses: 0,
          });
        }

        const entry = routeMap.get(routeKey)!;
        entry.busCount += 1;
        entry.totalPassengers += bus.bus_present;
        entry.totalCapacity += bus.bus_capacity;
      });
    });

    // Calculate metrics
    const results: RouteEfficiency[] = [];
    routeMap.forEach((entry) => {
      entry.avgUtilization = entry.totalCapacity > 0
        ? Math.round((entry.totalPassengers / entry.totalCapacity) * 100)
        : 0;
      entry.optimalBusCount = Math.ceil(entry.totalPassengers / busCapacityMax);
      entry.removableBuses = Math.max(0, entry.busCount - entry.optimalBusCount);

      if (entry.removableBuses > 0 || entry.avgUtilization < 50) {
        results.push(entry);
      }
    });

    return results.sort((a, b) => b.removableBuses - a.removableBuses).slice(0, 5);
  }, [plants, busCapacityMax]);

  // Calculate fleet reduction by plant
  const fleetReduction = useMemo(() => {
    const plantMap = new Map<string, FleetReductionByPlant>();

    plants.forEach((plantGroup) => {
      let totalPassengers = 0;
      let currentBuses = 0;

      plantGroup.buses.forEach((bus) => {
        if (bus.bus_capacity > 0) {
          currentBuses += 1;
          totalPassengers += bus.bus_present;
        }
      });

      const optimalBuses = Math.ceil(totalPassengers / busCapacityMax);
      const removable = Math.max(0, currentBuses - optimalBuses);

      plantMap.set(plantGroup.plant, {
        plant: plantGroup.plant,
        currentBuses,
        removableBuses: removable,
        afterOptimization: currentBuses - removable,
      });
    });

    return Array.from(plantMap.values()).sort((a, b) => b.removableBuses - a.removableBuses);
  }, [plants, busCapacityMax]);

  const totalRemovable = fleetReduction.reduce((acc, p) => acc + p.removableBuses, 0);
  const totalCurrent = fleetReduction.reduce((acc, p) => acc + p.currentBuses, 0);

  return (
    <div className="col-span-1 lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Merge className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">Optimization Opportunities</h3>
          <p className="text-xs text-slate-500">Based on current utilization data</p>
        </div>
        {totalRemovable > 0 && (
          <div className="ml-auto bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
            {totalRemovable} buses could be optimized
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bus Consolidation Suggestions */}
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bus className="w-4 h-4 text-slate-600" />
            <h4 className="font-medium text-slate-700 text-sm">Bus Consolidation</h4>
          </div>

          {consolidationSuggestions.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No consolidation opportunities found</p>
          ) : (
            <div className="space-y-3">
              {consolidationSuggestions.slice(0, 3).map((suggestion, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-500">{suggestion.plant}</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      -{suggestion.busesRemovable} bus
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mb-2 truncate" title={suggestion.route}>
                    {suggestion.route}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {suggestion.buses.map((bus, i) => (
                      <span key={bus.busId} className="flex items-center">
                        <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                          {bus.busId} ({bus.passengers})
                        </span>
                        {i < suggestion.buses.length - 1 && (
                          <span className="text-slate-400 mx-1">+</span>
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs">
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="text-emerald-600 font-medium">
                      Combined: {suggestion.combinedPassengers}/{busCapacityMax} ({suggestion.combinedUtilization}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Route Efficiency */}
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Route className="w-4 h-4 text-slate-600" />
            <h4 className="font-medium text-slate-700 text-sm">Route Efficiency</h4>
          </div>

          {routeEfficiency.length === 0 ? (
            <p className="text-sm text-slate-500 italic">All routes are efficiently utilized</p>
          ) : (
            <div className="space-y-2">
              {routeEfficiency.slice(0, 4).map((route, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-500">{route.plant}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      route.avgUtilization < 30
                        ? 'bg-red-100 text-red-700'
                        : route.avgUtilization < 50
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}>
                      {route.avgUtilization}% avg
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 font-medium truncate mb-1" title={route.route}>
                    {route.route}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{route.busCount} buses → {route.optimalBusCount} optimal</span>
                    {route.removableBuses > 0 && (
                      <span className="text-green-600 font-medium">-{route.removableBuses}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fleet Reduction Summary */}
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <MinusCircle className="w-4 h-4 text-slate-600" />
            <h4 className="font-medium text-slate-700 text-sm">Fleet Reduction</h4>
          </div>

          <div className="bg-white rounded-lg p-4 border border-slate-200 mb-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{totalRemovable}</div>
              <div className="text-xs text-slate-500">buses could be removed</div>
              <div className="text-xs text-slate-400 mt-1">
                {totalCurrent} current → {totalCurrent - totalRemovable} optimal
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {fleetReduction.map((plant) => (
              <div
                key={plant.plant}
                className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-200"
              >
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                    {plant.plant}
                  </span>
                  <div className="text-xs">
                    <div className="text-slate-700 font-medium">{plant.currentBuses} buses</div>
                    <div className="text-slate-400">→ {plant.afterOptimization} optimal</div>
                  </div>
                </div>
                {plant.removableBuses > 0 ? (
                  <span className="text-sm font-bold text-green-600">-{plant.removableBuses}</span>
                ) : (
                  <span className="text-xs text-slate-400">Optimal</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
