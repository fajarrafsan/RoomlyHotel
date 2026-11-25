import React, { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CalendarDays, Check, ChevronDown } from 'lucide-react';
import type { AnalyticsPeriod } from '../../lib/travelAnalytics';

interface AnalyticsPeriodControlProps {
  value: AnalyticsPeriod;
  onChange: (value: AnalyticsPeriod) => void;
  years: number[];
  isID: boolean;
}

export function AnalyticsPeriodControl({ value, onChange, years, isID }: AnalyticsPeriodControlProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const reduceMotion = useReducedMotion();
  const selectedYear = value.startsWith('year:') ? Number(value.slice(5)) : null;
  const availableYears = [...new Set([...years, ...(selectedYear !== null ? [selectedYear] : [])])]
    .filter(year => Number.isSafeInteger(year) && year > 0 && year <= 9999)
    .sort((a, b) => b - a);
  const options: { value: AnalyticsPeriod; title: string; description: string }[] = [
    { value: 'all', title: isID ? 'Semua waktu' : 'All time', description: isID ? 'Seluruh riwayat reservasimu' : 'Your complete booking history' },
    { value: 'last12', title: isID ? '12 bulan terakhir' : 'Last 12 months', description: isID ? 'Tanggal check-in hingga hari ini' : 'Check-in dates through today' },
    ...availableYears.map(year => ({
      value: `year:${year}` as AnalyticsPeriod,
      title: String(year),
      description: isID ? `Januari–Desember ${year}` : `January–December ${year}`,
    })),
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

  return <div
    ref={wrapperRef}
    className="relative w-full shrink-0 sm:w-[220px]"
    data-analytics-period
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
      onClick={() => setOpen(previous => !previous)}
      aria-expanded={open}
      aria-controls={open ? panelId : undefined}
      aria-label={`${isID ? 'Periode statistik' : 'Statistics period'}: ${current.title}`}
      className={`flex min-h-12 w-full cursor-pointer items-center gap-2.5 rounded-xl border bg-white px-3.5 text-left text-sm font-semibold text-navy-dark transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-navy ${open ? 'border-gold/60 ring-2 ring-gold/10' : 'border-slate-200 hover:border-gold/50 hover:bg-slate-50'}`}
    >
      <CalendarDays className="size-4 shrink-0 text-gold" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{current.title}</span>
      <ChevronDown className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden />
    </button>
    <AnimatePresence>
      {open && <motion.div
        id={panelId}
        role="group"
        aria-label={isID ? 'Pilih periode statistik' : 'Choose statistics period'}
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.16 }}
        className="absolute left-0 right-auto top-full z-40 mt-2 max-h-[320px] w-[280px] max-w-[calc(100vw-4rem)] overflow-y-auto overscroll-contain rounded-[18px] border border-slate-200 bg-white p-1.5 shadow-[0_16px_44px_rgba(15,35,68,0.16)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:left-auto lg:right-0"
      >
        {options.map(option => {
          const selected = option.value === value;
          return <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => { onChange(option.value); closeAndFocus(); }}
            className={`flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy ${selected ? 'bg-navy-soft/75 text-navy-dark' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold leading-5">{option.title}</span><span className="mt-0.5 block text-xs leading-5 text-slate-500">{option.description}</span></span>
            <span className={`flex size-5 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-navy-dark text-white' : 'border border-slate-200'}`} aria-hidden>{selected && <Check className="size-3" />}</span>
          </button>;
        })}
      </motion.div>}
    </AnimatePresence>
  </div>;
}
