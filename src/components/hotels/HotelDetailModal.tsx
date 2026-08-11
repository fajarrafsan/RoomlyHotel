import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Hotel, RoomType, Language, RoomPolicy } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { formatTime } from './detail/policyLabels';
import { HotelGallery } from './detail/HotelGallery';
import { QuickStatsBar } from './detail/QuickStatsBar';
import { RoomsTab } from './detail/RoomsTab';
import { OverviewTab } from './detail/OverviewTab';
import { ReviewsTab } from './detail/ReviewsTab';
import { HotelDetailModalSkeleton } from './detail/HotelDetailModalSkeleton';

interface HotelDetailModalProps {
  hotel: Hotel | null;
  isLoadingDetail?: boolean;
  onClose: () => void;
  onSelectRoom: (hotel: Hotel, room: RoomType) => void;
  isWishlisted: boolean;
  onToggleWishlist: (hotelId: string) => void;
  language: Language;
}

export const HotelDetailModal: React.FC<HotelDetailModalProps> = ({
  hotel, isLoadingDetail, onClose, onSelectRoom,
  isWishlisted, onToggleWishlist, language
}) => {
  if (!hotel) return null;
  const isID = language === 'ID';
  const [activeTab, setActiveTab] = useState<'rooms' | 'overview' | 'reviews'>('rooms');

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // enrichHotelDetail already puts the hotel thumbnail first in the gallery.
  const images = hotel.gallery?.length ? hotel.gallery : [hotel.image];
  const isBestSeller = hotel.rating >= 4.8 && hotel.reviewsCount > 50;

  // Real cancellation terms live on the room policies (policyType REFUND).
  const refundPolicies: RoomPolicy[] = hotel.rooms
    .flatMap((r) => r.policies ?? [])
    .flatMap((g) => g.items)
    .filter((p) => p.policyType === 'REFUND');
  const anyRefundable = refundPolicies.some((p) => p.isRefundable);

  const checkIn = formatTime(hotel.checkInTime);
  const checkOut = formatTime(hotel.checkOutTime);

  const fullAddress = [hotel.address, hotel.district, hotel.city, hotel.province, hotel.postalCode, hotel.country]
    .filter(Boolean)
    .join(', ');

  const hasCoords = !!(hotel.coordinates?.lat && hotel.coordinates?.lng);
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${hotel.coordinates.lat},${hotel.coordinates.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name} ${fullAddress}`)}`;

  // Group the hotel's facilities by their backend category.
  const facilitiesByCategory = (hotel.facilities ?? []).reduce((acc, f) => {
    (acc[f.category] ||= []).push(f);
    return acc;
  }, {} as Record<string, NonNullable<Hotel['facilities']>>);

  return (
    <>
      {/* ===== MAIN MODAL ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm flex items-start justify-center overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          className="bg-white rounded-none sm:rounded-2xl max-w-5xl w-full shadow-[0_25px_80px_rgba(0,0,0,0.15)] border-0 sm:border border-slate-100 overflow-hidden my-0 sm:my-8 relative max-h-[100vh] sm:max-h-[92vh] flex flex-col"
        >
          {isLoadingDetail ? (
            <HotelDetailModalSkeleton onClose={onClose} isID={isID} />
          ) : (
            <>
          <HotelGallery
            hotel={hotel}
            images={images}
            isBestSeller={isBestSeller}
            isID={isID}
            isWishlisted={isWishlisted}
            onToggleWishlist={onToggleWishlist}
            onClose={onClose}
          />

          {/* ===== QUICK STATS BAR ===== */}
          <QuickStatsBar
            hotel={hotel}
            anyRefundable={anyRefundable}
            checkIn={checkIn}
            checkOut={checkOut}
            isID={isID}
          />

          {/* ===== TABS ===== */}
          <div className="flex items-center px-6 border-b border-slate-100 bg-white shrink-0 sticky top-0 z-10">
            {[
              { key: 'rooms', label: isID ? 'Kamar' : 'Rooms', count: hotel.rooms.length },
              { key: 'overview', label: isID ? 'Tentang' : 'About' },
              { key: 'reviews', label: isID ? 'Ulasan' : 'Reviews', count: hotel.reviews.length },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 mr-8 text-[13px] font-medium border-b-2 transition-all duration-200 ${
                  activeTab === tab.key ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}>
                {tab.label}
                {tab.count !== undefined && <span className="ml-1.5 text-[11px] text-slate-400 font-light">{tab.count}</span>}
              </button>
            ))}
          </div>

          {/* ===== CONTENT ===== */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-8 bg-white">
            {activeTab === 'rooms' && (
              <RoomsTab
                hotel={hotel}
                isLoadingDetail={!!isLoadingDetail}
                isID={isID}
                onSelectRoom={onSelectRoom}
              />
            )}
            {activeTab === 'overview' && (
              <OverviewTab
                hotel={hotel}
                isID={isID}
                checkIn={checkIn}
                checkOut={checkOut}
                anyRefundable={anyRefundable}
                refundPolicies={refundPolicies}
                facilitiesByCategory={facilitiesByCategory}
                mapsUrl={mapsUrl}
                hasCoords={hasCoords}
              />
            )}
            {activeTab === 'reviews' && (
              <ReviewsTab hotel={hotel} isID={isID} />
            )}
          </div>

          {/* ===== STICKY MOBILE BOTTOM BAR ===== */}
          <div className="sm:hidden sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 p-4 flex items-center justify-between z-20">
            <div>
              {hotel.originalPrice && (
                <span className="text-[11px] text-slate-400 line-through font-light block">{formatCurrency(hotel.originalPrice)}</span>
              )}
              <span className="text-xl font-bold text-slate-900">{formatCurrency(hotel.pricePerNight)}</span>
              <span className="text-[11px] text-slate-400 font-light"> / {isID ? 'malam' : 'night'}</span>
            </div>
            <button onClick={() => setActiveTab('rooms')}
              className="px-6 py-3 rounded-xl bg-slate-900 text-white text-[13px] font-medium shadow-sm">
              {isID ? 'Lihat Kamar' : 'See Rooms'}
            </button>
          </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </>
  );
};
