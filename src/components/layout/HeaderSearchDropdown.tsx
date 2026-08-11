import React, { useEffect, useRef, useState } from 'react';
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
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-[13px] transition-colors cursor-pointer"
      >
        <Search className="w-4 h-4" />
        <span>{isID ? 'Cari Hotel' : 'Search'}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 bg-white text-slate-900 rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-100 z-50 overflow-hidden origin-top-right"
          >
            <form onSubmit={handleSubmit} className="p-3.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 px-0.5">
                {isID ? 'Cari Hotel' : 'Search Hotels'}
              </label>
              <div className="relative rounded-xl border border-slate-200 focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900/5 transition-all duration-200">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isID ? 'mis. Maya Ubud Resort' : 'e.g. Maya Ubud Resort'}
                  className="w-full pl-9 pr-3 py-2.5 bg-transparent text-[13px] font-medium text-slate-900 placeholder-slate-300 focus:outline-none rounded-xl"
                />
              </div>
              <button
                type="submit"
                className="w-full mt-2.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[12.5px] font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{isID ? 'Cari' : 'Search'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
