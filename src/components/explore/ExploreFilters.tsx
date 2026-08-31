import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { SlidersHorizontal, ArrowUpDown, ChevronDown, RotateCcw, Star } from 'lucide-react';
import { ExploreSort } from './useHotelFilters';

interface ExploreFiltersProps {
  isID: boolean;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  sortBy: ExploreSort;
  onSortChange: (sort: ExploreSort) => void;
  minRating: number;
  onMinRatingChange: (rating: number) => void;
  showAdvancedFilters: boolean;
  onToggleAdvanced: () => void;
  hasActiveFilters: boolean;
  onReset: () => void;
}

const ExploreFiltersComponent: React.FC<ExploreFiltersProps> = ({
  isID,
  categories,
  selectedCategory,
  onSelectCategory,
  sortBy,
  onSortChange,
  minRating,
  onMinRatingChange,
  showAdvancedFilters,
  onToggleAdvanced,
  hasActiveFilters,
  onReset
}) => {
  const reduceMotion = useReducedMotion();
  const sortId = 'explore-sort';

  return (
    <div className="sticky top-[5.25rem] sm:top-[6rem] z-30 bg-white/95 backdrop-blur-sm border-b border-navy-soft">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 py-3.5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 w-full lg:w-auto" role="tablist" aria-label={isID ? 'Kategori' : 'Category'}>
            {categories.map((cat) => {
              const isCatActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={isCatActive}
                  onClick={() => onSelectCategory(cat)}
                  className={`min-h-11 px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors duration-200 cursor-pointer ${
                    isCatActive
                      ? 'bg-navy text-white'
                      : 'bg-transparent text-slate-600 hover:text-navy hover:bg-navy-soft'
                  }`}
                >
                  {cat === 'ALL' ? (isID ? 'Semua' : 'All') : cat}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
            <button
              type="button"
              onClick={onToggleAdvanced}
              aria-expanded={showAdvancedFilters}
              className={`inline-flex items-center gap-2 min-h-11 px-4 py-2 rounded-full text-[13px] font-medium transition-colors duration-200 cursor-pointer ${
                showAdvancedFilters || minRating > 0
                  ? 'bg-gold-soft text-gold ring-1 ring-gold/25'
                  : 'text-slate-600 hover:text-navy hover:bg-navy-soft'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden />
              <span>{isID ? 'Filter' : 'Filters'}</span>
              {minRating > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden />
              )}
            </button>

            <div className="relative">
              <label htmlFor={sortId} className="sr-only">{isID ? 'Urutkan' : 'Sort'}</label>
              <div className="inline-flex items-center gap-2 min-h-11 px-4 py-2 rounded-full text-[13px] font-medium text-slate-600 hover:text-navy hover:bg-navy-soft transition-colors duration-200">
                <ArrowUpDown className="w-3.5 h-3.5" aria-hidden />
                <select
                  id={sortId}
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value as ExploreSort)}
                  className="appearance-none bg-transparent pr-4 focus:outline-none cursor-pointer font-medium text-[13px] text-inherit"
                >
                  <option value="recommended">{isID ? 'Rekomendasi' : 'Recommended'}</option>
                  <option value="price-asc">{isID ? 'Harga: rendah' : 'Price: low'}</option>
                  <option value="price-desc">{isID ? 'Harga: tinggi' : 'Price: high'}</option>
                  <option value="rating">{isID ? 'Rating' : 'Rating'}</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" aria-hidden />
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1.5 min-h-11 px-3 py-2 rounded-full text-[13px] font-medium text-rose-700 hover:bg-rose-50 transition-colors duration-200 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden />
                <span className="hidden sm:inline">{isID ? 'Reset' : 'Reset'}</span>
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="pt-3 mt-3 border-t border-navy-soft flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
                  {isID ? 'Rating minimum' : 'Minimum rating'}
                </span>
                {[0, 4.0, 4.5].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => onMinRatingChange(rate)}
                    className={`min-h-10 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors duration-200 cursor-pointer ${
                      minRating === rate
                        ? 'bg-navy text-white'
                        : 'bg-navy-soft/70 text-slate-600 hover:bg-navy-soft'
                    }`}
                  >
                    {rate === 0
                      ? (isID ? 'Semua' : 'Any')
                      : (
                        <span className="inline-flex items-center gap-1">
                          {rate}+ <Star className="w-3 h-3 fill-gold text-gold" aria-hidden />
                        </span>
                      )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const ExploreFilters = React.memo(ExploreFiltersComponent);
