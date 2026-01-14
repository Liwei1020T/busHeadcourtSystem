import { useEffect, useState, useMemo } from 'react';
import { X, Search, Download, UserCheck, UserX, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { BusDetailResponse, FilterParams } from '../types';
import { fetchBusDetail } from '../api';

type BusDetailDrawerProps = {
  busId: string | null;
  filters: FilterParams;
  onClose: () => void;
};

export default function BusDetailDrawer({ busId, filters, onClose }: BusDetailDrawerProps) {
  const [data, setData] = useState<BusDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'present' | 'absent'>('all');
  const [includeInactive, setIncludeInactive] = useState(false);

  useEffect(() => {
    if (!busId) {
      setData(null);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = {
          date_from: filters.date_from,
          date_to: filters.date_to,
          shift: filters.shift,
          bus_id: busId,
          include_inactive: includeInactive,
        };
        const res = await fetchBusDetail(query);
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load details');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [busId, filters.date_from, filters.date_to, filters.shift, includeInactive]);

  const filteredEmployees = useMemo(() => {
    if (!data) return [];
    
    return data.employees.filter((emp) => {
      const matchesSearch = 
        emp.name?.toLowerCase().includes(search.toLowerCase()) || 
        emp.personid.toString().includes(search) ||
        emp.pickup_point?.toLowerCase().includes(search.toLowerCase());
      
      if (!matchesSearch) return false;

      if (activeTab === 'present') return emp.present;
      if (activeTab === 'absent') return !emp.present;
      
      return true;
    });
  }, [data, search, activeTab]);

  const exportCsv = () => {
    if (!data) return;
    const headers = ['PersonID', 'Name', 'Pickup Point', 'Contractor', 'Status', 'Scanned'];
    const rows = data.employees.map(e => [
      e.personid,
      e.name || '',
      e.pickup_point || '',
      e.contractor || '',
      e.present ? 'Present' : 'Absent',
      e.scanned_at || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `roster_${data.bus_id}_${filters.date_from}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!busId) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl z-50 transform transition-transform border-l flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            Bus {busId} 
             {data?.route && <span className="text-sm font-normal text-gray-500">({data.route})</span>}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
             {filters.date_from} → {filters.date_to} • {filters.shift || 'All Shifts'}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-gray-200">
           <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Loading/Error State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center text-emerald-600">
           <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}
      
      {error && (
        <div className="p-6 text-center text-red-600">
           <AlertCircle className="w-8 h-8 mx-auto mb-2" />
           <p>{error}</p>
        </div>
      )}

      {/* Content */}
      {!loading && data && (
        <>
          {/* KPI Strip */}
          <div className="grid grid-cols-3 gap-2 p-4 border-b">
             <div className="bg-emerald-50 p-2 rounded border border-emerald-100 text-center">
               <div className="text-xs text-gray-500 uppercase font-semibold">Present</div>
               <div className="text-xl font-bold text-emerald-700">{data.present_total}</div>
             </div>
             <div className="bg-red-50 p-2 rounded border border-red-100 text-center">
               <div className="text-xs text-gray-500 uppercase font-semibold">Absent</div>
               <div className="text-xl font-bold text-red-700">{data.absent_total}</div>
             </div>
             <div className="bg-gray-50 p-2 rounded border border-gray-100 text-center">
               <div className="text-xs text-gray-500 uppercase font-semibold">Roster</div>
               <div className="text-xl font-bold text-gray-700">{data.roster_total}</div>
             </div>
          </div>

          {/* Controls */}
          <div className="p-4 space-y-4 border-b bg-white">
             {/* Tabs */}
             <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${activeTab==='all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  onClick={() => setActiveTab('all')}
                >
                  All
                </button>
                <button 
                  className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${activeTab==='present' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500 hover:text-gray-900'}`}
                  onClick={() => setActiveTab('present')}
                >
                  Present
                </button>
                <button 
                  className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${activeTab==='absent' ? 'bg-white shadow-sm text-red-700' : 'text-gray-500 hover:text-gray-900'}`}
                  onClick={() => setActiveTab('absent')}
                >
                  Absent
                </button>
             </div>

             <div className="flex gap-2">
               <div className="relative flex-1">
                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                 <Input 
                   placeholder="Search name, ID..." 
                   className="pl-9 h-9" 
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                 />
               </div>
               <Button variant="outline" size="icon" className="h-9 w-9" onClick={exportCsv} title="Export CSV">
                  <Download className="w-4 h-4" />
               </Button>
             </div>

             <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-inactive"
                  checked={includeInactive}
                  onCheckedChange={(c: boolean | 'indeterminate') => setIncludeInactive(!!c)}
                />
                <label htmlFor="include-inactive" className="text-sm text-gray-600 font-medium cursor-pointer">
                  Include Inactive Employees
                </label>
             </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
             {filteredEmployees.length === 0 ? (
               <div className="p-8 text-center text-gray-400 text-sm">
                 No employees found.
               </div>
             ) : (
               <table className="w-full text-sm text-left">
                 <thead className="bg-gray-50 border-b sticky top-0">
                    <tr>
                      <th className="px-4 py-2 font-medium text-gray-500 w-12">Stat</th>
                      <th className="px-4 py-2 font-medium text-gray-500">Employee</th>
                      <th className="px-4 py-2 font-medium text-gray-500 text-right">Details</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {filteredEmployees.map((emp) => (
                      <tr key={emp.personid} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 align-top">
                           {emp.present ? (
                             <UserCheck className="w-5 h-5 text-emerald-500" />
                           ) : (
                             <UserX className="w-5 h-5 text-gray-300" />
                           )}
                        </td>
                        <td className="px-4 py-3 align-top">
                           <div className="font-medium text-gray-900">{emp.name}</div>
                           <div className="text-xs text-gray-500 font-mono">{emp.personid}</div>
                        </td>
                        <td className="px-4 py-3 text-right align-top text-xs text-gray-600">
                           <div className="font-semibold">{emp.pickup_point}</div>
                           <div>{emp.contractor}</div>
                           {emp.scanned_at && (
                             <div className="mt-1 text-emerald-600 font-medium bg-emerald-50 inline-block px-1 rounded">
                               {emp.scanned_at.split('T')[1]?.slice(0,5)}
                             </div>
                           )}
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             )}
          </div>
        </>
      )}
    </div>
  );
}
