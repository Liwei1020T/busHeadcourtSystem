import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { BusInfo, VanInfo, VanInput } from '../types';
import { fetchBuses, fetchVans, saveVan } from '../api';

const emptyForm: VanInput = {
  van_code: '',
  bus_id: '',
  plate_number: '',
  driver_name: '',
  capacity: undefined,
  active: true,
};

export default function VanManagement() {
  const [vans, setVans] = useState<VanInfo[]>([]);
  const [buses, setBuses] = useState<BusInfo[]>([]);
  const [form, setForm] = useState<VanInput>(emptyForm);
  const [selected, setSelected] = useState<VanInfo | null>(null);
  const [search, setSearch] = useState('');
  const [busFilter, setBusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'form'>('list');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);

    try {
      const [vanData, busData] = await Promise.all([fetchVans(), fetchBuses()]);
      setVans(vanData);
      setBuses(busData);

      if (!form.bus_id && busData.length > 0) {
        setForm((prev) => ({ ...prev, bus_id: busData[0].bus_id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vans');
    } finally {
      setLoading(false);
    }
  };

  const filteredVans = useMemo(() => {
    const query = search.toLowerCase().trim();
    return vans.filter((van) => {
      const matchesSearch =
        van.van_code.toLowerCase().includes(query) ||
        (van.plate_number || '').toLowerCase().includes(query) ||
        (van.driver_name || '').toLowerCase().includes(query) ||
        van.bus_id.toLowerCase().includes(query);
      const matchesBus = busFilter ? van.bus_id === busFilter : true;
      return matchesSearch && matchesBus;
    });
  }, [vans, search, busFilter]);

  const activeCount = useMemo(() => vans.filter((van) => van.active).length, [vans]);
  const totalCapacity = useMemo(
    () => vans.reduce((sum, van) => sum + (van.capacity ?? 0), 0),
    [vans]
  );

  const handleSelect = (van: VanInfo) => {
    setSelected(van);
    setMessage(null);
    setForm({
      van_code: van.van_code,
      bus_id: van.bus_id,
      plate_number: van.plate_number || '',
      driver_name: van.driver_name || '',
      capacity: van.capacity ?? undefined,
      active: van.active,
    });
    setMobileView('form');
  };

  const handleNew = () => {
    setSelected(null);
    setMessage(null);
    setForm(emptyForm);
    setMobileView('form');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (!form.van_code || !form.bus_id) {
        throw new Error('Van code and bus are required.');
      }

      const payload: VanInput = {
        ...form,
        plate_number: form.plate_number || null,
        driver_name: form.driver_name || null,
        capacity: form.capacity === undefined || form.capacity === null ? undefined : Number(form.capacity),
      };

      await saveVan(payload);
      setMessage('Van saved.');
      await loadAll();
      setMobileView('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save van');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">Admin</p>
          <h1 className="text-2xl font-bold text-gray-900">Van Management</h1>
          <p className="text-sm text-gray-500">Maintain van inventory and assignments to buses.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleNew}
            className="px-4 py-2 rounded-md bg-white border border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50"
          >
            New van
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
          <p className="text-xs text-gray-500">Total vans</p>
          <p className="text-2xl font-semibold text-gray-900">{vans.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-2xl font-semibold text-green-700">{activeCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500">Total capacity</p>
          <p className="text-2xl font-semibold text-gray-900">{totalCapacity}</p>
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
          <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
            <input
              type="text"
              placeholder="Search van, plate, driver, or bus"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Filter by bus:</span>
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
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Van Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                      Loading vans...
                    </td>
                  </tr>
                ) : filteredVans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                      No vans match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredVans.map((van) => (
                    <tr
                      key={van.id}
                      className={`${selected?.id === van.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{van.van_code}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{van.bus_id}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{van.plate_number || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{van.driver_name || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{van.capacity ?? '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${van.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}
                        >
                          {van.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleSelect(van)}
                          className="text-primary-700 hover:text-primary-900 font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`bg-white rounded-lg shadow p-4 ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{selected ? 'Edit van' : 'Add van'}</h2>
              <p className="text-sm text-gray-500">Van code is unique. Saving will update if it already exists.</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Van code</label>
              <input
                type="text"
                value={form.van_code}
                onChange={(e) => setForm({ ...form, van_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. V01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bus</label>
              <select
                value={form.bus_id}
                onChange={(e) => setForm({ ...form, bus_id: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Plate number (optional)</label>
              <input
                type="text"
                value={form.plate_number || ''}
                onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. ABC1234"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Driver name (optional)</label>
              <input
                type="text"
                value={form.driver_name || ''}
                onChange={(e) => setForm({ ...form, driver_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Driver name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input
                type="number"
                min={0}
                value={form.capacity ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    capacity: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Seats"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="van-active"
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 text-primary-600 border-gray-300 rounded"
              />
              <label htmlFor="van-active" className="text-sm text-gray-700">
                Active (eligible for assignment)
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-2 bg-primary-600 text-white font-medium rounded-md shadow-sm hover:bg-primary-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : selected ? 'Update van' : 'Create van'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
