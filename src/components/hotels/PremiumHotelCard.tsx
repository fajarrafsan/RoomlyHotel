import React, { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Heart, MapPin, Star } from 'lucide-react';
import { Hotel, Language } from '../../types';
import { applyImageFallback } from '../../lib/imageFallback';

interface PremiumHotelCardProps {
  hotel: Hotel;
  index: number;
  isWishlisted: boolean;
  onToggleWishlist: (hotelId: string) => void;
  onSelect: (hotel: Hotel) => void;
  language: Language;
}

const categoryNames: Record<string, string> = {
  Villa: 'Vila',
  Apartment: 'Apartemen',
  Resort: 'Resor',
  Boutique: 'Butik',
  Business: 'Bisnis',
  Luxury: 'Mewah',
};

/** Photo-led card for the dark Home showcase; Explore has its own card for comparing details. */
export const PremiumHotelCard: React.FC<PremiumHotelCardProps> = React.memo(({
  hotel,
  index,
  isWishlisted,
  onToggleWishlist,
  onSelect,
  language,
}) => {
  const isID = language === 'ID';
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const hasRating = Number.isFinite(hotel.rating) && hotel.rating > 0 && hotel.reviewsCount > 0;
  const hasStars = Number.isInteger(hotel.stars) && hotel.stars > 0 && hotel.stars <= 5;
  const lowestPricedRoom = hotel.rooms.filter(room => Number.isFinite(room.pricePerNight) && room.pricePerNight > 0)
    .reduce<(typeof hotel.rooms)[number] | undefined>((lowest, room) => !lowest || room.pricePerNight < lowest.pricePerNight ? room : lowest, undefined);
  const startingPrice = lowestPricedRoom?.pricePerNight ?? hotel.pricePerNight;
  const hasPrice = Number.isFinite(startingPrice) && startingPrice > 0;
  const locale = isID ? 'id-ID' : 'en-US';
  const price = hasPrice ? new Intl.NumberFormat(locale, {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(startingPrice) : null;
  const category = isID ? categoryNames[hotel.category] || hotel.category : hotel.category;
  const location = hotel.location || [hotel.city, hotel.province].filter(Boolean).join(', ');
  const rating = hotel.rating.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const roomSize = lowestPricedRoom && parseFloat(lowestPricedRoom.size) > 0
    ? lowestPricedRoom.size.replace(/\bsqm\b/gi, 'm²').replace(/\bsqft\b/gi, 'ft²') : null;
  const roomGuests = lowestPricedRoom && Number.isFinite(lowestPricedRoom.maxOccupancy) && lowestPricedRoom.maxOccupancy > 0
    ? `${lowestPricedRoom.maxOccupancy} ${isID ? 'tamu' : lowestPricedRoom.maxOccupancy === 1 ? 'guest' : 'guests'}` : null;
  const roomSummary = lowestPricedRoom ? [lowestPricedRoom.name, roomSize, roomGuests].filter(Boolean).join(' · ') : null;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '40px' }}
      transition={{ duration: reduceMotion ? 0 : 0.28, delay: reduceMotion ? 0 : Math.min(index, 4) * 0.035, ease: 'easeOut' }}
      className="group relative isolate flex aspect-[3/4] h-full min-w-0 flex-col justify-end overflow-hidden rounded-[24px] xl:aspect-[2/3] bg-[#0b1d33] ring-1 ring-inset ring-white/10 transition-shadow duration-300 hover:shadow-[0_18px_44px_rgba(3,12,26,0.5)]"
      aria-labelledby={titleId}
      data-recommended-card
      data-hotel-id={hotel.id}
    >
      <img
        src={hotel.image}
        alt=""
        loading="lazy"
        decoding="async"
        onError={applyImageFallback}
        className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-24 bg-gradient-to-b from-[#071526]/45 to-transparent" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[78%] bg-gradient-to-t from-[#071526] from-30% via-[#071526]/70 via-60% to-transparent" aria-hidden />
      <div className="pointer-events-none absolute inset-0 rounded-[24px] opacity-0 ring-1 ring-inset ring-gold-light/60 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />

      <button
        type="button"
        onClick={() => onSelect(hotel)}
        aria-label={isID ? `Lihat kamar di ${hotel.name}` : `View rooms at ${hotel.name}`}
        className="recommended-hotels-chrome absolute inset-0 z-10 cursor-pointer rounded-[24px] focus-visible:outline-offset-[-4px]"
        data-recommended-open
      />

      <span className="absolute left-3 top-3 inline-flex max-w-[calc(100%-4.5rem)] items-center gap-1.5 rounded-full bg-[#0b1d33]/65 px-3 py-1.5 text-xs font-semibold leading-4 text-white backdrop-blur-md">
        <span className="truncate">{category}</span>
        {hasRating && <>
          <span className="h-3 w-px shrink-0 bg-white/25" aria-hidden />
          <span className="inline-flex shrink-0 items-center gap-1" aria-label={isID ? `Rating ${rating} dari ${hotel.reviewsCount} ulasan` : `Rated ${rating} from ${hotel.reviewsCount} reviews`}>
            <Star className="size-3 fill-gold-light text-gold-light" aria-hidden />{rating}
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
        className={`recommended-hotels-chrome absolute right-2.5 top-2.5 z-20 flex size-11 cursor-pointer items-center justify-center rounded-full backdrop-blur-md transition-[color,background-color,transform] duration-200 hover:scale-105 active:scale-95 motion-reduce:hover:scale-100 motion-reduce:active:scale-100 ${isWishlisted ? 'bg-white text-rose-600' : 'bg-[#0b1d33]/65 text-white hover:bg-[#0b1d33]/85'}`}
        data-recommended-wishlist
      >
        <Heart className={`size-[18px] ${isWishlisted ? 'fill-current' : ''}`} aria-hidden />
      </button>

      <div className="pointer-events-none flex min-w-0 flex-col p-4 sm:p-5">
        {hasStars && (
          <span className="mb-2 inline-flex items-center gap-0.5 text-gold-light" role="img" aria-label={isID ? `Kelas hotel bintang ${hotel.stars}` : `${hotel.stars}-star hotel`}>
            {Array.from({ length: hotel.stars }, (_, star) => <Star key={star} className="size-3 fill-current" aria-hidden />)}
          </span>
        )}
        <h3 id={titleId} className="font-serif text-[23px] font-medium leading-[1.2] tracking-[-0.02em] text-white line-clamp-2 sm:text-[24px]">
          {hotel.name}
        </h3>
        <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[13px] leading-5 text-white/90">
          <MapPin className="size-3.5 shrink-0 text-gold-light" aria-hidden />
          <span className="truncate" title={location}>{location}</span>
        </p>
        {roomSummary && <p className="mt-0.5 truncate text-xs leading-5 text-white/75" title={roomSummary} data-recommended-room-preview data-room-id={lowestPricedRoom?.id}>{roomSummary}</p>}

        <div className="mt-3 flex items-end justify-between gap-3 border-t border-white/20 pt-3">
          {price ? (
            <div className="min-w-0">
              <p className="text-xs leading-4 text-white/75">{isID ? 'Mulai dari' : 'From'}</p>
              <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1">
                <span className="text-[20px] font-semibold leading-7 tracking-tight text-white" data-recommended-price>{price}</span>
                <span className="text-xs text-white/75">/ {isID ? 'malam' : 'night'}</span>
              </p>
            </div>
          ) : <p className="flex min-h-11 items-center text-sm font-medium text-white/85" data-recommended-price>{isID ? 'Harga belum tersedia' : 'Price unavailable'}</p>}
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors duration-200 group-hover:bg-gold-light group-hover:text-navy-dark" aria-hidden>
            <ArrowUpRight className="size-[18px] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" />
          </span>
        </div>
      </div>
    </motion.article>
  );
});
