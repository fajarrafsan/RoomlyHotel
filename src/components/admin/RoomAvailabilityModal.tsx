import React, { useEffect, useState } from 'react';
import { OperationsDialog } from './OperationsDialog';
import { Loader2, AlertCircle, CalendarRange, Save, Trash2, Wand2, Info } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { roomApi } from '../../api/rooms';
import { ApiError } from '../../lib/http';
import {
  RoomAvailabilityResponse, RoomAvailabilityStatus, RoomAvailabilityUpsertRequest, RoomResponse
} from '../../types/api/room';
import { StatusPill } from './StatusPill';

const STATUSES: RoomAvailabilityStatus[] = ['AVAILABLE', 'LIMITED', 'SOLD_OUT', 'MAINTENANCE', 'CLOSED'];

/**
 * Formats a Date as a local YYYY-MM-DD.
 *
 * Deliberately NOT toISOString(): `new Date("2026-08-10T00:00:00")` is parsed as
 * local midnight, and toISOString() then converts back to UTC. At UTC+7 that
 * lands on 2026-08-09T17:00Z, so the formatted date reads one day EARLIER —
 * which exactly cancelled out a +1 day step and made addDays() return its own
 * input forever.
 */
const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const addDays = (iso: string, days: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return isoDate(date);
};
/**
 * Longest span this editor will load at once. Beyond this the table stops being
 * usable and the bulk-apply would write hundreds of rows in one request, so the
 * range is clamped up front instead of being silently truncated while loading.
 */
const MAX_RANGE_DAYS = 62;

/** Every date from `from` to `to` inclusive, never more than MAX_RANGE_DAYS. */
const dateRange = (from: string, to: string): string[] => {
  const out: string[] = [];
  for (let d = from; d <= to && out.length < MAX_RANGE_DAYS; d = addDays(d, 1)) {
    // A non-advancing step would spin until the length cap and emit duplicate
    // dates, so treat it as a bug rather than silently filling the table.
    if (out[out.length - 1] === d) break;
    out.push(d);
  }
  return out;
};

/** Inclusive day count between two ISO dates, computed in UTC so DST can't skew it. */
const daysBetween = (from: string, to: string) => {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000) + 1;
};

/** One editable row: an existing record, or a blank date with no record yet. */
interface Row {
  date: string;
  existing: RoomAvailabilityResponse | null;
  reserved: number;
  maintenance: number;
  status: RoomAvailabilityStatus | '';
  notes: string;
  dirty: boolean;
}

const toRow = (date: string, existing: RoomAvailabilityResponse | null): Row => ({
  date,
  existing,
  reserved: existing?.reservedInventory ?? 0,
  maintenance: existing?.maintenanceInventory ?? 0,
  status: existing?.status ?? '',
  notes: existing?.notes ?? '',
  dirty: false,
});

interface RoomAvailabilityModalProps {
  isID: boolean;
  room: RoomResponse;
  onClose: () => void;
}

/**
 * Per-date inventory for one room type. This is what makes a room bookable:
 * a date with no availability row (or zero available inventory) can't be reserved
 * by a guest, no matter that the room type itself exists.
 */
export const RoomAvailabilityModal: React.FC<RoomAvailabilityModalProps> = ({ isID, room, onClose }) => {
  const today = isoDate(new Date());
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(addDays(today, 13));

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingDate, setSavingDate] = useState<string | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);

  // Bulk-apply controls
  const [bulkReserved, setBulkReserved] = useState(0);
  const [bulkMaintenance, setBulkMaintenance] = useState(0);
  const [bulkStatus, setBulkStatus] = useState<RoomAvailabilityStatus | ''>('');

  // The room's real capacity: how many physical units it has. This is the number
  // that drives every availability row's totalInventory server-side, so it's shown
  // here rather than leaving the admin to infer it from the table.
  const [unitCount, setUnitCount] = useState<number | null>(null);

  // A range longer than MAX_RANGE_DAYS is clamped rather than partially loaded,
  // so what the table shows always matches what "from → to" says.
  const requestedDays = daysBetween(from, to);
  const clamped = requestedDays > MAX_RANGE_DAYS;
  const effectiveTo = clamped ? addDays(from, MAX_RANGE_DAYS - 1) : to;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const existing = await roomApi.availability(Number(room.id), from, effectiveTo);
      const byDate = new Map<string, RoomAvailabilityResponse>(existing.map((a): [string, RoomAvailabilityResponse] => [a.availabilityDate.slice(0, 10), a]));
      setRows(dateRange(from, effectiveTo).map((d) => toRow(d, byDate.get(d) ?? null)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal memuat ketersediaan.' : 'Failed to load availability.'));
      setRows(dateRange(from, effectiveTo).map((d) => toRow(d, null)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [room.id, from, effectiveTo]);

  useEffect(() => {
    let cancelled = false;
    adminApi.listUnits(room.id)
      .then((units) => { if (!cancelled) setUnitCount(units.length); })
      .catch(() => { if (!cancelled) setUnitCount(null); });
    return () => { cancelled = true; };
  }, [room.id]);

  const patchRow = (date: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.date === date ? { ...r, ...patch, dirty: true } : r)));

  const toPayload = (r: Row): RoomAvailabilityUpsertRequest => ({
    availabilityDate: r.date,
    reservedInventory: Number(r.reserved) || 0,
    maintenanceInventory: Number(r.maintenance) || 0,
    status: r.status || undefined,
    notes: r.notes.trim() || undefined,
  });

  // The single-date endpoint is an upsert, so one call covers create and edit.
  const handleSaveRow = async (row: Row) => {
    setSavingDate(row.date);
    setError(null);
    try {
      const saved = await adminApi.upsertAvailability(room.id, toPayload(row));
      setRows((prev) => prev.map((r) => (r.date === row.date ? toRow(row.date, saved) : r)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal menyimpan.' : 'Failed to save.'));
    } finally {
      setSavingDate(null);
    }
  };

  const handleDeleteRow = async (row: Row) => {
    if (!row.existing) return;
    setSavingDate(row.date);
    setError(null);
    try {
      await adminApi.deleteAvailability(row.existing.id);
      setRows((prev) => prev.map((r) => (r.date === row.date ? toRow(row.date, null) : r)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal menghapus.' : 'Failed to delete.'));
    } finally {
      setSavingDate(null);
    }
  };

  /** Writes the bulk values across every date in the loaded range in one call. */
  const handleBulkApply = async () => {
    setBulkSaving(true);
    setError(null);
    try {
      const items: RoomAvailabilityUpsertRequest[] = rows.map((r) => ({
        availabilityDate: r.date,
        reservedInventory: bulkReserved,
        maintenanceInventory: bulkMaintenance,
        status: bulkStatus || undefined,
      }));
      const saved = await adminApi.bulkUpsertAvailability(room.id, items);
      const byDate = new Map(saved.map((a) => [a.availabilityDate.slice(0, 10), a]));
      setRows((prev) => prev.map((r) => toRow(r.date, byDate.get(r.date) ?? r.existing)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal menerapkan massal.' : 'Bulk apply failed.'));
    } finally {
      setBulkSaving(false);
    }
  };

  const datesWithData = rows.filter((r) => r.existing !== null).length;
  const openDates = rows.filter((r) => (r.existing?.availableInventory ?? 0) > 0).length;

  return (
    <OperationsDialog title={isID ? 'Ketersediaan & inventaris' : 'Availability & inventory'} description={room.roomName}
      isID={isID} size="wide" busy={savingDate !== null || bulkSaving} onClose={onClose}>
      <div className="min-w-0 space-y-3">
        <p className="text-sm text-slate-700">
          <span className="font-semibold">{unitCount ?? '—'} {isID ? 'unit fisik' : 'physical units'}</span>
          {' · '}{isID ? `${rows.length} tanggal, ${datesWithData} diatur, ${openDates} bisa dipesan` : `${rows.length} dates, ${datesWithData} configured, ${openDates} bookable`}
        </p>
        <div className="min-w-0 space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 font-light leading-relaxed">
              {isID
                ? 'Total inventaris diambil dari jumlah unit kamar fisik, bukan diisi manual. Anda mengisi "Reserved" dan "Maintenance"; sisanya (Tersedia) dihitung backend. Nilai maintenance akan dinaikkan otomatis bila ada unit berstatus OUT_OF_ORDER.'
                : 'Total inventory comes from the number of physical room units, not from this form. You set "Reserved" and "Maintenance"; the backend computes what is left as Available. Maintenance is automatically raised if any unit is OUT_OF_ORDER.'}
            </p>
          </div>

          {/* Date range */}
          <div className="flex flex-wrap items-end gap-2">
            <label>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">{isID ? 'Dari' : 'From'}</span>
              <input
                type="date" value={from} min={today} onChange={(e) => setFrom(e.target.value)}
                className="p-2 rounded-xl border border-slate-200 text-[12px] text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
              />
            </label>
            <label>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">{isID ? 'Sampai' : 'To'}</span>
              <input
                type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)}
                className="p-2 rounded-xl border border-slate-200 text-[12px] text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
              />
            </label>
            <button
              onClick={load}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <CalendarRange className={`w-3.5 h-3.5 ${loading ? 'animate-pulse' : ''}`} />
              {isID ? 'Muat' : 'Load'}
            </button>
          </div>

          {clamped && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                {isID
                  ? `Rentang ${requestedDays} hari terlalu panjang. Ditampilkan ${MAX_RANGE_DAYS} hari pertama saja (sampai ${effectiveTo}). Persempit tanggal untuk mengatur sisanya.`
                  : `A ${requestedDays}-day range is too long. Showing the first ${MAX_RANGE_DAYS} days only (through ${effectiveTo}). Narrow the dates to configure the rest.`}
              </span>
            </p>
          )}

          {/* Bulk apply */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
            <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-slate-400" />
              {isID ? 'Terapkan ke Semua Tanggal Termuat' : 'Apply to Every Loaded Date'}
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <label>
                <span className="text-[10px] font-semibold text-slate-500 block mb-1">Reserved</span>
                <input
                  type="number" min={0} value={bulkReserved}
                  onChange={(e) => setBulkReserved(Number(e.target.value))}
                  className="w-24 p-2 rounded-lg border border-slate-200 text-[12px] focus:outline-none focus:border-slate-900"
                />
              </label>
              <label>
                <span className="text-[10px] font-semibold text-slate-500 block mb-1">Maintenance</span>
                <input
                  type="number" min={0} value={bulkMaintenance}
                  onChange={(e) => setBulkMaintenance(Number(e.target.value))}
                  className="w-24 p-2 rounded-lg border border-slate-200 text-[12px] focus:outline-none focus:border-slate-900"
                />
              </label>
              <label>
                <span className="text-[10px] font-semibold text-slate-500 block mb-1">Status</span>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value as RoomAvailabilityStatus | '')}
                  className="p-2 rounded-lg border border-slate-200 text-[12px] text-slate-700 focus:outline-none focus:border-slate-900 cursor-pointer"
                >
                  <option value="">{isID ? 'Otomatis' : 'Auto'}</option>
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </label>
              <button
                onClick={handleBulkApply}
                disabled={bulkSaving || rows.length === 0}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {bulkSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isID ? `Terapkan (${rows.length})` : `Apply (${rows.length})`}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-[12px] text-rose-600 font-medium flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </p>
          )}

          {/* Per-date grid */}
          <div className="rounded-2xl border border-slate-100 overflow-hidden max-h-[45vh] overflow-y-auto">
            {loading ? (
              <p className="p-8 text-center text-xs text-slate-400 font-light flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {isID ? 'Memuat ketersediaan...' : 'Loading availability...'}
              </p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px] sticky top-0">
                  <tr>
                    <th className="px-3 py-2.5">{isID ? 'Tanggal' : 'Date'}</th>
                    <th className="px-3 py-2.5 text-center">Total</th>
                    <th className="px-3 py-2.5 text-center">{isID ? 'Tersedia' : 'Available'}</th>
                    <th className="px-3 py-2.5">Reserved</th>
                    <th className="px-3 py-2.5">Maint.</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5 text-right">{isID ? 'Aksi' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {rows.map((r) => (
                    <tr key={r.date} className={`transition-colors ${r.dirty ? 'bg-amber-50/50' : 'hover:bg-slate-50/50'}`}>
                      <td className="px-3 py-2 font-semibold text-slate-900 whitespace-nowrap">
                        {r.date}
                        {!r.existing && (
                          <span className="block text-[9px] text-slate-400 font-normal">
                            {isID ? 'belum diatur' : 'not set'}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center text-slate-500">{r.existing?.totalInventory ?? '—'}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`font-bold ${
                          (r.existing?.availableInventory ?? 0) > 0 ? 'text-emerald-600' : 'text-slate-300'
                        }`}>
                          {r.existing?.availableInventory ?? '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number" min={0} value={r.reserved}
                          onChange={(e) => patchRow(r.date, { reserved: Number(e.target.value) })}
                          className="w-16 p-1.5 rounded-lg border border-slate-200 text-[12px] focus:outline-none focus:border-slate-900"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number" min={0} value={r.maintenance}
                          onChange={(e) => patchRow(r.date, { maintenance: Number(e.target.value) })}
                          className="w-16 p-1.5 rounded-lg border border-slate-200 text-[12px] focus:outline-none focus:border-slate-900"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          {r.existing && <StatusPill status={r.existing.status} />}
                          <select
                            value={r.status}
                            onChange={(e) => patchRow(r.date, { status: e.target.value as RoomAvailabilityStatus | '' })}
                            className="text-[10px] border border-slate-200 rounded-lg px-1.5 py-1 text-slate-500 focus:outline-none focus:border-slate-900 cursor-pointer"
                          >
                            <option value="">{isID ? 'Otomatis' : 'Auto'}</option>
                            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          {savingDate === r.date && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                          <button
                            onClick={() => handleSaveRow(r)}
                            disabled={savingDate === r.date}
                            title={isID ? 'Simpan tanggal ini' : 'Save this date'}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-40"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          {r.existing && (
                            <button
                              onClick={() => handleDeleteRow(r)}
                              disabled={savingDate === r.date}
                              title={isID ? 'Hapus data tanggal ini' : 'Clear this date'}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </OperationsDialog>
  );
};
