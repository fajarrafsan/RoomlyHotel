import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, ArrowUpRight } from 'lucide-react';
import { DashboardView } from '../../types';

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
  return (
    <div className="space-y-14">
      {/* Section Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-3">
          <p className="text-[11px] font-medium text-amber-700 uppercase tracking-[0.25em]">
            {isID ? 'Jelajahi' : 'Explore'}
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-slate-900 tracking-tight leading-[1.1]">
            {isID ? 'Destinasi ' : 'Popular '}
            <span className="font-serif italic text-slate-700">{isID ? 'Populer' : 'Destinations'}</span>
          </h2>
        </div>

        <button
          onClick={() => onNavigateTo('explore')}
          className="group hidden sm:flex items-center gap-2 text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors duration-300 pb-1"
        >
          <span>{isID ? 'Lihat Semua' : 'View All'}</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
        </button>
      </div>

      {/* Destinations Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
        {destinations.map((dest, idx) => (
          <motion.div
            key={dest.city}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '50px' }}
            transition={{ duration: 0.4, delay: Math.min(idx, 6) * 0.05, ease: 'easeOut' }}
            onClick={() => {
              onSearchCityChange(dest.city);
              onNavigateTo('explore');
            }}
            className="group relative aspect-[2/3] rounded-[2rem] overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-slate-900/15 will-change-transform transform-gpu hover:-translate-y-1.5 transition-transform duration-300 ease-out"
          >
            {/* Image */}
            <img
              src={dest.image}
              alt={dest.title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />

            {/* Overlay — Cinematic gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-slate-950/5" />

            {/* Index Number — Editorial feel */}
            <div className="absolute top-5 left-5 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
              <span className="text-[11px] font-medium text-white/30 tracking-widest">
                {String(idx + 1).padStart(2, '0')}
              </span>
            </div>

            {/* Top-right arrow indicator */}
            <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 delay-75">
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Bottom Content */}
            <div className="absolute inset-x-0 bottom-0 p-6">
              {/* Animated line accent */}
              <div className="w-8 h-[2px] bg-amber-400/80 mb-4 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out" />

              <h3 className="text-white text-xl font-light tracking-tight leading-tight group-hover:text-amber-100 transition-colors duration-500">
                <span className="font-serif italic">{dest.city}</span>
              </h3>

              <div className="mt-2 overflow-hidden">
                <p className="text-white/40 text-[11px] font-medium tracking-wide translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out delay-75">
                  {isID
                    ? `${dest.count.toLocaleString('id-ID')}+ hotel & resor`
                    : `${dest.count.toLocaleString('en-US')}+ stays`}
                </p>
              </div>
            </div>

            {/* Hover border glow */}
            <div className="absolute inset-0 rounded-[2rem] border border-white/0 group-hover:border-white/10 transition-colors duration-500 pointer-events-none" />
          </motion.div>
        ))}
      </div>

      {/* Mobile View All Button */}
      <div className="sm:hidden flex justify-center">
        <button
          onClick={() => onNavigateTo('explore')}
          className="group flex items-center gap-2 text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors duration-300"
        >
          <span>{isID ? 'Lihat Semua Destinasi' : 'View All Destinations'}</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
};
