import React from 'react';
import { motion } from 'motion/react';
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
}) => (
  <motion.section
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.6 }}
    className="relative bg-white border-b border-slate-100"
  >
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 2xl:px-16 pt-12 pb-8 sm:pt-16 sm:pb-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">

        {/* Left: Typography */}
        <div className="space-y-4 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2"
          >
            <div className="h-px w-8 bg-amber-500" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-amber-600">
              {isID ? 'Koleksi Eksklusif' : 'Curated Collection'}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-light text-slate-900 tracking-tight leading-[1.1]"
          >
            {isID
              ? <>Temukan <span className="font-semibold italic">Penginapan</span> Sempurna</>
              : <>Find Your <span className="font-semibold italic">Perfect</span> Stay</>
            }
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-slate-500 leading-relaxed max-w-md font-light"
          >
            {isID
              ? 'Jaminan harga terbaik dengan ulasan terverifikasi. Ribuan pilihan eksklusif untuk pengalaman menginap yang tak terlupakan.'
              : 'Best price guarantee with verified reviews. Thousands of exclusive choices for an unforgettable stay experience.'}
          </motion.p>
        </div>

        {/* Right: Refined Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="w-full lg:w-auto lg:min-w-[560px]"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_20px_rgba(0,0,0,0.04)] p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-shadow duration-300">

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder={isID ? 'Cari hotel atau destinasi...' : 'Search hotel or destination...'}
                className="w-full pl-11 pr-9 py-3.5 bg-transparent text-slate-900 placeholder-slate-400 text-[13px] font-medium focus:outline-none rounded-xl focus:bg-slate-50/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchQueryChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-slate-200" />

            {/* City Selector */}
            <div className="relative shrink-0 sm:min-w-[160px]">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedCity}
                onChange={(e) => onSelectCity(e.target.value)}
                className="w-full sm:w-auto pl-11 pr-10 py-3.5 bg-transparent text-slate-900 font-medium text-[13px] focus:outline-none cursor-pointer appearance-none rounded-xl hover:bg-slate-50/50 transition-colors"
              >
                <option value="">{isID ? 'Semua Kota' : 'All Cities'}</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Search Button */}
            <button className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold rounded-xl transition-colors duration-200 shrink-0">
              {isID ? 'Cari' : 'Search'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  </motion.section>
);

export const ExploreHero = React.memo(ExploreHeroComponent);
