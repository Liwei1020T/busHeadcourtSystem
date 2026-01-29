import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { BusInfo, VanInfo, VanInput } from '../types';
import { fetchBuses, fetchVans, saveVan } from '../api';
import PageHeader from '../components/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Truck, Plus, RefreshCw, Search, Users, CheckCircle2, XCircle } from 'lucide-react';

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
    <div className="space-y-6">
      <PageHeader
        title="Van Management"
        subtitle="Maintain van inventory and assignments to buses."
        badge="Admin"
        rightContent={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleNew}>
              <Plus className="w-4 h-4 mr-1" />
              New van
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
              <Truck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Total vans</p>
              <p className="text-2xl font-bold text-gray-900">{vans.length}</p>
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
              <p className="text-xs text-gray-500 font-medium uppercase">Total capacity</p>
              <p className="text-2xl font-bold text-teal-600">{totalCapacity}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Messages */}
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
        {/* Van Table */}
        <Card className={`lg:col-span-2 overflow-hidden ${mobileView === 'form' ? 'hidden lg:block' : 'block'}`}>
          <div className="p-4 bg-gradient-to-r from-emerald-50/50 to-white border-b border-emerald-100">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search van, plate, driver, or bus"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Filter:</span>
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
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Van Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bus</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Plate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Driver</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Capacity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Loading vans...
                    </td>
                  </tr>
                ) : filteredVans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No vans match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredVans.map((van, index) => (
                    <tr
                      key={van.id}
                      className={`${selected?.id === van.id ? 'bg-emerald-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-emerald-50/50 transition-colors`}
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900">{van.van_code}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">{van.bus_id}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">{van.plate_number || '-'}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">{van.driver_name || '-'}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-900">{van.capacity ?? '-'}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${van.active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'}`}
                        >
                          {van.active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {van.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleSelect(van)}
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
              <h2 className="text-lg font-semibold text-gray-900">{selected ? 'Edit van' : 'Add van'}</h2>
              <p className="text-sm text-gray-500">Van code is unique.</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Van code</label>
              <Input
                type="text"
                value={form.van_code}
                onChange={(e) => setForm({ ...form, van_code: e.target.value })}
                placeholder="e.g. V01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bus</label>
              <select
                value={form.bus_id}
                onChange={(e) => setForm({ ...form, bus_id: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Plate number (optional)</label>
              <Input
                type="text"
                value={form.plate_number || ''}
                onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
                placeholder="e.g. ABC1234"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Driver name (optional)</label>
              <Input
                type="text"
                value={form.driver_name || ''}
                onChange={(e) => setForm({ ...form, driver_name: e.target.value })}
                placeholder="Driver name"
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

            <div className="flex items-center gap-2">
              <input
                id="van-active"
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="van-active" className="text-sm text-gray-700">
                Active (eligible for assignment)
              </label>
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Saving...' : selected ? 'Update van' : 'Create van'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
