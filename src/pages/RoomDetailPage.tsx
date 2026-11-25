import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Baby, BedDouble, CalendarDays, MapPin, Maximize2, SearchX, ShieldCheck, UsersRound,
  type LucideIcon,
} from 'lucide-react';
import type { Hotel, Language, RoomType } from '../types';
import type { RoomCompositionResponse } from '../types/api';
import { mapPolicyGroupsToUI } from '../lib/adapters';
import { formatCurrency } from '../lib/utils';
import { refundTerms } from '../components/hotels/detail/policyLabels';
import { useRoomDetail } from '../components/rooms/useRoomDetail';
import { RoomGallery } from '../components/rooms/RoomGallery';
import { RoomDetailGrid } from '../components/rooms/RoomDetailGrid';

interface RoomDetailPageProps {
  hotels: Hotel[];
  language: Language;
  onBook: (hotel: Hotel, room: RoomType) => void;
}

const bookingButton = 'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl px-3.5 text-center text-sm font-bold leading-tight motion-safe:transition-colors sm:px-5';

export function RoomDetailPage({ hotels, language, onBook }: RoomDetailPageProps) {
  const isID = language === 'ID';
  const navigate = useNavigate();
  const location = useLocation();
  const { hotelId, roomId } = useParams<{ hotelId: string; roomId: string }>();
  const canonicalRoomId = roomId?.match(/^(\d+)\.$/)?.[1];
  const hotel = hotels.find(item => item.id === hotelId);
  const room = canonicalRoomId ? undefined : hotel?.rooms.find(item => item.id === roomId);
  const { gallery, galleryLoading, illustrated, policies, composition, amenityGroups, specialPrices, availableToday, loading } = useRoomDetail(room);

  if (canonicalRoomId && hotelId) {
    return <Navigate replace state={location.state} to={{ pathname: `/hotel/${encodeURIComponent(hotelId)}/room/${canonicalRoomId}`, search: location.search, hash: location.hash }} />;
  }

  if (!hotel || !room) {
    return (
      <div className="room-detail-page mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 rounded-[24px] border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
        <span className="grid size-14 place-items-center rounded-2xl border border-[#eedec1] bg-[#faf3e5] text-gold-dark"><SearchX className="size-6" aria-hidden /></span>
        <h1 className="font-serif text-3xl leading-tight text-[#172953]">{isID ? 'Kamar tidak ditemukan' : 'Room not found'}</h1>
        <p className="max-w-xs text-sm leading-6 text-slate-600">{isID ? 'Coba pilih kamar lain dari daftar penginapan.' : 'Choose another room from the available stays.'}</p>
        <Link to="/explore" className={bookingButton + ' mt-1 bg-[#172953] text-white hover:bg-navy'}>
          <ArrowLeft className="size-4" aria-hidden />{isID ? 'Jelajahi penginapan' : 'Explore stays'}
        </Link>
      </div>
    );
  }

  const groupedPolicies = policies.length ? mapPolicyGroupsToUI(policies) : (room.policies ?? []);
  const compositionByArea = composition.reduce<Record<string, RoomCompositionResponse[]>>((areas, item) => {
    (areas[item.areaType] ||= []).push(item);
    return areas;
  }, {});
  const goBack = () => (location.key === 'default' || window.history.state?.idx === 0 ? navigate('/explore') : navigate(-1));
  const size = room.size.replace(/\bsqm\b/gi, 'm²').replace(/\bsqft\b/gi, 'ft²');
  const beds = room.bedType.replace(/\bBeds?\b/gi, word => isID ? 'ranjang' : word.toLowerCase());
  const stats: { icon: LucideIcon; label: string; value: string }[] = [
    ...(room.size !== '—' ? [{ icon: Maximize2, label: isID ? 'Luas kamar' : 'Room size', value: size }] : []),
    { icon: BedDouble, label: isID ? 'Tempat tidur' : 'Beds', value: beds },
    { icon: UsersRound, label: isID ? 'Kapasitas' : 'Sleeps', value: `${room.maxOccupancy} ${isID ? 'tamu' : room.maxOccupancy === 1 ? 'guest' : 'guests'}` },
    ...(room.capacityAdult !== undefined ? [{
      icon: Baby,
      label: isID ? 'Dewasa & anak' : 'Adults & children',
      value: [
        `${room.capacityAdult} ${isID ? 'dewasa' : room.capacityAdult === 1 ? 'adult' : 'adults'}`,
        ...(room.capacityChild ? [`${room.capacityChild} ${isID ? 'anak' : room.capacityChild === 1 ? 'child' : 'children'}`] : []),
      ].join(' · '),
    }] : []),
  ];
  const policy = groupedPolicies.find(group => group.policyType === 'REFUND')?.items[0];
  const refund = policy ? refundTerms(policy, isID) : '';
  const price = formatCurrency(room.pricePerNight);
  const perNight = isID ? 'malam' : 'night';
  const place = hotel.location || hotel.city;
  const bookLabel = isID ? 'Pesan sekarang' : 'Book now';
  const available = availableToday !== null && availableToday > 0;
  const stock = availableToday === null ? null
    : available ? (isID ? `${availableToday} kamar tersedia hari ini`
      : `${availableToday} ${availableToday === 1 ? 'room' : 'rooms'} available today`)
      : (isID ? 'Penuh hari ini' : 'Sold out today');

  return (
    <div className="room-detail-page mx-auto max-w-[1280px] lg:pb-12" data-room-detail>
      <header className="mb-5 sm:mb-7">
        <button type="button" onClick={goBack}
          className="group -ml-2 mb-2 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-700 hover:bg-navy-soft hover:text-navy-dark sm:mb-3">
          <ArrowLeft className="size-4 motion-safe:transition-transform motion-safe:group-hover:-translate-x-0.5" aria-hidden />{isID ? 'Kembali' : 'Back'}
        </button>
        <h1 className="font-serif text-[clamp(2rem,4.9vw,3.7rem)] leading-[1.1] tracking-[-0.04em] text-[#172953] [overflow-wrap:anywhere]">{room.name}</h1>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm leading-5 sm:mt-3 sm:text-[15px]">
          <span className="font-bold text-[#243b64] [overflow-wrap:anywhere]">{hotel.name}</span>
          {place && <span className="flex min-w-0 items-center gap-1.5 text-slate-600 [overflow-wrap:anywhere]"><MapPin className="size-4 shrink-0 text-gold" aria-hidden />{place}</span>}
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-7 xl:grid-cols-[minmax(0,1fr)_350px] xl:gap-9">
        <div className="min-w-0 space-y-5 sm:space-y-6">
          <RoomGallery key={room.id} gallery={gallery} roomName={room.name} isID={isID} loading={galleryLoading} illustrated={illustrated} />

          <dl className={`grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 ${stats.length === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`} data-room-stats>
            {stats.map(({ icon: Icon, label, value }) => (
              <div key={label} className="min-w-0 bg-white px-3 py-3.5 sm:px-4 sm:py-4">
                <dt className="flex items-center gap-2 text-xs font-medium leading-4 text-slate-600">
                  <Icon className="size-4 shrink-0 text-[#93641f]" aria-hidden />{label}
                </dt>
                <dd className="mt-1.5 text-sm font-bold leading-5 text-[#172953] [overflow-wrap:anywhere] sm:text-[15px]">{value}</dd>
              </div>
            ))}
          </dl>

          {room.description && (
            <section className="rounded-[22px] border border-slate-200 bg-white px-4 py-5 sm:px-6 sm:py-6" aria-labelledby="room-overview-title">
              <h2 id="room-overview-title" className="font-serif text-[25px] leading-tight tracking-tight text-[#172953] sm:text-[28px]">
                {isID ? 'Tentang kamar ini' : 'About this room'}
              </h2>
              <p className="mt-2.5 max-w-[66ch] text-[15px] leading-7 whitespace-pre-line text-slate-700 [overflow-wrap:anywhere] sm:text-base">{room.description}</p>
            </section>
          )}

          <RoomDetailGrid isID={isID} loading={loading} compositionByArea={compositionByArea}
            amenityGroups={amenityGroups} groupedPolicies={groupedPolicies} specialPrices={specialPrices} />
        </div>

        <aside className="hidden lg:sticky lg:top-[89px] lg:block" aria-label={isID ? 'Pemesanan kamar' : 'Book this room'}>
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_15px_35px_rgba(15,35,68,0.12)]" data-room-booking-card>
            <div className="bg-[#172953] px-5 py-5 text-white xl:px-6">
              <p className="text-sm font-semibold text-gold-soft">{isID ? 'Tarif dasar per malam' : 'Base rate per night'}</p>
              {!!room.originalPrice && <p className="mt-2 text-sm text-white/75 line-through">{formatCurrency(room.originalPrice)}</p>}
              <p className="mt-1.5 text-[clamp(1.6rem,3vw,2.25rem)] font-bold leading-tight tracking-tight tabular-nums [overflow-wrap:anywhere]">{price}</p>
              {!!room.discountPercentage && <span className="mt-2 inline-block rounded-lg bg-white/15 px-2 py-1 text-xs font-bold text-white">-{room.discountPercentage}%</span>}
            </div>
            <div className="space-y-4 p-5 xl:p-6">
              {loading ? (
                <span role="status" className="block h-7 w-3/4 rounded-full bg-navy-soft motion-safe:animate-pulse"><span className="sr-only">{isID ? 'Memuat ketersediaan…' : 'Loading availability…'}</span></span>
              ) : stock && (
                <p className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold ${available ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                  <span className={`size-1.5 shrink-0 rounded-full ${available ? 'bg-emerald-700' : 'bg-slate-500'}`} aria-hidden />{stock}
                </p>
              )}
              <button type="button" onClick={() => onBook(hotel, room)} className={bookingButton + ' w-full bg-gold-soft text-[#172953] hover:bg-gold-light'}>
                {bookLabel}<ArrowRight className="size-4" aria-hidden />
              </button>
              <p className="flex items-start gap-2 text-sm leading-5 text-slate-600">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                {isID ? 'Tarif dan ketersediaan mengikuti tanggal menginap.' : 'Rates and availability depend on your stay dates.'}
              </p>
              {refund && (
                <p className="flex items-start gap-2 border-t border-slate-100 pt-3 text-sm leading-5 text-slate-700">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />{refund}
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="sticky bottom-0 z-40 -mx-4 mt-6 border-t border-slate-200 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(15,35,68,0.08)] backdrop-blur-xl sm:-mx-6 sm:px-6 lg:hidden" data-room-mobile-bar>
        <div className="mx-auto flex max-w-[720px] items-center justify-between gap-2.5">
          <div className="min-w-0">
            <p className="flex flex-wrap items-baseline gap-x-1 text-[#172953]">
              <span className="text-[clamp(1rem,5.1vw,1.35rem)] font-bold leading-6 tracking-tight tabular-nums [overflow-wrap:anywhere]">{price}</span>
              <span className="text-xs text-slate-600">/ {perNight}</span>
            </p>
            {stock && <p className={`mt-0.5 text-xs font-semibold leading-4 ${available ? 'text-emerald-800' : 'text-slate-600'}`}>{stock}</p>}
          </div>
          <button type="button" onClick={() => onBook(hotel, room)} className={bookingButton + ' shrink-0 bg-[#172953] text-white hover:bg-navy'}>{bookLabel}</button>
        </div>
      </div>
    </div>
  );
}
