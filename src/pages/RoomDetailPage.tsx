import React, { useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Maximize2, Bed, Users, Baby, MapPin,
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
      <div className="room-detail-page min-h-[60vh] flex flex-col items-center justify-center text-center gap-5 py-20">
        <div className="w-16 h-16 rounded-full bg-navy-soft text-navy flex items-center justify-center">
          <SearchX className="w-7 h-7" aria-hidden />
        </div>
        <div>
          <h2 className="font-serif text-2xl text-navy tracking-tight">
            {isID ? 'Kamar tidak ditemukan' : 'Room not found'}
          </h2>
          <p className="text-[14px] text-slate-600 mt-2 leading-relaxed max-w-xs mx-auto">
            {isID ? 'Tautan ini tidak valid atau kamar sudah tidak tersedia.' : 'This link is invalid or the room is no longer available.'}
          </p>
        </div>
        <Link
          to="/explore"
          className="mt-1 inline-flex items-center gap-2 min-h-11 px-5 rounded-xl bg-gold hover:bg-gold-dark text-white text-[14px] font-semibold transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
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

  const prevImage = useCallback(
    () => setActiveImage((i) => (gallery.length ? (i - 1 + gallery.length) % gallery.length : 0)),
    [gallery.length, setActiveImage]
  );
  const nextImage = useCallback(
    () => setActiveImage((i) => (gallery.length ? (i + 1) % gallery.length : 0)),
    [gallery.length, setActiveImage]
  );

  return (
    <div className="room-detail-page max-w-7xl mx-auto pb-20">
      <nav className="py-4 sm:py-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-2 min-h-11 text-[13px] font-medium text-slate-600 hover:text-navy transition-colors duration-200 cursor-pointer"
        >
          <span className="w-11 h-11 rounded-full border border-navy-soft group-hover:bg-navy-soft flex items-center justify-center transition-colors duration-200">
            <ArrowLeft className="w-4 h-4" aria-hidden />
          </span>
          {isID ? 'Kembali' : 'Back'}
        </button>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        <div className="lg:col-span-8 space-y-8 sm:space-y-10">
          <RoomGallery
            gallery={gallery}
            roomName={room.name}
            activeImage={activeImage}
            onSelect={setActiveImage}
            onPrev={prevImage}
            onNext={nextImage}
            isID={isID}
          />

          <div className="space-y-4 border-b border-navy-soft pb-7">
            <p className="text-[12px] font-semibold tracking-[0.16em] uppercase text-gold">
              {hotel.name}
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl text-navy tracking-tight leading-[1.15]">
              {room.name}
            </h1>

            {(hotel.location || hotel.city) && (
              <p className="flex items-center gap-1.5 text-[14px] text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-gold shrink-0" aria-hidden />
                <span className="truncate">
                  {[hotel.location, hotel.city].filter(Boolean).join(', ')}
                </span>
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-navy-soft px-3 py-1.5 rounded-full text-[12px] font-medium text-navy">
                <Maximize2 className="w-3.5 h-3.5 text-gold shrink-0" aria-hidden />
                {room.size}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-navy-soft px-3 py-1.5 rounded-full text-[12px] font-medium text-navy">
                <Bed className="w-3.5 h-3.5 text-gold shrink-0" aria-hidden />
                {room.bedType}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-navy-soft px-3 py-1.5 rounded-full text-[12px] font-medium text-navy">
                <Users className="w-3.5 h-3.5 text-gold shrink-0" aria-hidden />
                {room.maxOccupancy} {isID ? 'tamu' : 'guests'}
              </span>
              {room.capacityAdult !== undefined && (
                <span className="inline-flex items-center gap-1.5 bg-navy-soft px-3 py-1.5 rounded-full text-[12px] font-medium text-navy">
                  <Users className="w-3.5 h-3.5 text-gold shrink-0" aria-hidden />
                  {room.capacityAdult} {isID ? 'dewasa' : 'adults'}
                </span>
              )}
              {room.capacityChild !== undefined && room.capacityChild > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-navy-soft px-3 py-1.5 rounded-full text-[12px] font-medium text-navy">
                  <Baby className="w-3.5 h-3.5 text-gold shrink-0" aria-hidden />
                  {room.capacityChild} {isID ? 'anak' : 'children'}
                </span>
              )}
            </div>

            {room.description && (
              <p className="text-[15px] text-slate-600 leading-relaxed max-w-2xl pt-1">
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

        <div className="lg:col-span-4">
          <div className="sticky top-[5.25rem] sm:top-[6rem] space-y-4">
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-navy-soft shadow-[0_12px_40px_rgba(30,58,138,0.08)] space-y-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
                  {isID ? 'Harga per malam' : 'Price per night'}
                </span>
                {room.discountPercentage && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold shrink-0">
                    -{room.discountPercentage}%
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-baseline gap-1.5 min-w-0">
                {room.originalPrice && (
                  <span className="text-[13px] text-slate-400 line-through">
                    {formatCurrency(room.originalPrice)}
                  </span>
                )}
                <span className="text-3xl sm:text-4xl font-semibold text-navy tracking-tight leading-none">
                  {formatCurrency(room.pricePerNight)}
                </span>
                <span className="text-[13px] text-slate-500">/ {isID ? 'malam' : 'night'}</span>
              </div>

              {loading ? (
                <span className="inline-flex w-32 h-8 rounded-full bg-navy-soft animate-pulse" />
              ) : availableToday !== null && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold ${
                    availableToday === 0
                      ? 'bg-navy-soft text-slate-500'
                      : availableToday <= 3
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${availableToday === 0 ? 'bg-slate-400' : availableToday <= 3 ? 'bg-rose-500' : 'bg-emerald-600'}`} />
                  {availableToday === 0
                    ? (isID ? 'Penuh hari ini' : 'Sold out today')
                    : `${availableToday} ${isID ? 'tersedia' : 'available'}`}
                </span>
              )}

              <button
                type="button"
                onClick={() => onBook(hotel, room)}
                className="w-full min-h-12 py-3.5 rounded-xl bg-gold hover:bg-gold-dark text-white text-[14px] font-semibold transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isID ? 'Pesan sekarang' : 'Book now'}
                <ArrowRight className="w-4 h-4" aria-hidden />
              </button>

              <p className="text-center text-[12px] text-slate-500">
                {isID ? 'Pembayaran aman via Midtrans · Konfirmasi instan' : 'Secure payment via Midtrans · Instant confirmation'}
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-navy-soft/50 border border-navy-soft space-y-3">
              <span className="flex items-center gap-3 text-[13px] text-slate-600">
                <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gold" aria-hidden />
                </span>
                {isID ? 'Konfirmasi instan' : 'Instant confirmation'}
              </span>
              <span className="flex items-center gap-3 text-[13px] text-slate-600">
                <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-gold" aria-hidden />
                </span>
                {isID ? 'Pembayaran aman' : 'Secure payment'}
              </span>
              <span className="flex items-center gap-3 text-[13px] text-slate-600">
                <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                  <CalendarClock className="w-3.5 h-3.5 text-gold" aria-hidden />
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
