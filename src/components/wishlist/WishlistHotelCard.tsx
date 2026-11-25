import React, { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Heart, Loader2, MapPin, Star } from 'lucide-react';
import type { Hotel, Language } from '../../types';
import { applyImageFallback } from '../../lib/imageFallback';
import { formatCurrency, formatDate } from '../../lib/utils';
import { getWishlistPrice, getWishlistPriceRoom } from '../../lib/wishlistPresentation';

interface WishlistHotelCardProps {
  hotel: Hotel;
  language: Language;
  savedAt?: string;
  pending: boolean;
  onRemove: (hotel: Hotel) => void;
  onSelect: (hotel: Hotel) => void;
  index?: number;
}

const categoryID: Record<Hotel['category'], string> = {
  Hotel: 'Hotel', Villa: 'Vila', Apartment: 'Apartemen', Resort: 'Resor',
  Boutique: 'Butik', Business: 'Bisnis', Luxury: 'Mewah',
};

export function WishlistHotelCard({ hotel, language, savedAt, pending, onRemove, onSelect, index = 0 }: WishlistHotelCardProps) {
  const isID = language === 'ID';
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const room = getWishlistPriceRoom(hotel);
  const price = getWishlistPrice(hotel);
  const location = hotel.location || [hotel.city, hotel.province].filter(Boolean).join(', ');
  const category = isID ? categoryID[hotel.category] : hotel.category;
  const hasRating = Number.isFinite(hotel.rating) && hotel.rating > 0 && hotel.rating <= 5
    && Number.isFinite(hotel.reviewsCount) && hotel.reviewsCount > 0;
  const hasStars = Number.isInteger(hotel.stars) && hotel.stars >= 1 && hotel.stars <= 5;
  const rating = hasRating ? hotel.rating.toLocaleString(isID ? 'id-ID' : 'en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1}) : null;
  const savedDate = savedAt && Number.isFinite(Date.parse(savedAt)) ? formatDate(savedAt, language) : null;
  const amenities = [...new Set(hotel.amenities.map(value => value.trim()).filter(Boolean))].slice(0, 2);
  const occupancy = room && Number.isFinite(room.maxOccupancy) && room.maxOccupancy > 0
    ? `${room.maxOccupancy} ${isID ? 'tamu' : room.maxOccupancy === 1 ? 'guest' : 'guests'}` : null;
  const roomSummary = room ? [room.name, occupancy].filter(Boolean).join(' · ') : null;
  const openLabel = isID ? `Lihat kamar di ${hotel.name}` : `View rooms at ${hotel.name}`;

  return <motion.article
    initial={reduceMotion ? false : {opacity: 0}} animate={{opacity: 1}}
    transition={{duration: reduceMotion ? 0 : 0.22, delay: reduceMotion ? 0 : Math.min(index, 4) * 0.035}}
    aria-labelledby={titleId} data-wishlist-card data-hotel-id={hotel.id} aria-busy={pending}
    className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,35,68,0.045)] transition-[border-color,box-shadow] duration-200 hover:border-gold/30 hover:shadow-[0_14px_34px_rgba(15,35,68,0.09)] motion-reduce:transition-none"
  >
    <div className="relative h-[200px] shrink-0 overflow-hidden bg-navy-soft sm:h-[216px]">
      <button type="button" onClick={() => onSelect(hotel)} aria-label={openLabel} className="absolute inset-0 block size-full cursor-pointer focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-gold-light" data-wishlist-open-image>
        <img src={hotel.image} alt={hotel.name} onError={applyImageFallback} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.035] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071c30]/70 via-transparent to-[#071c30]/10" aria-hidden />
      </button>
      <div className="pointer-events-none absolute left-3 top-3 flex max-w-[calc(100%-4.5rem)] items-center gap-2 rounded-full border border-white/35 bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-navy-dark shadow-sm">
        <span className="truncate">{category}</span>
        {hasStars && <span className="flex shrink-0 items-center gap-0.5 border-l border-slate-200 pl-2 text-gold" role="img" aria-label={isID ? `Kelas hotel bintang ${hotel.stars}` : `${hotel.stars}-star hotel`}>{Array.from({length: hotel.stars}, (_, star) => <Star key={star} className="size-2.5 fill-current" aria-hidden />)}</span>}
      </div>
      <button type="button" onClick={() => onRemove(hotel)} disabled={pending} aria-label={isID ? `Hapus ${hotel.name} dari wishlist` : `Remove ${hotel.name} from wishlist`} aria-pressed="true" title={isID ? 'Hapus dari wishlist' : 'Remove from wishlist'} className="absolute right-3 top-3 flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/95 text-rose-600 shadow-sm transition-colors duration-200 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-light disabled:cursor-wait disabled:opacity-65" data-wishlist-remove>
        {pending ? <Loader2 className="size-[18px] animate-spin motion-reduce:animate-none" aria-hidden /> : <Heart className="size-[18px] fill-current" aria-hidden />}
      </button>
      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-between gap-2">
        {hasRating ? <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-navy-dark"><Star className="size-3 fill-gold text-gold" aria-hidden />{rating}<span className="font-normal text-slate-500">({hotel.reviewsCount.toLocaleString(isID ? 'id-ID' : 'en-US')})</span></span> : <span className="rounded-full border border-white/20 bg-[#10253f]/55 px-2.5 py-1.5 text-[11px] font-medium text-white">{isID ? 'Belum ada ulasan' : 'No reviews yet'}</span>}
        {savedDate && <span className="text-[10px] font-medium leading-4 text-white/95">{isID ? 'Disimpan' : 'Saved'} {savedDate}</span>}
      </div>
    </div>
    <div className="flex min-w-0 flex-1 flex-col px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
      <h3 id={titleId} className="line-clamp-2 font-serif text-[22px] leading-[1.23] tracking-[-0.025em] text-navy-dark" title={hotel.name}>{hotel.name}</h3>
      {location && <p className="mt-2 flex min-w-0 items-center gap-1.5 text-[13px] leading-5 text-slate-500"><MapPin className="size-3.5 shrink-0 text-gold" aria-hidden /><span className="truncate" title={location}>{location}</span></p>}
      {amenities.length > 0 && <ul className="mt-3 flex min-w-0 flex-wrap gap-1.5" aria-label={isID ? 'Fasilitas penginapan' : 'Property amenities'}>{amenities.map(amenity => <li key={amenity} className="max-w-full truncate rounded-md bg-slate-100/80 px-2 py-1 text-[10px] leading-4 text-slate-600" title={amenity}>{amenity}</li>)}</ul>}
      {roomSummary && <p className="mt-3 truncate text-xs leading-5 text-slate-500" title={roomSummary} data-wishlist-price-room data-room-id={room?.id}>{roomSummary}</p>}
      <div className="mt-auto pt-4">
        <div className="flex min-w-0 items-end justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="min-w-0">{price !== null ? <><p className="mb-1 text-[10px] font-medium text-slate-500">{isID ? 'Mulai dari · per malam' : 'From · per night'}</p><p className="break-words text-[19px] font-bold leading-6 tracking-tight text-navy-dark" data-wishlist-price>{formatCurrency(price)}</p></> : <p className="max-w-[160px] text-sm font-medium leading-5 text-slate-600" data-wishlist-price>{isID ? 'Lihat pilihan kamar' : 'Explore room options'}</p>}</div>
          <button type="button" onClick={() => onSelect(hotel)} aria-label={openLabel} className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-navy-dark px-3 text-xs font-semibold text-white transition-colors duration-200 hover:bg-navy focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-navy" data-wishlist-open>{isID ? 'Lihat kamar' : 'View rooms'}<ArrowUpRight className="size-3.5" aria-hidden /></button>
        </div>
      </div>
    </div>
  </motion.article>;
}
