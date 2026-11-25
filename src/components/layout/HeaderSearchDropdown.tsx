import React, { useEffect, useId, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { fadeTween } from '../../lib/motion';

interface HeaderSearchDropdownProps {
  isID: boolean;
  onOpen: () => void;
  onSubmit: (query: string) => void;
}

export const HeaderSearchDropdown: React.FC<HeaderSearchDropdownProps> = ({ isID, onOpen, onSubmit }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelId = useId();
  const inputId = useId();
  const reduced = useReducedMotion();
  const { key: locationKey } = useLocation();
  const searchLabel = isID ? 'Cari penginapan' : 'Search stays';

  useEffect(() => setOpen(false), [locationKey]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: Event) => {
      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
      document.addEventListener('focusin', closeOutside);
    });
    document.addEventListener('pointerdown', closeOutside);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('focusin', closeOutside);
      document.removeEventListener('pointerdown', closeOutside);
    };
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
    <div className="flex shrink-0 lg:relative" ref={wrapperRef} onKeyDown={(event) => {
      if (!open || event.key !== 'Escape') return;
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus({ preventScroll: true });
    }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!open) onOpen();
          setOpen(!open);
        }}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-haspopup="dialog"
        aria-label={searchLabel}
        className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 transition-colors hover:border-navy/25 hover:bg-white hover:text-navy-dark aria-expanded:border-navy/30 aria-expanded:bg-navy-soft aria-expanded:text-navy-dark xl:w-[186px] xl:justify-start xl:px-4 2xl:w-[216px]"
      >
        <Search className="size-[17px] shrink-0 text-gold-dark" aria-hidden />
        <span className="hidden truncate text-left xl:inline">{searchLabel}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            role="dialog"
            aria-label={searchLabel}
            initial={reduced ? false : { opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -5 }}
            transition={reduced ? { duration: 0 } : fadeTween}
            className="absolute top-full right-3 left-3 z-50 mt-2.5 rounded-[20px] border border-slate-200 bg-white text-slate-900 shadow-[0_16px_40px_rgba(15,35,68,0.16)] sm:right-8 sm:left-auto sm:w-[360px] lg:right-0"
          >
            <form onSubmit={handleSubmit} className="p-2.5">
              <label htmlFor={inputId} className="sr-only">
                {searchLabel}
              </label>
              <div className="flex items-center gap-2.5 rounded-[14px] border border-slate-200 pl-3.5 pr-1.5 transition-colors duration-200 focus-within:border-gold/50 focus-within:ring-2 focus-within:ring-gold/10">
                <Search className="size-[18px] shrink-0 text-gold" aria-hidden />
                <input
                  id={inputId}
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isID ? 'Nama hotel, kota, atau provinsi' : 'Hotel name, city, or province'}
                  style={{ outline: 'none' }}
                  className="min-h-[52px] w-full min-w-0 bg-transparent text-[15px] font-medium text-navy-dark placeholder:font-normal placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  aria-label={isID ? 'Cari' : 'Search'}
                  className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-navy-dark text-white transition-colors duration-200 hover:bg-navy"
                >
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
