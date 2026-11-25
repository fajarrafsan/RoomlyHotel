import React, { useId } from 'react';
import { ArrowUpRight, Heart, MapPin, Star } from 'lucide-react';
import { Hotel, Language, RoomType } from '../../types';
import { applyImageFallback } from '../../lib/imageFallback';

interface ExploreHotelCardProps {
  hotel: Hotel;
  previewRoom?: RoomType;
  isWishlisted: boolean;
  onToggleWishlist: (id: string) => void;
  onSelect: (hotel: Hotel) => void;
  language: Language;
  layout: 'grid' | 'list';
}

const categoryNamesID: Record<string, string> = {
  Villa: 'Vila',
  Apartment: 'Apartemen',
  Resort: 'Resor',
  Boutique: 'Butik',
  Business: 'Bisnis',
  Luxury: 'Mewah',
};

export function ExploreHotelCard({ hotel, previewRoom, isWishlisted, onToggleWishlist, onSelect, language, layout }: ExploreHotelCardProps) {
  const isID = language === 'ID';
  const isList = layout === 'list';
  const titleId = useId();
  const locale = isID ? 'id-ID' : 'en-US';
  const room = previewRoom ?? hotel.rooms.filter(item => Number.isFinite(item.pricePerNight) && item.pricePerNight > 0)
    .reduce<RoomType | undefined>((lowest, item) => !lowest || item.pricePerNight < lowest.pricePerNight ? item : lowest, undefined);
  const amount = room?.pricePerNight ?? hotel.pricePerNight;
  const price = Number.isFinite(amount) && amount > 0
    ? new Intl.NumberFormat(locale, { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
    : null;
  const hasRating = Number.isFinite(hotel.rating) && hotel.rating > 0 && hotel.reviewsCount > 0;
  const hasStars = Number.isInteger(hotel.stars) && hotel.stars > 0 && hotel.stars <= 5;
  const category = isID ? categoryNamesID[hotel.category] || hotel.category : hotel.category;
  const location = hotel.location || [hotel.city, hotel.province].filter(Boolean).join(', ');
  const size = room && parseFloat(room.size) > 0 ? room.size.replace(/\bsqm\b/gi, 'm²').replace(/\bsqft\b/gi, 'ft²') : null;
  const guests = room && Number.isFinite(room.maxOccupancy) && room.maxOccupancy > 0
    ? `${room.maxOccupancy} ${isID ? 'tamu' : room.maxOccupancy === 1 ? 'guest' : 'guests'}`
    : null;
  const beds = room?.bedType && room.bedType !== '—' && !/^0\b/.test(room.bedType)
    ? room.bedType.replace(/\bBeds?\b/gi, label => isID ? 'ranjang' : label.toLowerCase())
    : null;
  const specs = [size, guests, beds].filter(Boolean).join(' · ');
  const roomTypes = hotel.rooms.length;
  const roomTypesLabel = roomTypes > 1 ? `${roomTypes} ${isID ? 'tipe kamar' : 'room types'}` : null;
  const rating = hotel.rating.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const viewRooms = isID ? 'Lihat kamar' : 'View rooms';

  return (
    <article
      className={`group relative isolate min-w-0 rounded-[22px] border border-slate-200/80 bg-white p-2 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-gold/35 hover:shadow-[0_14px_36px_rgba(21,42,102,0.1)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:rounded-[26px] ${isList ? 'grid grid-cols-[minmax(0,36%)_minmax(0,1fr)] md:grid-cols-[minmax(0,38%)_minmax(0,1fr)]' : 'flex h-full flex-col'}`}
      aria-labelledby={titleId}
      data-explore-hotel-card
      data-layout={layout}
      data-hotel-id={hotel.id}
    >
      <button
        type="button"
        onClick={() => onSelect(hotel)}
        aria-label={isID ? `Lihat kamar di ${hotel.name}` : `View rooms at ${hotel.name}`}
        className="absolute inset-0 z-10 cursor-pointer rounded-[22px] focus-visible:outline-offset-[-4px] sm:rounded-[26px]"
        data-explore-open
      />

      <div className={`relative overflow-hidden rounded-[16px] bg-slate-100 sm:rounded-[19px] ${isList ? 'min-h-[176px] md:min-h-[248px]' : 'aspect-[4/3]'}`}>
        <img
          src={hotel.image}
          alt={hotel.name}
          onError={applyImageFallback}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-950/30 to-transparent" aria-hidden />
        <span className="absolute bottom-2.5 left-2.5 inline-flex max-w-[calc(100%-1.25rem)] items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold leading-4 text-navy-dark shadow-sm">
          <span className="truncate">{category}</span>
          {hasRating && <>
            <span className="h-3 w-px shrink-0 bg-slate-200" aria-hidden />
            <span className="inline-flex shrink-0 items-center gap-1" aria-label={isID ? `Rating ${rating} dari ${hotel.reviewsCount} ulasan` : `Rated ${rating} from ${hotel.reviewsCount} reviews`}>
              <Star className="size-3 fill-gold text-gold" aria-hidden />{rating}
              <span className="font-normal text-slate-500">({hotel.reviewsCount.toLocaleString(locale)})</span>
            </span>
          </>}
        </span>
        <button
          type="button"
          aria-pressed={isWishlisted}
          aria-label={isID
            ? `${isWishlisted ? 'Hapus' : 'Simpan'} ${hotel.name} ${isWishlisted ? 'dari' : 'ke'} wishlist`
            : `${isWishlisted ? 'Remove' : 'Save'} ${hotel.name} ${isWishlisted ? 'from' : 'to'} wishlist`}
          onClick={() => onToggleWishlist(hotel.id)}
          className={`absolute z-20 flex cursor-pointer items-center justify-center rounded-full bg-white/95 shadow-sm transition-[color,background-color,transform] duration-200 hover:scale-105 hover:bg-white active:scale-95 motion-reduce:hover:scale-100 motion-reduce:active:scale-100 ${isList ? 'right-1.5 top-1.5 size-9 before:absolute before:-inset-1 md:right-2 md:top-2 md:size-11 md:before:hidden' : 'right-2 top-2 size-11'} ${isWishlisted ? 'text-rose-600' : 'text-navy-dark hover:text-rose-600'}`}
          data-explore-wishlist
        >
          <Heart className={`size-[18px] ${isWishlisted ? 'fill-current' : ''}`} aria-hidden />
        </button>
      </div>

      <div className={`pointer-events-none flex min-w-0 flex-col ${isList ? 'py-1 pl-3 pr-1.5 md:py-3 md:pl-5 md:pr-4' : 'flex-1 px-2 pb-2 pt-3 sm:px-3 sm:pb-2.5 sm:pt-3.5'}`}>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1 text-[13px] leading-5 text-slate-500">
            <MapPin className="size-3.5 shrink-0 text-gold" aria-hidden />
            <span className="truncate" title={location}>{location}</span>
          </p>
          {hasStars && (
            <span className={`shrink-0 items-center gap-0.5 text-gold ${isList ? 'hidden md:inline-flex' : 'inline-flex'}`} role="img" aria-label={isID ? `Kelas hotel bintang ${hotel.stars}` : `${hotel.stars}-star hotel`}>
              {Array.from({ length: hotel.stars }, (_, index) => <Star key={index} className="size-3 fill-current" aria-hidden />)}
            </span>
          )}
        </div>

        <h3 id={titleId} className={`mt-1 font-serif font-medium leading-[1.27] tracking-[-0.02em] text-navy-dark line-clamp-2 ${isList ? 'text-[17px] sm:text-[20px] md:text-[25px]' : 'text-[20px] sm:text-[21px]'}`}>
          {hotel.name}
        </h3>

        {isList && hotel.description && (
          <p className="mt-2 line-clamp-2 text-[13.5px] leading-[1.55] text-slate-600 max-md:hidden">{hotel.description}</p>
        )}

        <div className="mt-auto">
          {room && (
            <div className={isList ? 'pt-2 md:pt-3' : 'pt-3'} data-explore-room-preview data-room-id={room.id}>
              <div className="flex min-w-0 items-baseline justify-between gap-2">
                <p className="min-w-0 truncate text-[13px] font-semibold leading-5 text-navy-dark" title={room.name}>{room.name}</p>
                {roomTypesLabel && <span className={`shrink-0 text-xs leading-5 text-slate-500 ${isList ? 'max-md:hidden' : ''}`} data-explore-room-count>{roomTypesLabel}</span>}
              </div>
              {specs && <p className={`truncate text-xs leading-5 text-slate-500 ${isList ? 'max-sm:hidden' : ''}`} data-explore-room-specs>{specs}</p>}
            </div>
          )}

          <div className={`flex items-end justify-between gap-3 border-t border-slate-100 ${isList ? 'mt-2 pt-2 md:mt-3 md:pt-3' : 'mt-3 pt-3'}`}>
            <div className="min-w-0">
              {price ? <>
                <p className={`text-xs leading-4 text-slate-500 ${isList ? 'max-sm:hidden' : ''}`}>{isID ? 'Mulai dari' : 'From'}</p>
                <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1">
                  <span className={`font-semibold tracking-tight text-navy-dark ${isList ? 'text-[16px] leading-6 sm:text-[20px] sm:leading-7 md:text-[22px]' : 'text-[20px] leading-7'}`} data-explore-price>{price}</span>
                  <span className="text-xs text-slate-500">/ {isID ? 'malam' : 'night'}</span>
                </p>
              </> : <p className="flex min-h-10 items-center text-sm font-medium text-slate-500" data-explore-price>{isID ? 'Harga belum tersedia' : 'Price unavailable'}</p>}
            </div>
            {isList && (
              <span className="hidden min-h-11 shrink-0 items-center gap-2 rounded-full bg-navy-soft/70 px-4 text-[13px] font-semibold text-navy-dark transition-colors duration-200 group-hover:bg-navy-dark group-hover:text-white md:inline-flex" aria-hidden>
                {viewRooms}<ArrowUpRight className="size-4" />
              </span>
            )}
            <span className={`size-10 shrink-0 items-center justify-center rounded-full bg-navy-soft/70 text-navy-dark transition-colors duration-200 group-hover:bg-navy-dark group-hover:text-white ${isList ? 'hidden' : 'flex'}`} aria-hidden>
              <ArrowUpRight className="size-4" />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
