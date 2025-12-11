import { useEffect, useMemo, useState } from 'react';
import { BusInfo, EmployeeInfo, EmployeeInput, VanInfo } from '../types';
import { fetchBuses, fetchEmployees, fetchVans, saveEmployee } from '../api';

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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">Admin</p>
          <h1 className="text-2xl font-bold text-gray-900">Employee Directory</h1>
          <p className="text-sm text-gray-500">
            View all employees, update bus assignments, and toggle active status.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleNew}
            className="px-4 py-2 rounded-md bg-white border border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50"
          >
            New employee
          </button>
          <button
            onClick={loadAll}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-primary-600 text-white shadow-sm hover:bg-primary-700 disabled:opacity-60"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500">Total employees</p>
          <p className="text-2xl font-semibold text-gray-900">{employees.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-2xl font-semibold text-green-700">{activeCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500">Buses with assignments</p>
          <p className="text-2xl font-semibold text-gray-900">
            {new Set(employees.map((e) => e.bus_id)).size || '0'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 bg-white rounded-lg shadow p-4 ${mobileView === 'form' ? 'hidden lg:block' : 'block'}`}>
          <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by name or batch ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={busFilter}
                onChange={(e) => setBusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All statuses</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Van</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      Loading employees...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      No employees found for the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const van = emp.van_id ? vanLookup.get(emp.van_id) : null;
                    return (
                      <tr
                        key={emp.id}
                        className={`${selected?.id === emp.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{emp.batch_id}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{emp.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{emp.bus_id}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{van ? van.van_code : '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}
                          >
                            {emp.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleSelect(emp)}
                            className="text-primary-700 hover:text-primary-900 font-medium"
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
        </div>

        <div className={`bg-white rounded-lg shadow p-4 ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{selected ? 'Edit employee' : 'Add employee'}</h2>
              <p className="text-sm text-gray-500">Changes are saved immediately.</p>
            </div>
            <button 
              onClick={() => setMobileView('list')}
              className="lg:hidden text-sm font-medium text-primary-600 hover:text-primary-800"
            >
              Back to list
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch ID</label>
              <input
                type="number"
                value={form.batch_id === 0 ? '' : form.batch_id}
                onChange={(e) => setForm({ ...form, batch_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. 12345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Employee name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bus ID</label>
              <select
                value={form.bus_id}
                onChange={(e) => setForm({ ...form, bus_id: e.target.value, van_id: undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Van (optional)</label>
              <select
                value={form.van_id ? form.van_id.toString() : ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    van_id: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                disabled={!form.bus_id || vansForBus.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
              >
                <option value="">No van assigned</option>
                {vansForBus.map((van) => (
                  <option key={van.id} value={van.id}>
                    {van.van_code} {van.plate_number ? `· ${van.plate_number}` : ''}
                  </option>
                ))}
              </select>
              {!form.bus_id && (
                <p className="text-xs text-gray-500 mt-1">Select a bus to see available vans.</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                id="employee-active"
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 text-primary-600 border-gray-300 rounded"
              />
              <label htmlFor="employee-active" className="text-sm text-gray-700">
                Active (eligible for attendance)
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-2 bg-primary-600 text-white font-medium rounded-md shadow-sm hover:bg-primary-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : selected ? 'Update employee' : 'Create employee'}
            </button>

            <p className="text-xs text-gray-500">
              Saving will update an existing employee with the same batch ID.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
