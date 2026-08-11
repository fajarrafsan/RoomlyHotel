import React, { useCallback, useEffect, useState } from 'react';
import { Database, Plus, Trash2, Loader2, Sparkles, Building } from 'lucide-react';
import { adminApi } from '../api/admin';
import { ApiError } from '../lib/http';
import { Language } from '../types';
import { FacilityCategory, FacilityResponse } from '../types/api/hotel';
import { AmenityGroup, AmenityResponse } from '../types/api/room';
import { AdminAccessGuard } from '../components/admin/AdminAccessGuard';
import { AdminPageShell, AdminTableCard } from '../components/admin/AdminPageShell';
import { StatusPill } from '../components/admin/StatusPill';

const AMENITY_GROUPS: AmenityGroup[] = [
  'TOP', 'ROOM', 'BATHROOM', 'VIEW', 'FOOD', 'ACCESSIBILITY', 'SAFETY', 'ENTERTAINMENT',
];
const FACILITY_CATEGORIES: FacilityCategory[] = [
  'GENERAL', 'INTERNET', 'FOOD', 'FITNESS', 'WELLNESS', 'RECREATION',
  'BUSINESS', 'TRANSPORTATION', 'ACCESSIBILITY', 'FAMILY', 'SECURITY', 'DINING',
];

const INPUT = 'p-2 rounded-lg border border-slate-200 text-[12px] text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-900 transition-colors';
const LABEL = 'text-[10px] font-semibold text-slate-500 block mb-1';

/**
 * Shared master data: room amenities (room-service) and hotel facilities
 * (hotel-service). These are the catalogs that the per-room and per-hotel
 * assignment screens pick from, so nothing can be assigned until they exist.
 */
export const AdminMasterDataPage: React.FC<{ language: Language; onOpenAuth?: () => void }> = ({
  language,
  onOpenAuth,
}) => {
  const isID = language === 'ID';
  const [tab, setTab] = useState<'amenities' | 'facilities'>('amenities');

  const [amenities, setAmenities] = useState<AmenityResponse[]>([]);
  const [facilities, setFacilities] = useState<FacilityResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [amenityForm, setAmenityForm] = useState({
    name: '', icon: '', amenityGroup: 'ROOM' as AmenityGroup, description: '',
  });
  const [facilityForm, setFacilityForm] = useState({
    name: '', icon: '', category: 'GENERAL' as FacilityCategory, description: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'amenities') setAmenities(await adminApi.listAmenities());
      else setFacilities(await adminApi.listFacilities());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal memuat data.' : 'Failed to load data.'));
    } finally {
      setLoading(false);
    }
  }, [tab, isID]);

  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Aksi gagal.' : 'Action failed.'));
    } finally {
      setBusy(false);
    }
  };

  const isEmpty = tab === 'amenities' ? amenities.length === 0 : facilities.length === 0;

  return (
    <AdminAccessGuard isID={isID} onOpenAuth={onOpenAuth}>
      <AdminPageShell
        icon={Database}
        title={isID ? 'Master Data' : 'Master Data'}
        subtitle={
          isID
            ? 'Katalog amenity kamar dan fasilitas hotel. Item di sini yang bisa dipilih saat menugaskan ke kamar atau properti.'
            : 'The room-amenity and hotel-facility catalogs. Only items defined here can be assigned to rooms or properties.'
        }
        endpoint={tab === 'amenities' ? '/api/admin/amenities' : '/api/admin/facilities'}
        isID={isID}
        loading={loading}
        error={error}
        onRefresh={load}
        filters={
          <div className="flex items-center gap-1">
            {([
              { key: 'amenities' as const, label: isID ? 'Amenity Kamar' : 'Room Amenities', icon: Sparkles },
              { key: 'facilities' as const, label: isID ? 'Fasilitas Hotel' : 'Hotel Facilities', icon: Building },
            ]).map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    tab === t.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        }
      >
        {tab === 'amenities' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                const created = await adminApi.createAmenity({
                  name: amenityForm.name.trim(),
                  icon: amenityForm.icon.trim() || undefined,
                  amenityGroup: amenityForm.amenityGroup,
                  description: amenityForm.description.trim() || undefined,
                });
                setAmenities((prev) => [created, ...prev]);
                setAmenityForm({ ...amenityForm, name: '', icon: '', description: '' });
              });
            }}
            className="bg-white rounded-2xl border border-slate-100 p-4 grid grid-cols-2 sm:grid-cols-5 gap-2 items-end"
          >
            <label><span className={LABEL}>{isID ? 'Nama' : 'Name'}</span>
              <input required maxLength={150} value={amenityForm.name}
                onChange={(e) => setAmenityForm({ ...amenityForm, name: e.target.value })} className={`w-full ${INPUT}`} />
            </label>
            <label><span className={LABEL}>{isID ? 'Grup' : 'Group'}</span>
              <select value={amenityForm.amenityGroup}
                onChange={(e) => setAmenityForm({ ...amenityForm, amenityGroup: e.target.value as AmenityGroup })}
                className={`w-full ${INPUT} cursor-pointer`}>
                {AMENITY_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
            <label><span className={LABEL}>Icon</span>
              <input maxLength={100} value={amenityForm.icon} placeholder="wifi"
                onChange={(e) => setAmenityForm({ ...amenityForm, icon: e.target.value })} className={`w-full ${INPUT}`} />
            </label>
            <label><span className={LABEL}>{isID ? 'Deskripsi' : 'Description'}</span>
              <input maxLength={500} value={amenityForm.description}
                onChange={(e) => setAmenityForm({ ...amenityForm, description: e.target.value })} className={`w-full ${INPUT}`} />
            </label>
            <button type="submit" disabled={busy}
              className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {isID ? 'Tambah' : 'Add'}
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                const created = await adminApi.createFacility({
                  name: facilityForm.name.trim(),
                  icon: facilityForm.icon.trim() || undefined,
                  category: facilityForm.category,
                  description: facilityForm.description.trim() || undefined,
                });
                setFacilities((prev) => [created, ...prev]);
                setFacilityForm({ ...facilityForm, name: '', icon: '', description: '' });
              });
            }}
            className="bg-white rounded-2xl border border-slate-100 p-4 grid grid-cols-2 sm:grid-cols-5 gap-2 items-end"
          >
            <label><span className={LABEL}>{isID ? 'Nama' : 'Name'}</span>
              <input required maxLength={100} value={facilityForm.name}
                onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })} className={`w-full ${INPUT}`} />
            </label>
            <label><span className={LABEL}>{isID ? 'Kategori' : 'Category'}</span>
              <select value={facilityForm.category}
                onChange={(e) => setFacilityForm({ ...facilityForm, category: e.target.value as FacilityCategory })}
                className={`w-full ${INPUT} cursor-pointer`}>
                {FACILITY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label><span className={LABEL}>Icon</span>
              <input maxLength={100} value={facilityForm.icon} placeholder="pool"
                onChange={(e) => setFacilityForm({ ...facilityForm, icon: e.target.value })} className={`w-full ${INPUT}`} />
            </label>
            <label><span className={LABEL}>{isID ? 'Deskripsi' : 'Description'}</span>
              <input maxLength={500} value={facilityForm.description}
                onChange={(e) => setFacilityForm({ ...facilityForm, description: e.target.value })} className={`w-full ${INPUT}`} />
            </label>
            <button type="submit" disabled={busy}
              className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {isID ? 'Tambah' : 'Add'}
            </button>
          </form>
        )}

        <AdminTableCard
          isID={isID}
          loading={loading}
          isEmpty={isEmpty}
          emptyLabel={isID ? 'Belum ada data.' : 'No records yet.'}
        >
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">{isID ? 'Nama' : 'Name'}</th>
                <th className="px-4 py-3">{tab === 'amenities' ? (isID ? 'Grup' : 'Group') : (isID ? 'Kategori' : 'Category')}</th>
                <th className="px-4 py-3">Icon</th>
                <th className="px-4 py-3">{isID ? 'Deskripsi' : 'Description'}</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">{isID ? 'Aksi' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {tab === 'amenities'
                ? amenities.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{a.name}</td>
                      <td className="px-4 py-3 text-slate-500">{a.amenityGroup}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{a.icon || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[260px] truncate">{a.description || '—'}</td>
                      <td className="px-4 py-3"><StatusPill status={a.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            if (!window.confirm(isID ? `Hapus amenity "${a.name}"?` : `Delete amenity "${a.name}"?`)) return;
                            run(async () => {
                              await adminApi.deleteAmenity(a.id);
                              setAmenities((prev) => prev.filter((x) => x.id !== a.id));
                            });
                          }}
                          disabled={busy}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                : facilities.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{f.name}</td>
                      <td className="px-4 py-3 text-slate-500">{f.category}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{f.icon || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[260px] truncate">{f.description || '—'}</td>
                      <td className="px-4 py-3"><StatusPill status={f.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            if (!window.confirm(isID ? `Hapus fasilitas "${f.name}"?` : `Delete facility "${f.name}"?`)) return;
                            run(async () => {
                              await adminApi.deleteFacility(f.id);
                              setFacilities((prev) => prev.filter((x) => x.id !== f.id));
                            });
                          }}
                          disabled={busy}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </AdminTableCard>
      </AdminPageShell>
    </AdminAccessGuard>
  );
};
