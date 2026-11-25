import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowLeft, ArrowRight, BedDouble, Building2, CalendarRange, DoorOpen, Image as ImageIcon, KeyRound,
  LoaderCircle, MapPin, Pencil, Plus, Search, SlidersHorizontal, Star, Trash2, UsersRound,
} from 'lucide-react';
import { adminApi } from '../api/admin';
import { AdminAccessGuard } from '../components/admin/AdminAccessGuard';
import { AdminCardsSkeleton } from '../components/admin/AdminSkeleton';
import { HotelFormModal } from '../components/admin/HotelFormModal';
import { HotelMediaModal } from '../components/admin/HotelMediaModal';
import { OperationsDialog } from '../components/admin/OperationsDialog';
import {
  OperationsEmpty, OperationsNotice, OperationsPage, OperationsPager, operationButton, operationDanger,
  operationField, operationPanel, operationPrimary, operationSecondary,
} from '../components/admin/OperationsPage';
import { RoomAvailabilityModal } from '../components/admin/RoomAvailabilityModal';
import { RoomDetailModal } from '../components/admin/RoomDetailModal';
import { RoomFormModal } from '../components/admin/RoomFormModal';
import { RoomUnitsModal } from '../components/admin/RoomUnitsModal';
import { StatusPill } from '../components/admin/StatusPill';
import { useAuth } from '../context/AuthContext';
import { useOperationsQuery } from '../hooks/useOperationsQuery';
import { ApiError } from '../lib/http';
import { formatCurrency } from '../lib/utils';
import type { Language } from '../types';
import type { HotelResponse, HotelStatus, PropertyType } from '../types/api/hotel';
import type { RoomResponse } from '../types/api/room';

const propertyLabels: Record<PropertyType, [string, string]> = {
  HOTEL: ['Hotel', 'Hotel'], VILLA: ['Vila', 'Villa'], APARTMENT: ['Apartemen', 'Apartment'],
};
const statusLabels: Record<HotelStatus, [string, string]> = {
  ACTIVE: ['Aktif', 'Active'], INACTIVE: ['Nonaktif', 'Inactive'],
  UNDER_MAINTENANCE: ['Dalam perawatan', 'Under maintenance'], DELETED: ['Dihapus', 'Deleted'],
};
const emptyFilters = { keyword: '', status: '' as HotelStatus | '', propertyType: '' as PropertyType | '' };
type Dialog =
  | { kind: 'hotelForm'; hotel: HotelResponse | null }
  | { kind: 'roomForm'; hotel: HotelResponse; room: RoomResponse | null }
  | { kind: 'hotelMedia'; hotel: HotelResponse }
  | { kind: 'units' | 'inventory' | 'roomDetails'; room: RoomResponse }
  | { kind: 'deleteHotel'; hotel: HotelResponse }
  | { kind: 'deleteRoom'; room: RoomResponse };

const manageAction = operationSecondary + ' w-full justify-start';
const propertyLocation = (hotel: HotelResponse) => [hotel.city, hotel.province].filter(Boolean).join(', ') || '—';

function PropertyPhoto({ url }: { url: string | null }) {
  const [unavailable, setUnavailable] = useState(false);
  return (
    <div className="relative grid aspect-[2.4] place-items-center overflow-hidden bg-[#e9eef5]">
      {url && !unavailable
        ? <img src={url} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" onError={() => setUnavailable(true)} />
        : <Building2 className="size-9 text-[#5a6f93]" strokeWidth={1.25} aria-hidden />}
    </div>
  );
}

function RoomCard({ room, hotel, isID, onOpen }: { room: RoomResponse; hotel: HotelResponse; isID: boolean; onOpen: (dialog: Dialog) => void }) {
  return (
    <li className={operationPanel + ' flex flex-col gap-4 p-4'}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 text-lg font-semibold leading-tight text-navy-dark [overflow-wrap:anywhere]">{room.roomName}</h3>
        <StatusPill status={room.status} label={statusLabels[room.status]?.[isID ? 0 : 1]} />
      </div>
      <div className="space-y-2">
        <p className="text-xl font-bold text-navy-dark tabular-nums">{formatCurrency(room.basePrice)}
          <span className="ml-1 text-sm font-normal text-slate-600">/ {isID ? 'malam' : 'night'}</span>
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
          <span className="inline-flex items-center gap-1.5"><UsersRound className="size-4 text-slate-500" aria-hidden />{room.maxOccupancy} {isID ? 'tamu' : 'guests'}</span>
          <span className="inline-flex items-center gap-1.5"><BedDouble className="size-4 text-slate-500" aria-hidden />{room.totalBeds} {isID ? 'tempat tidur' : 'beds'}</span>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <button type="button" onClick={() => onOpen({ kind: 'units', room })} className={operationSecondary}>
          <KeyRound className="size-4" aria-hidden />{isID ? 'Unit fisik' : 'Physical units'}
        </button>
        <button type="button" onClick={() => onOpen({ kind: 'inventory', room })} className={operationSecondary}>
          <CalendarRange className="size-4" aria-hidden />{isID ? 'Inventaris' : 'Inventory'}
        </button>
        <button type="button" onClick={() => onOpen({ kind: 'roomDetails', room })} className={operationSecondary}>
          <SlidersHorizontal className="size-4" aria-hidden />{isID ? 'Detail kamar' : 'Room details'}
        </button>
        <button type="button" onClick={() => onOpen({ kind: 'roomForm', hotel, room })} className={operationSecondary}>
          <Pencil className="size-4" aria-hidden />{isID ? 'Ubah' : 'Edit'}
        </button>
        <button type="button" onClick={() => onOpen({ kind: 'deleteRoom', room })} aria-label={isID ? `Hapus kamar ${room.roomName}` : `Delete room ${room.roomName}`}
          className={operationDanger + ' w-11 px-0'}>
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}

export function AdminHotelsPage({ language, onOpenAuth }: { language: Language; onOpenAuth?: () => void }) {
  const isID = language === 'ID';
  const locale = isID ? 0 : 1;
  const { user, isLoading: authLoading } = useAuth();
  const allowed = user?.role === 'ADMIN';
  const [filters, setFilters] = useState(emptyFilters);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedHotel, setSelectedHotel] = useState<HotelResponse | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const selectedId = selectedHotel?.id;
  const heading = useRef<HTMLHeadingElement>(null);
  const previousId = useRef(selectedId);
  useEffect(() => {
    if (previousId.current !== selectedId) heading.current?.focus();
    previousId.current = selectedId;
  }, [selectedId]);

  const readHotels = useCallback(() => adminApi.listHotels(page, 9, {
    keyword: filters.keyword || undefined,
    status: filters.status || undefined,
    propertyType: filters.propertyType || undefined,
  }), [page, filters, user?.userId]);
  const readRooms = useCallback(() => selectedId == null ? Promise.resolve([]) : adminApi.listRooms(selectedId), [selectedId, user?.userId]);
  const hotels = useOperationsQuery(readHotels, allowed && selectedId == null, isID ? 'Gagal memuat properti.' : 'Could not load properties.');
  const rooms = useOperationsQuery(readRooms, allowed && selectedId != null, isID ? 'Gagal memuat kamar.' : 'Could not load rooms.');
  const totalPages = hotels.data?.page.totalPages;

  useEffect(() => {
    if (totalPages !== undefined && page > 0 && page >= totalPages) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const searchHotels = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keyword = search.trim();
    setSearch(keyword);
    if (keyword === filters.keyword) return;
    setPage(0);
    setFilters({ ...filters, keyword });
  };

  const openDialog = (value: Dialog) => {
    setActionError(null);
    setDialog(value);
  };
  const closeDialog = () => setDialog(null);

  const remove = async () => {
    if (!dialog || deleting || (dialog.kind !== 'deleteHotel' && dialog.kind !== 'deleteRoom')) return;
    setDeleting(true);
    setActionError(null);
    setNotice(null);
    try {
      if (dialog.kind === 'deleteHotel') {
        await adminApi.deleteHotel(dialog.hotel.id);
        setSelectedHotel(null);
        setNotice(isID ? 'Properti dihapus.' : 'Property deleted.');
      } else {
        await adminApi.deleteRoom(dialog.room.id);
        setNotice(isID ? 'Tipe kamar dihapus.' : 'Room type deleted.');
        void rooms.refresh();
      }
      closeDialog();
    } catch (failure) {
      setActionError(failure instanceof ApiError ? failure.message : (isID ? 'Penghapusan gagal.' : 'Could not delete this record.'));
    } finally {
      setDeleting(false);
    }
  };

  if (!allowed) {
    if (authLoading) return <OperationsEmpty loading isID={isID} empty="" />;
    return <AdminAccessGuard isID={isID} onOpenAuth={onOpenAuth}>{null}</AdminAccessGuard>;
  }

  const error = selectedHotel ? rooms.error : hotels.error;
  const hasFilters = !!(filters.keyword || filters.status || filters.propertyType);
  const loading = selectedHotel ? rooms.loading : hotels.loading;
  const deleteLabel = dialog?.kind === 'deleteHotel' ? (isID ? 'Hapus properti' : 'Delete property') : (isID ? 'Hapus tipe kamar' : 'Delete room type');

  return (
    <OperationsPage icon={Building2} title={isID ? 'Properti & Kamar' : 'Properties & Rooms'} image="/images/seed/hotels/plataran-borobudur.jpg"
      description={isID ? 'Kelola katalog properti, tipe kamar, dan unit fisik.' : 'Manage properties, room types, and physical room units.'}
      isID={isID} loading={loading} blocked={!!dialog} onRefresh={() => void (selectedHotel ? rooms.refresh() : hotels.refresh())}
      action={!selectedHotel && <button type="button" onClick={() => openDialog({ kind: 'hotelForm', hotel: null })}
        className={operationButton + ' bg-gold-soft text-[#162951] hover:bg-white'}><Plus className="size-4" aria-hidden />{isID ? 'Tambah properti' : 'Add property'}</button>}>

      {error && <OperationsNotice>{error}</OperationsNotice>}
      {notice && <OperationsNotice success>{notice}</OperationsNotice>}

      {selectedHotel ? (
        <>
          <div className={operationPanel + ' p-4 sm:p-5'}>
            <button type="button" onClick={() => { setSelectedHotel(null); setNotice(null); }} className={operationSecondary}>
              <ArrowLeft className="size-4" aria-hidden />{isID ? 'Daftar properti' : 'Property list'}
            </button>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 ref={heading} tabIndex={-1} className="scroll-mt-36 text-2xl font-semibold text-navy-dark outline-none [overflow-wrap:anywhere]">{selectedHotel.name}</h2>
                  <StatusPill status={selectedHotel.status} label={statusLabels[selectedHotel.status]?.[locale]} />
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600 [overflow-wrap:anywhere]"><MapPin className="size-4 shrink-0" aria-hidden />{propertyLocation(selectedHotel)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => openDialog({ kind: 'hotelMedia', hotel: selectedHotel })} className={operationSecondary}>
                  <ImageIcon className="size-4" aria-hidden />{isID ? 'Foto & fasilitas' : 'Photos & facilities'}
                </button>
                <button type="button" onClick={() => openDialog({ kind: 'hotelForm', hotel: selectedHotel })} className={operationSecondary}>
                  <Pencil className="size-4" aria-hidden />{isID ? 'Ubah properti' : 'Edit property'}
                </button>
                <button type="button" onClick={() => openDialog({ kind: 'deleteHotel', hotel: selectedHotel })} className={operationDanger}>
                  <Trash2 className="size-4" aria-hidden />{isID ? 'Hapus properti' : 'Delete property'}
                </button>
              </div>
            </div>
          </div>

          <section aria-labelledby="property-rooms" aria-busy={rooms.loading} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 id="property-rooms" className="text-xl font-semibold text-navy-dark">{isID ? 'Tipe kamar' : 'Room types'}</h2>
                {rooms.data && <p className="mt-0.5 text-sm text-slate-600">{rooms.data.length} {isID ? 'tipe terdaftar' : 'room types'}</p>}
              </div>
              <button type="button" onClick={() => openDialog({ kind: 'roomForm', hotel: selectedHotel, room: null })} className={operationPrimary}>
                <Plus className="size-4" aria-hidden />{isID ? 'Tambah tipe kamar' : 'Add room type'}
              </button>
            </div>
            {rooms.data?.length ? (
              <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {rooms.data.map(room => <RoomCard key={room.id} room={room} hotel={selectedHotel} isID={isID} onOpen={openDialog} />)}
              </ul>
            ) : rooms.loading ? <AdminCardsSkeleton isID={isID} layout="rooms" /> : (
              <div className={operationPanel}>
                <OperationsEmpty loading={false} isID={isID} empty={rooms.error
                  ? (isID ? 'Daftar tipe kamar belum tersedia.' : 'Room types are unavailable.')
                  : (isID ? 'Properti ini belum memiliki tipe kamar.' : 'This property has no room types yet.')} />
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="space-y-4" aria-labelledby="property-list" aria-busy={hotels.loading}>
          <div className={operationPanel + ' space-y-3 px-4 py-4 sm:px-5'}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id="property-list" ref={heading} tabIndex={-1} className="scroll-mt-36 text-xl font-semibold text-navy-dark outline-none">{isID ? 'Daftar properti' : 'Property list'}</h2>
              {hotels.data && <p className="text-sm font-medium text-slate-600">{hotels.data.page.totalElements.toLocaleString(isID ? 'id-ID' : 'en-US')} {isID ? 'properti ditemukan' : 'properties found'}</p>}
            </div>
            <form onSubmit={searchHotels} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(160px,auto)_minmax(160px,auto)]">
              <div className="flex min-w-0 gap-2 sm:col-span-2 lg:col-span-1">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">{isID ? 'Cari nama properti' : 'Search by property name'}</span>
                  <Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-slate-500" aria-hidden />
                  <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={isID ? 'Cari nama properti…' : 'Search property name…'}
                    className={operationField + ' pl-9'} />
                </label>
                <button type="submit" className={operationSecondary}>{isID ? 'Cari' : 'Search'}</button>
              </div>
              <select aria-label={isID ? 'Tipe properti' : 'Property type'} value={filters.propertyType} className={operationField + ' bg-white'}
                onChange={event => { setPage(0); setFilters({ ...filters, propertyType: event.target.value as PropertyType | '' }); }}>
                <option value="">{isID ? 'Semua tipe' : 'All types'}</option>
                {Object.entries(propertyLabels).map(([value, pair]) => <option key={value} value={value}>{pair[locale]}</option>)}
              </select>
              <select aria-label={isID ? 'Status properti' : 'Property status'} value={filters.status} className={operationField + ' bg-white'}
                onChange={event => { setPage(0); setFilters({ ...filters, status: event.target.value as HotelStatus | '' }); }}>
                <option value="">{isID ? 'Semua status' : 'All statuses'}</option>
                {(['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE'] as const).map(value => <option key={value} value={value}>{statusLabels[value][locale]}</option>)}
              </select>
            </form>
            {hasFilters && <button type="button" onClick={() => { setPage(0); setSearch(''); setFilters(emptyFilters); }} className={operationSecondary}>
              {isID ? 'Atur ulang filter' : 'Reset filters'}
            </button>}
          </div>

          {hotels.data?.content.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {hotels.data.content.map(hotel => (
                <li key={hotel.id} className={operationPanel + ' flex flex-col overflow-hidden'}>
                  <PropertyPhoto key={hotel.thumbnailUrl} url={hotel.thumbnailUrl} />
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          {hotel.propertyType && propertyLabels[hotel.propertyType]?.[locale]}
                          {hotel.starRating > 0 && <span className="inline-flex items-center gap-0.5 text-[#80571b]">
                            <Star className="size-3.5 fill-current" aria-hidden />{hotel.starRating}
                            <span className="sr-only">{isID ? 'bintang' : 'stars'}</span>
                          </span>}
                        </span>
                        <StatusPill status={hotel.status} label={statusLabels[hotel.status]?.[locale]} />
                      </div>
                      <h3 className="mt-2 text-xl font-semibold leading-tight text-navy-dark [overflow-wrap:anywhere]">{hotel.name}</h3>
                      <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-600 [overflow-wrap:anywhere]"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />{propertyLocation(hotel)}</p>
                    </div>
                    <dl className="mt-auto grid grid-cols-2 gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                      <div><dt className="text-xs text-slate-600">Check-in</dt><dd className="font-semibold text-navy-dark tabular-nums">{hotel.checkInTime?.slice(0, 5) || '—'}</dd></div>
                      <div><dt className="text-xs text-slate-600">Check-out</dt><dd className="font-semibold text-navy-dark tabular-nums">{hotel.checkOutTime?.slice(0, 5) || '—'}</dd></div>
                    </dl>
                    <button type="button" onClick={() => { setSelectedHotel(hotel); setNotice(null); }} className={manageAction}
                      aria-label={isID ? `Kelola properti ${hotel.name}` : `Manage property ${hotel.name}`}>
                      <DoorOpen className="size-4" aria-hidden />{isID ? 'Kelola properti' : 'Manage property'}<ArrowRight className="ml-auto size-4" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : hotels.loading ? <AdminCardsSkeleton isID={isID} layout="properties" /> : (
            <div className={operationPanel}>
              <OperationsEmpty loading={false} isID={isID}
                empty={error ? (isID ? 'Daftar properti belum tersedia.' : 'Properties are unavailable.')
                  : hasFilters ? (isID ? 'Tidak ada properti yang cocok dengan filter.' : 'No properties match these filters.')
                    : (isID ? 'Belum ada properti terdaftar.' : 'No properties registered yet.')} />
            </div>
          )}

          <OperationsPager page={page} totalPages={totalPages ?? 0} isID={isID} disabled={hotels.loading} onChange={setPage} />
        </section>
      )}

      {dialog?.kind === 'hotelForm' && <HotelFormModal isID={isID} hotel={dialog.hotel} onClose={closeDialog}
        onSaved={(saved, isNew) => {
          if (selectedId === saved.id) setSelectedHotel(saved);
          else void hotels.refresh();
          closeDialog();
          setNotice(isNew ? (isID ? 'Properti ditambahkan.' : 'Property added.') : (isID ? 'Perubahan properti disimpan.' : 'Property changes saved.'));
        }} />}
      {dialog?.kind === 'roomForm' && <RoomFormModal isID={isID} hotelId={dialog.hotel.id} hotelName={dialog.hotel.name} room={dialog.room} onClose={closeDialog}
        onSaved={(_saved, isNew) => {
          closeDialog();
          setNotice(isNew ? (isID ? 'Tipe kamar ditambahkan.' : 'Room type added.') : (isID ? 'Perubahan tipe kamar disimpan.' : 'Room changes saved.'));
          void rooms.refresh();
        }} />}
      {dialog?.kind === 'hotelMedia' && <HotelMediaModal isID={isID} hotel={dialog.hotel} onClose={closeDialog} />}
      {dialog?.kind === 'units' && <RoomUnitsModal isID={isID} room={dialog.room} onClose={closeDialog} />}
      {dialog?.kind === 'inventory' && <RoomAvailabilityModal isID={isID} room={dialog.room} onClose={closeDialog} />}
      {dialog?.kind === 'roomDetails' && <RoomDetailModal isID={isID} room={dialog.room} onClose={closeDialog} />}
      {(dialog?.kind === 'deleteHotel' || dialog?.kind === 'deleteRoom') && (
        <OperationsDialog title={deleteLabel} description={dialog.kind === 'deleteHotel' ? dialog.hotel.name : dialog.room.roomName}
          isID={isID} busy={deleting} onClose={closeDialog}>
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-700">{dialog.kind === 'deleteHotel'
              ? (isID ? 'Hapus properti ini? Kamar dan reservasi yang terkait dapat terpengaruh.' : 'Delete this property? Linked rooms and reservations may be affected.')
              : (isID ? 'Hapus tipe kamar ini dari katalog properti?' : 'Delete this room type from the property catalog?')}</p>
            {actionError && <OperationsNotice>{actionError}</OperationsNotice>}
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" disabled={deleting} onClick={closeDialog} className={operationSecondary}>{isID ? 'Batal' : 'Cancel'}</button>
              <button type="button" disabled={deleting} onClick={() => void remove()} className={operationDanger}>
                {deleting && <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />}{deleteLabel}
              </button>
            </div>
          </div>
        </OperationsDialog>
      )}
    </OperationsPage>
  );
}
