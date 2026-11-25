import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Building2, Check, ChevronDown, Hotel, House, LayoutGrid } from 'lucide-react';
import { useSearchDropdown } from './useSearchDropdown';

export type PropertyFilter = 'ALL' | 'HOTEL' | 'VILLA' | 'APARTMENT';

interface PropertyTypePickerProps {
  id: string;
  isID: boolean;
  value: PropertyFilter;
  onChange: (value: PropertyFilter) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyTypePicker({ id, isID, value, onChange, open, onOpenChange }: PropertyTypePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const typeahead = useRef({ value: '', time: 0 });
  const reduceMotion = useReducedMotion();
  const options = [
    { value: 'ALL' as const, label: isID ? 'Semua penginapan' : 'All stays', description: isID ? 'Jelajahi seluruh pilihan Roomly' : 'Explore the full Roomly collection', icon: LayoutGrid },
    { value: 'HOTEL' as const, label: isID ? 'Hotel' : 'Hotels', description: isID ? 'Nyaman untuk liburan dan bisnis' : 'Comfort for leisure and business', icon: Hotel },
    { value: 'VILLA' as const, label: isID ? 'Vila' : 'Villas', description: isID ? 'Lebih privat, lebih leluasa' : 'More privacy, more room to unwind', icon: House },
    { value: 'APARTMENT' as const, label: isID ? 'Apartemen' : 'Apartments', description: isID ? 'Ruang praktis, serasa di rumah' : 'A practical space that feels like home', icon: Building2 },
  ];
  const selectedIndex = Math.max(0, options.findIndex(option => option.value === value));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selected = options[selectedIndex];
  const SelectedIcon = selected.icon;
  const panelId = `${id}-options`;
  const valueId = `${id}-value`;
  const position = useSearchDropdown({
    open,
    anchorRef: triggerRef,
    panelRef,
    onClose: () => onOpenChange(false),
    minWidth: 310,
    maxHeight: 390,
  });

  useEffect(() => { setActiveIndex(selectedIndex); }, [selectedIndex]);
  useEffect(() => {
    if (open) document.getElementById(`${panelId}-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open, panelId]);

  const openMenu = (index = selectedIndex) => {
    setActiveIndex(index);
    onOpenChange(true);
  };
  const choose = (index: number) => {
    onChange(options[index].value);
    onOpenChange(false);
    triggerRef.current?.focus();
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) openMenu(selectedIndex);
      else setActiveIndex(current => (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      openMenu(event.key === 'Home' ? 0 : options.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) choose(activeIndex);
      else openMenu();
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      onOpenChange(false);
    } else if (event.key === 'Tab') {
      onOpenChange(false);
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now = Date.now();
      const query = `${now - typeahead.current.time < 700 ? typeahead.current.value : ''}${event.key}`.toLocaleLowerCase();
      typeahead.current = { value: query, time: now };
      const match = options.findIndex(option => option.label.toLocaleLowerCase().startsWith(query));
      if (match >= 0) openMenu(match);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="listbox"
        aria-labelledby={`${id}-label ${valueId}`}
        aria-activedescendant={open ? `${panelId}-${activeIndex}` : undefined}
        onClick={() => open ? onOpenChange(false) : openMenu()}
        onKeyDown={onKeyDown}
        className={`flex min-h-12 w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-lg py-2.5 text-left text-base font-semibold text-navy-dark transition-colors duration-200 focus-visible:!outline-none focus-visible:ring-2 focus-visible:ring-gold/35 ${open ? 'bg-navy-soft/45' : 'hover:bg-slate-50'}`}
      >
        <SelectedIcon className="size-[19px] shrink-0 text-gold" aria-hidden />
        <span id={valueId} className="min-w-0 flex-1 truncate">{selected.label}</span>
        <ChevronDown className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              id={panelId}
              role="listbox"
              aria-labelledby={`${id}-label`}
              initial={reduceMotion ? false : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : 3 }}
              transition={{ duration: reduceMotion ? 0 : 0.16 }}
              className="roomly-search-menu overflow-y-auto rounded-[18px] border border-[#e8e2d7] bg-white p-2 shadow-[0_18px_52px_rgba(15,35,65,0.18)]"
              style={{ ...position, fontFamily: "'Karla', ui-sans-serif, system-ui, sans-serif" }}
            >
              <div className="mb-1 border-b border-slate-100 px-3 pb-3 pt-2.5">
                <p className="text-[13px] font-semibold text-navy-dark">{isID ? 'Jenis penginapan' : 'Choose your stay'}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{isID ? 'Temukan suasana yang kamu suka' : 'Find a place that suits your style'}</p>
              </div>
              {options.map((option, index) => {
                const Icon = option.icon;
                const isSelected = option.value === value;
                const active = activeIndex === index;
                return (
                  <div
                    key={option.value}
                    id={`${panelId}-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={event => event.preventDefault()}
                    onPointerMove={() => setActiveIndex(index)}
                    onClick={() => choose(index)}
                    className={`my-1 flex min-h-[66px] cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150 ${isSelected ? 'bg-navy-soft/75' : active ? 'bg-[#faf6ee]' : 'bg-white hover:bg-[#faf6ee]'}`}
                  >
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${isSelected ? 'bg-white text-navy' : 'bg-[#f7f3eb] text-gold'}`}><Icon className="size-[19px]" aria-hidden /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-navy-dark">{option.label}</span>
                      <span className="mt-0.5 block text-xs leading-[18px] text-slate-500">{option.description}</span>
                    </span>
                    {isSelected && <Check className="size-[17px] shrink-0 text-gold" aria-hidden />}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
