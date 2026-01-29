import { useState, useMemo } from 'react';
import { OccupancyBusRow } from '../types';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, AlertCircle, Users } from 'lucide-react';

type OccupancyTableProps = {
  data: OccupancyBusRow[];
  onBusClick: (bus: OccupancyBusRow) => void;
};

type SortField = keyof OccupancyBusRow | 'utilization' | 'absent_pct' | 'absent_count';
type SortDirection = 'asc' | 'desc';

export default function OccupancyTable({ data, onBusClick }: OccupancyTableProps) {
  const [showProblemsOnly, setShowProblemsOnly] = useState(false);
  const [hideOwn, setHideOwn] = useState(true);
  const [sortField, setSortField] = useState<SortField>('bus_id');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const filteredData = useMemo(() => {
    return data.filter(row => {
      // Hide OWN/UNKN (own transport and unknown)
      const busIdUpper = row.bus_id.toUpperCase();
      const routeUpper = row.route?.toUpperCase() || '';
      if (hideOwn && (
        busIdUpper === 'OWN' ||
        busIdUpper === 'UNKN' ||
        busIdUpper.includes('OWN') ||
        routeUpper.includes('OWN')
      )) {
        return false;
      }

      if (showProblemsOnly) {
         const absentCount = Math.max(0, row.total_roster - row.total_present);
         return absentCount > 0;
      }
      return true;
    });
  }, [data, hideOwn, showProblemsOnly]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
       let valA: number | string = 0;
       let valB: number | string = 0;

       if (sortField === 'utilization') {
         valA = a.total_capacity > 0 ? a.total_present / a.total_capacity : 0;
         valB = b.total_capacity > 0 ? b.total_present / b.total_capacity : 0;
       } else if (sortField === 'absent_pct') {
         valA = a.total_roster > 0 ? (a.total_roster - a.total_present) / a.total_roster : 0;
         valB = b.total_roster > 0 ? (b.total_roster - b.total_present) / b.total_roster : 0;
       } else if (sortField === 'absent_count') {
         valA = a.total_roster - a.total_present;
         valB = b.total_roster - b.total_present;
       } else {
         // @ts-ignore
         valA = a[sortField] || 0;
         // @ts-ignore
         valB = b[sortField] || 0;
       }

       if (typeof valA === 'string' && typeof valB === 'string') {
         return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
       }
       if (valA < valB) return sortDir === 'asc' ? -1 : 1;
       if (valA > valB) return sortDir === 'asc' ? 1 : -1;
       return 0;
    });
  }, [filteredData, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortHeader = ({ field, label, align = 'left' }: { field: SortField, label: string, align?: 'left'|'right'|'center' }) => (
    <th 
      className={`px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors text-${align}`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? (sortDir === 'asc' ? 'text-emerald-600' : 'text-emerald-600 rotate-180') : 'text-gray-300 opacity-0 group-hover:opacity-100'}`} />
      </div>
    </th>
  );

  return (
    <Card className="flex flex-col shadow-sm border border-gray-200 bg-white">
      {/* Table Toolbar */}
      <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50/50">
        <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
           Bus Occupancy <span className="text-gray-400 font-normal">({sortedData.length} Buses)</span>
        </h3>
        <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filter-problems"
                checked={showProblemsOnly}
                onCheckedChange={(c: boolean | 'indeterminate') => setShowProblemsOnly(!!c)}
              />
              <label htmlFor="filter-problems" className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                Problems Only
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filter-own"
                checked={hideOwn}
                onCheckedChange={(c: boolean | 'indeterminate') => setHideOwn(!!c)}
              />
              <label htmlFor="filter-own" className="text-xs font-medium leading-none cursor-pointer">
                Hide OWN/UNKN
              </label>
            </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b group">
            <tr>
              <SortHeader field="bus_id" label="Bus / Route" />
              <SortHeader field="van_count" label="Vans" align="center" />
              <SortHeader field="total_capacity" label="Cap (Tot)" align="right" />
              <SortHeader field="total_present" label="Actual" align="right" />
              <SortHeader field="absent_count" label="Absent" align="right" />
              <SortHeader field="utilization" label="Util %" align="right" />
              <SortHeader field="total_roster" label="Total" align="right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedData.map((row) => {
               const absent = Math.max(0, row.total_roster - row.total_present);
               const utilization = row.total_capacity > 0 ? (row.total_present / row.total_capacity) * 100 : 0;
               const attendanceRate = row.total_roster > 0 ? (row.total_present / row.total_roster) * 100 : 0;

               return (
                <tr 
                  key={row.bus_id} 
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                  onClick={() => onBusClick(row)}
                >
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-gray-900">{row.bus_id}</div>
                    <div className="text-xs text-gray-500">{row.route || '-'}</div>
                  </td>
                  
                  <td className="px-3 py-2.5 text-center">
                    {row.van_count > 0 ? (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-gray-100 text-gray-600">
                        {row.van_count}
                      </Badge>
                    ) : <span className="text-gray-300">-</span>}
                  </td>

                  <td className="px-3 py-2.5 text-right font-mono text-gray-600">
                    {row.total_capacity}
                    {row.van_capacity > 0 && <span className="text-xs text-gray-400 block" title="Van Cap">v:{row.van_capacity}</span>}
                  </td>

                  <td className="px-3 py-2.5 text-right font-semibold">
                    {row.total_present}
                    {row.van_present > 0 && <span className="text-xs text-gray-400 block" title="In Van">v:{row.van_present}</span>}
                  </td>

                  <td className={`px-3 py-2.5 text-right font-medium ${absent > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                    {absent > 0 ? absent : '-'}
                  </td>

                  <td className="px-3 py-2.5 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`text-xs font-bold ${utilization > 100 ? 'text-red-500' : utilization > 90 ? 'text-emerald-600' : 'text-gray-600'}`}>
                        {utilization.toFixed(1)}%
                      </span>
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-0.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${utilization > 100 ? 'bg-red-500' : utilization > 80 ? 'bg-emerald-500' : 'bg-gray-400'}`} 
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-2.5 text-right text-gray-600">
                    <div className="flex items-center justify-end gap-1">
                      {row.total_roster}
                      <Users className="w-3 h-3 text-gray-300" />
                    </div>
                     <span className={`text-[10px] block ${attendanceRate < 80 ? 'text-red-400' : 'text-emerald-600'}`}>
                       {attendanceRate.toFixed(0)}% att
                     </span>
                  </td>
                </tr>
               );
            })}
            
            {sortedData.length === 0 && (
                <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400 bg-gray-50/30">
                        <div className="flex flex-col items-center justify-center">
                            <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                            <p>No buses found matching your filters.</p>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
