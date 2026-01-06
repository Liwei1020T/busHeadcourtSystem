import { useEffect, useMemo, useState } from 'react';
import { BusInfo, BusInput } from '../types';
import { fetchBuses, saveBus } from '../api';
import PageHeader from '../components/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bus, Plus, RefreshCw, Search, Users } from 'lucide-react';

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
    <div className="space-y-6">
      <PageHeader
        title="Bus Management"
        subtitle="Keep bus details and capacity up to date."
        badge="Admin"
        rightContent={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleNew}>
              <Plus className="w-4 h-4 mr-1" />
              New bus
            </Button>
            <Button onClick={loadBuses} disabled={loading}>
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
              <Bus className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Total buses</p>
              <p className="text-2xl font-bold text-gray-900">{buses.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50">
              <Users className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Total capacity</p>
              <p className="text-2xl font-bold text-teal-600">{totalCapacity}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50">
              <Bus className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Plates filled</p>
              <p className="text-2xl font-bold text-emerald-600">
                {buses.filter((b) => b.plate_number).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bus Table */}
        <Card className={`lg:col-span-2 overflow-hidden ${mobileView === 'form' ? 'hidden lg:block' : 'block'}`}>
          <div className="p-4 bg-gradient-to-r from-emerald-50/50 to-white border-b border-emerald-100">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search bus, route, or plate"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-gray-500">Click a row to edit.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bus ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Route</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Plate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Capacity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Loading buses...
                    </td>
                  </tr>
                ) : filteredBuses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No buses match the current search.
                    </td>
                  </tr>
                ) : (
                  filteredBuses.map((bus, index) => (
                    <tr
                      key={bus.bus_id}
                      className={`${selected?.bus_id === bus.bus_id ? 'bg-emerald-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-emerald-50/50 transition-colors`}
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900">{bus.bus_id}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">{bus.route || '-'}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">{bus.plate_number || '-'}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-900">{bus.capacity ?? '-'}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleSelect(bus)}
                          className="text-emerald-600 hover:text-emerald-700 font-medium"
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
        </Card>

        {/* Form Panel */}
        <Card className={`p-5 ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{selected ? 'Edit bus' : 'Add bus'}</h2>
              <p className="text-sm text-gray-500">Bus ID is unique.</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bus ID</label>
              <Input
                type="text"
                value={form.bus_id}
                onChange={(e) => setForm({ ...form, bus_id: e.target.value })}
                placeholder="e.g. A01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Route</label>
              <Input
                type="text"
                value={form.route}
                onChange={(e) => setForm({ ...form, route: e.target.value })}
                placeholder="Route name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Plate number (optional)</label>
              <Input
                type="text"
                value={form.plate_number || ''}
                onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
                placeholder="e.g. ABC1234"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Capacity</label>
              <Input
                type="number"
                min={0}
                value={form.capacity ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    capacity: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
                placeholder="Seats"
              />
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Saving...' : selected ? 'Update bus' : 'Create bus'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
