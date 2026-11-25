import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Minus, Plus, RotateCcw, Star, Users, X } from 'lucide-react';
import { modalTween } from '../../lib/motion';

export interface ExploreFilterFieldsProps {
  isID: boolean;
  minRating: number;
  onMinRatingChange: (rating: number) => void;
  maxPrice: number | null;
  onMaxPriceChange: (price: number | null) => void;
  catalogMaxPrice: number;
  minGuests: number;
  onMinGuestsChange: (guests: number) => void;
  minStars: number;
  onMinStarsChange: (stars: number) => void;
}

interface ExploreFiltersProps extends ExploreFilterFieldsProps {
  hasActiveFilters: boolean;
  onReset: () => void;
}

interface ExploreFilterSheetProps extends ExploreFiltersProps {
  open: boolean;
  onClose: () => void;
  resultCount: number;
}

const PRICE_STEP = 100_000;
const SLIDER_MAX = 1000;
const SLIDER_CURVE = 2.4;

// Catalog prices cluster near the bottom of a range that tops out much higher,
// so a linear track would squeeze every realistic budget into its first pixels.
const positionToPrice = (position: number, ceiling: number) =>
  Math.max(PRICE_STEP, Math.round(((position / SLIDER_MAX) ** SLIDER_CURVE * ceiling) / PRICE_STEP) * PRICE_STEP);
const priceToPosition = (price: number, ceiling: number) =>
  Math.round((Math.min(price, ceiling) / ceiling) ** (1 / SLIDER_CURVE) * SLIDER_MAX);

const segmentClass = (active: boolean) => `flex min-h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1 rounded-[10px] px-1 text-[13px] font-semibold transition-colors duration-150 ${active ? 'bg-white text-navy-dark shadow-[0_1px_4px_rgba(21,42,102,0.16)]' : 'text-slate-500 hover:text-navy-dark'}`;
const stepperClass = 'flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-navy-dark transition-colors duration-150 hover:border-gold/60 hover:text-gold-dark disabled:cursor-default disabled:opacity-35 disabled:hover:border-slate-200 disabled:hover:text-navy-dark';

const FilterSection: React.FC<{ title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }> = ({ title, hint, action, children }) => (
  <fieldset className="min-w-0 border-b border-slate-100 py-[18px] last:border-b-0">
    <legend className="sr-only">{title}</legend>
    <div className="mb-3 flex min-h-5 items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-5 text-navy-dark" aria-hidden>{title}</p>
        {hint && <p className="text-xs leading-5 text-slate-500">{hint}</p>}
      </div>
      {action}
    </div>
    {children}
  </fieldset>
);

const ExploreFilterFields: React.FC<ExploreFilterFieldsProps> = ({
  isID, minRating, onMinRatingChange, maxPrice, onMaxPriceChange, catalogMaxPrice, minGuests, onMinGuestsChange, minStars, onMinStarsChange,
}) => {
  const priceId = useId();
  const locale = isID ? 'id-ID' : 'en-US';
  const formatPrice = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  const position = maxPrice === null ? SLIDER_MAX : priceToPosition(maxPrice, catalogMaxPrice);

  return (
    <div className="min-w-0" data-explore-filter-fields>
      <FilterSection
        title={isID ? 'Anggaran per malam' : 'Nightly budget'}
        action={maxPrice !== null ? <button type="button" onClick={() => onMaxPriceChange(null)} className="min-h-8 shrink-0 cursor-pointer rounded-md px-1 text-xs font-semibold text-gold-dark hover:text-navy-dark">{isID ? 'Hapus' : 'Clear'}</button> : undefined}
      >
        <div className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 transition-colors duration-150 focus-within:border-gold/60 focus-within:ring-2 focus-within:ring-gold/10">
          <span className="text-[13px] font-semibold text-gold" aria-hidden>Rp</span>
          <input
            id={priceId}
            type="text"
            inputMode="numeric"
            maxLength={13}
            value={maxPrice === null ? '' : maxPrice.toLocaleString(locale)}
            onChange={event => {
              const digits = event.target.value.replace(/\D/g, '');
              onMaxPriceChange(digits ? Number(digits) : null);
            }}
            placeholder={isID ? 'Tanpa batas' : 'No limit'}
            aria-label={isID ? 'Anggaran maksimum per malam' : 'Maximum nightly budget'}
            style={{ outline: 'none' }}
            className="min-h-11 w-full min-w-0 bg-transparent text-base font-semibold tabular-nums text-navy-dark placeholder:font-normal placeholder:text-slate-500"
          />
        </div>
        <input
          type="range"
          min={0}
          max={SLIDER_MAX}
          step={4}
          value={position}
          onChange={event => {
            const next = Number(event.target.value);
            onMaxPriceChange(next >= SLIDER_MAX ? null : positionToPrice(next, catalogMaxPrice));
          }}
          aria-label={isID ? 'Geser anggaran maksimum per malam' : 'Adjust maximum nightly budget'}
          aria-valuetext={maxPrice === null ? (isID ? 'Tanpa batas' : 'No limit') : formatPrice(maxPrice)}
          style={{ '--range-fill': `${(position / SLIDER_MAX) * 100}%` } as React.CSSProperties}
          className="explore-range mt-1 block"
          data-explore-price-range
        />
        <div className="-mt-1 flex justify-between gap-2 text-xs text-slate-500"><span>{formatPrice(PRICE_STEP)}</span><span>{formatPrice(catalogMaxPrice)}</span></div>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[1_000_000, 2_000_000, 3_000_000, 5_000_000].map(amount => {
            const active = maxPrice === amount;
            return (
              <button
                key={amount}
                type="button"
                aria-label={`${isID ? 'Maksimal' : 'Up to'} ${formatPrice(amount)}`}
                aria-pressed={active}
                onClick={() => onMaxPriceChange(active ? null : amount)}
                className={`flex min-h-11 min-w-0 cursor-pointer items-center justify-center rounded-full border px-1 text-[13px] font-semibold transition-colors duration-150 ${active ? 'border-gold bg-gold-soft text-gold-dark' : 'border-slate-200 bg-white text-slate-600 hover:border-gold/50 hover:text-navy-dark'}`}
              >
                {amount / 1_000_000}{isID ? ' jt' : 'm'}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title={isID ? 'Kapasitas tamu' : 'Guest capacity'} hint={isID ? 'Tamu dalam satu kamar' : 'Guests in one room'}>
        <div className="flex items-center justify-between gap-2">
          <button type="button" disabled={minGuests === 0} onClick={() => onMinGuestsChange(Math.max(0, minGuests - 1))} aria-label={isID ? 'Kurangi kapasitas tamu' : 'Decrease guest capacity'} className={stepperClass}><Minus className="size-4" aria-hidden /></button>
          <span className="flex min-w-0 items-center gap-2 text-[15px] font-semibold tabular-nums text-navy-dark" aria-live="polite" data-explore-guests>
            <Users className="size-4 shrink-0 text-gold" aria-hidden />
            {minGuests ? `${minGuests}+ ${isID ? 'tamu' : minGuests === 1 ? 'guest' : 'guests'}` : (isID ? 'Semua' : 'Any')}
          </span>
          <button type="button" disabled={minGuests >= 12} onClick={() => onMinGuestsChange(Math.min(12, minGuests + 1))} aria-label={isID ? 'Tambah kapasitas tamu' : 'Increase guest capacity'} className={stepperClass}><Plus className="size-4" aria-hidden /></button>
        </div>
      </FilterSection>

      <FilterSection title={isID ? 'Kelas hotel' : 'Hotel class'}>
        <div className="flex gap-0.5 rounded-xl bg-slate-100 p-1" role="group" aria-label={isID ? 'Kelas hotel' : 'Hotel class'}>
          {[0, 3, 4, 5].map(stars => (
            <button
              key={stars}
              type="button"
              aria-pressed={minStars === stars}
              aria-label={stars === 0 ? (isID ? 'Semua kelas hotel' : 'Any hotel class') : `${stars}${stars < 5 ? '+' : ''} ${isID ? 'bintang' : 'stars'}`}
              onClick={() => onMinStarsChange(stars)}
              className={segmentClass(minStars === stars)}
            >
              {stars === 0 ? (isID ? 'Semua' : 'Any') : <>{stars}{stars < 5 ? '+' : ''}<Star className="size-3 fill-gold text-gold" aria-hidden /></>}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title={isID ? 'Ulasan tamu' : 'Guest reviews'}>
        <div className="flex gap-0.5 rounded-xl bg-slate-100 p-1" role="group" aria-label={isID ? 'Ulasan tamu' : 'Guest reviews'}>
          {[0, 4, 4.5].map(rating => (
            <button
              key={rating}
              type="button"
              aria-pressed={minRating === rating}
              aria-label={rating === 0 ? (isID ? 'Semua ulasan' : 'Any guest rating') : `${isID ? 'Rating minimum' : 'Minimum rating'} ${rating.toFixed(1)}`}
              onClick={() => onMinRatingChange(rating)}
              className={segmentClass(minRating === rating)}
            >
              {rating === 0 ? (isID ? 'Semua' : 'Any') : <>{rating.toLocaleString(locale, { minimumFractionDigits: 1 })}+<Star className="size-3 fill-gold text-gold" aria-hidden /></>}
            </button>
          ))}
        </div>
      </FilterSection>
    </div>
  );
};

export const ExploreFilters: React.FC<ExploreFiltersProps> = ({ hasActiveFilters, onReset, ...fields }) => {
  const { isID } = fields;
  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[26px] border border-slate-200/80 bg-white" data-explore-filters>
      <div className="flex min-h-[62px] shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-5">
        <h2 className="min-w-0 truncate font-serif text-[19px] tracking-[-0.02em] text-navy-dark">{isID ? 'Sesuaikan pilihan' : 'Refine your stay'}</h2>
        {hasActiveFilters && <button type="button" onClick={onReset} aria-label={isID ? 'Reset semua filter' : 'Reset all filters'} className="flex min-h-11 shrink-0 cursor-pointer items-center gap-1 rounded-lg px-1 text-xs font-semibold text-gold-dark transition-colors duration-150 hover:text-navy-dark"><RotateCcw className="size-3.5" aria-hidden />Reset</button>}
      </div>
      <div className="explore-filter-scroll min-h-0 flex-1 px-5 pb-2"><ExploreFilterFields {...fields} /></div>
    </div>
  );
};

export const ExploreFilterSheet: React.FC<ExploreFilterSheetProps> = ({ open, onClose, resultCount, hasActiveFilters, onReset, ...fields }) => {
  const { isID } = fields;
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const controls = Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)'));
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement as HTMLElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement as HTMLElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    // The sidebar takes over at this width, so a sheet left open would keep the page locked.
    const desktop = window.matchMedia('(min-width: 1280px)');
    const onViewportChange = () => { if (desktop.matches) onCloseRef.current(); };

    window.addEventListener('keydown', onKey);
    desktop.addEventListener('change', onViewportChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', onViewportChange);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);

  if (typeof document === 'undefined') return null;

  const showLabel = isID
    ? `Tampilkan ${resultCount} penginapan`
    : `Show ${resultCount} ${resultCount === 1 ? 'stay' : 'stays'}`;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="explore-page fixed inset-0 z-[70] xl:hidden"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          data-explore-filter-sheet
        >
          <div className="absolute inset-0 bg-[#0b1f3a]/55" onClick={onClose} aria-hidden />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={reduceMotion ? false : { y: '100%' }}
            animate={{ y: 0 }}
            exit={reduceMotion ? undefined : { y: '100%' }}
            transition={reduceMotion ? { duration: 0 } : modalTween}
            style={{ outline: 'none' }}
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[88dvh] w-full max-w-[560px] flex-col rounded-t-[26px] bg-white shadow-[0_-16px_48px_rgba(11,31,58,0.24)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 pl-5 pr-3">
              <h2 id={titleId} className="font-serif text-[21px] tracking-[-0.02em] text-navy-dark">{isID ? 'Filter penginapan' : 'Filter stays'}</h2>
              <button type="button" onClick={onClose} aria-label={isID ? 'Tutup filter' : 'Close filters'} className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-navy-dark"><X className="size-5" aria-hidden /></button>
            </div>
            <div className="explore-no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5"><ExploreFilterFields {...fields} /></div>
            <div className="flex items-center gap-2 border-t border-slate-100 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={onReset} disabled={!hasActiveFilters} className="flex min-h-12 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-gold-dark transition-colors duration-150 hover:text-navy-dark disabled:cursor-default disabled:text-slate-400"><RotateCcw className="size-4" aria-hidden />Reset</button>
              <button type="button" onClick={onClose} className="flex min-h-12 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-full bg-navy-dark px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-navy" aria-live="polite" data-explore-show-results>{showLabel}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
