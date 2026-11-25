import { CalendarDays, MapPin, UsersRound } from 'lucide-react';
import type { Hotel, RoomType } from '../../types';
import type { BookingQuoteResponse } from '../../types/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { applyImageFallback } from '../../lib/imageFallback';

interface BookingSummaryProps {
  isID: boolean;
  hotel: Hotel;
  room: RoomType;
  roomPhoto?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  quote?: BookingQuoteResponse | null;
}

export const formatGuests = (adults: number, children: number, isID: boolean) => [
  `${adults} ${isID ? 'dewasa' : adults === 1 ? 'adult' : 'adults'}`,
  ...(children > 0 ? [`${children} ${isID ? 'anak' : children === 1 ? 'child' : 'children'}`] : []),
].join(' · ');

export const formatNights = (nights: number, isID: boolean) => `${nights} ${isID ? 'malam' : nights === 1 ? 'night' : 'nights'}`;

export function BookingSummary({
  isID, hotel, room, roomPhoto, checkIn, checkOut, nights, adults, children, quote,
}: BookingSummaryProps) {
  const lang = isID ? 'ID' : 'EN';
  const hasDates = nights > 0;
  const photo = roomPhoto || hotel.image;
  const location = hotel.location || hotel.city;
  const guests = formatGuests(adults, children, isID);
  const chooseDate = isID ? 'Pilih tanggal' : 'Select a date';
  const formatStayDate = (date: string) => date ? formatDate(date, lang) : chooseDate;
  const baseRate = formatCurrency(room.pricePerNight);
  const perNight = isID ? 'malam' : 'night';

  return (
    <aside className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,35,68,0.06)] lg:rounded-[24px]" aria-label={isID ? 'Ringkasan reservasi' : 'Booking summary'} data-checkout-summary>
      <div className="flex items-center gap-3 p-2.5 lg:block lg:p-0">
        <div className="relative size-[62px] shrink-0 overflow-hidden rounded-xl bg-navy-soft lg:aspect-[16/9] lg:h-auto lg:w-full lg:rounded-none">
          <img key={photo} src={photo} alt="" onError={applyImageFallback} className="absolute inset-0 size-full object-cover" />
        </div>

        <div className="min-w-0 flex-1 lg:px-5 lg:pb-4 lg:pt-4 xl:px-6">
          <h2 className="font-serif text-lg leading-tight tracking-tight text-navy-dark [overflow-wrap:anywhere] lg:text-[27px]">{room.name}</h2>
          <p className="mt-0.5 text-xs font-semibold leading-4 text-slate-700 [overflow-wrap:anywhere] lg:mt-1 lg:text-sm lg:leading-5">{hotel.name}</p>
          {location && (
            <p className="mt-1.5 hidden items-start gap-1.5 text-sm leading-5 text-slate-600 lg:flex">
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold-dark" aria-hidden />
              <span className="min-w-0 [overflow-wrap:anywhere]">{location}</span>
            </p>
          )}
          <p className="mt-1 text-xs font-semibold leading-4 text-navy-dark lg:hidden">
            {hasDates ? `${formatNights(nights, isID)} · ${guests}` : `${baseRate} / ${perNight}`}
          </p>
        </div>
      </div>

      <div className="hidden px-5 pb-4 lg:block xl:px-6">
        <dl className="grid grid-cols-2 gap-x-3 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-slate-600">Check-in</dt>
            <dd className="mt-0.5 text-sm font-bold text-navy-dark">{formatStayDate(checkIn)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-slate-600">Check-out</dt>
            <dd className="mt-0.5 text-sm font-bold text-navy-dark">{formatStayDate(checkOut)}</dd>
          </div>
          <div className="col-span-2 border-t border-slate-200 pt-2.5 text-sm text-slate-700">
            <dt className="sr-only">{isID ? 'Durasi dan tamu' : 'Length of stay and guests'}</dt>
            <dd className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {hasDates && <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5 shrink-0 text-gold-dark" aria-hidden />{formatNights(nights, isID)}</span>}
              <span className="inline-flex items-center gap-1.5"><UsersRound className="size-4 shrink-0 text-gold-dark" aria-hidden />{guests}</span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="hidden bg-navy-dark px-5 py-4 text-white lg:block xl:px-6" aria-live="polite">
        <p className="text-xs font-bold text-gold-soft">
          {hasDates ? (isID ? 'Total untuk tanggal terpilih' : 'Total for selected dates') : (isID ? 'Tarif dasar per malam' : 'Base rate per night')}
        </p>
        <p className="mt-0.5 text-[25px] font-bold leading-tight tracking-tight tabular-nums [overflow-wrap:anywhere]" data-checkout-estimate>
          {quote ? formatCurrency(quote.totalAmount) : hasDates ? '—' : baseRate}
        </p>
        {hasDates && !quote && (
          <p className="mt-2 text-xs leading-4 text-white/85">
            {quote === null
              ? (isID ? 'Tarif belum tersedia. Coba lagi di langkah tinjauan.' : 'Could not load the rates. Retry on the review step.')
              : (isID ? 'Memuat tarif per malam…' : 'Loading nightly rates…')}
          </p>
        )}
      </div>
    </aside>
  );
}
