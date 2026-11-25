import React, { useEffect, useState } from 'react';
import { OperationsDialog } from './OperationsDialog';
import { Loader2, AlertCircle, Trash2, ImageIcon, Building, Star, Upload } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { ApiError } from '../../lib/http';
import { FacilityResponse, HotelImageResponse, HotelResponse } from '../../types/api/hotel';

type Tab = 'images' | 'facilities';

interface HotelMediaModalProps {
  isID: boolean;
  hotel: HotelResponse;
  onClose: () => void;
}

/** Photos and facility assignments for one property. */
export const HotelMediaModal: React.FC<HotelMediaModalProps> = ({ isID, hotel, onClose }) => {
  const [tab, setTab] = useState<Tab>('images');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [images, setImages] = useState<HotelImageResponse[] | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);

  const [allFacilities, setAllFacilities] = useState<FacilityResponse[] | null>(null);
  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());

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

  useEffect(() => {
    const load = async () => {
      try {
        if (tab === 'images' && images === null) setImages(await adminApi.hotelImages(hotel.id));
        if (tab === 'facilities' && allFacilities === null) {
          const [master, assigned] = await Promise.all([
            adminApi.listFacilities(),
            adminApi.hotelFacilities(hotel.id),
          ]);
          setAllFacilities(master);
          setAssignedIds(new Set(assigned.map((f) => f.id)));
        }
      } catch (err) {
        console.error('Failed to load hotel detail tab', tab, err);
        setError(err instanceof ApiError ? err.message : (isID ? 'Gagal memuat data.' : 'Failed to load data.'));
      }
    };
    load();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [tab, hotel.id]);

  // hotel-service has no "replace" endpoint for facilities, so a change is
  // applied as an explicit diff: assign the newly ticked ones, remove the rest.
  const handleSaveFacilities = (nextIds: Set<number>) =>
    run(async () => {
      const toAdd = Array.from(nextIds).filter((id) => !assignedIds.has(id));
      const toRemove = Array.from(assignedIds).filter((id) => !nextIds.has(id));

      if (toAdd.length > 0) await adminApi.assignHotelFacilities(hotel.id, toAdd);
      for (const id of toRemove) await adminApi.removeHotelFacility(hotel.id, id);

      setAssignedIds(new Set(nextIds));
    });

  const [draftIds, setDraftIds] = useState<Set<number> | null>(null);
  const effectiveIds = draftIds ?? assignedIds;

  return (
    <OperationsDialog title={isID ? 'Foto & fasilitas' : 'Photos & facilities'} description={hotel.name}
      isID={isID} size="form" busy={busy} onClose={onClose}>
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-100">
          {([
            { key: 'images' as Tab, label: isID ? 'Foto' : 'Photos', icon: ImageIcon },
            { key: 'facilities' as Tab, label: isID ? 'Fasilitas' : 'Facilities', icon: Building },
          ]).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                aria-pressed={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`min-h-11 px-3 py-2 rounded-t-xl text-[12px] font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 border-b-2 ${
                  tab === t.key ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-700'
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

          {tab === 'images' && (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!files || files.length === 0) return;
                  const formEl = e.target as HTMLFormElement;
                  run(async () => {
                    const uploaded = await adminApi.uploadHotelImages(hotel.id, Array.from(files));
                    setImages((prev) => [...(prev ?? []), ...uploaded]);
                    setFiles(null);
                    formEl.reset();
                  });
                }}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-wrap items-end gap-2"
              >
                <label className="flex-1 min-w-[200px]">
                  <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                    {isID ? 'Pilih Foto (bisa banyak)' : 'Choose Photos (multiple)'}
                  </span>
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

              <div className="rounded-2xl border border-slate-100 overflow-hidden max-h-[45vh] overflow-y-auto">
                {images === null ? (
                  <p className="p-8 text-center text-xs text-slate-400 font-light flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {isID ? 'Memuat foto...' : 'Loading photos...'}
                  </p>
                ) : images.length === 0 ? (
                  <p className="p-8 text-center text-xs text-slate-400 font-light">
                    {isID ? 'Belum ada foto properti.' : 'No property photos yet.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-2">
                    {images.map((img) => (
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
                              await adminApi.setHotelImagePrimary(img.id);
                              setImages((prev) => (prev ?? []).map((i) => ({ ...i, isPrimary: i.id === img.id })));
                            })}
                            disabled={busy || img.isPrimary}
                            title={isID ? 'Jadikan foto utama' : 'Set as primary'}
                            className="p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer disabled:opacity-30"
                          >
                            <Star className={`w-3 h-3 ${img.isPrimary ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                          <button
                            onClick={() => run(async () => {
                              await adminApi.deleteHotelImage(img.id);
                              setImages((prev) => (prev ?? []).filter((i) => i.id !== img.id));
                            })}
                            disabled={busy}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-40"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'facilities' && (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-slate-500 font-light">
                  {isID
                    ? 'Centang fasilitas properti, lalu simpan. Perubahan dikirim sebagai penambahan dan penghapusan.'
                    : 'Tick this property’s facilities, then save. Changes are sent as adds and removes.'}
                </p>
                <button
                  onClick={() => draftIds && handleSaveFacilities(draftIds)}
                  disabled={busy || draftIds === null}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Building className="w-3.5 h-3.5" />}
                  {isID ? `Simpan (${effectiveIds.size})` : `Save (${effectiveIds.size})`}
                </button>
              </div>

              <div className="rounded-2xl border border-slate-100 overflow-hidden max-h-[45vh] overflow-y-auto">
                {allFacilities === null ? (
                  <p className="p-8 text-center text-xs text-slate-400 font-light flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {isID ? 'Memuat fasilitas...' : 'Loading facilities...'}
                  </p>
                ) : allFacilities.length === 0 ? (
                  <p className="p-8 text-center text-xs text-slate-400 font-light">
                    {isID
                      ? 'Belum ada master fasilitas. Buat dulu di menu Master Data.'
                      : 'No facility master data yet. Create some under Master Data.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 p-2">
                    {allFacilities.map((f) => {
                      const checked = effectiveIds.has(f.id);
                      return (
                        <label
                          key={f.id}
                          className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all text-[11px] ${
                            checked ? 'border-slate-900 bg-slate-50' : 'border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox" checked={checked} className="accent-slate-900 cursor-pointer"
                            onChange={(e) => {
                              const next = new Set(effectiveIds);
                              if (e.target.checked) next.add(f.id); else next.delete(f.id);
                              setDraftIds(next);
                            }}
                          />
                          <span className="min-w-0">
                            <span className="font-semibold text-slate-800 block truncate">{f.name}</span>
                            <span className="text-[9px] text-slate-400">{f.category}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </OperationsDialog>
  );
};
