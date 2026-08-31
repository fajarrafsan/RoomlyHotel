import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { roleLandingPath } from '../../lib/routes';
import { useAuth } from '../../context/AuthContext';

export const HeaderLogo: React.FC<{ isID: boolean }> = ({ isID }) => {
  const { user } = useAuth();

  return (
    <Link to={roleLandingPath(user?.role)} className="shrink-0" aria-label="Roomly">
      <motion.div
        className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-navy flex items-center justify-center shrink-0 shadow-[0_6px_16px_rgba(30,58,138,0.18)]">
          <svg
            className="w-5 h-5 text-gold-light"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M3 21h18" />
            <path d="M5 21V7l7-4 7 4v14" />
            <path d="M9 21v-5a3 3 0 0 1 6 0v5" />
            <path d="M12 3v4" />
            <circle cx="12" cy="11" r="1.2" fill="currentColor" />
          </svg>
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-xl font-semibold tracking-tight text-navy font-serif leading-none">
              Roomly
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
          </div>
          <span className="hidden sm:block text-[10px] font-semibold text-slate-500 uppercase tracking-[0.16em] mt-1 leading-none">
            {isID ? 'Hotel & Resor' : 'Hotels & Resorts'}
          </span>
        </div>
      </motion.div>
    </Link>
  );
};
