import React, { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Search, MapPin, ChevronDown, X } from 'lucide-react';

interface ExploreHeroProps {
  isID: boolean;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  selectedCity: string;
  onSelectCity: (city: string) => void;
  cities: string[];
}

const ExploreHeroComponent: React.FC<ExploreHeroProps> = ({
  isID,
  searchQuery,
  onSearchQueryChange,
  selectedCity,
  onSelectCity,
  cities
}) => {
  const reduceMotion = useReducedMotion();
  const searchId = useId();
  const cityId = useId();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="relative bg-white border-b border-navy-soft"
    >
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 pt-10 pb-8 sm:pt-14 sm:pb-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <p className="text-[12px] font-semibold tracking-[0.16em] uppercase text-gold">
              {isID ? 'Koleksi eksklusif' : 'Curated collection'}
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] text-navy tracking-tight leading-[1.15]">
              {isID
                ? <>Temukan <span className="italic text-gold">penginapan</span> sempurna</>
                : <>Find your <span className="italic text-gold">perfect</span> stay</>}
            </h1>
            <p className="text-[15px] text-slate-600 leading-relaxed max-w-md">
              {isID
                ? 'Jaminan harga terbaik dengan ulasan terverifikasi. Ribuan pilihan kurasi untuk menginap yang nyaman.'
                : 'Best price guarantee with verified reviews. Thousands of curated stays, ready when you are.'}
            </p>
          </div>

          <form
            className="w-full lg:w-auto lg:min-w-[560px]"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="bg-white rounded-2xl border border-navy-soft shadow-[0_12px_40px_rgba(30,58,138,0.08)] p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <label htmlFor={searchId} className="sr-only">
                  {isID ? 'Cari hotel atau destinasi' : 'Search hotel or destination'}
                </label>
                <Search className="w-4 h-4 text-gold absolute left-4 top-1/2 -translate-y-1/2" aria-hidden />
                <input
                  id={searchId}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  placeholder={isID ? 'Cari hotel atau destinasi...' : 'Search hotel or destination...'}
                  className="w-full min-h-12 pl-11 pr-10 py-3 bg-transparent text-navy placeholder-slate-400 text-[14px] font-medium focus:outline-none rounded-xl"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchQueryChange('')}
                    aria-label={isID ? 'Hapus pencarian' : 'Clear search'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 min-w-9 min-h-9 inline-flex items-center justify-center text-slate-400 hover:text-navy transition-colors duration-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="hidden sm:block w-px h-8 bg-navy-soft" aria-hidden />

              <div className="relative shrink-0 sm:min-w-[168px]">
                <label htmlFor={cityId} className="sr-only">
                  {isID ? 'Kota' : 'City'}
                </label>
                <MapPin className="w-4 h-4 text-gold absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
                <select
                  id={cityId}
                  value={selectedCity}
                  onChange={(e) => onSelectCity(e.target.value)}
                  className="w-full sm:w-auto min-h-12 pl-11 pr-10 py-3 bg-transparent text-navy font-medium text-[14px] focus:outline-none cursor-pointer appearance-none rounded-xl"
                >
                  <option value="">{isID ? 'Semua kota' : 'All cities'}</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
              </div>

              <button
                type="submit"
                className="min-h-12 px-6 py-3 bg-gold hover:bg-gold-dark text-white text-[14px] font-semibold rounded-xl transition-colors duration-200 shrink-0 cursor-pointer"
              >
                {isID ? 'Cari' : 'Search'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.section>
  );
};

export const ExploreHero = React.memo(ExploreHeroComponent);
