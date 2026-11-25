import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Compass, MapPin } from 'lucide-react';
import { DashboardView } from '../../types';
import { easeOutSoft } from './animations';
import { applyImageFallback } from '../../lib/imageFallback';

interface StayInspirationBannerProps {
  isID: boolean;
  onNavigateTo: (view: DashboardView) => void;
}

export const StayInspirationBanner: React.FC<StayInspirationBannerProps> = ({ isID, onNavigateTo }) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, ease: easeOutSoft }}
      className="grid overflow-hidden rounded-[28px] border border-[#e8e2d8] bg-[#f5f1e9] md:grid-cols-[0.46fr_0.54fr] sm:rounded-[32px]"
      aria-labelledby="stay-inspiration-heading"
      data-stay-inspiration
    >
      <div className="relative flex flex-col items-start justify-center px-7 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
        <div className="mb-5 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
          <span className="h-px w-7 bg-gold/60" aria-hidden />
          {isID ? 'Inspirasi menginap' : 'Your next escape'}
        </div>
        <h2 id="stay-inspiration-heading" className="font-serif text-[35px] leading-[1.16] tracking-[-0.035em] text-navy-dark sm:text-[42px] md:text-[38px] lg:text-[48px]">
          {isID ? <>Liburan kecil,<br /><span className="italic text-gold">kenangan besar.</span></> : <>A little escape.<br /><span className="italic text-gold">Lasting memories.</span></>}
        </h2>
        <p className="mt-5 max-w-[360px] text-[15px] leading-7 text-slate-600">
          {isID
            ? 'Tukar rutinitas dengan suasana baru. Temukan hotel dan vila untuk waktu berkualitas bersama orang tersayang.'
            : 'Trade your everyday routine for a change of scenery. Find a hotel or villa for quality time with your favourite people.'}
        </p>
        <button
          type="button"
          onClick={() => onNavigateTo('explore')}
          className="group mt-7 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-navy-dark px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-navy sm:w-auto"
        >
          {isID ? 'Temukan penginapan' : 'Find your stay'}
          <ArrowUpRight className="size-[18px] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden />
        </button>
        <p className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-slate-600">
          <Compass className="size-4 shrink-0 text-gold" aria-hidden />
          {isID ? 'Tempat baru. Cerita yang berbeda.' : 'New places. A different story.'}
        </p>
      </div>

      <figure className="relative order-first m-0 min-h-[220px] overflow-hidden bg-slate-200 sm:min-h-[280px] md:order-last md:min-h-[420px]">
        <img
          src="/images/seed/hotels/mandalika-sagara.png"
          alt={isID ? 'Vila dengan kolam pribadi menghadap teluk dan perbukitan Mandalika' : 'Private-pool villas overlooking the bay and hills of Mandalika'}
          loading="lazy"
          decoding="async"
          onError={applyImageFallback}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" aria-hidden />
        <figcaption className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-white sm:inset-x-7 sm:bottom-7">
          <div>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-white/80">The Roomly Escape</p>
            <p className="flex items-center gap-1.5 text-sm font-semibold sm:text-base">
              <MapPin className="size-4 shrink-0 text-gold-light" aria-hidden />
              Mandalika, Lombok
            </p>
          </div>
          <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-[11px] font-medium backdrop-blur-sm">
            {isID ? 'Jeda di tepi laut' : 'A seaside escape'}
          </span>
        </figcaption>
      </figure>
    </motion.section>
  );
};
