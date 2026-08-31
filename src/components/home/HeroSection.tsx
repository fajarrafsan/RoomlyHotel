import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Sparkles, MapPin, Search, Users, User, Baby,
  Building, Building2, Home, CalendarDays, ArrowRight,
  Minus, Plus, ChevronDown
} from 'lucide-react';
import { Language, DashboardView } from '../../types';
import { blurUp, staggerContainer, easeOutSoft } from './animations';
import { pillTween } from '../../lib/motion';
import { getTodayDateString, getTomorrowDateString } from '../../lib/utils';

interface HeroSectionProps {
  language: Language;
  searchCity: string;
  onSearchCityChange: (city: string) => void;
  onNavigateTo: (view: DashboardView) => void;
}

const QUICK_CITIES = ['Bali', 'Jakarta', 'Bandung', 'Tokyo'] as const;

export const HeroSection: React.FC<HeroSectionProps> = ({
  language, searchCity, onSearchCityChange, onNavigateTo
}) => {
  const isID = language === 'ID';
  const reduceMotion = useReducedMotion();
  const [activeCategoryTab, setActiveCategoryTab] = useState<'hotel' | 'villa' | 'apartment'>('hotel');
  const [heroDestination, setHeroDestination] = useState<string>(searchCity || 'Jakarta');
  const [checkInDate, setCheckInDate] = useState<string>(getTodayDateString());
  const [checkOutDate, setCheckOutDate] = useState<string>(getTomorrowDateString());
  const [adultCount, setAdultCount] = useState<number>(2);
  const [childCount, setChildCount] = useState<number>(0);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);

  const handleHeroSearch = () => {
    onSearchCityChange(heroDestination || 'Jakarta');
    onNavigateTo('explore');
  };

  const handleQuickCity = (city: string) => {
    setHeroDestination(city);
    onSearchCityChange(city);
    onNavigateTo('explore');
  };

  const totalGuests = adultCount + childCount;

  useEffect(() => {
    if (!showGuestDropdown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowGuestDropdown(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showGuestDropdown]);

  return (
    <section className="relative -mt-6 -mx-4 sm:-mx-6 lg:-mx-8 min-h-[640px] flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1920&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0B1B3A]/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1B3A]/40 via-[#0B1B3A]/20 to-[#F8FAFC]" />
      </div>

      <div className="relative z-30 max-w-[1400px] mx-auto w-full px-4 sm:px-8 lg:px-12 pt-14 pb-28">
        <motion.div
          variants={staggerContainer}
          initial={reduceMotion ? false : 'initial'}
          animate="animate"
          className="text-center space-y-5 max-w-3xl mx-auto"
        >
          <motion.div variants={blurUp} transition={{ duration: 0.35, ease: easeOutSoft }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/12 backdrop-blur-md border border-white/20 rounded-full text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-light">
              <Sparkles className="w-3.5 h-3.5 text-gold-light" aria-hidden />
              {isID ? 'Koleksi Roomly 2026' : 'Roomly Collection 2026'}
            </span>
          </motion.div>
          <motion.h1
            variants={blurUp}
            transition={{ duration: 0.45, ease: easeOutSoft }}
            className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] text-white tracking-tight leading-[1.08]"
          >
            {isID ? (
              <>Temukan <span className="italic text-gold-light">menginap</span> terbaik</>
            ) : (
              <>Find your next <span className="italic text-gold-light">stay</span></>
            )}
          </motion.h1>
          <motion.p
            variants={blurUp}
            transition={{ duration: 0.4, ease: easeOutSoft }}
            className="text-[15px] sm:text-base text-white/85 font-normal max-w-xl mx-auto leading-relaxed"
          >
            {isID
              ? 'Hotel, resor, dan vila kurasi — konfirmasi instan, tarif member, tanpa ribet.'
              : 'Curated hotels, resorts, and villas — instant confirmation, member rates, no fuss.'}
          </motion.p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16, ease: easeOutSoft }}
          className="mt-10 max-w-5xl mx-auto"
        >
          <div className="flex justify-center mb-3">
            <div
              role="tablist"
              aria-label={isID ? 'Jenis properti' : 'Property type'}
              className="inline-flex items-center gap-1 p-1 bg-white/12 backdrop-blur-md rounded-full border border-white/20"
            >
              {([
                { id: 'hotel' as const, label: isID ? 'Hotel' : 'Hotels', icon: Building },
                { id: 'villa' as const, label: isID ? 'Vila' : 'Villas', icon: Home },
                { id: 'apartment' as const, label: isID ? 'Apartemen' : 'Apartments', icon: Building2 }
              ]).map((tab) => {
                const active = activeCategoryTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveCategoryTab(tab.id)}
                    className={`relative min-h-11 px-4 py-2 rounded-full text-[13px] font-medium transition-colors duration-200 flex items-center gap-1.5 cursor-pointer ${active ? 'text-[#1E3A8A]' : 'text-white/80 hover:text-white'}`}
                  >
                    {active && (
                      <motion.span
                        layoutId={reduceMotion ? undefined : 'activeCategoryPill'}
                        className="absolute inset-0 bg-white rounded-full shadow-sm"
                        transition={pillTween}
                      />
                    )}
                    <tab.icon className="w-3.5 h-3.5 relative z-10" aria-hidden />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleHeroSearch();
            }}
            className="bg-white rounded-2xl sm:rounded-3xl p-2 sm:p-2 shadow-[0_20px_50px_rgba(11,27,58,0.22)] border border-white"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-0 items-stretch">
              <div className="md:col-span-3 p-3 sm:p-4 md:border-r border-slate-100">
                <label htmlFor="hero-destination" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  {isID ? 'Destinasi' : 'Destination'}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-0 top-1/2 -translate-y-1/2 text-gold pointer-events-none" aria-hidden />
                  <input
                    id="hero-destination"
                    type="text"
                    value={heroDestination}
                    onChange={(e) => setHeroDestination(e.target.value)}
                    placeholder={isID ? 'Bali, Jakarta, Tokyo...' : 'Bali, Tokyo, Paris...'}
                    autoComplete="off"
                    className="w-full min-h-11 pl-6 pr-2 py-1 bg-transparent text-[15px] font-semibold text-[#1E3A8A] placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-4 p-3 sm:p-4 md:border-r border-slate-100 border-t md:border-t-0">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  {isID ? 'Tanggal menginap' : 'Stay dates'}
                </span>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <label htmlFor="hero-checkin" className="sr-only">{isID ? 'Check-in' : 'Check-in'}</label>
                    <CalendarDays className="w-4 h-4 absolute left-0 top-1/2 -translate-y-1/2 text-gold pointer-events-none" aria-hidden />
                    <input
                      id="hero-checkin"
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full min-h-11 min-w-0 pl-6 pr-0 py-1 bg-transparent text-[13px] font-semibold text-[#1E3A8A] focus:outline-none cursor-pointer"
                    />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0 hidden sm:block" aria-hidden />
                  <div className="relative flex-1 min-w-0">
                    <label htmlFor="hero-checkout" className="sr-only">{isID ? 'Check-out' : 'Check-out'}</label>
                    <CalendarDays className="w-4 h-4 absolute left-0 top-1/2 -translate-y-1/2 text-gold pointer-events-none" aria-hidden />
                    <input
                      id="hero-checkout"
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full min-h-11 min-w-0 pl-6 pr-0 py-1 bg-transparent text-[13px] font-semibold text-[#1E3A8A] focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-3 p-3 sm:p-4 border-t md:border-t-0">
                <span id="hero-guests-label" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  {isID ? 'Tamu & kamar' : 'Guests & rooms'}
                </span>
                <button
                  type="button"
                  aria-labelledby="hero-guests-label"
                  aria-expanded={showGuestDropdown}
                  aria-controls="hero-guest-panel"
                  onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                  className="w-full min-h-11 flex items-center gap-2.5 text-left group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#E9EEF5] flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors duration-200">
                    <Users className="w-4 h-4 text-[#1E3A8A]" aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-[#1E3A8A] truncate">
                      {totalGuests} {isID ? 'tamu' : 'guests'}
                    </p>
                    <p className="text-[12px] text-slate-500 truncate">
                      {adultCount} {isID ? 'dewasa' : 'adults'}
                      {childCount > 0 ? `, ${childCount} ${isID ? 'anak' : 'children'}` : ''}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${showGuestDropdown ? 'rotate-180' : ''}`} aria-hidden />
                </button>
              </div>

              <div className="md:col-span-2 p-2 flex items-end">
                <motion.button
                  type="submit"
                  whileHover={reduceMotion ? undefined : { scale: 1.015 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  className="w-full min-h-12 md:min-h-[56px] rounded-xl bg-gold hover:bg-gold-dark text-white flex items-center justify-center gap-2 cursor-pointer transition-colors duration-200 shadow-md shadow-gold/25"
                >
                  <Search className="w-4 h-4" aria-hidden />
                  <span className="text-[14px] font-semibold">
                    {isID ? 'Cari' : 'Search'}
                  </span>
                </motion.button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {showGuestDropdown && (
                <motion.div
                  id="hero-guest-panel"
                  role="region"
                  aria-label={isID ? 'Jumlah tamu' : 'Guest count'}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: easeOutSoft }}
                >
                  <div className="mx-2 mb-2 mt-1 rounded-2xl border border-navy-soft bg-navy-soft/50 p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                            <User className="w-4 h-4 text-navy" aria-hidden />
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-navy">{isID ? 'Dewasa' : 'Adults'}</p>
                            <p className="text-[12px] text-slate-500">{isID ? 'Usia 13+' : 'Age 13+'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAdultCount(Math.max(1, adultCount - 1))}
                            disabled={adultCount <= 1}
                            aria-label={isID ? 'Kurangi dewasa' : 'Decrease adults'}
                            className="w-11 h-11 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-navy hover:bg-white transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" aria-hidden />
                          </button>
                          <span className="text-sm font-bold text-navy w-5 text-center" aria-live="polite">{adultCount}</span>
                          <button
                            type="button"
                            onClick={() => setAdultCount(Math.min(20, adultCount + 1))}
                            aria-label={isID ? 'Tambah dewasa' : 'Increase adults'}
                            className="w-11 h-11 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-navy transition-colors duration-200 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                            <Baby className="w-4 h-4 text-navy" aria-hidden />
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-navy">{isID ? 'Anak' : 'Children'}</p>
                            <p className="text-[12px] text-slate-500">{isID ? 'Usia 0-12' : 'Age 0-12'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setChildCount(Math.max(0, childCount - 1))}
                            disabled={childCount <= 0}
                            aria-label={isID ? 'Kurangi anak' : 'Decrease children'}
                            className="w-11 h-11 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-navy transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" aria-hidden />
                          </button>
                          <span className="text-sm font-bold text-navy w-5 text-center" aria-live="polite">{childCount}</span>
                          <button
                            type="button"
                            onClick={() => setChildCount(Math.min(10, childCount + 1))}
                            aria-label={isID ? 'Tambah anak' : 'Increase children'}
                            className="w-11 h-11 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-navy transition-colors duration-200 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[12px] text-white/70 font-medium mr-1">
              {isID ? 'Populer:' : 'Popular:'}
            </span>
            {QUICK_CITIES.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => handleQuickCity(city)}
                className="min-h-9 px-3.5 py-1.5 rounded-full bg-white/14 hover:bg-white/24 border border-white/25 text-[13px] font-medium text-white transition-colors duration-200 cursor-pointer"
              >
                {city}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
