import { useEffect, useMemo, useState } from 'react';
import { BusInfo, BusInput } from '../types';
import { fetchBuses, saveBus } from '../api';

const emptyForm: BusInput = {
  bus_id: '',
  route: '',
  plate_number: '',
  capacity: 40,
};

export default function BusManagement() {
  const [buses, setBuses] = useState<BusInfo[]>([]);
  const [form, setForm] = useState<BusInput>(emptyForm);
  const [selected, setSelected] = useState<BusInfo | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'form'>('list');

  useEffect(() => {
    loadBuses();
  }, []);

  const loadBuses = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchBuses();
      setBuses(data);

      if (!form.bus_id && data.length > 0) {
        setForm((prev) => ({ ...prev, bus_id: data[0].bus_id, route: data[0].route ?? '' }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load buses');
    } finally {
      setLoading(false);
    }
  };

  const filteredBuses = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return buses;
    return buses.filter(
      (bus) =>
        bus.bus_id.toLowerCase().includes(query) ||
        (bus.route || '').toLowerCase().includes(query) ||
        (bus.plate_number || '').toLowerCase().includes(query)
    );
  }, [buses, search]);

  const totalCapacity = useMemo(
    () => buses.reduce((sum, bus) => sum + (bus.capacity ?? 0), 0),
    [buses]
  );

  const handleSelect = (bus: BusInfo) => {
    setSelected(bus);
    setMessage(null);
    setForm({
      bus_id: bus.bus_id,
      route: bus.route || '',
      plate_number: bus.plate_number || '',
      capacity: bus.capacity ?? undefined,
    });
    setMobileView('form');
  };

  const handleNew = () => {
    setSelected(null);
    setMessage(null);
    setForm(emptyForm);
    setMobileView('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (!form.bus_id || !form.route) {
        throw new Error('Bus ID and route are required.');
      }

      const payload: BusInput = {
        ...form,
        plate_number: form.plate_number || null,
        capacity: form.capacity ? Number(form.capacity) : undefined,
      };

      await saveBus(payload);
      setMessage('Bus saved.');
      await loadBuses();
      setMobileView('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bus');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">Admin</p>
          <h1 className="text-2xl font-bold text-gray-900">Bus Management</h1>
          <p className="text-sm text-gray-500">Keep bus details and capacity up to date.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleNew}
            className="px-4 py-2 rounded-md bg-white border border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50"
          >
            New bus
          </button>
          <button
            onClick={loadBuses}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-primary-600 text-white shadow-sm hover:bg-primary-700 disabled:opacity-60"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500">Total buses</p>
          <p className="text-2xl font-semibold text-gray-900">{buses.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500">Total capacity (seats)</p>
          <p className="text-2xl font-semibold text-gray-900">{totalCapacity}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500">Plate numbers filled</p>
          <p className="text-2xl font-semibold text-gray-900">
            {buses.filter((b) => b.plate_number).length}
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
          <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
            <input
              type="text"
              placeholder="Search bus, route, or plate"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-sm text-gray-500">Click a row to edit.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                      Loading buses...
                    </td>
                  </tr>
                ) : filteredBuses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                      No buses match the current search.
                    </td>
                  </tr>
                ) : (
                  filteredBuses.map((bus) => (
                    <tr
                      key={bus.bus_id}
                      className={`${selected?.bus_id === bus.bus_id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{bus.bus_id}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{bus.route || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{bus.plate_number || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{bus.capacity ?? '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleSelect(bus)}
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
              <h2 className="text-lg font-semibold text-gray-900">{selected ? 'Edit bus' : 'Add bus'}</h2>
              <p className="text-sm text-gray-500">Bus ID is unique.</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Bus ID</label>
              <input
                type="text"
                value={form.bus_id}
                onChange={(e) => setForm({ ...form, bus_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. A01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
              <input
                type="text"
                value={form.route}
                onChange={(e) => setForm({ ...form, route: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Route name"
              />
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

            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-2 bg-primary-600 text-white font-medium rounded-md shadow-sm hover:bg-primary-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : selected ? 'Update bus' : 'Create bus'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
