import { useEffect, useMemo, useState } from 'react';
import type { BusInfo, EmployeeInfo, EmployeeInput } from '../types';
import { fetchBuses, fetchEmployees, saveEmployee } from '../api';
import PageHeader from '../components/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, RefreshCw, Search, CheckCircle2, XCircle, MapPin, Building2, Phone, Briefcase, UserCheck, UserX, Bus } from 'lucide-react';

type ActiveFilter = 'all' | 'active' | 'inactive';

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<EmployeeInfo[]>([]);
  const [buses, setBuses] = useState<BusInfo[]>([]);

  const [loading, setLoading] = useState(false);
  const [savingPersonId, setSavingPersonId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [busFilter, setBusFilter] = useState('');
  const [plantFilter, setPlantFilter] = useState('');
  const [contractorFilter, setContractorFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');

  const [selected, setSelected] = useState<EmployeeInfo | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const [employeeData, busData] = await Promise.all([fetchEmployees(), fetchBuses()]);
      setEmployees(employeeData);
      setBuses(busData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const contractorOptions = useMemo(() => {
    const values = new Set<string>();
    employees.forEach((e) => {
      if (e.transport_contractor) values.add(e.transport_contractor);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [employees]);

  const plantOptions = useMemo(() => {
    const values = new Set<string>();
    employees.forEach((e) => {
      if (e.building_id) values.add(e.building_id);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const query = search.toLowerCase().trim();

    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(query) ||
        emp.batch_id.toString().includes(query) ||
        (emp.transport_contractor || '').toLowerCase().includes(query) ||
        (emp.pickup_point || '').toLowerCase().includes(query) ||
        (emp.transport || '').toLowerCase().includes(query) ||
        (emp.route || '').toLowerCase().includes(query) ||
        (emp.building_id || '').toLowerCase().includes(query);
      const matchesBus = busFilter ? emp.bus_id === busFilter : true;
      const matchesPlant = plantFilter ? (emp.building_id || '') === plantFilter : true;
      const matchesContractor = contractorFilter ? (emp.transport_contractor || '') === contractorFilter : true;
      const matchesActive =
        activeFilter === 'all' ? true : activeFilter === 'active' ? emp.active : !emp.active;

      return matchesSearch && matchesBus && matchesPlant && matchesContractor && matchesActive;
    });
  }, [employees, search, busFilter, plantFilter, contractorFilter, activeFilter]);

  const activeCount = useMemo(() => employees.filter((e) => e.active).length, [employees]);
  const inactiveCount = useMemo(() => employees.filter((e) => !e.active).length, [employees]);
  const ownTransportCount = useMemo(() => employees.filter((e) => e.bus_id === 'OWN').length, [employees]);
  const filteredCount = filteredEmployees.length;

  const openDetails = (emp: EmployeeInfo) => {
    setSelected(emp);
    setDetailsOpen(true);
  };

  const toggleActive = async (emp: EmployeeInfo) => {
    setError(null);
    setMessage(null);
    setSavingPersonId(emp.batch_id);

    const payload: EmployeeInput = {
      batch_id: emp.batch_id,
      name: emp.name,
      bus_id: emp.bus_id,
      van_id: emp.van_id ?? undefined,
      active: !emp.active,
    };

    try {
      await saveEmployee(payload);
      setEmployees((prev) => prev.map((e) => (e.batch_id === emp.batch_id ? { ...e, active: !emp.active } : e)));
      setMessage(`Employee ${emp.batch_id} marked as ${!emp.active ? 'active' : 'inactive'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee');
    } finally {
      setSavingPersonId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Directory"
        subtitle="Employee data comes from the uploaded master list. Use this page to search, audit, and toggle active eligibility."
        badge="Admin"
        rightContent={
          <div className="flex gap-2">
            <Button onClick={loadAll} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 hover-lift">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
              <Users className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Total employees</p>
              <p className="text-2xl font-extrabold text-slate-900">{employees.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 hover-lift">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
              <UserCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Active</p>
              <p className="text-2xl font-extrabold text-emerald-700">{activeCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 hover-lift">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-100">
              <UserX className="w-5 h-5 text-rose-700" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Inactive</p>
              <p className="text-2xl font-extrabold text-rose-700">{inactiveCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 hover-lift">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50 border border-slate-200">
              <Bus className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Own transport</p>
              <p className="text-2xl font-extrabold text-slate-900">{ownTransportCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500" />
          {error}
        </div>
      )}

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          {message}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-emerald-50/50 to-white border-b border-emerald-100">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, PersonId, plant, contractor, pickup, route, or transport"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={busFilter}
                onChange={(e) => setBusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="">All buses</option>
                {buses.map((bus) => (
                  <option key={bus.bus_id} value={bus.bus_id}>
                    {bus.bus_id}
                  </option>
                ))}
              </select>

              <select
                value={plantFilter}
                onChange={(e) => setPlantFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="">All plants</option>
                {plantOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <select
                value={contractorFilter}
                onChange={(e) => setContractorFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="">All contractors</option>
                {contractorOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="all">All statuses</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setBusFilter('');
                  setPlantFilter('');
                  setContractorFilter('');
                  setActiveFilter('all');
                }}
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-700">{filteredCount}</span> of{' '}
              <span className="font-semibold text-slate-700">{employees.length}</span>
            </div>
            <div className="flex items-center gap-4">
              {plantFilter ? (
                <div className="truncate">
                  Plant: <span className="font-semibold text-slate-700">{plantFilter}</span>
                </div>
              ) : null}
              {contractorFilter ? (
                <div className="truncate">
                  Contractor: <span className="font-semibold text-slate-700">{contractorFilter}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PersonId</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Plant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bus</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transport</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contractor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pickup</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Active</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading employees...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No employees found for the current filters.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, index) => (
                  <tr
                    key={emp.id}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-emerald-50/50 transition-colors`}
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900">{emp.batch_id}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-800">{emp.name}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">
                      {emp.building_id ? (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {emp.building_id}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900">{emp.bus_id}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">
                      {emp.bus_id === 'OWN' ? (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">
                          OWN
                        </Badge>
                      ) : emp.transport ? (
                        <span className="font-medium">{emp.transport}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">
                      {emp.transport_contractor || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700 max-w-[280px] truncate">
                      {emp.pickup_point || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {emp.active ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="border-rose-200 text-rose-700">
                            Inactive
                          </Badge>
                        )}
                        {emp.terminate ? (
                          <Badge variant="secondary" className="bg-amber-50 text-amber-800 border-amber-200">
                            Terminated
                          </Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openDetails(emp)}>
                          Details
                        </Button>
                        <Button
                          variant={emp.active ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => toggleActive(emp)}
                          disabled={savingPersonId === emp.batch_id}
                        >
                          {savingPersonId === emp.batch_id ? 'Saving...' : emp.active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
            <DialogDescription>Master list fields for audit and troubleshooting.</DialogDescription>
          </DialogHeader>

          {!selected ? (
            <div className="text-sm text-gray-500">No employee selected.</div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold text-gray-900">{selected.name}</div>
                  <div className="text-sm text-gray-500">PersonId {selected.batch_id}</div>
                </div>
                <div className="flex items-center gap-2">
                  {selected.active ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="border-rose-200 text-rose-700">
                      Inactive
                    </Badge>
                  )}
                  {selected.terminate ? (
                    <Badge variant="secondary" className="bg-amber-50 text-amber-800 border-amber-200">
                      Terminated {selected.terminate}
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <Briefcase className="w-4 h-4 text-emerald-700" />
                    Transport
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Bus</span>
                      <span className="font-medium">{selected.bus_id || '—'}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Route</span>
                      <span className="font-medium">{selected.route || '—'}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Transport</span>
                      <span className="font-medium">{selected.transport || '—'}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Contractor</span>
                      <span className="font-medium">{selected.transport_contractor || '—'}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Pickup point</span>
                      <span className="font-medium">{selected.pickup_point || '—'}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <Building2 className="w-4 h-4 text-emerald-700" />
                    Employment
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Date joined</span>
                      <span className="font-medium">{selected.date_joined || '—'}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">SAPId</span>
                      <span className="font-medium">{selected.sap_id || '—'}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">WDID</span>
                      <span className="font-medium">{selected.wdid || '—'}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Status</span>
                      <span className="font-medium">{selected.status || '—'}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Plant</span>
                      <span className="font-medium">{selected.building_id || '—'}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Nationality</span>
                      <span className="font-medium">{selected.nationality || '—'}</span>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  Address
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                  <div>
                    <div className="text-gray-500">Address</div>
                    <div className="font-medium break-words">{selected.address1 || '—'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-gray-500">Postcode</div>
                      <div className="font-medium">{selected.postcode || '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">City</div>
                      <div className="font-medium">{selected.city || '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">State</div>
                      <div className="font-medium">{selected.state || '—'}</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        <div className="text-gray-500">Contact</div>
                        <div className="font-medium">{selected.contact_no || '—'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
