import React, { useEffect, useId, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowRight } from 'lucide-react';

interface HeaderSearchDropdownProps {
  isID: boolean;
  onSubmit: (query: string) => void;
}

export const HeaderSearchDropdown: React.FC<HeaderSearchDropdownProps> = ({ isID, onSubmit }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.98 }}
        className="hidden sm:inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-xl bg-gold hover:bg-gold-dark text-white font-semibold text-[13px] transition-colors duration-200 cursor-pointer"
      >
        <Search className="w-4 h-4" aria-hidden />
        <span>{isID ? 'Cari hotel' : 'Search'}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={isID ? 'Cari hotel' : 'Search hotels'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-3 w-80 bg-white text-slate-900 rounded-2xl shadow-[0_16px_40px_rgba(30,58,138,0.14)] border border-navy-soft z-50 overflow-hidden origin-top-right"
          >
            <form onSubmit={handleSubmit} className="p-3.5">
              <label htmlFor={inputId} className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2 px-0.5">
                {isID ? 'Cari hotel' : 'Search hotels'}
              </label>
              <div className="relative rounded-xl border border-navy-soft focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/15 transition-all duration-200">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gold" aria-hidden />
                <input
                  id={inputId}
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isID ? 'mis. Maya Ubud Resort' : 'e.g. Maya Ubud Resort'}
                  className="w-full min-h-11 pl-9 pr-3 py-2.5 bg-transparent text-[14px] font-medium text-navy placeholder-slate-400 focus:outline-none rounded-xl"
                />
              </div>
              <button
                type="submit"
                className="w-full mt-2.5 min-h-11 py-2.5 rounded-xl bg-gold hover:bg-gold-dark text-white text-[13px] font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{isID ? 'Cari' : 'Search'}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
