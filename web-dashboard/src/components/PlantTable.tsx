// web-dashboard/src/components/PlantTable.tsx

import { useState } from 'react';
import { ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import { OccupancyBusRow } from '../types';
import { PlantGroup } from '../utils/plants';
import { getSeverityLevel } from '../lib/theme';

type PlantTableProps = {
  plants: PlantGroup[];
  onBusClick: (bus: OccupancyBusRow) => void;
};

function StatusDot({ level }: { level: 'critical' | 'warning' | 'normal' }) {
  const colors = {
    critical: 'bg-red-500',
    warning: 'bg-amber-500',
    normal: 'bg-emerald-500',
  };
  return <span className={`w-2.5 h-2.5 rounded-full ${colors[level]}`} />;
}

const plantIcons: Record<string, string> = {
  P1: '1',
  P2: '2',
  BK: 'B',
  JBMW: 'J',
  Unknown: '?',
};

const plantColors: Record<string, string> = {
  P1: 'bg-blue-500',
  P2: 'bg-purple-500',
  BK: 'bg-orange-500',
  JBMW: 'bg-slate-500',
  Unknown: 'bg-slate-400',
};

function PlantHeader({
  plant,
  isExpanded,
  onToggle,
}: {
  plant: PlantGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors border-b"
    >
      <div className="flex items-center gap-3 flex-shrink-0">
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500" />
        )}

        {/* Plant Icon */}
        <div className={`w-8 h-8 ${plantColors[plant.plant] || plantColors.Unknown} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <span className="text-white font-bold text-sm">
            {plantIcons[plant.plant] || plant.plant.charAt(0)}
          </span>
        </div>

        <span className="font-bold text-slate-800 whitespace-nowrap">
          Plant {plant.plant}
        </span>
        <span className="text-sm text-slate-500 whitespace-nowrap">({plant.buses.length} buses)</span>

        {/* Status indicators */}
        <div className="flex items-center gap-2 ml-2">
          {plant.criticalCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
              <StatusDot level="critical" />
              {plant.criticalCount}
            </span>
          )}
          {plant.warningCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
              <StatusDot level="warning" />
              {plant.warningCount}
            </span>
          )}
        </div>
      </div>

      {/* Stats - right aligned with fixed widths */}
      <div className="flex items-center text-sm">
        <div className="w-28 text-right">
          <span className="font-bold font-mono">{plant.avgUtilization.toFixed(1)}%</span>
          <span className="text-slate-400 ml-1 text-xs">Util</span>
        </div>
        <div className="w-28 text-right">
          <span className="font-bold font-mono">{plant.avgAttendanceRate.toFixed(1)}%</span>
          <span className="text-slate-400 ml-1 text-xs">Attend</span>
        </div>
        <div className="w-24 text-right">
          <span className="font-bold font-mono text-blue-600">{plant.totalPresent.toLocaleString()}</span>
          <span className="text-slate-400 ml-1 text-xs">pax</span>
        </div>
      </div>
    </button>
  );
}

function TableHeaderRow() {
  return (
    <div className="w-full flex items-center bg-slate-100 border-b text-xs uppercase text-slate-500 font-semibold">
      <div className="px-4 py-2 w-12 flex-shrink-0">Status</div>
      <div className="px-4 py-2 flex-1 min-w-[120px]">Bus / Route</div>
      <div className="px-4 py-2 w-16 text-right flex-shrink-0">Cap</div>
      <div className="px-4 py-2 w-16 text-right flex-shrink-0">Present</div>
      <div className="px-4 py-2 w-16 text-right flex-shrink-0">Roster</div>
      <div className="px-4 py-2 w-24 text-right flex-shrink-0">Util %</div>
      <div className="px-4 py-2 w-20 text-right flex-shrink-0">Attend %</div>
      <div className="px-4 py-2 w-8 flex-shrink-0"></div>
    </div>
  );
}

function BusRow({
  bus,
  onClick,
}: {
  bus: OccupancyBusRow;
  onClick: () => void;
}) {
  const utilization = bus.bus_capacity > 0 ? (bus.total_present / bus.bus_capacity) * 100 : 0;
  const attendance = bus.total_roster > 0 ? (bus.total_present / bus.total_roster) * 100 : 0;
  const severity = getSeverityLevel(utilization);

  const rowBgClass = {
    critical: 'bg-red-50 hover:bg-red-100',
    warning: 'bg-amber-50 hover:bg-amber-100',
    normal: 'hover:bg-slate-50',
  }[severity];

  const getUtilColor = (util: number) => {
    if (util >= 100) return 'text-red-600 font-bold';
    if (util >= 80) return 'text-amber-600';
    if (util < 30) return 'text-red-500';
    return 'text-emerald-600';
  };

  const getAttendColor = (att: number) => {
    if (att >= 90) return 'text-emerald-600';
    if (att >= 70) return 'text-amber-600';
    return 'text-red-500';
  };

  return (
    <div
      className={`w-full flex items-center cursor-pointer transition-colors border-b border-slate-100 ${rowBgClass}`}
      onClick={onClick}
    >
      <div className="px-4 py-3 w-12 flex-shrink-0 flex items-center">
        <StatusDot level={severity} />
      </div>
      <div className="px-4 py-3 flex-1 min-w-[120px]">
        <div className="font-semibold text-slate-900 text-sm">{bus.bus_id}</div>
        <div className="text-xs text-slate-500 truncate">{bus.route || '-'}</div>
      </div>
      <div className="px-4 py-3 w-16 text-right font-mono text-slate-600 text-sm flex-shrink-0">
        {bus.bus_capacity}
      </div>
      <div className="px-4 py-3 w-16 text-right font-mono text-slate-600 text-sm flex-shrink-0">
        {bus.total_present}
      </div>
      <div className="px-4 py-3 w-16 text-right font-mono text-slate-600 text-sm flex-shrink-0">
        {bus.total_roster}
      </div>
      <div className={`px-4 py-3 w-24 text-right flex-shrink-0 ${getUtilColor(utilization)}`}>
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono text-sm">{utilization.toFixed(1)}%</span>
          <div className="w-14 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${utilization > 100 ? 'bg-red-500' : utilization > 80 ? 'bg-emerald-500' : utilization < 30 ? 'bg-red-400' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
        </div>
      </div>
      <div className={`px-4 py-3 w-20 text-right font-mono text-sm flex-shrink-0 ${getAttendColor(attendance)}`}>
        {attendance.toFixed(1)}%
      </div>
      <div className="px-4 py-3 w-8 flex-shrink-0 flex items-center justify-end">
        <ArrowRight className="w-4 h-4 text-slate-400" />
      </div>
    </div>
  );
}

export default function PlantTable({ plants, onBusClick }: PlantTableProps) {
  const [expandedPlants, setExpandedPlants] = useState<Set<string>>(() => {
    return new Set(plants.map((p) => p.plant));
  });

  const togglePlant = (plant: string) => {
    setExpandedPlants((prev) => {
      const next = new Set(prev);
      if (next.has(plant)) {
        next.delete(plant);
      } else {
        next.add(plant);
      }
      return next;
    });
  };

  if (plants.length === 0) {
    return (
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-12 text-center text-slate-400">
          No buses found matching your filters.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <div className="max-h-[calc(100vh-220px)] overflow-auto">
        {plants.map((plant) => (
          <div key={plant.plant}>
            {/* Plant Header */}
            <PlantHeader
              plant={plant}
              isExpanded={expandedPlants.has(plant.plant)}
              onToggle={() => togglePlant(plant.plant)}
            />

            {/* Expanded Content */}
            {expandedPlants.has(plant.plant) && (
              <>
                <TableHeaderRow />
                {plant.buses.map((bus) => (
                  <BusRow
                    key={bus.bus_id}
                    bus={bus}
                    onClick={() => onBusClick(bus)}
                  />
                ))}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
