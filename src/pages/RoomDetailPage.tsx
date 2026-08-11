import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft, ArrowRight, Maximize2, Bed, Users, Baby, Eye,
  SearchX, CalendarClock, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { Hotel, RoomType, Language } from '../types';
import { RoomCompositionResponse } from '../types/api';
import { mapPolicyGroupsToUI } from '../lib/adapters';
import { formatCurrency } from '../lib/utils';
import { useRoomDetail } from '../components/rooms/useRoomDetail';
import { RoomGallery } from '../components/rooms/RoomGallery';
import { RoomDetailGrid } from '../components/rooms/RoomDetailGrid';

interface RoomDetailPageProps {
  hotels: Hotel[];
  language: Language;
  onBook: (hotel: Hotel, room: RoomType) => void;
}

export const RoomDetailPage: React.FC<RoomDetailPageProps> = ({ hotels, language, onBook }) => {
  const isID = language === 'ID';
  const navigate = useNavigate();
  const { hotelId, roomId } = useParams<{ hotelId: string; roomId: string }>();

  const hotel = hotels.find((h) => h.id === hotelId);
  const room = hotel?.rooms.find((r) => r.id === roomId);

  const {
    gallery, policies, composition, amenityGroups, specialPrices,
    availableToday, loading, activeImage, setActiveImage,
  } = useRoomDetail(room);

  if (!hotel || !room) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-5 py-20">
        <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center">
          <SearchX className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
            {isID ? 'Kamar tidak ditemukan' : 'Room not found'}
          </h2>
          <p className="text-sm text-slate-400 mt-2 font-light leading-relaxed max-w-xs mx-auto">
            {isID ? 'Tautan ini tidak valid atau kamar sudah tidak tersedia.' : 'This link is invalid or the room is no longer available.'}
          </p>
        </div>
        <Link
          to="/explore"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-900 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {isID ? 'Kembali ke Explore' : 'Back to Explore'}
        </Link>
      </div>
    );
  }

  const groupedPolicies = policies.length ? mapPolicyGroupsToUI(policies) : (room.policies || []);
  const compositionByArea = composition.reduce<Record<string, RoomCompositionResponse[]>>((acc, item) => {
    (acc[item.areaType] ||= []).push(item);
    return acc;
  }, {});

  const prevImage = () => setActiveImage((i) => (i - 1 + gallery.length) % gallery.length);
  const nextImage = () => setActiveImage((i) => (i + 1) % gallery.length);

  return (
    <div className="max-w-7xl mx-auto pb-20 px-2 sm:px-6 lg:px-8">
      {/* Back Navigation */}
      <nav className="py-4 sm:py-6 px-2 sm:px-0">
        <button
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 group-hover:border-slate-300 group-hover:bg-slate-50 flex items-center justify-center transition-all">
            <ArrowLeft className="w-3.5 h-3.5" />
          </span>
          {isID ? 'Kembali' : 'Back'}
        </button>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
        {/* ===== LEFT: Content (8 cols) ===== */}
        <div className="lg:col-span-8 space-y-8 sm:space-y-12">
          <RoomGallery
            gallery={gallery}
            roomName={room.name}
            activeImage={activeImage}
            onSelect={setActiveImage}
            onPrev={prevImage}
            onNext={nextImage}
            isID={isID}
          />

          {/* Title & Meta */}
          <div className="space-y-4 sm:space-y-5 border-b border-slate-100 pb-6 sm:pb-8">
            <div className="flex items-start gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-4xl font-semibold text-slate-950 tracking-tight leading-tight">
                {room.name}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500 font-light">
              <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl">
                <Maximize2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {room.size}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl">
                <Bed className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {room.bedType}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl">
                <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {room.maxOccupancy} {isID ? 'tamu' : 'guests'}
              </span>
              {room.capacityAdult !== undefined && (
                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {room.capacityAdult} {isID ? 'dewasa' : 'adults'}
                </span>
              )}
              {room.capacityChild !== undefined && room.capacityChild > 0 && (
                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl">
                  <Baby className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {room.capacityChild} {isID ? 'anak' : 'children'}
                </span>
              )}
            </div>

            {room.description && (
              <p className="text-xs sm:text-[15px] text-slate-500 font-light leading-relaxed sm:leading-[1.7] max-w-2xl pt-1">
                {room.description}
              </p>
            )}
          </div>

          <RoomDetailGrid
            isID={isID}
            loading={loading}
            compositionByArea={compositionByArea}
            amenityGroups={amenityGroups}
            groupedPolicies={groupedPolicies}
            specialPrices={specialPrices}
          />
        </div>

        {/* ===== RIGHT: Sticky booking card (4 cols) ===== */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 sm:top-28 space-y-4">
            <div className="p-4 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-[0_12px_48px_rgba(15,23,42,0.08)] space-y-4 sm:space-y-5">
              {/* Price Header */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  {isID ? 'Harga per malam' : 'Price per night'}
                </span>
                {room.discountPercentage && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold shrink-0">
                    -{room.discountPercentage}%
                  </span>
                )}
              </div>

              {/* Price Amount */}
              <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2 min-w-0">
                {room.originalPrice && (
                  <span className="text-xs sm:text-[13px] text-slate-400 line-through font-light mr-1">
                    {formatCurrency(room.originalPrice)}
                  </span>
                )}
                <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight leading-none break-all">
                  {formatCurrency(room.pricePerNight)}
                </span>
                <span className="text-xs sm:text-[13px] text-slate-400 font-light">/ {isID ? 'malam' : 'night'}</span>
              </div>

              {/* Availability Badge */}
              {loading ? (
                <span className="inline-flex items-center gap-1.5 w-32 h-8 px-3 py-1.5 rounded-full bg-slate-100 animate-pulse" />
              ) : availableToday !== null && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold ${
                    availableToday === 0
                      ? 'bg-slate-50 text-slate-400 border border-slate-100'
                      : availableToday <= 3
                      ? 'bg-rose-50 text-rose-600 border border-rose-100'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${availableToday === 0 ? 'bg-slate-300' : availableToday <= 3 ? 'bg-rose-400' : 'bg-emerald-500'}`} />
                  {availableToday === 0
                    ? (isID ? 'Penuh hari ini' : 'Sold out today')
                    : `${availableToday} ${isID ? 'tersedia' : 'available'}`}
                </span>
              )}

              {/* CTA */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onBook(hotel, room)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-[13px] font-bold shadow-lg shadow-amber-500/25 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isID ? 'Pesan Sekarang' : 'Book Now'}
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <p className="text-center text-[11px] text-slate-400 font-light">
                {isID ? 'Pembayaran aman via Midtrans · Konfirmasi instan' : 'Secure payment via Midtrans · Instant confirmation'}
              </p>
            </div>

            {/* Trust Signals */}
            <div className="p-5 rounded-3xl bg-slate-50/70 border border-slate-100 space-y-3">
              <span className="flex items-center gap-3 text-[12px] text-slate-500 font-light">
                <span className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </span>
                {isID ? 'Konfirmasi instan' : 'Instant confirmation'}
              </span>
              <span className="flex items-center gap-3 text-[12px] text-slate-500 font-light">
                <span className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                </span>
                {isID ? 'Pembayaran aman' : 'Secure payment'}
              </span>
              <span className="flex items-center gap-3 text-[12px] text-slate-500 font-light">
                <span className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <CalendarClock className="w-3.5 h-3.5 text-emerald-500" />
                </span>
                {isID ? 'Ketersediaan real-time' : 'Real-time availability'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
