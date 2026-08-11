import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
}) => (
  // Same fix as the main Header: this bar is `sticky`, so a blurred backdrop
  // had to be recomposited on every scroll frame. Solid near-opaque white
  // instead — same look, zero ongoing compositing cost.
  <div className="sticky top-0 z-30 bg-white/98 border-b border-slate-100">
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 py-4">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide w-full lg:w-auto">
          {categories.map((cat) => {
            const isCatActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-4 py-2 rounded-full text-[12px] font-medium whitespace-nowrap transition-all duration-200 ${
                  isCatActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {cat === 'ALL' ? (isID ? 'Semua' : 'All') : cat}
              </button>
            );
          })}
        </div>

        {/* Right: Sort & Filter Controls */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">

          {/* Advanced Filter Toggle */}
          <button
            onClick={onToggleAdvanced}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-medium transition-all duration-200 ${
              showAdvancedFilters || minRating > 0
                ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isID ? 'Filter' : 'Filters'}</span>
            {minRating > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as ExploreSort)}
                className="appearance-none bg-transparent pr-4 focus:outline-none cursor-pointer font-medium text-[12px]"
              >
                <option value="recommended">{isID ? 'Rekomendasi' : 'Recommended'}</option>
                <option value="price-asc">{isID ? 'Harga: Rendah' : 'Price: Low'}</option>
                <option value="price-desc">{isID ? 'Harga: Tinggi' : 'Price: High'}</option>
                <option value="rating">{isID ? 'Rating' : 'Rating'}</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
            </div>
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">{isID ? 'Reset' : 'Reset'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Advanced Filters */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {isID ? 'Rating Minimum' : 'Minimum Rating'}
              </span>
              {[0, 4.0, 4.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => onMinRatingChange(rate)}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 ${
                    minRating === rate
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {rate === 0
                    ? (isID ? 'Semua' : 'Any')
                    : <span className="flex items-center gap-1">{rate}+ <Star className="w-3 h-3 fill-amber-400 text-amber-400" /></span>
                  }
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
);

export const ExploreFilters = React.memo(ExploreFiltersComponent);
