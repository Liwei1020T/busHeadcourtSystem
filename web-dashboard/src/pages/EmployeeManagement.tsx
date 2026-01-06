import { useEffect, useMemo, useState } from 'react';
import { BusInfo, EmployeeInfo, EmployeeInput, VanInfo } from '../types';
import { fetchBuses, fetchEmployees, fetchVans, saveEmployee } from '../api';
import PageHeader from '../components/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, UserPlus, RefreshCw, Search, CheckCircle2, XCircle } from 'lucide-react';

type ActiveFilter = 'all' | 'active' | 'inactive';

const initialForm = (busId = ''): EmployeeInput => ({
  batch_id: 0,
  name: '',
  bus_id: busId,
  van_id: undefined,
  active: true,
});

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<EmployeeInfo[]>([]);
  const [buses, setBuses] = useState<BusInfo[]>([]);
  const [vans, setVans] = useState<VanInfo[]>([]);
  const [form, setForm] = useState<EmployeeInput>(initialForm());
  const [selected, setSelected] = useState<EmployeeInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busFilter, setBusFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [mobileView, setMobileView] = useState<'list' | 'form'>('list');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);

    try {
      const [employeeData, busData, vanData] = await Promise.all([
        fetchEmployees(),
        fetchBuses(),
        fetchVans(),
      ]);

      setEmployees(employeeData);
      setBuses(busData);
      setVans(vanData);

      if (!form.bus_id && busData.length > 0) {
        setForm((prev) => ({ ...prev, bus_id: busData[0].bus_id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const refreshEmployees = async () => {
    try {
      const updated = await fetchEmployees();
      setEmployees(updated);

      if (selected) {
        const match = updated.find((e) => e.batch_id === selected.batch_id);
        if (match) {
          setSelected(match);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh employees');
    }
  };

  const filteredEmployees = useMemo(() => {
    const query = search.toLowerCase().trim();

    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(query) ||
        emp.batch_id.toString().includes(query);
      const matchesBus = busFilter ? emp.bus_id === busFilter : true;
      const matchesActive =
        activeFilter === 'all'
          ? true
          : activeFilter === 'active'
            ? emp.active
            : !emp.active;

      return matchesSearch && matchesBus && matchesActive;
    });
  }, [employees, search, busFilter, activeFilter]);

  const activeCount = useMemo(
    () => employees.filter((emp) => emp.active).length,
    [employees]
  );

  const vanLookup = useMemo(() => new Map(vans.map((v) => [v.id, v])), [vans]);

  const vansForBus = useMemo(
    () => vans.filter((v) => v.bus_id === form.bus_id),
    [vans, form.bus_id]
  );

  const handleSelect = (emp: EmployeeInfo) => {
    setSelected(emp);
    setMessage(null);
    setForm({
      batch_id: emp.batch_id,
      name: emp.name,
      bus_id: emp.bus_id,
      van_id: emp.van_id ?? undefined,
      active: emp.active,
    });
    setMobileView('form');
  };

  const handleNew = () => {
    setSelected(null);
    setMessage(null);
    setForm(initialForm(buses[0]?.bus_id ?? ''));
    setMobileView('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      if (!form.batch_id || !form.name || !form.bus_id) {
        throw new Error('Batch ID, name, and bus are required.');
      }

      const payload: EmployeeInput = {
        ...form,
        batch_id: Number(form.batch_id),
        van_id: form.van_id ? Number(form.van_id) : undefined,
      };

      await saveEmployee(payload);
      setMessage('Employee saved.');
      await refreshEmployees();
      setMobileView('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Directory"
        subtitle="View all employees, update bus assignments, and toggle active status."
        badge="Admin"
        rightContent={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleNew}>
              <UserPlus className="w-4 h-4 mr-1" />
              New employee
            </Button>
            <Button onClick={loadAll} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Total employees</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Active</p>
              <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50">
              <Users className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Buses with assignments</p>
              <p className="text-2xl font-bold text-teal-600">
                {new Set(employees.map((e) => e.bus_id)).size || '0'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Error/Success Messages */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Table */}
        <Card className={`lg:col-span-2 overflow-hidden ${mobileView === 'form' ? 'hidden lg:block' : 'block'}`}>
          {/* Filters */}
          <div className="p-4 bg-gradient-to-r from-emerald-50/50 to-white border-b border-emerald-100">
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name or batch ID"
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
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active only</option>
                  <option value="inactive">Inactive only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Batch ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bus</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Van</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Loading employees...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No employees found for the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp, index) => {
                    const van = emp.van_id ? vanLookup.get(emp.van_id) : null;
                    return (
                      <tr
                        key={emp.id}
                        className={`${selected?.id === emp.id
                          ? 'bg-emerald-50'
                          : index % 2 === 0
                            ? 'bg-white'
                            : 'bg-gray-50/50'
                          } hover:bg-emerald-50/50 transition-colors`}
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900">{emp.batch_id}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">{emp.name}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">{emp.bus_id}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">{van ? van.van_code : '-'}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${emp.active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-500'}`}
                          >
                            {emp.active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {emp.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleSelect(emp)}
                            className="text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Form Panel */}
        <Card className={`p-5 ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{selected ? 'Edit employee' : 'Add employee'}</h2>
              <p className="text-sm text-gray-500">Changes are saved immediately.</p>
            </div>
            <button
              onClick={() => setMobileView('list')}
              className="lg:hidden text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Back to list
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Batch ID</label>
              <Input
                type="number"
                value={form.batch_id === 0 ? '' : form.batch_id}
                onChange={(e) => setForm({ ...form, batch_id: Number(e.target.value) })}
                placeholder="e.g. 12345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <Input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Employee name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bus ID</label>
              <select
                value={form.bus_id}
                onChange={(e) => setForm({ ...form, bus_id: e.target.value, van_id: undefined })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select a bus</option>
                {buses.map((bus) => (
                  <option key={bus.bus_id} value={bus.bus_id}>
                    {bus.bus_id} {bus.route ? `· ${bus.route}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Van (optional)</label>
              <select
                value={form.van_id ? form.van_id.toString() : ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    van_id: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                disabled={!form.bus_id || vansForBus.length === 0}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">No van assigned</option>
                {vansForBus.map((van) => (
                  <option key={van.id} value={van.id}>
                    {van.van_code} {van.plate_number ? `· ${van.plate_number}` : ''}
                  </option>
                ))}
              </select>
              {!form.bus_id && (
                <p className="text-xs text-gray-400 mt-1">Select a bus to see available vans.</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                id="employee-active"
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="employee-active" className="text-sm text-gray-700">
                Active (eligible for attendance)
              </label>
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Saving...' : selected ? 'Update employee' : 'Create employee'}
            </Button>

            <p className="text-xs text-gray-400 text-center">
              Saving will update an existing employee with the same batch ID.
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
