import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, Building2, Hotel as HotelIcon, House, LayoutGrid, List, LucideIcon, RotateCcw, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { Hotel, Language, RoomType } from '../../types';
import { fadeTween } from '../../lib/motion';
import { ExploreHotelCard } from './ExploreHotelCard';
import { ExploreSortPicker } from './ExploreSortPicker';
import { ExploreSort } from './useHotelFilters';

export interface ExploreFilterChip {
  key: string;
  label: string;
  remove: () => void;
}

interface ExploreResultsProps {
  isID: boolean;
  hotels: Hotel[];
  selectedCity: string;
  wishlistIds: string[];
  onToggleWishlist: (hotelId: string) => void;
  onSelectHotel: (hotel: Hotel) => void;
  language: Language;
  onReset: () => void;
  sortBy: ExploreSort;
  onSortChange: (sort: ExploreSort) => void;
  searchQuery?: string;
  matchingRoomsByHotel?: Record<string, RoomType>;
  roomFiltersActive?: boolean;
  filterKey?: string;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  chips: ExploreFilterChip[];
  panelFilterCount: number;
  onOpenFilters: () => void;
}

const PAGE_SIZE = 9;

const categoryIcons: Record<string, LucideIcon> = { ALL: LayoutGrid, Hotel: HotelIcon, Villa: House, Apartment: Building2 };
const categoryNouns: Record<string, { id: string; en: [string, string] }> = {
  ALL: { id: 'penginapan', en: ['stay', 'stays'] },
  Hotel: { id: 'hotel', en: ['hotel', 'hotels'] },
  Villa: { id: 'vila', en: ['villa', 'villas'] },
  Apartment: { id: 'apartemen', en: ['apartment', 'apartments'] },
};

export const ExploreResults: React.FC<ExploreResultsProps> = ({
  isID, hotels, selectedCity, wishlistIds, onToggleWishlist, onSelectHotel, language, onReset,
  sortBy, onSortChange, searchQuery = '', matchingRoomsByHotel, roomFiltersActive = false, filterKey,
  categories, selectedCategory, onSelectCategory, categoryCounts, chips, panelFilterCount, onOpenFilters,
}) => {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [toolbarInView, setToolbarInView] = useState(true);
  const resultSignature = hotels.map(hotel => hotel.id).join('|');
  useEffect(() => setPage(1), [resultSignature, selectedCity, searchQuery, sortBy, filterKey]);
  const pageCount = Math.max(1, Math.ceil(hotels.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleHotels = hotels.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;
    const headerHeight = Math.ceil(document.querySelector('.site-header')?.getBoundingClientRect().height ?? 72);
    const observer = new IntersectionObserver(([entry]) => setToolbarInView(entry.isIntersecting), { rootMargin: `-${headerHeight}px 0px 0px 0px` });
    observer.observe(toolbar);
    return () => observer.disconnect();
  }, []);

  const changePage = (next: number) => {
    setPage(Math.max(1, Math.min(pageCount, next)));
    requestAnimationFrame(() => {
      const section = sectionRef.current;
      if (!section) return;
      const headerHeight = document.querySelector('header')?.getBoundingClientRect().height ?? 72;
      window.scrollTo({ top: window.scrollY + section.getBoundingClientRect().top - headerHeight - 16, behavior: reduceMotion ? 'instant' : 'smooth' });
      headingRef.current?.focus({ preventScroll: true });
    });
  };

  const city = selectedCity.trim();
  const query = searchQuery.trim();
  const scope = city
    ? `${isID ? 'di' : 'in'} ${city}`
    : query
      ? `${isID ? 'untuk' : 'for'} “${query}”`
      : (isID ? 'di Indonesia' : 'across Indonesia');
  const nounSet = categoryNouns[selectedCategory] ?? categoryNouns.ALL;
  const noun = isID ? nounSet.id : nounSet.en[hotels.length === 1 ? 0 : 1];
  const tabLabels: Record<string, string> = {
    ALL: isID ? 'Semua' : 'All stays', Hotel: isID ? 'Hotel' : 'Hotels', Villa: isID ? 'Vila' : 'Villas', Apartment: isID ? 'Apartemen' : 'Apartments',
  };
  const filterLabel = isID ? 'Filter' : 'Filters';
  const viewButtonClass = (active: boolean) => `flex size-11 cursor-pointer items-center justify-center rounded-full transition-colors duration-150 ${active ? 'bg-navy-soft text-navy-dark' : 'text-slate-500 hover:text-navy-dark'}`;

  return (
    <section ref={sectionRef} className="min-w-0 pb-10" aria-labelledby="explore-results-heading" data-explore-results>
      <div className="flex flex-col gap-1 lg:flex-row lg:items-baseline lg:justify-between lg:gap-8">
        <h2 ref={headingRef} tabIndex={-1} id="explore-results-heading" className="min-w-0 break-words font-serif text-[27px] leading-[1.18] tracking-[-0.03em] text-navy-dark sm:text-[33px]">
          {hotels.length > 0
            ? <><span data-explore-result-count>{hotels.length}</span> {noun} <span className="italic text-gold">{scope}</span></>
            : <>{isID ? 'Belum ada yang cocok' : 'No matches yet'} <span className="italic text-gold">{scope}</span></>}
        </h2>
        <p className="text-sm leading-5 text-slate-500 lg:shrink-0" role="status" aria-live="polite">
          {hotels.length
            ? (isID ? `Menampilkan ${start + 1}–${Math.min(start + PAGE_SIZE, hotels.length)} dari ${hotels.length} penginapan` : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, hotels.length)} of ${hotels.length} stays`)
            : (isID ? 'Longgarkan filter untuk melihat lebih banyak pilihan' : 'Loosen your filters to see more options')}
        </p>
      </div>

      <div ref={toolbarRef} className="mt-3.5 flex flex-col gap-3 lg:mt-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="explore-no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 max-lg:order-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0" role="group" aria-label={isID ? 'Jenis penginapan' : 'Property type'} data-explore-category-tabs>
          {categories.map(category => {
            const active = selectedCategory === category;
            const Icon = categoryIcons[category] ?? LayoutGrid;
            return (
              <button key={category} type="button" aria-pressed={active} onClick={() => onSelectCategory(category)} className={`inline-flex min-h-12 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-[13.5px] font-semibold transition-colors duration-200 ${active ? 'border-navy-dark bg-navy-dark text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-gold/45 hover:text-navy-dark'}`}>
                <Icon className={`size-4 ${active ? 'text-gold-light' : 'text-gold'}`} aria-hidden />
                {tabLabels[category] || category}
                <span className={`text-xs font-medium tabular-nums ${active ? 'text-white/75' : 'text-slate-500'}`}>{categoryCounts[category] || 0}</span>
              </button>
            );
          })}
        </div>
        <div className="flex min-w-0 items-center gap-2 max-lg:order-1 lg:shrink-0">
          <button type="button" onClick={onOpenFilters} className="inline-flex min-h-12 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[13px] font-semibold text-navy-dark transition-colors duration-200 hover:border-gold/40 xl:hidden" data-explore-open-filters>
            <SlidersHorizontal className="size-4 text-gold" aria-hidden />{filterLabel}
            {panelFilterCount > 0 && <span className="flex size-5 items-center justify-center rounded-full bg-navy-dark text-[11px] tabular-nums text-white">{panelFilterCount}</span>}
          </button>
          <div className="min-w-0 flex-1 lg:w-[196px] lg:flex-none"><ExploreSortPicker isID={isID} value={sortBy} onChange={onSortChange} /></div>
          <div className="flex shrink-0 rounded-full border border-slate-200 bg-white p-px" role="group" aria-label={isID ? 'Tampilan hasil' : 'Results view'}>
            <button type="button" onClick={() => setView('grid')} aria-pressed={view === 'grid'} aria-label={isID ? 'Tampilan grid' : 'Grid view'} className={viewButtonClass(view === 'grid')}><LayoutGrid className="size-4" aria-hidden /></button>
            <button type="button" onClick={() => setView('list')} aria-pressed={view === 'list'} aria-label={isID ? 'Tampilan daftar' : 'List view'} className={viewButtonClass(view === 'list')}><List className="size-4" aria-hidden /></button>
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-3.5 flex min-w-0 flex-wrap items-center gap-2" aria-label={isID ? 'Filter aktif' : 'Active filters'} data-explore-active-filters>
          {chips.map(chip => (
            <button key={chip.key} type="button" onClick={chip.remove} aria-label={`${isID ? 'Hapus filter' : 'Remove filter'} ${chip.label}`} className="relative inline-flex min-h-9 min-w-0 max-w-full cursor-pointer items-center gap-1.5 rounded-full bg-gold-soft/70 pl-3 pr-2 text-xs font-semibold text-gold-dark transition-colors duration-150 after:absolute after:inset-x-0 after:-inset-y-1 hover:bg-gold-soft">
              <span className="min-w-0 truncate">{chip.label}</span><X className="size-3.5 shrink-0" aria-hidden />
            </button>
          ))}
          <button type="button" onClick={onReset} className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-1.5 text-xs font-semibold text-slate-500 transition-colors duration-150 hover:text-navy-dark"><RotateCcw className="size-3.5" aria-hidden />{isID ? 'Bersihkan semua' : 'Clear all'}</button>
        </div>
      )}

      {roomFiltersActive && hotels.length > 0 && <p className="mt-2 text-[13px] leading-5 text-slate-500">{isID ? 'Harga dan spesifikasi mengikuti kamar yang cocok dengan kriteriamu.' : 'Prices and specifications reflect the rooms that match your criteria.'}</p>}

      {hotels.length === 0 ? (
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.2 }} className="mt-5 flex flex-col items-center rounded-[26px] border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center sm:py-20" data-explore-empty>
          <span className="mb-5 flex size-16 items-center justify-center rounded-full bg-gold-soft/70 text-gold-dark"><SearchX className="size-7" aria-hidden /></span>
          <h3 className="font-serif text-[26px] tracking-[-0.02em] text-navy-dark">{isID ? 'Coba pilihan yang berbeda' : 'Try a different direction'}</h3>
          <p className="mt-3 max-w-[360px] text-[15px] leading-6 text-slate-600">{isID ? 'Sesuaikan kota, rentang harga, atau jumlah tamu untuk menemukan penginapan yang cocok.' : 'Adjust your city, budget, or guest count to find a stay that suits your plans.'}</p>
          <button type="button" onClick={onReset} className="group mt-6 inline-flex min-h-12 cursor-pointer items-center gap-3 rounded-full bg-navy-dark px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-navy">{isID ? 'Reset semua filter' : 'Reset all filters'}<ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden /></button>
        </motion.div>
      ) : <>
        {/* Keyed so a view or page change swaps the whole grid instead of overlapping two layouts. */}
        <motion.div
          key={`${view}-${currentPage}`}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduceMotion ? { duration: 0 } : fadeTween}
          className={`mt-5 grid min-w-0 grid-cols-1 gap-4 sm:gap-5 ${view === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : ''}`}
          data-explore-grid
          data-view={view}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {visibleHotels.map((hotel, index) => (
              <motion.div
                key={hotel.id}
                layout={reduceMotion ? false : 'position'}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={reduceMotion ? { duration: 0 } : { ...fadeTween, delay: Math.min(index, 8) * 0.018 }}
                className="min-w-0"
                data-explore-card
                data-hotel-id={hotel.id}
              >
                <ExploreHotelCard layout={view} hotel={hotel} previewRoom={matchingRoomsByHotel?.[hotel.id]} isWishlisted={wishlistIds.includes(hotel.id)} onToggleWishlist={onToggleWishlist} onSelect={onSelectHotel} language={language} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {pageCount > 1 && (
          <nav className="mt-9 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-6 sm:flex-row" aria-label={isID ? 'Halaman hasil penginapan' : 'Stay results pages'} data-explore-pagination>
            <p className="text-sm text-slate-500">{isID ? 'Halaman' : 'Page'} <span className="font-semibold tabular-nums text-navy-dark">{currentPage}</span> {isID ? 'dari' : 'of'} <span className="tabular-nums">{pageCount}</span></p>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1} aria-label={isID ? 'Halaman sebelumnya' : 'Previous page'} className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-navy-dark transition-colors duration-150 hover:border-gold/50 disabled:cursor-default disabled:opacity-40 disabled:hover:border-slate-200"><ArrowLeft className="size-4" aria-hidden /></button>
              <span className="px-3 text-sm font-semibold tabular-nums text-navy-dark sm:hidden">{currentPage} / {pageCount}</span>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map(number => (
                <button key={number} type="button" onClick={() => changePage(number)} aria-current={currentPage === number ? 'page' : undefined} aria-label={isID ? `Halaman ${number}` : `Page ${number}`} className={`hidden size-11 cursor-pointer items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors duration-150 sm:flex ${currentPage === number ? 'bg-navy-dark text-white' : 'text-slate-500 hover:bg-navy-soft hover:text-navy-dark'}`}>{number}</button>
              ))}
              <button type="button" onClick={() => changePage(currentPage + 1)} disabled={currentPage === pageCount} aria-label={isID ? 'Halaman berikutnya' : 'Next page'} className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-navy-dark transition-colors duration-150 hover:border-gold/50 disabled:cursor-default disabled:opacity-40 disabled:hover:border-slate-200"><ArrowRight className="size-4" aria-hidden /></button>
            </div>
          </nav>
        )}
      </>}

      <div className="pointer-events-none sticky bottom-5 z-30 flex h-0 justify-center xl:hidden" data-explore-floating-filter>
        <AnimatePresence>
          {!toolbarInView && hotels.length > 0 && (
            <motion.button
              type="button"
              onClick={onOpenFilters}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 12 }}
              transition={reduceMotion ? { duration: 0 } : fadeTween}
              className="pointer-events-auto absolute bottom-0 inline-flex min-h-12 cursor-pointer items-center gap-2.5 rounded-full bg-navy-dark px-5 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(12,31,59,0.32)]"
            >
              <SlidersHorizontal className="size-4 text-gold-light" aria-hidden />{filterLabel}
              {panelFilterCount > 0 && <span className="flex size-5 items-center justify-center rounded-full bg-gold-light text-[11px] tabular-nums text-navy-dark">{panelFilterCount}</span>}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
