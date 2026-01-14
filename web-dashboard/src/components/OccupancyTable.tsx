import { useMemo } from 'react';
import { ChevronDown, Users } from 'lucide-react';

import { OccupancyBusRow } from '../types';
import { Card } from '@/components/ui/card';

const PLANT_ORDER = ['P1', 'P2', 'BK', 'Mixed', 'Unassigned'];

type OccupancyTableProps = {
  data: OccupancyBusRow[];
  onBusClick: (bus: OccupancyBusRow) => void;
};

type PlantGroup = {
  plant: string;
  rows: OccupancyBusRow[];
};

function groupByPlant(rows: OccupancyBusRow[]): PlantGroup[] {
  const grouped = new Map<string, OccupancyBusRow[]>();
  rows.forEach((row) => {
    const key = row.plant || 'Unassigned';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)?.push(row);
  });

  return PLANT_ORDER.map((plant) => ({
    plant,
    rows: grouped.get(plant) || [],
  })).filter((group) => group.rows.length > 0);
}

export default function OccupancyTable({ data, onBusClick }: OccupancyTableProps) {
  const plantGroups = useMemo(() => groupByPlant(data), [data]);
  const totalBuses = data.length;

  return (
    <Card className="flex flex-col shadow-sm border border-gray-200 bg-white">
      <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50/50">
        <h3 className="font-semibold text-gray-700 text-sm">
          Bus Occupancy <span className="text-gray-400 font-normal">({totalBuses} buses)</span>
        </h3>
      </div>

      <div className="divide-y">
        {plantGroups.map((group) => {
          const totals = group.rows.reduce(
            (acc, row) => {
              acc.present += row.total_present;
              acc.roster += row.total_roster;
              acc.capacity += row.bus_capacity;
              acc.vans += row.van_count;
              return acc;
            },
            { present: 0, roster: 0, capacity: 0, vans: 0 },
          );
          const absent = Math.max(0, totals.roster - totals.present);
          const utilization = totals.capacity > 0 ? (totals.present / totals.capacity) * 100 : 0;

          return (
            <details key={group.plant} open className="group">
              <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none bg-white hover:bg-emerald-50/40">
                <ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" />
                <div className="text-sm font-semibold text-gray-800">Plant {group.plant}</div>
                <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
                  <span>{group.rows.length} buses</span>
                  <span>{totals.vans} vans</span>
                  <span className="text-emerald-700 font-semibold">{totals.present} present</span>
                  <span className="text-red-500 font-semibold">{absent} absent</span>
                  <span className="text-gray-700 font-semibold">{utilization.toFixed(1)}% util</span>
                </div>
              </summary>

              <div className="overflow-x-auto border-t border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr className="text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-2 text-left">Bus</th>
                      <th className="px-4 py-2 text-left">Route</th>
                      <th className="px-4 py-2 text-right">Cap</th>
                      <th className="px-4 py-2 text-right">Bus Present</th>
                      <th className="px-4 py-2 text-right">Van Present</th>
                      <th className="px-4 py-2 text-right">Total Present</th>
                      <th className="px-4 py-2 text-right">Absent</th>
                      <th className="px-4 py-2 text-right">Utilization</th>
                      <th className="px-4 py-2 text-right">Roster</th>
                      <th className="px-4 py-2 text-right">Vans</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {group.rows.map((row) => {
                      const absentCount = Math.max(0, row.total_roster - row.total_present);
                      const utilizationPct = row.bus_capacity > 0 ? (row.total_present / row.bus_capacity) * 100 : 0;

                      return (
                        <tr
                          key={row.bus_id}
                          className="hover:bg-emerald-50/40 cursor-pointer"
                          onClick={() => onBusClick(row)}
                        >
                          <td className="px-4 py-2 font-semibold text-gray-900">{row.bus_id}</td>
                          <td className="px-4 py-2 text-gray-500">{row.route || '-'}</td>
                          <td className="px-4 py-2 text-right font-mono text-gray-700">{row.bus_capacity}</td>
                          <td className="px-4 py-2 text-right text-gray-700">{row.bus_present}</td>
                          <td className="px-4 py-2 text-right text-gray-700">{row.van_present}</td>
                          <td className="px-4 py-2 text-right font-semibold text-gray-900">{row.total_present}</td>
                          <td className={`px-4 py-2 text-right ${absentCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                            {absentCount > 0 ? absentCount : '-'}
                          </td>
                          <td className="px-4 py-2 text-right text-emerald-700 font-semibold">
                            {utilizationPct.toFixed(1)}%
                          </td>
                          <td className="px-4 py-2 text-right text-gray-600">
                            <span className="inline-flex items-center gap-1">
                              {row.total_roster}
                              <Users className="w-3 h-3 text-gray-300" />
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right text-gray-600">{row.van_count}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </details>
          );
        })}

        {plantGroups.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-400">No buses found for the selected filters.</div>
        )}
      </div>
    </Card>
  );
}
