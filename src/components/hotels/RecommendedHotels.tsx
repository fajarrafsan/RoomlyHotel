import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Building2 } from 'lucide-react';
import { DashboardView, Hotel, Language } from '../../types';
import { PremiumHotelCard } from './PremiumHotelCard';

interface RecommendedHotelsProps {
  hotels: Hotel[];
  isID: boolean;
  onNavigateTo: (view: DashboardView) => void;
  onSelectHotel: (hotel: Hotel) => void;
  onToggleWishlist: (hotelId: string) => void;
  wishlistedIds: string[];
  language: Language;
}

export const RecommendedHotels: React.FC<RecommendedHotelsProps> = ({
  hotels, isID, onNavigateTo, onSelectHotel, onToggleWishlist, wishlistedIds, language,
}) => {
  const reduceMotion = useReducedMotion();
  const railRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ first: 1, last: 1, canPrev: false, canNext: false });

  const updatePosition = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const bounds = rail.getBoundingClientRect();
    // A card only counts once most of it shows, so the sliver peeking in on phones doesn't.
    const visible = [...rail.children].map((card, index) => ({ index, rect: card.getBoundingClientRect() }))
      .filter(({ rect }) => Math.min(rect.right, bounds.right) - Math.max(rect.left, bounds.left) > rect.width * 0.6);
    const next = {
      first: (visible[0]?.index ?? 0) + 1,
      last: (visible[visible.length - 1]?.index ?? 0) + 1,
      canPrev: rail.scrollLeft > 3,
      canNext: rail.scrollWidth - rail.clientWidth - rail.scrollLeft > 3,
    };
    setPosition(current => Object.keys(next).every(key => current[key as keyof typeof current] === next[key as keyof typeof next]) ? current : next);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [hotels.length, updatePosition]);

  const move = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
    rail.scrollBy({ left: direction * (rail.clientWidth + gap), behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <section className="recommended-hotels-section -mx-4 overflow-hidden rounded-[28px] bg-[#10253f] bg-[radial-gradient(110%_75%_at_88%_-12%,rgba(228,192,120,0.14),transparent_62%),radial-gradient(85%_70%_at_-5%_112%,rgba(30,58,138,0.42),transparent_64%)] px-4 pb-6 pt-7 sm:mx-0 sm:rounded-[32px] sm:px-7 sm:pb-7 sm:pt-9 lg:px-9 lg:pt-10" aria-labelledby="recommended-heading" data-recommended-hotels>
      <div className="mb-7 flex flex-col justify-between gap-5 lg:mb-8 lg:flex-row lg:items-end lg:gap-10">
        <div>
          <p className="mb-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.19em] text-gold-light"><span className="h-px w-7 bg-gold-light/60" aria-hidden />{isID ? 'Rekomendasi Roomly' : 'The Roomly collection'}</p>
          <h2 id="recommended-heading" className="font-serif text-[30px] leading-[1.2] tracking-[-0.035em] text-white sm:text-[38px] lg:text-[42px]">
            {isID ? <>Tempat istimewa,<br /><span className="italic text-gold-light">untuk momenmu.</span></> : <>Exceptional stays.<br /><span className="italic text-gold-light">Memorable moments.</span></>}
          </h2>
        </div>
        <div className="max-w-[350px]">
          <p className="text-[15px] leading-6 text-white/80">{isID ? 'Dari vila dengan pemandangan laut hingga jeda nyaman di tengah kota. Temukan tempat yang cocok untukmu.' : 'From sea-view villas to a comfortable pause in the city. Find a place that feels right for you.'}</p>
          <button type="button" onClick={() => onNavigateTo('explore')} className="recommended-hotels-chrome mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2.5 border-b border-gold-light/35 text-[13px] font-semibold text-gold-light transition-colors duration-200 hover:border-gold-light hover:text-white">
            {isID ? 'Lihat semua penginapan' : 'Explore all stays'}<ArrowUpRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      {hotels.length === 0 ? (
        <div className="rounded-2xl border border-white/15 bg-white/5 px-6 py-12 text-center"><Building2 className="mx-auto mb-3 size-7 text-gold-light" aria-hidden /><p className="text-sm font-semibold text-white">{isID ? 'Pilihan penginapan sedang disiapkan' : 'Our collection is being prepared'}</p><p className="mt-2 text-xs text-white/65">{isID ? 'Kembali lagi untuk menemukan tempat menginap berikutnya.' : 'Come back to find your next place to stay.'}</p></div>
      ) : (
        <>
          <div
            ref={railRef}
            className="recommended-hotels-rail recommended-hotels-chrome relative -mx-4 grid auto-cols-[86%] grid-flow-col items-stretch gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-px-4 snap-x snap-mandatory px-4 sm:mx-0 sm:auto-cols-[calc((100%_-_1.25rem)/2)] sm:scroll-px-0 sm:gap-5 sm:rounded-[24px] sm:px-0 lg:auto-cols-[calc((100%_-_2.5rem)/3)] xl:auto-cols-[calc((100%_-_3.75rem)/4)]"
            role="region"
            aria-roledescription="carousel"
            aria-label={isID ? 'Koleksi penginapan rekomendasi' : 'Recommended stays collection'}
            tabIndex={0}
            onScroll={updatePosition}
            onKeyDown={event => {
              if (event.target !== event.currentTarget) return;
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                move(event.key === 'ArrowRight' ? 1 : -1);
              } else if (event.key === 'Home' || event.key === 'End') {
                event.preventDefault();
                event.currentTarget.scrollTo({ left: event.key === 'Home' ? 0 : event.currentTarget.scrollWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
              }
            }}
          >
            {hotels.map((hotel, index) => (
              <div
                key={hotel.id}
                className="min-w-0 snap-start"
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} ${isID ? 'dari' : 'of'} ${hotels.length}`}
                onFocusCapture={event => {
                  const rail = railRef.current;
                  if (!rail) return;
                  const card = event.currentTarget.getBoundingClientRect();
                  const bounds = rail.getBoundingClientRect();
                  if (card.left < bounds.left - 2 || card.right > bounds.right + 2) rail.scrollTo({ left: rail.scrollLeft + card.left - bounds.left, behavior: 'instant' });
                }}
              >
                <PremiumHotelCard hotel={hotel} index={index} isWishlisted={wishlistedIds.includes(hotel.id)} onToggleWishlist={onToggleWishlist} onSelect={onSelectHotel} language={language} />
              </div>
            ))}
          </div>
          <div className="relative mt-6 h-px bg-white/15" aria-hidden>
            <span className="absolute inset-x-0 -top-px block h-0.5 origin-left rounded-full bg-gold-light transition-transform duration-300 ease-out motion-reduce:transition-none" style={{ transform: `scaleX(${position.last / hotels.length})` }} />
          </div>
          <div className="mt-5 flex items-center justify-between gap-4">
            <div aria-live="polite" aria-atomic="true" className="text-xs text-white/65"><span className="font-semibold tabular-nums text-white">{String(position.first).padStart(2, '0')} — {String(position.last).padStart(2, '0')}</span><span className="mx-2 text-white/30">/</span>{hotels.length} {isID ? 'penginapan pilihan' : 'selected stays'}</div>
            <div className="flex shrink-0 gap-2.5">
              <button type="button" onClick={() => move(-1)} disabled={!position.canPrev} aria-label={isID ? 'Penginapan sebelumnya' : 'Previous stays'} className="recommended-hotels-chrome flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/25 text-white transition-colors duration-200 hover:border-gold-light hover:bg-white/10 disabled:cursor-default disabled:opacity-30"><ArrowLeft className="size-[18px]" aria-hidden /></button>
              <button type="button" onClick={() => move(1)} disabled={!position.canNext} aria-label={isID ? 'Penginapan berikutnya' : 'Next stays'} className="recommended-hotels-chrome flex size-11 cursor-pointer items-center justify-center rounded-full border border-gold-light bg-gold-light text-[#10253f] transition-colors duration-200 hover:border-white hover:bg-white disabled:cursor-default disabled:opacity-30"><ArrowRight className="size-[18px]" aria-hidden /></button>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
