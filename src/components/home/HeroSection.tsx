import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, MapPin, Search, Users, User, Baby,
  Building, Building2, Home, CalendarDays, ArrowRight,
  Minus, Plus, ChevronDown
} from 'lucide-react';
import { Language, DashboardView } from '../../types';
import { blurUp, staggerContainer } from './animations';
import { getTodayDateString, getTomorrowDateString } from '../../lib/utils';

interface HeroSectionProps {
  language: Language;
  searchCity: string;
  onSearchCityChange: (city: string) => void;
  onNavigateTo: (view: DashboardView) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  language, searchCity, onSearchCityChange, onNavigateTo
}) => {
  const isID = language === 'ID';
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

  const totalGuests = adultCount + childCount;

  return (
    <div className="relative -mt-6 -mx-4 sm:-mx-6 lg:-mx-8 min-h-[560px] flex items-center justify-center overflow-hidden">
      {/* Background — plain CSS animation (not Motion/JS-driven) so this
          always-on decorative loop runs on the compositor thread instead of
          competing with scroll for main-thread time. */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-ken-burns"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=90)' }}
      />
      <div className="absolute inset-0 bg-slate-950/60" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/80" />

      <div className="relative z-10 max-w-[1400px] mx-auto w-full px-4 sm:px-8 lg:px-12 pt-14 pb-20">
        {/* Hero Content */}
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="text-center space-y-6 max-w-3xl mx-auto">
          <motion.div variants={blurUp} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {isID ? 'Platform Reservasi Eksklusif' : 'Exclusive Reservation Platform'}
            </span>
          </motion.div>
          <motion.h1 variants={blurUp} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-tight leading-[1.15]">
            {isID ? (
              <>Temukan <span className="font-serif italic font-normal">Penginapan</span><br /><span className="font-semibold">Sempurna Anda</span></>
            ) : (
              <>Discover Your<br /><span className="font-serif italic font-normal">Perfect</span> <span className="font-semibold">Stay</span></>
            )}
          </motion.h1>
          <motion.p variants={blurUp} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xs sm:text-sm text-white/70 font-light max-w-lg mx-auto leading-relaxed">
            {isID
              ? 'Kurasi hotel bintang lima, resor pribadi, dan vila mewah dengan harga eksklusif dan konfirmasi instan.'
              : 'Curated five-star hotels, private resorts, and luxury villas with exclusive rates and instant confirmation.'}
          </motion.p>
        </motion.div>

        {/* Search Widget */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 18, delay: 0.35 }}
          className="mt-10 max-w-5xl mx-auto">

          {/* Category Tabs */}
          <div className="flex justify-center mb-3">
            <div className="inline-flex items-center gap-1 p-1 bg-white/10 backdrop-blur-xl rounded-full border border-white/10">
              {([
                { id: 'hotel' as const, label: isID ? 'Hotel' : 'Hotels', icon: Building },
                { id: 'villa' as const, label: isID ? 'Vila' : 'Villas', icon: Home },
                { id: 'apartment' as const, label: isID ? 'Apartemen' : 'Apartments', icon: Building2 }
              ]).map((tab) => {
                const active = activeCategoryTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveCategoryTab(tab.id)}
                    className={`relative px-4 py-2 rounded-full text-[12px] font-medium transition-colors duration-300 flex items-center gap-1.5 cursor-pointer ${active ? 'text-slate-900' : 'text-white/70 hover:text-white'}`}>
                    {active && (
                      <motion.span layoutId="activeCategoryPill"
                        className="absolute inset-0 bg-white rounded-full shadow-md shadow-black/20"
                        transition={{ type: 'spring', stiffness: 500, damping: 34 }} />
                    )}
                    <tab.icon className="w-3.5 h-3.5 relative z-10" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-2xl p-2 sm:p-1.5 shadow-xl shadow-black/20">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-0 items-center">
              
              {/* Destination */}
              <div className="md:col-span-3 p-2.5 sm:p-3 lg:p-4 md:border-r border-slate-100">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  {isID ? 'Destinasi' : 'Destination'}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="text" value={heroDestination} onChange={(e) => setHeroDestination(e.target.value)}
                    placeholder={isID ? 'Bali, Jakarta, Tokyo...' : 'Bali, Tokyo, Paris...'}
                    className="w-full pl-6 pr-2 py-0.5 bg-transparent text-[13px] font-semibold text-slate-900 placeholder-slate-300 focus:outline-none" />
                </div>
              </div>

              {/* Dates (Responsive vertical stack on 320px screens) */}
              <div className="md:col-span-4 p-2.5 sm:p-3 lg:p-4 md:border-r border-slate-100 border-t md:border-t-0 border-slate-50">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  {isID ? 'Tanggal Menginap' : 'Stay Dates'}
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-1.5">
                  <div className="relative flex-1 min-w-0">
                    <CalendarDays className="w-3.5 h-3.5 absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full min-w-0 pl-5 pr-0 py-0.5 bg-transparent text-[11px] sm:text-[12px] font-semibold text-slate-900 focus:outline-none cursor-pointer" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0 hidden sm:block" />
                  <div className="relative flex-1 min-w-0">
                    <CalendarDays className="w-3.5 h-3.5 absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="date" value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full min-w-0 pl-5 pr-0 py-0.5 bg-transparent text-[11px] sm:text-[12px] font-semibold text-slate-900 focus:outline-none cursor-pointer" />
                  </div>
                </div>
              </div>

              {/* GUESTS & ROOMS (Expanded space: md:col-span-4) */}
              <div className="md:col-span-4 p-2.5 sm:p-3 lg:p-4 relative border-t md:border-t-0 border-slate-50">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                  {isID ? 'Tamu & Pilihan Kamar' : 'Guests & Rooms'}
                </label>
                
                {/* Trigger */}
                <button onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                  className="w-full flex items-center gap-2.5 text-left group">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-slate-100 transition-colors">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">
                      {totalGuests} {isID ? 'tamu' : 'guests'} · {activeCategoryTab === 'hotel' ? (isID ? 'Semua Kamar' : 'All Rooms') : activeCategoryTab === 'villa' ? 'Vila' : 'Apartemen'}
                    </p>
                    <p className="text-[11px] text-slate-400 font-light truncate">
                      {adultCount} {isID ? 'dewasa' : 'adults'}
                      {childCount > 0 ? `, ${childCount} ${isID ? 'anak' : 'children'}` : ''}
                    </p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${showGuestDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {showGuestDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowGuestDropdown(false)} />
                      <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }} transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 p-4 z-50">
                        
                        {/* Adults */}
                        <div className="flex items-center justify-between py-3 border-b border-slate-50">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
                              <User className="w-4 h-4 text-slate-500" />
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-slate-900">{isID ? 'Dewasa' : 'Adults'}</p>
                              <p className="text-[11px] text-slate-400 font-light">{isID ? 'Usia 13+' : 'Age 13+'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => setAdultCount(Math.max(1, adultCount - 1))} disabled={adultCount <= 1}
                              className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-sm font-bold text-slate-900 w-4 text-center">{adultCount}</span>
                            <button onClick={() => setAdultCount(Math.min(20, adultCount + 1))}
                              className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-all">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Children */}
                        <div className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
                              <Baby className="w-4 h-4 text-slate-500" />
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-slate-900">{isID ? 'Anak' : 'Children'}</p>
                              <p className="text-[11px] text-slate-400 font-light">{isID ? 'Usia 0-12' : 'Age 0-12'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => setChildCount(Math.max(0, childCount - 1))} disabled={childCount <= 0}
                              className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-sm font-bold text-slate-900 w-4 text-center">{childCount}</span>
                            <button onClick={() => setChildCount(Math.min(10, childCount + 1))}
                              className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-all">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <button onClick={() => setShowGuestDropdown(false)}
                          className="w-full mt-2 py-2.5 rounded-xl bg-slate-900 text-white text-[13px] font-medium hover:bg-slate-800 transition-colors">
                          {isID ? 'Selesai' : 'Done'}
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Search Button */}
              <div className="md:col-span-1 p-1.5">
                <motion.button onClick={handleHeroSearch}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="relative overflow-hidden w-full h-[60px] md:h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center cursor-pointer transition-colors shadow-md shadow-slate-900/20 group"
                  title={isID ? 'Cari' : 'Search'}>
                  <span className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
                  <Search className="w-4 h-4 relative z-10" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Partner Logos — Clean White Luxury Theme */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
            className="relative z-20 mt-10 max-w-4xl mx-auto text-center px-4">
            <div className="inline-flex flex-col items-center gap-3 px-6 py-4 sm:px-10 sm:py-4.5 rounded-full bg-white/95 border border-slate-200/80 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <p className="text-[10px] uppercase font-bold text-amber-700 tracking-[0.25em]">
                {isID ? 'Mitra Hotel Terpilih' : 'Selected Hotel Partners'}
              </p>
              <div className="flex items-center justify-center gap-5 sm:gap-10 flex-wrap">
                {['Swiss-Belhotel', 'ARTOTEL', 'Santika', 'AYANA', "d'prima"].map((brand) => (
                  <span key={brand} className="text-slate-800 font-bold text-xs sm:text-sm tracking-wider hover:text-amber-600 transition-colors">
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-72 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgb(248 250 252) 0%, rgb(248 250 252 / 0.92) 18%, rgb(248 250 252 / 0.6) 42%, rgb(248 250 252 / 0.25) 68%, transparent 100%)' }} />
    </div>
  );
};