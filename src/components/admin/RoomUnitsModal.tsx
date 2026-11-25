import React, { useEffect, useState } from 'react';
import { OperationsDialog } from './OperationsDialog';
import { Loader2, Plus, Trash2, Layers, AlertCircle } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { ApiError } from '../../lib/http';
import { RoomResponse, RoomUnitResponse, RoomUnitStatus } from '../../types/api/room';
import { StatusPill } from './StatusPill';

const UNIT_STATUSES: RoomUnitStatus[] = [
  'AVAILABLE', 'RESERVED', 'OCCUPIED', 'DIRTY', 'CLEANING', 'MAINTENANCE', 'OUT_OF_ORDER',
];

interface RoomUnitsModalProps {
  isID: boolean;
  room: RoomResponse;
  onClose: () => void;
}

/**
 * Physical room units for one room type. These are what the front desk assigns
 * during check-in, so a room type with no AVAILABLE unit can't be checked in at all.
 */
export const RoomUnitsModal: React.FC<RoomUnitsModalProps> = ({ isID, room, onClose }) => {
  const [units, setUnits] = useState<RoomUnitResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Single-unit form
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [creating, setCreating] = useState(false);

  // Bulk generator: prefix + numeric range, e.g. "3" 01..10 -> 301, 302, ...
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPrefix, setBulkPrefix] = useState('');
  const [bulkFrom, setBulkFrom] = useState(1);
  const [bulkTo, setBulkTo] = useState(10);
  const [bulkFloor, setBulkFloor] = useState('');
  const [bulkCreating, setBulkCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setUnits(await adminApi.listUnits(room.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal memuat unit.' : 'Failed to load units.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [room.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const created = await adminApi.createUnit(room.id, {
        roomNumber: roomNumber.trim(),
        floor: floor === '' ? undefined : Number(floor),
        status: 'AVAILABLE',
      });
      setUnits((prev) => [...prev, created]);
      setRoomNumber('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal membuat unit.' : 'Failed to create unit.'));
    } finally {
      setCreating(false);
    }
  };

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkTo < bulkFrom) {
      setError(isID ? 'Nomor akhir harus >= nomor awal.' : 'End number must be >= start number.');
      return;
    }
    setBulkCreating(true);
    setError(null);
    try {
      const items = [];
      for (let n = bulkFrom; n <= bulkTo; n++) {
        items.push({
          roomNumber: `${bulkPrefix}${String(n).padStart(2, '0')}`,
          floor: bulkFloor === '' ? undefined : Number(bulkFloor),
          status: 'AVAILABLE' as RoomUnitStatus,
        });
      }
      const created = await adminApi.createUnitsBulk(room.id, items);
      setUnits((prev) => [...prev, ...created]);
      setBulkOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal membuat unit massal.' : 'Bulk create failed.'));
    } finally {
      setBulkCreating(false);
    }
  };

  const handleStatusChange = async (unit: RoomUnitResponse, status: RoomUnitStatus) => {
    setBusyId(unit.id);
    setError(null);
    try {
      const updated = await adminApi.updateUnit(unit.id, { status });
      setUnits((prev) => prev.map((u) => (u.id === unit.id ? updated : u)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal mengubah status unit.' : 'Failed to update unit.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (unit: RoomUnitResponse) => {
    if (!window.confirm(isID ? `Hapus unit ${unit.roomNumber}?` : `Delete unit ${unit.roomNumber}?`)) return;
    setBusyId(unit.id);
    setError(null);
    try {
      await adminApi.deleteUnit(unit.id);
      setUnits((prev) => prev.filter((u) => u.id !== unit.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal menghapus unit.' : 'Failed to delete unit.'));
    } finally {
      setBusyId(null);
    }
  };

  const availableCount = units.filter((u) => u.status === 'AVAILABLE').length;

  return (
    <OperationsDialog title={isID ? 'Unit kamar fisik' : 'Physical room units'} description={room.roomName}
      isID={isID} size="form" busy={creating || busyId != null || bulkCreating} onClose={onClose}>
      <div className="min-w-0 space-y-3">
        <p className="text-sm text-slate-700">
          {units.length} {isID ? 'unit' : 'units'} ·{' '}
          <span className="font-semibold text-emerald-700">{availableCount} {isID ? 'tersedia' : 'available'}</span>
          {availableCount === 0 && units.length > 0 && (
            <span className="text-amber-800">{' '}— {isID ? 'check-in belum bisa dilakukan' : 'check-in is unavailable'}</span>
          )}
        </p>
        <div className="min-w-0 space-y-4">
          {/* Create controls */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <form onSubmit={handleCreate} className="flex min-w-0 flex-1 flex-wrap items-end gap-2 sm:flex-nowrap">
              <label className="min-w-24 flex-1">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  {isID ? 'Nomor Kamar' : 'Room Number'}
                </span>
                <input
                  required value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)}
                  maxLength={50} placeholder={isID ? 'mis. 301' : 'e.g. 301'}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-900 transition-colors"
                />
              </label>
              <label className="w-20">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  {isID ? 'Lantai' : 'Floor'}
                </span>
                <input
                  type="number" value={floor} onChange={(e) => setFloor(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
                />
              </label>
              <button
                type="submit" disabled={creating}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {isID ? 'Tambah' : 'Add'}
              </button>
            </form>

            <button
              onClick={() => setBulkOpen((v) => !v)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Layers className="w-3.5 h-3.5" />
              {isID ? 'Massal' : 'Bulk'}
            </button>
          </div>

          {bulkOpen && (
            <form onSubmit={handleBulkCreate} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <p className="text-[11px] text-slate-500 font-medium">
                {isID
                  ? 'Buat banyak unit sekaligus: awalan + rentang nomor.'
                  : 'Generate several units at once: prefix + number range.'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
                <label className="col-span-1">
                  <span className="text-[10px] font-semibold text-slate-500 block mb-1">{isID ? 'Awalan' : 'Prefix'}</span>
                  <input
                    value={bulkPrefix} onChange={(e) => setBulkPrefix(e.target.value)} placeholder="3"
                    className="w-full p-2 rounded-lg border border-slate-200 text-[12px] focus:outline-none focus:border-slate-900"
                  />
                </label>
                <label>
                  <span className="text-[10px] font-semibold text-slate-500 block mb-1">{isID ? 'Dari' : 'From'}</span>
                  <input
                    type="number" min={0} value={bulkFrom} onChange={(e) => setBulkFrom(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 text-[12px] focus:outline-none focus:border-slate-900"
                  />
                </label>
                <label>
                  <span className="text-[10px] font-semibold text-slate-500 block mb-1">{isID ? 'Sampai' : 'To'}</span>
                  <input
                    type="number" min={0} value={bulkTo} onChange={(e) => setBulkTo(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 text-[12px] focus:outline-none focus:border-slate-900"
                  />
                </label>
                <label>
                  <span className="text-[10px] font-semibold text-slate-500 block mb-1">{isID ? 'Lantai' : 'Floor'}</span>
                  <input
                    type="number" value={bulkFloor} onChange={(e) => setBulkFloor(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 text-[12px] focus:outline-none focus:border-slate-900"
                  />
                </label>
                <button
                  type="submit" disabled={bulkCreating}
                  className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-semibold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {bulkCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  {isID ? 'Buat' : 'Create'}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-light">
                {isID ? 'Contoh hasil' : 'Preview'}: {bulkPrefix}{String(bulkFrom).padStart(2, '0')} …{' '}
                {bulkPrefix}{String(bulkTo).padStart(2, '0')} ({Math.max(0, bulkTo - bulkFrom + 1)} {isID ? 'unit' : 'units'})
              </p>
            </form>
          )}

          {error && (
            <p className="text-[12px] text-rose-600 font-medium flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </p>
          )}

          {/* Unit list */}
          <div className="rounded-2xl border border-slate-100 overflow-hidden max-h-[45vh] overflow-y-auto">
            {loading ? (
              <p className="p-8 text-center text-xs text-slate-400 font-light flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {isID ? 'Memuat unit...' : 'Loading units...'}
              </p>
            ) : units.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-400 font-light">
                {isID
                  ? 'Belum ada unit fisik. Tamu tidak bisa check-in ke tipe kamar ini sampai unit dibuat.'
                  : 'No physical units yet. Guests cannot check into this room type until units exist.'}
              </p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px] sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5">{isID ? 'Nomor' : 'Number'}</th>
                    <th className="px-4 py-2.5">{isID ? 'Lantai' : 'Floor'}</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">{isID ? 'Aksi' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {units.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-2.5 font-semibold text-slate-900">{u.roomNumber}</td>
                      <td className="px-4 py-2.5 text-slate-500">{u.floor ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <StatusPill status={u.status} />
                          <select
                            value={u.status}
                            disabled={busyId === u.id}
                            onChange={(e) => handleStatusChange(u, e.target.value as RoomUnitStatus)}
                            className="text-[10px] border border-slate-200 rounded-lg px-1.5 py-1 text-slate-500 focus:outline-none focus:border-slate-900 cursor-pointer disabled:opacity-40"
                          >
                            {UNIT_STATUSES.map((s) => (
                              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={busyId === u.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-40"
                          title={isID ? 'Hapus unit' : 'Delete unit'}
                        >
                          {busyId === u.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
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
