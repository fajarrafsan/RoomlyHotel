import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowDownWideNarrow, ArrowUpDown, ArrowUpWideNarrow, Check, ChevronDown, Sparkles, Star } from 'lucide-react';
import { useSearchDropdown } from '../home/useSearchDropdown';
import { ExploreSort } from './useHotelFilters';

interface ExploreSortPickerProps {
  isID: boolean;
  value: ExploreSort;
  onChange: (value: ExploreSort) => void;
}

export function ExploreSortPicker({ isID, value, onChange }: ExploreSortPickerProps) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const options = [
    { value: 'recommended' as const, label: isID ? 'Rekomendasi' : 'Recommended', icon: Sparkles },
    { value: 'price-asc' as const, label: isID ? 'Harga terendah' : 'Lowest price', icon: ArrowDownWideNarrow },
    { value: 'price-desc' as const, label: isID ? 'Harga tertinggi' : 'Highest price', icon: ArrowUpWideNarrow },
    { value: 'rating' as const, label: isID ? 'Rating tamu' : 'Guest rating', icon: Star },
  ];
  const selectedIndex = Math.max(0, options.findIndex(option => option.value === value));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const position = useSearchDropdown({ open, anchorRef: triggerRef, panelRef, onClose: () => setOpen(false), minWidth: 240, maxHeight: 300 });
  useEffect(() => setActiveIndex(selectedIndex), [selectedIndex]);
  useEffect(() => { if (open) document.getElementById(`${id}-sort-${activeIndex}`)?.scrollIntoView({ block: 'nearest' }); }, [activeIndex, open, id]);
  const choose = (index: number) => { onChange(options[index].value); setOpen(false); triggerRef.current?.focus(); };

  return <>
    <span id={`${id}-label`} className="sr-only">{isID ? 'Urutkan' : 'Sort by'}</span>
    <button
      ref={triggerRef}
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={`${id}-options`}
      aria-labelledby={`${id}-label ${id}-value`}
      aria-activedescendant={open ? `${id}-sort-${activeIndex}` : undefined}
      onClick={() => { setActiveIndex(selectedIndex); setOpen(current => !current); }}
      onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          if (!open) { setOpen(true); setActiveIndex(selectedIndex); }
          else setActiveIndex(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
        } else if (event.key === 'Home' || event.key === 'End') {
          event.preventDefault(); setOpen(true); setActiveIndex(event.key === 'Home' ? 0 : options.length - 1);
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault(); if (open) choose(activeIndex); else { setActiveIndex(selectedIndex); setOpen(true); }
        } else if (event.key === 'Escape') {
          if (open) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
        } else if (event.key === 'Tab') setOpen(false);
      }}
      className="flex min-h-12 w-full min-w-0 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-left text-[13px] font-semibold text-navy-dark transition-colors duration-200 hover:border-gold/40"
    >
      <ArrowUpDown className="hidden size-4 shrink-0 text-gold min-[400px]:block" aria-hidden />
      <span id={`${id}-value`} className="min-w-0 flex-1 truncate">{options[selectedIndex].label}</span>
      <ChevronDown className={`size-3.5 shrink-0 text-slate-400 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden />
    </button>
    {typeof document !== 'undefined' && createPortal(<AnimatePresence>{open && <motion.div
      ref={panelRef}
      id={`${id}-options`}
      role="listbox"
      aria-labelledby={`${id}-label`}
      style={position}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.14 }}
      className="roomly-search-menu overflow-y-auto rounded-[18px] border border-[#e8e2d7] bg-white p-2 shadow-[0_16px_48px_rgba(15,35,68,0.16)]"
    >
      <p className="mb-1 border-b border-slate-100 px-3 pb-3 pt-2 text-xs font-semibold text-slate-500">{isID ? 'Urutkan penginapan' : 'Sort stays'}</p>
      {options.map((option, index) => <div
        key={option.value}
        id={`${id}-sort-${index}`}
        role="option"
        aria-selected={option.value === value}
        onMouseDown={event => event.preventDefault()}
        onPointerMove={() => setActiveIndex(index)}
        onClick={() => choose(index)}
        className={`my-1 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm ${option.value === value ? 'bg-navy-soft/65 text-navy-dark' : activeIndex === index ? 'bg-[#faf6ee] text-navy-dark' : 'text-slate-600 hover:bg-[#faf6ee]'}`}
      ><option.icon className="size-4 shrink-0 text-gold" aria-hidden /><span className="flex-1 font-medium">{option.label}</span>{option.value === value && <Check className="size-4 text-gold" aria-hidden />}</div>)}
    </motion.div>}</AnimatePresence>, document.body)}
  </>;
}
