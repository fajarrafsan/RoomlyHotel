import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { VIEW_PATHS } from '../../lib/routes';

export const HeaderLogo: React.FC<{ isID: boolean }> = ({ isID }) => (
  <Link to={VIEW_PATHS.overview} className="shrink-0">
    <motion.div
      className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Clean White Luxury Emblem Badge */}
      <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white border border-slate-200/90 shadow-sm shadow-slate-900/5 group-hover:border-amber-400 group-hover:shadow-amber-500/10 transition-all duration-300 flex items-center justify-center shrink-0 overflow-hidden">
        {/* Subtle Shimmer accent */}
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-50/50 via-transparent to-slate-50 opacity-80" />

        {/* Custom Architectural Luxury Hotel Emblem SVG */}
        <svg
          className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 text-slate-900 group-hover:text-amber-600 relative z-10 transition-transform duration-300 group-hover:scale-110"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 21h18" />
          <path d="M5 21V7l7-4 7 4v14" />
          <path d="M9 21v-5a3 3 0 0 1 6 0v5" />
          <path d="M12 3v4" />
          <circle cx="12" cy="11" r="1.2" fill="currentColor" />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1">
          <span className="text-base sm:text-xl font-bold tracking-tight text-slate-950 group-hover:text-slate-700 transition-colors font-serif leading-none">
            Roomly
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 shrink-0 shadow-xs" />
        </div>
        <span className="hidden sm:block text-[9px] font-semibold text-slate-400 group-hover:text-amber-700 transition-colors uppercase tracking-[0.22em] mt-1 leading-none">
          {isID ? 'Hotel & Resor' : 'Hotels & Resorts'}
        </span>
      </div>
    </motion.div>
  </Link>
);
