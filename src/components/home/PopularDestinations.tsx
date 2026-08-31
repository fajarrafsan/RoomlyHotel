import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ChevronRight, ArrowUpRight } from 'lucide-react';
import { DashboardView } from '../../types';
import { easeOutSoft } from './animations';

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
    <section className="space-y-8 sm:space-y-10" aria-labelledby="destinations-heading">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[12px] font-semibold text-gold uppercase tracking-[0.16em]">
            {isID ? 'Jelajahi dunia' : 'Wanderlust'}
          </p>
          <h2 id="destinations-heading" className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] text-[#1E3A8A] tracking-tight leading-[1.15]">
            {isID ? 'Destinasi ikonik' : 'Signature destinations'}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTo('explore')}
          className="group hidden sm:inline-flex min-h-11 items-center gap-2 text-[14px] font-semibold text-slate-600 hover:text-[#1E3A8A] transition-colors duration-200 cursor-pointer"
        >
          <span>{isID ? 'Lihat semua' : 'View all'}</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 auto-rows-[200px] sm:auto-rows-[220px] lg:auto-rows-[230px]">
        {destinations.map((dest, idx) => {
          const featured = idx === 0;
          const stayLabel = isID
            ? `${dest.count.toLocaleString('id-ID')}+ hotel & resor`
            : `${dest.count.toLocaleString('en-US')}+ stays`;

          return (
            <motion.button
              key={dest.city}
              type="button"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '50px' }}
              whileHover={reduceMotion ? undefined : { y: -4 }}
              transition={{ duration: 0.3, delay: Math.min(idx, 5) * 0.05, ease: easeOutSoft }}
              onClick={() => openCity(dest.city)}
              aria-label={`${dest.city}, ${stayLabel}`}
              className={`group relative rounded-3xl overflow-hidden cursor-pointer text-left shadow-[0_8px_28px_rgba(30,58,138,0.08)] hover:shadow-[0_16px_40px_rgba(30,58,138,0.14)] transition-shadow duration-200 ${
                featured ? 'col-span-2 row-span-2 min-h-[280px] sm:min-h-0' : ''
              }`}
            >
              <img
                src={dest.image}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B3A] via-[#0B1B3A]/30 to-transparent" />

              <div className="absolute top-4 left-4">
                <span className="text-[12px] font-semibold tracking-[0.14em] text-gold-light">
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </div>

              <div className="absolute top-3 right-3 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                <div className="w-10 h-10 rounded-full bg-white/95 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 text-[#1E3A8A]" aria-hidden />
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <h3 className={`text-white font-serif tracking-tight ${featured ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'}`}>
                  {dest.city}
                </h3>
                <p className="mt-1 text-white/80 text-[12px] sm:text-[13px] font-medium">
                  {stayLabel}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="sm:hidden flex justify-center">
        <button
          type="button"
          onClick={() => onNavigateTo('explore')}
          className="group inline-flex min-h-11 items-center gap-2 text-[14px] font-semibold text-slate-600 hover:text-[#1E3A8A] transition-colors duration-200 cursor-pointer"
        >
          <span>{isID ? 'Lihat semua destinasi' : 'View all destinations'}</span>
          <ChevronRight className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </section>
  );
};
