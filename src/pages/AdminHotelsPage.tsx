import React, { useCallback, useEffect, useState } from 'react';
import {
  Building2, Star, MapPin, DoorOpen, Loader2, Plus, Pencil, Trash2, KeyRound, CalendarRange,
  ImageIcon, SlidersHorizontal
} from 'lucide-react';
import { adminApi } from '../api/admin';
import { ApiError } from '../lib/http';
import { formatCurrency } from '../lib/utils';
import { Language } from '../types';
import { HotelResponse } from '../types/api/hotel';
import { RoomResponse } from '../types/api/room';
import { AdminAccessGuard } from '../components/admin/AdminAccessGuard';
import { AdminPageShell, AdminTableCard } from '../components/admin/AdminPageShell';
import { StatusPill } from '../components/admin/StatusPill';
import { HotelFormModal } from '../components/admin/HotelFormModal';
import { RoomFormModal } from '../components/admin/RoomFormModal';
import { RoomUnitsModal } from '../components/admin/RoomUnitsModal';
import { RoomAvailabilityModal } from '../components/admin/RoomAvailabilityModal';
import { RoomDetailModal } from '../components/admin/RoomDetailModal';
import { HotelMediaModal } from '../components/admin/HotelMediaModal';

export const AdminHotelsPage: React.FC<{ language: Language; onOpenAuth?: () => void }> = ({
  language,
  onOpenAuth,
}) => {
  const isID = language === 'ID';

  const [hotels, setHotels] = useState<HotelResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyHotelId, setBusyHotelId] = useState<number | null>(null);

  // Room catalog for one expanded property, fetched on demand.
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [rooms, setRooms] = useState<RoomResponse[] | null>(null);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Modal state — only one is ever open at a time.
  const [hotelForm, setHotelForm] = useState<{ hotel: HotelResponse | null } | null>(null);
  const [roomForm, setRoomForm] = useState<{ hotel: HotelResponse; room: RoomResponse | null } | null>(null);
  const [unitsFor, setUnitsFor] = useState<RoomResponse | null>(null);
  const [availabilityFor, setAvailabilityFor] = useState<RoomResponse | null>(null);
  const [roomDetailFor, setRoomDetailFor] = useState<RoomResponse | null>(null);
  const [hotelDetailFor, setHotelDetailFor] = useState<HotelResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await adminApi.listHotels(0, 100);
      setHotels(page.content);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal memuat properti.' : 'Failed to load properties.'));
    } finally {
      setLoading(false);
    }
  }, [isID]);

  useEffect(() => { load(); }, [load]);

  const loadRooms = async (hotelId: number) => {
    setRoomsLoading(true);
    try {
      setRooms(await adminApi.listRooms(hotelId));
    } catch (err) {
      console.error('Failed to load rooms for hotel', hotelId, err);
      setRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  const toggleRooms = async (hotel: HotelResponse) => {
    if (expandedId === hotel.id) {
      setExpandedId(null);
      setRooms(null);
      return;
    }
    setExpandedId(hotel.id);
    setRooms(null);
    await loadRooms(hotel.id);
  };

  const handleDeleteHotel = async (hotel: HotelResponse) => {
    const ok = window.confirm(
      isID
        ? `Hapus properti "${hotel.name}"? Kamar dan reservasi yang tertaut bisa ikut terpengaruh.`
        : `Delete property "${hotel.name}"? Linked rooms and reservations may be affected.`
    );
    if (!ok) return;

    setBusyHotelId(hotel.id);
    setError(null);
    try {
      await adminApi.deleteHotel(hotel.id);
      setHotels((prev) => prev.filter((h) => h.id !== hotel.id));
      if (expandedId === hotel.id) { setExpandedId(null); setRooms(null); }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal menghapus properti.' : 'Failed to delete property.'));
    } finally {
      setBusyHotelId(null);
    }
  };

  const handleDeleteRoom = async (room: RoomResponse) => {
    const ok = window.confirm(
      isID ? `Hapus tipe kamar "${room.roomName}"?` : `Delete room type "${room.roomName}"?`
    );
    if (!ok) return;

    setError(null);
    try {
      await adminApi.deleteRoom(room.id);
      setRooms((prev) => (prev ? prev.filter((r) => r.id !== room.id) : prev));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal menghapus kamar.' : 'Failed to delete room.'));
    }
  };

  return (
    <AdminAccessGuard isID={isID} onOpenAuth={onOpenAuth}>
      <AdminPageShell
        icon={Building2}
        title={isID ? 'Properti & Kamar' : 'Properties & Rooms'}
        subtitle={
          isID
            ? `Kelola properti, tipe kamar, dan unit kamar fisik. ${hotels.length} properti terdaftar.`
            : `Manage properties, room types and physical room units. ${hotels.length} properties registered.`
        }
        endpoint="/api/admin/hotels · /api/admin/rooms"
        isID={isID}
        loading={loading}
        error={error}
        onRefresh={load}
        filters={
          <button
            onClick={() => setHotelForm({ hotel: null })}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {isID ? 'Properti Baru' : 'New Property'}
          </button>
        }
      >
        <AdminTableCard
          isID={isID}
          loading={loading}
          isEmpty={hotels.length === 0}
          emptyLabel={isID ? 'Belum ada properti terdaftar.' : 'No properties registered yet.'}
        >
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">{isID ? 'Properti' : 'Property'}</th>
                <th className="px-4 py-3">{isID ? 'Lokasi' : 'Location'}</th>
                <th className="px-4 py-3">{isID ? 'Bintang' : 'Stars'}</th>
                <th className="px-4 py-3">Check-in / out</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">{isID ? 'Aksi' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {hotels.map((h) => (
                <React.Fragment key={h.id}>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{h.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        #{h.id}{h.propertyType ? ` · ${h.propertyType}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-300" />
                        {h.city}{h.province ? `, ${h.province}` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {h.starRating}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {(h.checkInTime?.slice(0, 5) || '—')} / {(h.checkOutTime?.slice(0, 5) || '—')}
                    </td>
                    <td className="px-4 py-3"><StatusPill status={h.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {busyHotelId === h.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 mr-1" />}
                        <button
                          onClick={() => toggleRooms(h)}
                          title={isID ? 'Kelola kamar' : 'Manage rooms'}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <DoorOpen className="w-3 h-3" />
                          <span>{expandedId === h.id ? (isID ? 'Tutup' : 'Hide') : (isID ? 'Kamar' : 'Rooms')}</span>
                        </button>
                        <button
                          onClick={() => setHotelDetailFor(h)}
                          title={isID ? 'Foto & fasilitas' : 'Photos & facilities'}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setHotelForm({ hotel: h })}
                          title={isID ? 'Ubah properti' : 'Edit property'}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteHotel(h)}
                          disabled={busyHotelId === h.id}
                          title={isID ? 'Hapus properti' : 'Delete property'}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedId === h.id && (
                    <tr className="bg-slate-50/60">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-[12px] font-semibold text-slate-700">
                            {isID ? 'Tipe Kamar' : 'Room Types'}
                            {rooms && <span className="text-slate-400 font-normal"> · {rooms.length}</span>}
                          </h4>
                          <button
                            onClick={() => setRoomForm({ hotel: h, room: null })}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            {isID ? 'Kamar Baru' : 'New Room'}
                          </button>
                        </div>

                        {roomsLoading ? (
                          <p className="text-[11px] text-slate-400 font-light flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            {isID ? 'Memuat kamar...' : 'Loading rooms...'}
                          </p>
                        ) : !rooms || rooms.length === 0 ? (
                          <p className="text-[11px] text-slate-400 font-light">
                            {isID ? 'Properti ini belum punya tipe kamar.' : 'This property has no room types yet.'}
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {rooms.map((room) => (
                              <div key={room.id} className="bg-white rounded-xl border border-slate-100 p-3 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="font-semibold text-slate-900 text-[12px] leading-tight">{room.roomName}</p>
                                  <StatusPill status={room.status} />
                                </div>
                                <div>
                                  <p className="text-[11px] text-slate-500">
                                    {formatCurrency(room.basePrice)}{' '}
                                    <span className="text-slate-400 font-light">/ {isID ? 'malam' : 'night'}</span>
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-light">
                                    {isID ? 'Kapasitas' : 'Capacity'}: {room.maxOccupancy} · {room.totalBeds}{' '}
                                    {isID ? 'tempat tidur' : 'beds'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 pt-1 border-t border-slate-50">
                                  <button
                                    onClick={() => setUnitsFor(room)}
                                    title={isID ? 'Unit kamar fisik' : 'Physical units'}
                                    className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-semibold transition-all inline-flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <KeyRound className="w-3 h-3" />
                                    {isID ? 'Unit' : 'Units'}
                                  </button>
                                  <button
                                    onClick={() => setAvailabilityFor(room)}
                                    title={isID ? 'Ketersediaan & inventaris' : 'Availability & inventory'}
                                    className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-semibold transition-all inline-flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <CalendarRange className="w-3 h-3" />
                                    {isID ? 'Inventaris' : 'Inventory'}
                                  </button>
                                  <button
                                    onClick={() => setRoomDetailFor(room)}
                                    title={isID ? 'Harga, kebijakan, fasilitas, foto' : 'Prices, policies, amenities, photos'}
                                    className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-semibold transition-all inline-flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <SlidersHorizontal className="w-3 h-3" />
                                    {isID ? 'Detail' : 'Details'}
                                  </button>
                                  <button
                                    onClick={() => setRoomForm({ hotel: h, room })}
                                    title={isID ? 'Ubah kamar' : 'Edit room'}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRoom(room)}
                                    title={isID ? 'Hapus kamar' : 'Delete room'}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </AdminTableCard>
      </AdminPageShell>

      {hotelForm && (
        <HotelFormModal
          isID={isID}
          hotel={hotelForm.hotel}
          onClose={() => setHotelForm(null)}
          onSaved={(saved, isNew) => {
            setHotels((prev) => (isNew ? [saved, ...prev] : prev.map((h) => (h.id === saved.id ? saved : h))));
            setHotelForm(null);
          }}
        />
      )}

      {roomForm && (
        <RoomFormModal
          isID={isID}
          hotelId={roomForm.hotel.id}
          hotelName={roomForm.hotel.name}
          room={roomForm.room}
          onClose={() => setRoomForm(null)}
          onSaved={(saved, isNew) => {
            setRooms((prev) => {
              if (!prev) return prev;
              return isNew ? [...prev, saved] : prev.map((r) => (r.id === saved.id ? saved : r));
            });
            setRoomForm(null);
          }}
        />
      )}

      {unitsFor && (
        <RoomUnitsModal isID={isID} room={unitsFor} onClose={() => setUnitsFor(null)} />
      )}

      {availabilityFor && (
        <RoomAvailabilityModal
          isID={isID}
          room={availabilityFor}
          onClose={() => setAvailabilityFor(null)}
        />
      )}

      {roomDetailFor && (
        <RoomDetailModal isID={isID} room={roomDetailFor} onClose={() => setRoomDetailFor(null)} />
      )}

      {hotelDetailFor && (
        <HotelMediaModal isID={isID} hotel={hotelDetailFor} onClose={() => setHotelDetailFor(null)} />
      )}
    </AdminAccessGuard>
  );
};
