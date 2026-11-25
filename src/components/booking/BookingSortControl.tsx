import React, { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowDownWideNarrow, Check, ChevronDown } from 'lucide-react';

export type BookingSort = 'newest' | 'check-in' | 'price';

interface BookingSortControlProps {
  value: BookingSort;
  onChange: (value: BookingSort) => void;
  isID: boolean;
}

export function BookingSortControl({ value, onChange, isID }: BookingSortControlProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const reduceMotion = useReducedMotion();
  const options: { value: BookingSort; title: string; description: string }[] = [
    { value: 'newest', title: isID ? 'Pesanan terbaru' : 'Newest bookings', description: isID ? 'Berdasarkan waktu pemesanan' : 'By the time the booking was made' },
    { value: 'check-in', title: isID ? 'Tanggal menginap' : 'Check-in date', description: isID ? 'Tanggal check-in paling awal' : 'Earliest check-in first' },
    { value: 'price', title: isID ? 'Total tertinggi' : 'Highest total', description: isID ? 'Nilai reservasi terbesar' : 'Largest reservation amount first' },
  ];
  const current = options.find(option => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const closeAndFocus = () => {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };

  return (
    <div
      ref={wrapperRef}
      className="relative w-full shrink-0 sm:w-[205px]"
      data-booking-sort
      onKeyDown={event => {
        if (event.key !== 'Escape' || !open) return;
        event.preventDefault();
        event.stopPropagation();
        closeAndFocus();
      }}
      onBlur={event => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`${isID ? 'Urutkan pesanan' : 'Sort bookings'}: ${current.title}`}
        className={`flex min-h-12 w-full cursor-pointer items-center gap-2.5 rounded-xl border bg-white px-3.5 text-left text-sm font-semibold text-navy-dark transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-navy ${open ? 'border-gold/60 ring-2 ring-gold/10' : 'border-slate-200 hover:border-gold/50 hover:bg-slate-50'}`}
      >
        <ArrowDownWideNarrow className="size-4 shrink-0 text-gold" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{current.title}</span>
        <ChevronDown className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            role="group"
            aria-label={isID ? 'Urutkan pesanan' : 'Sort bookings'}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
            className="absolute right-0 top-full z-40 mt-2 w-full max-w-[calc(100vw-2rem)] rounded-[18px] border border-slate-200 bg-white p-1.5 shadow-[0_16px_44px_rgba(15,35,68,0.16)] sm:w-[280px] sm:min-w-[250px]"
          >
            {options.map(option => {
              const selected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    onChange(option.value);
                    closeAndFocus();
                  }}
                  className={`flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy ${selected ? 'bg-navy-soft/75 text-navy-dark' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold leading-5">{option.title}</span><span className="mt-0.5 block text-xs leading-5 text-slate-500">{option.description}</span></span>
                  <span className={`flex size-5 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-navy-dark text-white' : 'border border-slate-200'}`} aria-hidden>{selected && <Check className="size-3" />}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
