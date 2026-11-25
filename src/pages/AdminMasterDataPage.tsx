import { useCallback, useState, type FormEvent } from 'react';
import { Building2, Database, LoaderCircle, Pencil, Plus, Search, Sparkles, XCircle } from 'lucide-react';
import { adminApi } from '../api/admin';
import { AdminAccessGuard } from '../components/admin/AdminAccessGuard';
import { AdminFormModal, SelectField, TextAreaField, TextField } from '../components/admin/AdminFormModal';
import { OperationsDialog } from '../components/admin/OperationsDialog';
import {
  OperationsEmpty, OperationsList, OperationsNotice, OperationsPage, OperationsTabs,
  operationButton, operationDanger, operationField, operationSecondary,
} from '../components/admin/OperationsPage';
import { StatusPill } from '../components/admin/StatusPill';
import { useAuth } from '../context/AuthContext';
import { useOperationsQuery } from '../hooks/useOperationsQuery';
import { ApiError } from '../lib/http';
import type { Language } from '../types';
import type { FacilityCategory, FacilityResponse } from '../types/api/hotel';
import type { AmenityGroup, AmenityResponse } from '../types/api/room';

const groups: Record<AmenityGroup, [string, string]> = {
  TOP: ['Unggulan', 'Top'], ROOM: ['Kamar', 'Room'], BATHROOM: ['Kamar mandi', 'Bathroom'],
  VIEW: ['Pemandangan', 'View'], FOOD: ['Makanan', 'Food'], ACCESSIBILITY: ['Aksesibilitas', 'Accessibility'],
  SAFETY: ['Keselamatan', 'Safety'], ENTERTAINMENT: ['Hiburan', 'Entertainment'],
};
const categories: Record<FacilityCategory, [string, string]> = {
  GENERAL: ['Umum', 'General'], INTERNET: ['Internet', 'Internet'], FOOD: ['Makanan', 'Food'],
  FITNESS: ['Kebugaran', 'Fitness'], WELLNESS: ['Kesehatan & relaksasi', 'Wellness'], RECREATION: ['Rekreasi', 'Recreation'],
  BUSINESS: ['Bisnis', 'Business'], TRANSPORTATION: ['Transportasi', 'Transportation'],
  ACCESSIBILITY: ['Aksesibilitas', 'Accessibility'], FAMILY: ['Keluarga', 'Family'],
  SECURITY: ['Keamanan', 'Security'], DINING: ['Restoran', 'Dining'],
};

type Catalog = 'amenities' | 'facilities';
type Entry = AmenityResponse | FacilityResponse;
type Dialog = { kind: 'form'; entry: Entry | null } | { kind: 'disable'; entry: Entry };
const entryGroup = (entry: Entry) => 'amenityGroup' in entry ? entry.amenityGroup : entry.category;
const newDraft = { name: '', icon: '', description: '', group: 'ROOM', status: 'ACTIVE' as Entry['status'] };

export function AdminMasterDataPage({ language, onOpenAuth }: { language: Language; onOpenAuth?: () => void }) {
  const isID = language === 'ID';
  const locale = isID ? 0 : 1;
  const { user, isLoading: authLoading } = useAuth();
  const allowed = user?.role === 'ADMIN';
  const [tab, setTab] = useState<Catalog>('amenities');
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [draft, setDraft] = useState(newDraft);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isAmenity = tab === 'amenities';
  const label = isAmenity ? (isID ? 'Amenity kamar' : 'Room amenities') : (isID ? 'Fasilitas hotel' : 'Hotel facilities');
  const fieldLabel = isAmenity ? (isID ? 'Grup' : 'Group') : (isID ? 'Kategori' : 'Category');
  const options = Object.entries(isAmenity ? groups : categories).map(([value, labels]) => ({ value, label: labels[locale] }));

  const read = useCallback(() => tab === 'amenities' ? adminApi.listAmenities() : adminApi.listFacilities(), [tab, user?.userId]);
  const { data, loading, error, refresh } = useOperationsQuery<Entry[]>(read, allowed, isID ? 'Gagal memuat katalog.' : 'Could not load the catalog.');

  const patchDraft = (fields: Partial<typeof newDraft>) => {
    setDraft(previous => ({ ...previous, ...fields }));
    setActionError(null);
  };

  const openForm = (entry: Entry | null) => {
    setActionError(null);
    setDraft(entry ? {
      name: entry.name, icon: entry.icon ?? '', description: entry.description ?? '',
      group: entryGroup(entry), status: entry.status,
    } : { ...newDraft, group: isAmenity ? 'ROOM' : 'GENERAL' });
    setDialog({ kind: 'form', entry });
  };

  const mutate = async (operation: () => Promise<unknown>, message: string) => {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      await operation();
      setDialog(null);
      setNotice(message);
      await refresh();
    } catch (failure) {
      setActionError(failure instanceof ApiError ? failure.message : (isID ? 'Perubahan gagal disimpan.' : 'Could not save the changes.'));
    } finally {
      setBusy(false);
    }
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (dialog?.kind !== 'form') return;
    const name = draft.name.trim();
    if (!name) {
      setActionError(isID ? 'Nama wajib diisi.' : 'Enter a name.');
      return;
    }
    const entry = dialog.entry;
    const fields = { name, icon: draft.icon.trim(), description: draft.description.trim() };
    const newFields = { ...fields, icon: fields.icon || undefined, description: fields.description || undefined };
    const operation = () => {
      if (isAmenity) {
        const amenityGroup = draft.group as AmenityGroup;
        return entry ? adminApi.updateAmenity(entry.id, { ...fields, amenityGroup })
          : adminApi.createAmenity({ ...newFields, amenityGroup });
      }
      const category = draft.group as FacilityCategory;
      return entry ? adminApi.updateFacility(entry.id, { ...fields, category, status: draft.status })
        : adminApi.createFacility({ ...newFields, category });
    };
    void mutate(operation, isID ? 'Katalog diperbarui.' : 'Catalog updated.');
  };

  if (!allowed) {
    if (authLoading) return <OperationsEmpty loading isID={isID} empty="" />;
    return <AdminAccessGuard isID={isID} onOpenAuth={onOpenAuth}>{null}</AdminAccessGuard>;
  }

  const needle = search.trim().toLowerCase();
  const rows = (data ?? []).filter(entry => (!group || entryGroup(entry) === group)
    && (!needle || [entry.name, entry.description, entry.icon].some(value => value?.toLowerCase().includes(needle))));
  const entryLabel = isAmenity ? 'amenity' : (isID ? 'fasilitas' : 'facility');
  const addLabel = isID ? `Tambah ${entryLabel}` : `Add ${entryLabel}`;
  const editLabel = isID ? `Ubah ${entryLabel}` : `Edit ${entryLabel}`;
  const disableLabel = isID ? `Nonaktifkan ${entryLabel}` : `Deactivate ${entryLabel}`;

  return (
    <OperationsPage icon={Database} title={isID ? 'Data Master' : 'Master Data'}
      description={isID ? 'Kelola pilihan amenity kamar dan fasilitas yang digunakan di katalog properti.' : 'Manage the room amenities and hotel facilities available in the property catalog.'}
      isID={isID} loading={loading} blocked={busy || !!dialog} onRefresh={() => void refresh()}
      action={<button type="button" onClick={() => openForm(null)} disabled={busy} className={operationButton + ' bg-gold-soft text-[#162951] hover:bg-white'}>
        <Plus className="size-4" aria-hidden />{addLabel}
      </button>}>
      <OperationsTabs<Catalog> label={isID ? 'Jenis katalog' : 'Catalogs'} value={tab} items={[
        { value: 'amenities', label: isID ? 'Amenity kamar' : 'Room amenities', icon: Sparkles },
        { value: 'facilities', label: isID ? 'Fasilitas hotel' : 'Hotel facilities', icon: Building2 },
      ]} onChange={value => {
        if (value === tab || busy) return;
        setTab(value); setSearch(''); setGroup(''); setNotice(null);
      }} />
      {error && <OperationsNotice>{error}</OperationsNotice>}
      {notice && <OperationsNotice success>{notice}</OperationsNotice>}
      <OperationsList title={label} isID={isID} rows={rows} loading={loading}
        description={data && !loading ? `${rows.length} ${isID ? 'item ditampilkan' : 'items shown'}` : undefined}
        empty={error ? (isID ? 'Katalog belum tersedia.' : 'The catalog is unavailable.')
          : search.trim() || group ? (isID ? 'Tidak ada item yang cocok.' : 'No matching items.')
            : (isID ? 'Belum ada item di katalog ini.' : 'There are no items in this catalog yet.')}
        controls={<div className="grid w-full min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(150px,auto)] lg:w-auto lg:min-w-105">
          <label className="relative min-w-0">
            <span className="sr-only">{isID ? 'Cari katalog' : 'Search the catalog'}</span>
            <Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-slate-500" aria-hidden />
            <input type="search" value={search} onChange={event => setSearch(event.target.value)}
              className={operationField + ' pl-9'} placeholder={isID ? 'Cari nama item…' : 'Search item name…'} />
          </label>
          <select aria-label={fieldLabel} value={group} onChange={event => setGroup(event.target.value)} className={operationField + ' bg-white'}>
            <option value="">{isAmenity ? (isID ? 'Semua grup' : 'All groups') : (isID ? 'Semua kategori' : 'All categories')}</option>
            {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>}
        primary={{ label: isID ? 'Nama' : 'Name', render: entry => (
          <div className="max-w-[32rem]">
            <p className="font-semibold text-navy-dark [overflow-wrap:anywhere]">{entry.name}</p>
            {entry.description && <p className="mt-1 text-xs leading-5 text-slate-600 [overflow-wrap:anywhere]">{entry.description}</p>}
          </div>
        ) }}
        columns={[
          { label: fieldLabel, render: entry => options.find(option => option.value === entryGroup(entry))?.label ?? entryGroup(entry) },
          { label: isID ? 'Ikon' : 'Icon', render: entry => <span className="font-mono text-xs text-slate-700">{entry.icon || '—'}</span> },
        ]}
        status={entry => <StatusPill status={entry.status} label={entry.status === 'ACTIVE' ? (isID ? 'Aktif' : 'Active') : (isID ? 'Nonaktif' : 'Inactive')} />}
        actions={entry => <>
          <button type="button" disabled={busy || loading} aria-label={`${editLabel} ${entry.name}`} onClick={() => openForm(entry)} className={operationSecondary}>
            <Pencil className="size-4" aria-hidden />{isID ? 'Ubah' : 'Edit'}
          </button>
          {entry.status === 'ACTIVE' && <button type="button" disabled={busy || loading} aria-label={`${disableLabel} ${entry.name}`}
            onClick={() => { setActionError(null); setDialog({ kind: 'disable', entry }); }} className={operationDanger}>
            <XCircle className="size-4" aria-hidden />{isID ? 'Nonaktifkan' : 'Deactivate'}
          </button>}
        </>}
      />
      {dialog?.kind === 'form' && (
        <AdminFormModal isID={isID} title={dialog.entry ? editLabel : addLabel} submitting={busy} error={actionError}
          onClose={() => setDialog(null)} onSubmit={save} submitLabel={isID ? 'Simpan' : 'Save'}>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label={isID ? 'Nama' : 'Name'} required maxLength={isAmenity ? 150 : 100}
              value={draft.name} onChange={event => patchDraft({ name: event.target.value })} />
            <SelectField label={fieldLabel} options={options} value={draft.group} onChange={event => patchDraft({ group: event.target.value })} />
          </div>
          <TextField label={isID ? 'Ikon' : 'Icon'} maxLength={100} placeholder={isAmenity ? 'wifi' : 'pool'}
            value={draft.icon} onChange={event => patchDraft({ icon: event.target.value })} />
          <TextAreaField label={isID ? 'Deskripsi' : 'Description'} maxLength={500} rows={3}
            value={draft.description} onChange={event => patchDraft({ description: event.target.value })} />
          {!isAmenity && dialog.entry && <SelectField label="Status" value={draft.status}
            options={[{ value: 'ACTIVE', label: isID ? 'Aktif' : 'Active' }, { value: 'INACTIVE', label: isID ? 'Nonaktif' : 'Inactive' }]}
            onChange={event => patchDraft({ status: event.target.value as Entry['status'] })} />}
        </AdminFormModal>
      )}
      {dialog?.kind === 'disable' && (
        <OperationsDialog title={disableLabel} description={dialog.entry.name} isID={isID} busy={busy} onClose={() => setDialog(null)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-700">{isID ? 'Item ini akan dikeluarkan dari pilihan untuk penetapan baru.' : 'New assignments will omit this item.'}</p>
            {actionError && <OperationsNotice>{actionError}</OperationsNotice>}
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" disabled={busy} onClick={() => setDialog(null)} className={operationSecondary}>{isID ? 'Batal' : 'Cancel'}</button>
              <button type="button" disabled={busy} onClick={() => void mutate(
                () => isAmenity ? adminApi.deleteAmenity(dialog.entry.id) : adminApi.deleteFacility(dialog.entry.id),
                isID ? 'Item dinonaktifkan.' : 'Item deactivated.',
              )} className={operationDanger}>
                {busy && <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />}{isID ? 'Nonaktifkan' : 'Deactivate'}
              </button>
            </div>
          </div>
        </OperationsDialog>
      )}
    </OperationsPage>
  );
}
