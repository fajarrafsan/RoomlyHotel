import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { DashboardView } from '../../types';
import { easeOutSoft } from './animations';
import { applyImageFallback } from '../../lib/imageFallback';

interface Destination {
  city: string;
  title: string;
  image: string;
  count: number;
}

interface PopularDestinationsProps {
  destinations: Destination[];
  isID: boolean;
  onNavigateTo: (view: DashboardView) => void;
  onSearchCityChange: (city: string) => void;
}

export const PopularDestinations: React.FC<PopularDestinationsProps> = ({
  destinations,
  isID,
  onNavigateTo,
  onSearchCityChange
}) => {
  const reduceMotion = useReducedMotion();

  const openCity = (city: string) => {
    onSearchCityChange(city);
    onNavigateTo('explore');
  };

  return (
    <section className="mx-auto max-w-[1480px]" aria-labelledby="destinations-heading" data-popular-destinations>
      <div className="mb-7 flex items-end justify-between gap-6 sm:mb-9">
        <div className="max-w-[620px]">
          <p className="mb-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
            <span className="h-px w-7 bg-gold/60" aria-hidden />
            {isID ? 'Banyak tempat, banyak cerita' : 'New places, new stories'}
          </p>
          <h2 id="destinations-heading" className="font-serif text-[30px] leading-[1.2] tracking-[-0.035em] text-navy-dark sm:text-[38px] lg:text-[44px]">
            {isID ? <>Ke mana <span className="italic text-gold">selanjutnya?</span></> : <>Where to <span className="italic text-gold">next?</span></>}
          </h2>
          <p className="mt-3 max-w-[520px] text-[15px] leading-6 text-slate-600">
            {isID
              ? 'Dari energi kota hingga tenangnya pesisir. Temukan tempat untuk cerita berikutnya.'
              : 'From the energy of the city to the calm of the coast. Find the setting for your next story.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTo('explore')}
          className="group hidden min-h-12 shrink-0 cursor-pointer items-center gap-3 rounded-full border border-navy/15 bg-white px-5 py-3 text-sm font-semibold text-navy-dark transition-colors duration-200 hover:border-navy/40 hover:bg-navy-soft/50 sm:inline-flex"
        >
          <span>{isID ? 'Jelajahi destinasi' : 'Explore destinations'}</span>
          <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6" data-destination-grid>
        {destinations.length === 0 && Array.from({ length: 6 }, (_, idx) => (
          <div key={idx} className="rounded-[22px] border border-slate-200/80 bg-white p-2 sm:rounded-[26px]" aria-hidden>
            <div className="aspect-[4/3] rounded-[16px] bg-slate-100 sm:aspect-[16/10] lg:aspect-[16/9]" />
            <div className="space-y-3 px-2 py-4 sm:px-3">
              <div className="h-6 w-2/3 rounded bg-slate-100" />
              <div className="h-4 w-4/5 rounded bg-slate-100" />
              <div className="h-4 w-1/2 rounded bg-slate-100" />
            </div>
          </div>
        ))}
        {destinations.map((dest, idx) => {
          const stayLabel = isID
            ? `${dest.count.toLocaleString('id-ID')} penginapan`
            : `${dest.count.toLocaleString('en-US')} ${dest.count === 1 ? 'stay' : 'stays'}`;

          return (
            <motion.button
              key={dest.city}
              type="button"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '50px' }}
              transition={{ duration: 0.25, delay: Math.min(idx, 5) * 0.035, ease: easeOutSoft }}
              onClick={() => openCity(dest.city)}
              aria-label={`${isID ? 'Jelajahi' : 'Explore'} ${dest.city}, ${stayLabel}`}
              className="group flex min-w-0 cursor-pointer flex-col rounded-[22px] border border-slate-200/80 bg-white p-2 text-left transition-[border-color,box-shadow] duration-200 hover:border-gold/35 hover:shadow-[0_12px_32px_rgba(21,42,102,0.08)] active:border-gold/60 sm:rounded-[26px]"
              data-destination-card
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[16px] bg-slate-100 sm:aspect-[16/10] sm:rounded-[19px] lg:aspect-[16/9]">
                <img
                  src={dest.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onError={applyImageFallback}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.035] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </div>

              <div className="flex flex-1 flex-col px-2 pb-2 pt-3 sm:px-3.5 sm:pb-3 sm:pt-4">
                <h3 className="font-serif text-[18px] leading-[1.25] tracking-tight text-navy-dark min-[360px]:text-[21px] sm:text-[27px]">
                  {dest.city}
                </h3>
                <p className="mb-3 mt-1.5 text-[13px] leading-5 text-slate-600 sm:text-sm">
                  {dest.title}
                </p>
                <div className="mt-auto flex items-center justify-between gap-1.5 border-t border-slate-100 pt-3">
                  <span className="whitespace-nowrap text-xs font-semibold text-navy sm:text-[13px]">
                    <span className="sm:hidden">{isID ? `${dest.count.toLocaleString('id-ID')} properti` : stayLabel}</span>
                    <span className="hidden sm:inline">{stayLabel}</span>
                  </span>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy-soft/70 text-navy-dark transition-colors duration-200 group-hover:bg-navy-dark group-hover:text-white sm:size-9" aria-hidden>
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-6 sm:hidden">
        <button
          type="button"
          onClick={() => onNavigateTo('explore')}
          className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-navy/15 bg-white px-5 py-3 text-sm font-semibold text-navy-dark transition-colors duration-200 hover:bg-navy-soft/50"
        >
          <span>{isID ? 'Jelajahi semua destinasi' : 'Explore all destinations'}</span>
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </section>
  );
};
