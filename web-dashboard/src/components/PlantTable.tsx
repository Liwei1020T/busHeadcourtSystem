// web-dashboard/src/components/PlantTable.tsx

import { useState, useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import { ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import { OccupancyBusRow } from '../types';
import { PlantGroup } from '../utils/plants';
import { getSeverityLevel } from '../lib/theme';

type PlantTableProps = {
  plants: PlantGroup[];
  onBusClick: (bus: OccupancyBusRow) => void;
};

// Item types for the flattened list
type FlatItem =
  | { type: 'HEADER'; plant: PlantGroup }
  | { type: 'TABLE_HEADER'; plantId: string }
  | { type: 'ROW'; bus: OccupancyBusRow; plantId: string };

// Row heights
const HEADER_HEIGHT = 64;
const TABLE_HEADER_HEIGHT = 36;
const ROW_HEIGHT = 64; // Increased to accommodate the progress bar

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
  Unknown: '?',
};

const plantColors: Record<string, string> = {
  P1: 'bg-blue-500',
  P2: 'bg-purple-500',
  BK: 'bg-orange-500',
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
      className="w-full flex items-center justify-between px-4 py-4 bg-slate-50 hover:bg-slate-100 transition-colors border-b"
    >
      <div className="flex items-center gap-3">
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500" />
        )}

        {/* Plant Icon */}
        <div className={`w-8 h-8 ${plantColors[plant.plant] || plantColors.Unknown} rounded-lg flex items-center justify-center`}>
          <span className="text-white font-bold text-sm">
            {plantIcons[plant.plant] || plant.plant.charAt(0)}
          </span>
        </div>

        <span className="font-bold text-slate-800">
          Plant {plant.plant}
        </span>
        <span className="text-sm text-slate-500">({plant.buses.length} buses)</span>

        {/* Status indicators */}
        <div className="flex items-center gap-2 ml-4">
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

      <div className="flex items-center gap-6 text-sm">
        <div className="flex flex-col items-end min-w-[90px]">
          <span className="font-bold text-base font-mono">{plant.avgUtilization.toFixed(1)}%</span>
          <span className="text-xs text-slate-500 whitespace-nowrap">Utilization</span>
        </div>
        <div className="flex flex-col items-end min-w-[90px]">
          <span className="font-bold text-base font-mono">{plant.avgAttendanceRate.toFixed(1)}%</span>
          <span className="text-xs text-slate-500 whitespace-nowrap">Attendance</span>
        </div>
        <div className="flex flex-col items-end min-w-[90px]">
          <span className="font-bold text-base font-mono text-blue-600">{plant.totalPresent.toLocaleString()}</span>
          <span className="text-xs text-slate-500 whitespace-nowrap">Passengers</span>
        </div>
      </div>
    </button>
  );
}

function TableHeaderRow() {
  return (
    <div className="w-full flex items-center bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold">
      <div className="px-4 py-2 w-12 flex-shrink-0">Status</div>
      <div className="px-4 py-2 flex-1 min-w-[150px]">Bus / Route</div>
      <div className="px-4 py-2 w-20 text-right flex-shrink-0">Bus Cap</div>
      <div className="px-4 py-2 w-20 text-right flex-shrink-0">Bus Pres</div>
      <div className="px-4 py-2 w-20 text-right flex-shrink-0">Van</div>
      <div className="px-4 py-2 w-20 text-right flex-shrink-0">Total</div>
      <div className="px-4 py-2 w-20 text-right flex-shrink-0">Total</div>
      <div className="px-4 py-2 w-28 text-right flex-shrink-0">Util %</div>
      <div className="px-4 py-2 w-24 text-right flex-shrink-0">Attend %</div>
      <div className="px-4 py-2 w-12 text-right flex-shrink-0"></div>
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
  // Utilization based on bus_capacity only (all passengers including van use bus capacity)
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
      <div className="px-4 py-3 flex-1 min-w-[150px]">
        <div className="font-semibold text-slate-900 text-sm">{bus.bus_id}</div>
        <div className="text-xs text-slate-500">{bus.route || '-'}</div>
      </div>
      <div className="px-4 py-3 w-20 text-right font-mono text-slate-600 text-sm flex-shrink-0">
        {bus.bus_capacity}
      </div>
      <div className="px-4 py-3 w-20 text-right font-mono text-slate-600 text-sm flex-shrink-0">
        {bus.total_present}
      </div>
      <div className="px-4 py-3 w-20 text-right flex-shrink-0">
        {bus.van_count > 0 && (
          <span className="text-xs text-slate-400">
            ({bus.van_present} via van)
          </span>
        )}
      </div>
      <div className="px-4 py-3 w-20 text-right font-mono font-semibold text-sm flex-shrink-0">
        {bus.total_present}
      </div>
      <div className="px-4 py-3 w-20 text-right font-mono text-slate-600 text-sm flex-shrink-0">
        {bus.total_roster}
      </div>
      <div className={`px-4 py-3 w-28 text-right font-mono text-sm flex-shrink-0 ${getUtilColor(utilization)}`}>
        <div className="flex flex-col items-end gap-1">
          <span>{utilization.toFixed(1)}%</span>
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${utilization > 100 ? 'bg-red-500' : utilization > 80 ? 'bg-emerald-500' : utilization < 30 ? 'bg-red-400' : 'bg-blue-500'
                }`}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
        </div>
      </div>
      <div className={`px-4 py-3 w-24 text-right font-mono text-sm flex-shrink-0 ${getAttendColor(attendance)}`}>
        {attendance.toFixed(1)}%
      </div>
      <div className="px-4 py-3 w-12 text-right flex-shrink-0 flex items-center justify-end">
        <ArrowRight className="w-4 h-4 text-slate-400" />
      </div>
    </div>
  );
}

export default function PlantTable({ plants, onBusClick }: PlantTableProps) {
  const [expandedPlants, setExpandedPlants] = useState<Set<string>>(() => {
    // Start with all plants expanded
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

  // Flatten the nested structure into a single list
  const flatItems = useMemo(() => {
    const items: FlatItem[] = [];

    plants.forEach((plant) => {
      // Add plant header
      items.push({ type: 'HEADER', plant });

      // If expanded, add table header and bus rows
      if (expandedPlants.has(plant.plant)) {
        items.push({ type: 'TABLE_HEADER', plantId: plant.plant });
        plant.buses.forEach((bus) => {
          items.push({ type: 'ROW', bus, plantId: plant.plant });
        });
      }
    });

    return items;
  }, [plants, expandedPlants]);

  // Calculate item size based on type
  const getItemSize = (index: number) => {
    const item = flatItems[index];
    if (item.type === 'HEADER') return HEADER_HEIGHT;
    if (item.type === 'TABLE_HEADER') return TABLE_HEADER_HEIGHT;
    return ROW_HEIGHT;
  };

  // Render individual row
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = flatItems[index];

    if (item.type === 'HEADER') {
      return (
        <div style={style}>
          <PlantHeader
            plant={item.plant}
            isExpanded={expandedPlants.has(item.plant.plant)}
            onToggle={() => togglePlant(item.plant.plant)}
          />
        </div>
      );
    }

    if (item.type === 'TABLE_HEADER') {
      return (
        <div style={style}>
          <TableHeaderRow />
        </div>
      );
    }

    // ROW type
    return (
      <div style={style}>
        <BusRow
          bus={item.bus}
          onClick={() => onBusClick(item.bus)}
        />
      </div>
    );
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
      <List
        height={600} // Fixed height for the virtualized list
        itemCount={flatItems.length}
        itemSize={getItemSize}
        width="100%"
        overscanCount={5}
      >
        {Row}
      </List>
    </div>
  );
}
