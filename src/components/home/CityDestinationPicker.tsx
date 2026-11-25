import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, MapPin, Search, X } from 'lucide-react';
import { useSearchDropdown } from './useSearchDropdown';

export interface CityDestinationOption {
  city: string;
  province?: string;
  count: number;
}

interface CityDestinationPickerProps {
  id: string;
  isID: boolean;
  value: string;
  onChange: (value: string) => void;
  cities: CityDestinationOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CityDestinationPicker({ id, isID, value, onChange, cities, open, onOpenChange }: CityDestinationPickerProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const query = value.trim().toLocaleLowerCase();
  const matches = cities.filter(option => `${option.city} ${option.province || ''}`.toLocaleLowerCase().includes(query));
  const activeIndex = matches.findIndex(option => option.city === activeCity);
  const panelId = `${id}-suggestions`;
  const position = useSearchDropdown({ open, anchorRef, panelRef, onClose: () => onOpenChange(false), maxHeight: 370, minWidth: 310 });

  useEffect(() => {
    if (open && activeIndex >= 0) {
      panelRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, open]);

  const choose = (option: CityDestinationOption) => {
    onChange(option.city);
    setActiveCity(null);
    onOpenChange(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      onOpenChange(true);
      if (!matches.length) return;
      const nextIndex = event.key === 'ArrowDown'
        ? (activeIndex + 1) % matches.length
        : activeIndex < 0 ? matches.length - 1 : (activeIndex - 1 + matches.length) % matches.length;
      setActiveCity(matches[nextIndex].city);
    } else if (open && (event.key === 'Home' || event.key === 'End') && activeIndex >= 0) {
      event.preventDefault();
      setActiveCity(matches[event.key === 'Home' ? 0 : matches.length - 1]?.city ?? null);
    } else if (event.key === 'Enter' && open && activeIndex >= 0) {
      event.preventDefault();
      choose(matches[activeIndex]);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      onOpenChange(false);
      setActiveCity(null);
    } else if (event.key === 'Tab') {
      onOpenChange(false);
      setActiveCity(null);
    }
  };

  return (
    <>
      <div
        ref={anchorRef}
        className={`relative rounded-xl border transition-colors duration-200 focus-within:border-gold/35 focus-within:bg-[#fffaf1] focus-within:ring-2 focus-within:ring-gold/10 ${open ? 'border-gold/30 bg-[#fffaf1]' : 'border-transparent'}`}
        onBlur={event => {
          if (!anchorRef.current?.contains(event.relatedTarget as Node | null) && !panelRef.current?.contains(event.relatedTarget as Node | null)) onOpenChange(false);
        }}
      >
        <MapPin className="pointer-events-none absolute left-2 top-1/2 size-[19px] -translate-y-1/2 text-gold" aria-hidden />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={panelId}
          aria-activedescendant={open && activeIndex >= 0 ? `${id}-city-${activeIndex}` : undefined}
          value={value}
          onChange={event => { onChange(event.target.value); setActiveCity(null); onOpenChange(true); }}
          onFocus={() => { setActiveCity(null); onOpenChange(true); }}
          onClick={() => onOpenChange(true)}
          onKeyDown={onKeyDown}
          placeholder={isID ? 'Ingin ke mana?' : 'Where would you like to go?'}
          autoComplete="off"
          spellCheck={false}
          maxLength={100}
          style={{ outline: 'none' }}
          className="min-h-12 w-full min-w-0 rounded-xl bg-transparent py-2.5 pl-9 pr-10 text-base font-semibold text-navy-dark placeholder:font-normal placeholder:text-slate-500"
        />
        {value && (
          <button
            type="button"
            aria-label={isID ? 'Hapus kota tujuan' : 'Clear destination'}
            onClick={() => { onChange(''); setActiveCity(null); inputRef.current?.focus(); onOpenChange(true); }}
            className="absolute right-0 top-1/2 flex min-h-11 min-w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:text-navy"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              style={position}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.14 }}
              className="roomly-search-menu overflow-y-auto overscroll-contain rounded-[20px] border border-[#e8e2d7] bg-white p-2 shadow-[0_16px_48px_rgba(15,35,68,0.16)]"
              data-city-dropdown
            >
              <div className="sticky -top-2 z-10 -mx-0.5 mb-1.5 flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-3 pb-3 pt-2.5">
                <div>
                  <p className="text-[13px] font-semibold text-navy-dark">{isID ? 'Temukan tujuanmu' : 'Find your destination'}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{isID ? 'Cari kota atau provinsi di Indonesia' : 'Search cities or provinces in Indonesia'}</p>
                </div>
                <span className="shrink-0 rounded-full bg-gold-soft/70 px-2.5 py-1 text-[10px] font-semibold text-gold-dark" aria-live="polite">{matches.length} {isID ? 'kota' : matches.length === 1 ? 'city' : 'cities'}</span>
              </div>
              <ul id={panelId} role="listbox" aria-labelledby={`${id}-label`} className="m-0 list-none space-y-1 p-0">
                {matches.map((option, index) => {
                  const selected = option.city.toLocaleLowerCase() === query;
                  const active = index === activeIndex;
                  return (
                    <li
                      key={option.city}
                      id={`${id}-city-${index}`}
                      role="option"
                      aria-selected={selected}
                      data-active={active}
                      onMouseDown={event => event.preventDefault()}
                      onPointerMove={() => setActiveCity(option.city)}
                      onClick={() => choose(option)}
                      className={`flex min-h-[64px] cursor-pointer items-center gap-3 rounded-[13px] px-3 py-2.5 transition-colors duration-150 ${active ? 'bg-[#f8f3e9]' : selected ? 'bg-navy-soft/60' : 'hover:bg-slate-50'}`}
                    >
                      <span className={`flex size-9 shrink-0 items-center justify-center rounded-[11px] ${selected ? 'bg-navy-dark text-gold-light' : 'bg-[#f5f2eb] text-gold'}`}><MapPin className="size-4" aria-hidden /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold leading-5 text-navy-dark">{option.city}</span>
                        <span className="mt-0.5 block text-xs leading-4 text-slate-500">{option.province || 'Indonesia'}</span>
                      </span>
                      <span className="shrink-0 text-[11px] text-slate-500">{option.count} {isID ? 'properti' : option.count === 1 ? 'stay' : 'stays'}</span>
                      {selected && <Check className="size-4 shrink-0 text-gold" aria-hidden />}
                    </li>
                  );
                })}
                {!matches.length && <li role="presentation"><div className="px-5 py-7 text-center" role="status"><Search className="mx-auto mb-3 size-6 text-gold" aria-hidden /><p className="text-sm font-semibold text-navy-dark">{isID ? 'Kota belum ditemukan' : 'No matching cities'}</p><p className="mt-1 text-xs leading-5 text-slate-500">{isID ? 'Coba nama kota atau provinsi lain.' : 'Try a different city or province.'}</p></div></li>}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>, document.body,
      )}
    </>
  );
}
