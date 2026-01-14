// web-dashboard/src/components/ZoneTable.tsx

import { useState } from 'react';
import { ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import { OccupancyBusRow } from '../types';
import { ZoneGroup } from '../utils/zones';
import { getSeverityLevel } from '../lib/theme';

type ZoneTableProps = {
  zones: ZoneGroup[];
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

function ZoneHeader({
  zone,
  isExpanded,
  onToggle,
}: {
  zone: ZoneGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 hover:bg-slate-200 transition-colors border-b"
    >
      <div className="flex items-center gap-3">
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500" />
        )}
        <span className="font-bold text-slate-800 uppercase tracking-wide">
          Zone {zone.zone}
        </span>
        <span className="text-sm text-slate-500">({zone.buses.length} buses)</span>

        {/* Status indicators */}
        <div className="flex items-center gap-2 ml-4">
          {zone.criticalCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
              <StatusDot level="critical" />
              {zone.criticalCount}
            </span>
          )}
          {zone.warningCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
              <StatusDot level="warning" />
              {zone.warningCount}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="text-slate-600">
          <span className="font-semibold">{zone.avgUtilization.toFixed(0)}%</span>
          <span className="text-slate-400 ml-1">Util</span>
        </div>
        <div className="text-slate-600">
          <span className="font-semibold font-mono">{zone.totalPresent.toLocaleString()}</span>
          <span className="text-slate-400 ml-1">pax</span>
        </div>
      </div>
    </button>
  );
}

function BusRow({
  bus,
  onClick,
}: {
  bus: OccupancyBusRow;
  onClick: () => void;
}) {
  const utilization = bus.total_capacity > 0 ? (bus.total_present / bus.total_capacity) * 100 : 0;
  const absent = Math.max(0, bus.total_roster - bus.total_present);
  const severity = getSeverityLevel(utilization);

  const rowBgClass = {
    critical: 'bg-red-50 hover:bg-red-100',
    warning: 'bg-amber-50 hover:bg-amber-100',
    normal: 'hover:bg-slate-50',
  }[severity];

  return (
    <tr
      className={`cursor-pointer transition-colors ${rowBgClass}`}
      onClick={onClick}
    >
      <td className="px-4 py-3 w-12">
        <StatusDot level={severity} />
      </td>
      <td className="px-4 py-3">
        <div className="font-semibold text-slate-900">{bus.bus_id}</div>
        <div className="text-xs text-slate-500">{bus.route || '-'}</div>
      </td>
      <td className="px-4 py-3 text-right font-mono text-slate-600">
        {bus.total_capacity}
      </td>
      <td className="px-4 py-3 text-right font-mono font-semibold">
        {bus.total_present}
      </td>
      <td className={`px-4 py-3 text-right font-mono ${severity === 'critical' ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
        {utilization.toFixed(1)}%
      </td>
      <td className={`px-4 py-3 text-right font-mono ${absent > 0 ? 'text-red-500' : 'text-slate-400'}`}>
        {absent > 0 ? absent : '-'}
      </td>
      <td className="px-4 py-3 text-right">
        <ArrowRight className="w-4 h-4 text-slate-400 inline" />
      </td>
    </tr>
  );
}

export default function ZoneTable({ zones, onBusClick }: ZoneTableProps) {
  const [expandedZones, setExpandedZones] = useState<Set<string>>(() => {
    // Start with all zones expanded
    return new Set(zones.map((z) => z.zone));
  });

  const toggleZone = (zone: string) => {
    setExpandedZones((prev) => {
      const next = new Set(prev);
      if (next.has(zone)) {
        next.delete(zone);
      } else {
        next.add(zone);
      }
      return next;
    });
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {zones.map((zone) => (
        <div key={zone.zone}>
          <ZoneHeader
            zone={zone}
            isExpanded={expandedZones.has(zone.zone)}
            onToggle={() => toggleZone(zone.zone)}
          />

          {expandedZones.has(zone.zone) && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left w-12">Status</th>
                  <th className="px-4 py-2 text-left">Bus / Route</th>
                  <th className="px-4 py-2 text-right">Cap</th>
                  <th className="px-4 py-2 text-right">Actual</th>
                  <th className="px-4 py-2 text-right">Util</th>
                  <th className="px-4 py-2 text-right">Absent</th>
                  <th className="px-4 py-2 text-right w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {zone.buses.map((bus) => (
                  <BusRow
                    key={bus.bus_id}
                    bus={bus}
                    onClick={() => onBusClick(bus)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      {zones.length === 0 && (
        <div className="p-12 text-center text-slate-400">
          No buses found matching your filters.
        </div>
      )}
    </div>
  );
}
