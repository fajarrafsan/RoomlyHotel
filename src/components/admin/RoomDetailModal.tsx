import React, { useEffect, useState } from 'react';
import { OperationsDialog } from './OperationsDialog';
import {
  Loader2, AlertCircle, Plus, Trash2, Tag, ScrollText, Sofa, Sparkles, ImageIcon, Star, Upload
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import { roomApi } from '../../api/rooms';
import { ApiError } from '../../lib/http';
import { formatCurrency } from '../../lib/utils';
import {
  AmenityResponse, RefundFeeType, RoomAreaType, RoomCompositionResponse, RoomImageResponse,
  RoomItemType, RoomPolicyResponse, RoomPolicyType, RoomPriceResponse, RoomResponse
} from '../../types/api/room';
import { StatusPill } from './StatusPill';

const POLICY_TYPES: RoomPolicyType[] = [
  'CHECK_IN', 'CHECK_OUT', 'BREAKFAST', 'EXTRA_BED', 'REFUND', 'SMOKING', 'PET', 'CHILD', 'GENERAL',
];
const FEE_TYPES: RefundFeeType[] = ['NONE', 'PERCENT', 'FULL', 'FIRST_NIGHT'];
const AREA_TYPES: RoomAreaType[] = ['BEDROOM', 'LIVING_ROOM', 'BATHROOM', 'BALCONY', 'OTHER'];
const ITEM_TYPES: RoomItemType[] = [
  'KING_BED', 'QUEEN_BED', 'DOUBLE_BED', 'SINGLE_BED', 'SOFA_BED',
  'SHOWER', 'BATHTUB', 'TOILET', 'SINK', 'NONE', 'OTHER',
];

type Tab = 'prices' | 'policies' | 'composition' | 'amenities' | 'images';

const INPUT = 'p-2 rounded-lg border border-slate-200 text-[12px] text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-900 transition-colors';
const LABEL = 'text-[10px] font-semibold text-slate-500 block mb-1';

interface RoomDetailModalProps {
  isID: boolean;
  room: RoomResponse;
  onClose: () => void;
}

/**
 * Everything attached to one room type that isn't the room record itself:
 * seasonal prices, policies, bed/area composition, amenities and photos.
 * Each tab talks to its own room-service admin endpoint group.
 */
export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({ isID, room, onClose }) => {
  const [tab, setTab] = useState<Tab>('prices');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [prices, setPrices] = useState<RoomPriceResponse[] | null>(null);
  const [policies, setPolicies] = useState<RoomPolicyResponse[] | null>(null);
  const [composition, setComposition] = useState<RoomCompositionResponse[] | null>(null);
  const [images, setImages] = useState<RoomImageResponse[] | null>(null);
  const [allAmenities, setAllAmenities] = useState<AmenityResponse[] | null>(null);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<Set<number>>(new Set());

  // ---- new-record form state, one per tab ----
  const [priceForm, setPriceForm] = useState({ startDate: '', endDate: '', pricePerNight: 0, notes: '' });
  const [policyForm, setPolicyForm] = useState({
    policyType: 'GENERAL' as RoomPolicyType, title: '', description: '',
    isRefundable: true, freeCancelDays: '', feeType: 'NONE' as RefundFeeType, feeValue: '',
  });
  const [compForm, setCompForm] = useState({
    areaType: 'BEDROOM' as RoomAreaType, label: '', itemType: 'KING_BED' as RoomItemType,
    quantity: 1, isOptional: false, notes: '',
  });
  const [files, setFiles] = useState<FileList | null>(null);

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

  // Load whichever tab's data hasn't been fetched yet.
  useEffect(() => {
    const load = async () => {
      try {
        if (tab === 'prices' && prices === null) setPrices(await roomApi.prices(room.id));
        if (tab === 'policies' && policies === null) {
          const grouped = await roomApi.policiesGrouped(room.id);
          setPolicies(grouped.flatMap((g) => g.items));
        }
        if (tab === 'composition' && composition === null) setComposition(await roomApi.composition(room.id));
        if (tab === 'images' && images === null) setImages(await roomApi.images(room.id));
        if (tab === 'amenities' && allAmenities === null) {
          const [master, grouped] = await Promise.all([
            adminApi.listAmenities(),
            roomApi.amenitiesGrouped(room.id),
          ]);
          setAllAmenities(master);
          setSelectedAmenityIds(new Set(grouped.flatMap((g) => g.items).map((i) => i.amenityId)));
        }
      } catch (err) {
        console.error('Failed to load room detail tab', tab, err);
        setError(err instanceof ApiError ? err.message : (isID ? 'Gagal memuat data.' : 'Failed to load data.'));
      }
    };
    load();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [tab, room.id]);

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'prices', label: isID ? 'Harga' : 'Prices', icon: Tag },
    { key: 'policies', label: isID ? 'Kebijakan' : 'Policies', icon: ScrollText },
    { key: 'composition', label: isID ? 'Komposisi' : 'Composition', icon: Sofa },
    { key: 'amenities', label: isID ? 'Fasilitas' : 'Amenities', icon: Sparkles },
    { key: 'images', label: isID ? 'Foto' : 'Photos', icon: ImageIcon },
  ];

  return (
    <OperationsDialog title={isID ? 'Detail kamar' : 'Room details'} description={room.roomName}
      isID={isID} size="wide" busy={busy} onClose={onClose}>
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-100">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                aria-pressed={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`min-h-11 px-3 py-2 rounded-t-xl text-[12px] font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 border-b-2 ${
                  tab === t.key
                    ? 'text-slate-900 border-slate-900'
                    : 'text-slate-400 border-transparent hover:text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="min-w-0 space-y-4">
          {error && (
            <p className="text-[12px] text-rose-600 font-medium flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </p>
          )}

          {/* ============ PRICES ============ */}
          {tab === 'prices' && (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    const created = await adminApi.createPrice(room.id, {
                      startDate: priceForm.startDate,
                      endDate: priceForm.endDate,
                      pricePerNight: Number(priceForm.pricePerNight),
                      notes: priceForm.notes.trim() || undefined,
                    });
                    setPrices((prev) => [...(prev ?? []), created]);
                    setPriceForm({ startDate: '', endDate: '', pricePerNight: 0, notes: '' });
                  });
                }}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-2 items-end"
              >
                <label><span className={LABEL}>{isID ? 'Mulai' : 'Start'}</span>
                  <input required type="date" value={priceForm.startDate}
                    onChange={(e) => setPriceForm({ ...priceForm, startDate: e.target.value })} className={`w-full ${INPUT}`} />
                </label>
                <label><span className={LABEL}>{isID ? 'Selesai' : 'End'}</span>
                  <input required type="date" value={priceForm.endDate} min={priceForm.startDate}
                    onChange={(e) => setPriceForm({ ...priceForm, endDate: e.target.value })} className={`w-full ${INPUT}`} />
                </label>
                <label><span className={LABEL}>{isID ? 'Harga/Malam' : 'Price/Night'}</span>
                  <input required type="number" min={1} step="1000" value={priceForm.pricePerNight}
                    onChange={(e) => setPriceForm({ ...priceForm, pricePerNight: Number(e.target.value) })} className={`w-full ${INPUT}`} />
                </label>
                <label><span className={LABEL}>{isID ? 'Catatan' : 'Notes'}</span>
                  <input value={priceForm.notes} maxLength={500}
                    onChange={(e) => setPriceForm({ ...priceForm, notes: e.target.value })} className={`w-full ${INPUT}`} />
                </label>
                <button type="submit" disabled={busy}
                  className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50">
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  {isID ? 'Tambah' : 'Add'}
                </button>
              </form>

              <ListShell isID={isID} data={prices} emptyLabel={isID ? 'Belum ada harga musiman. Tarif dasar kamar yang dipakai.' : 'No seasonal prices. The room base price applies.'}>
                {(prices ?? []).map((p) => (
                  <Row key={p.id}>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-[12px]">
                        {formatCurrency(p.pricePerNight)} <span className="text-slate-400 font-normal">/ {isID ? 'malam' : 'night'}</span>
                      </p>
                      <p className="text-[11px] text-slate-500">{p.startDate} → {p.endDate}</p>
                      {p.notes && <p className="text-[10px] text-slate-400 font-light">{p.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusPill status={p.status} />
                      <DeleteBtn busy={busy} onClick={() => run(async () => {
                        await adminApi.deletePrice(p.id);
                        setPrices((prev) => (prev ?? []).filter((x) => x.id !== p.id));
                      })} />
                    </div>
                  </Row>
                ))}
              </ListShell>
            </>
          )}

          {/* ============ POLICIES ============ */}
          {tab === 'policies' && (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    const created = await adminApi.createPolicy(room.id, {
                      policyType: policyForm.policyType,
                      title: policyForm.title.trim() || undefined,
                      description: policyForm.description.trim() || undefined,
                      isRefundable: policyForm.isRefundable,
                      freeCancelDays: policyForm.freeCancelDays === '' ? undefined : Number(policyForm.freeCancelDays),
                      feeType: policyForm.feeType,
                      feeValue: policyForm.feeValue === '' ? undefined : Number(policyForm.feeValue),
                    });
                    setPolicies((prev) => [...(prev ?? []), created]);
                    setPolicyForm({ ...policyForm, title: '', description: '', freeCancelDays: '', feeValue: '' });
                  });
                }}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <label><span className={LABEL}>{isID ? 'Jenis' : 'Type'}</span>
                    <select value={policyForm.policyType}
                      onChange={(e) => setPolicyForm({ ...policyForm, policyType: e.target.value as RoomPolicyType })}
                      className={`w-full ${INPUT} cursor-pointer`}>
                      {POLICY_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                  </label>
                  <label><span className={LABEL}>{isID ? 'Judul' : 'Title'}</span>
                    <input value={policyForm.title}
                      onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })} className={`w-full ${INPUT}`} />
                  </label>
                  <label><span className={LABEL}>{isID ? 'Tipe Biaya' : 'Fee Type'}</span>
                    <select value={policyForm.feeType}
                      onChange={(e) => setPolicyForm({ ...policyForm, feeType: e.target.value as RefundFeeType })}
                      className={`w-full ${INPUT} cursor-pointer`}>
                      {FEE_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                  </label>
                  <label><span className={LABEL}>{isID ? 'Nilai Biaya' : 'Fee Value'}</span>
                    <input type="number" min={0} step="any" value={policyForm.feeValue}
                      onChange={(e) => setPolicyForm({ ...policyForm, feeValue: e.target.value })} className={`w-full ${INPUT}`} />
                  </label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
                  <label className="sm:col-span-2"><span className={LABEL}>{isID ? 'Deskripsi' : 'Description'}</span>
                    <input value={policyForm.description}
                      onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })} className={`w-full ${INPUT}`} />
                  </label>
                  <label><span className={LABEL}>{isID ? 'Hari Batal Gratis' : 'Free Cancel Days'}</span>
                    <input type="number" min={0} value={policyForm.freeCancelDays}
                      onChange={(e) => setPolicyForm({ ...policyForm, freeCancelDays: e.target.value })} className={`w-full ${INPUT}`} />
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium cursor-pointer">
                      <input type="checkbox" checked={policyForm.isRefundable}
                        onChange={(e) => setPolicyForm({ ...policyForm, isRefundable: e.target.checked })}
                        className="accent-slate-900 cursor-pointer" />
                      Refundable
                    </label>
                    <button type="submit" disabled={busy}
                      className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      {isID ? 'Tambah' : 'Add'}
                    </button>
                  </div>
                </div>
              </form>

              <ListShell isID={isID} data={policies} emptyLabel={isID ? 'Belum ada kebijakan.' : 'No policies yet.'}>
                {(policies ?? []).map((p) => (
                  <Row key={p.id}>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-[12px]">
                        {p.title || p.policyType.replace(/_/g, ' ')}
                        <span className="ml-2 text-[10px] text-slate-400 font-normal">{p.policyType.replace(/_/g, ' ')}</span>
                      </p>
                      {p.description && <p className="text-[11px] text-slate-500 font-light">{p.description}</p>}
                      <p className="text-[10px] text-slate-400 font-light">
                        {p.isRefundable ? (isID ? 'Bisa refund' : 'Refundable') : (isID ? 'Tidak bisa refund' : 'Non-refundable')}
                        {p.freeCancelDays != null && ` · ${p.freeCancelDays} ${isID ? 'hari batal gratis' : 'free-cancel days'}`}
                        {p.feeType && p.feeType !== 'NONE' && ` · ${p.feeType} ${p.feeValue ?? ''}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusPill status={p.status} />
                      <DeleteBtn busy={busy} onClick={() => run(async () => {
                        await adminApi.deletePolicy(p.id);
                        setPolicies((prev) => (prev ?? []).filter((x) => x.id !== p.id));
                      })} />
                    </div>
                  </Row>
                ))}
              </ListShell>
            </>
          )}

          {/* ============ COMPOSITION ============ */}
          {tab === 'composition' && (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    const created = await adminApi.createComposition(room.id, {
                      areaType: compForm.areaType,
                      label: compForm.label.trim(),
                      itemType: compForm.itemType,
                      quantity: Number(compForm.quantity),
                      isOptional: compForm.isOptional,
                      notes: compForm.notes.trim() || undefined,
                    });
                    setComposition((prev) => [...(prev ?? []), created]);
                    setCompForm({ ...compForm, label: '', notes: '' });
                  });
                }}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 sm:grid-cols-6 gap-2 items-end"
              >
                <label><span className={LABEL}>Area</span>
                  <select value={compForm.areaType}
                    onChange={(e) => setCompForm({ ...compForm, areaType: e.target.value as RoomAreaType })}
                    className={`w-full ${INPUT} cursor-pointer`}>
                    {AREA_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </label>
                <label><span className={LABEL}>Label</span>
                  <input required maxLength={100} value={compForm.label}
                    onChange={(e) => setCompForm({ ...compForm, label: e.target.value })} className={`w-full ${INPUT}`} />
                </label>
                <label><span className={LABEL}>Item</span>
                  <select value={compForm.itemType}
                    onChange={(e) => setCompForm({ ...compForm, itemType: e.target.value as RoomItemType })}
                    className={`w-full ${INPUT} cursor-pointer`}>
                    {ITEM_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </label>
                <label><span className={LABEL}>{isID ? 'Jumlah' : 'Qty'}</span>
                  <input required type="number" min={1} value={compForm.quantity}
                    onChange={(e) => setCompForm({ ...compForm, quantity: Number(e.target.value) })} className={`w-full ${INPUT}`} />
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium cursor-pointer pb-2">
                  <input type="checkbox" checked={compForm.isOptional}
                    onChange={(e) => setCompForm({ ...compForm, isOptional: e.target.checked })}
                    className="accent-slate-900 cursor-pointer" />
                  {isID ? 'Opsional' : 'Optional'}
                </label>
                <button type="submit" disabled={busy}
                  className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50">
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  {isID ? 'Tambah' : 'Add'}
                </button>
              </form>

              <ListShell isID={isID} data={composition} emptyLabel={isID ? 'Belum ada komposisi ruangan.' : 'No room composition yet.'}>
                {(composition ?? []).map((c) => (
                  <Row key={c.id}>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-[12px]">
                        {c.label} <span className="text-slate-400 font-normal">· {c.itemType.replace(/_/g, ' ')} × {c.quantity}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-light">
                        {c.areaType.replace(/_/g, ' ')}{c.isOptional ? (isID ? ' · opsional' : ' · optional') : ''}
                        {c.notes ? ` · ${c.notes}` : ''}
                      </p>
                    </div>
                    <DeleteBtn busy={busy} onClick={() => run(async () => {
                      await adminApi.deleteComposition(c.id);
                      setComposition((prev) => (prev ?? []).filter((x) => x.id !== c.id));
                    })} />
                  </Row>
                ))}
              </ListShell>
            </>
          )}

          {/* ============ AMENITIES ============ */}
          {tab === 'amenities' && (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-slate-500 font-light">
                  {isID
                    ? 'Centang fasilitas yang tersedia, lalu simpan. Menyimpan akan mengganti seluruh daftar fasilitas kamar ini.'
                    : 'Tick the amenities this room has, then save. Saving replaces the room’s entire amenity set.'}
                </p>
                <button
                  onClick={() => run(async () => {
                    await adminApi.replaceRoomAmenities(room.id, Array.from(selectedAmenityIds));
                  })}
                  disabled={busy || selectedAmenityIds.size === 0}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {isID ? `Simpan (${selectedAmenityIds.size})` : `Save (${selectedAmenityIds.size})`}
                </button>
              </div>

              <ListShell isID={isID} data={allAmenities} emptyLabel={isID ? 'Belum ada master fasilitas. Buat dulu di menu Master Data.' : 'No amenity master data yet. Create some under Master Data.'}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 p-2">
                  {(allAmenities ?? []).map((a) => {
                    const checked = selectedAmenityIds.has(a.id);
                    return (
                      <label
                        key={a.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all text-[11px] ${
                          checked ? 'border-slate-900 bg-slate-50' : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox" checked={checked} className="accent-slate-900 cursor-pointer"
                          onChange={(e) => setSelectedAmenityIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(a.id); else next.delete(a.id);
                            return next;
                          })}
                        />
                        <span className="min-w-0">
                          <span className="font-semibold text-slate-800 block truncate">{a.name}</span>
                          <span className="text-[9px] text-slate-400">{a.amenityGroup}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </ListShell>
            </>
          )}

          {/* ============ IMAGES ============ */}
          {tab === 'images' && (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!files || files.length === 0) return;
                  const formEl = e.target as HTMLFormElement;
                  run(async () => {
                    const uploaded = await adminApi.uploadRoomImages(room.id, Array.from(files));
                    setImages((prev) => [...(prev ?? []), ...uploaded]);
                    setFiles(null);
                    formEl.reset();
                  });
                }}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-wrap items-end gap-2"
              >
                <label className="flex-1 min-w-[200px]">
                  <span className={LABEL}>{isID ? 'Pilih Foto (bisa banyak)' : 'Choose Photos (multiple)'}</span>
                  <input
                    type="file" accept="image/*" multiple
                    onChange={(e) => setFiles(e.target.files)}
                    className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 file:cursor-pointer cursor-pointer"
                  />
                </label>
                <button type="submit" disabled={busy || !files || files.length === 0}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {isID ? 'Unggah' : 'Upload'}
                </button>
              </form>

              <ListShell isID={isID} data={images} emptyLabel={isID ? 'Belum ada foto kamar.' : 'No room photos yet.'}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-2">
                  {(images ?? []).map((img) => (
                    <div key={img.id} className="rounded-xl border border-slate-100 overflow-hidden relative">
                      <img src={img.imageUrl} alt={img.altText ?? ''} className="w-full h-24 object-cover bg-slate-100" />
                      {img.isPrimary && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-slate-900/90 text-white text-[9px] font-bold">
                          {isID ? 'Utama' : 'Primary'}
                        </span>
                      )}
                      <div className="flex items-center justify-between p-1.5 gap-1">
                        <button
                          onClick={() => run(async () => {
                            await adminApi.setRoomImagePrimary(img.id);
                            setImages((prev) => (prev ?? []).map((i) => ({ ...i, isPrimary: i.id === img.id })));
                          })}
                          disabled={busy || img.isPrimary}
                          title={isID ? 'Jadikan foto utama' : 'Set as primary'}
                          className="p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer disabled:opacity-30"
                        >
                          <Star className={`w-3 h-3 ${img.isPrimary ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                        <DeleteBtn busy={busy} onClick={() => run(async () => {
                          await adminApi.deleteRoomImage(img.id);
                          setImages((prev) => (prev ?? []).filter((i) => i.id !== img.id));
                        })} />
                      </div>
                    </div>
                  ))}
                </div>
              </ListShell>
            </>
          )}
        </div>
      </div>
    </OperationsDialog>
  );
};

// ---------- small shared bits ----------

const ListShell: React.FC<{
  isID: boolean;
  data: unknown[] | null;
  emptyLabel: string;
  children: React.ReactNode;
}> = ({ isID, data, emptyLabel, children }) => (
  <div className="rounded-2xl border border-slate-100 overflow-hidden max-h-[40vh] overflow-y-auto">
    {data === null ? (
      <p className="p-8 text-center text-xs text-slate-400 font-light flex items-center justify-center gap-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        {isID ? 'Memuat...' : 'Loading...'}
      </p>
    ) : data.length === 0 ? (
      <p className="p-8 text-center text-xs text-slate-400 font-light">{emptyLabel}</p>
    ) : (
      children
    )}
  </div>
);

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start justify-between gap-3 p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
    {children}
  </div>
);

const DeleteBtn: React.FC<{ busy: boolean; onClick: () => void }> = ({ busy, onClick }) => (
  <button
    onClick={onClick}
    disabled={busy}
    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-40 shrink-0"
  >
    <Trash2 className="w-3.5 h-3.5" />
  </button>
);
