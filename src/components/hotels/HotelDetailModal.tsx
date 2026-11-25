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
  const isID = language === 'ID';
  const [activeTab, setActiveTab] = useState<'rooms' | 'overview' | 'reviews'>('rooms');

  useEffect(() => {
    if (!hotel) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [hotel]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (document.querySelector('[data-hotel-fullscreen-gallery]')) return;
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!hotel) return null;

  const images = hotel.gallery?.length ? hotel.gallery : [hotel.image];
  const isBestSeller = hotel.rating >= 4.8 && hotel.reviewsCount > 50;

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

  const facilitiesByCategory = (hotel.facilities ?? []).reduce((acc, f) => {
    (acc[f.category] ||= []).push(f);
    return acc;
  }, {} as Record<string, NonNullable<Hotel['facilities']>>);

  const tabs = [
    { key: 'rooms' as const, label: isID ? 'Kamar' : 'Rooms', count: hotel.rooms.length },
    { key: 'overview' as const, label: isID ? 'Tentang' : 'About' },
    { key: 'reviews' as const, label: isID ? 'Ulasan' : 'Reviews', count: hotel.reviews.length },
  ];

  return (
    <motion.div
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 bg-slate-950/50 flex items-start justify-center overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hotel-detail-title"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
        className="hotel-detail-modal bg-white rounded-none sm:rounded-3xl max-w-[1120px] w-full shadow-[0_24px_64px_rgba(30,58,138,0.18)] border-0 sm:border border-navy-soft overflow-hidden my-0 sm:my-4 relative max-h-[100dvh] sm:max-h-[calc(100dvh-2rem)] flex flex-col transform-gpu"
        onClick={(e) => e.stopPropagation()}
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

            <QuickStatsBar
              hotel={hotel}
              anyRefundable={anyRefundable}
              checkIn={checkIn}
              checkOut={checkOut}
              isID={isID}
            />

            <div className="flex items-center px-5 sm:px-6 border-b border-navy-soft bg-white shrink-0" role="tablist" aria-label={isID ? 'Detail hotel' : 'Hotel detail'}>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`min-h-12 py-3 px-1 mr-6 text-[14px] font-semibold border-b-2 transition-colors duration-200 cursor-pointer ${
                    activeTab === tab.key ? 'border-navy text-navy' : 'border-transparent text-slate-500 hover:text-navy'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`ml-1.5 text-[12px] font-medium ${activeTab === tab.key ? 'text-gold' : 'text-slate-400'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="min-h-0 p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/80" data-hotel-detail-scroll>
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

            {activeTab !== 'rooms' && <div className="sm:hidden sticky bottom-0 left-0 right-0 bg-white border-t border-navy-soft p-4 flex items-center justify-between z-20">
              <div>
                {hotel.originalPrice && (
                  <span className="text-[12px] text-slate-500 line-through block">{formatCurrency(hotel.originalPrice)}</span>
                )}
                <span className="text-xl font-semibold text-navy">{formatCurrency(hotel.pricePerNight)}</span>
                <span className="text-[12px] text-slate-500"> / {isID ? 'malam' : 'night'}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('rooms')}
                className="min-h-12 px-6 py-3 rounded-xl bg-gold hover:bg-gold-dark text-white text-[14px] font-semibold transition-colors duration-200 cursor-pointer"
              >
                {isID ? 'Lihat kamar' : 'See rooms'}
              </button>
            </div>}
          </>
        )}
      </motion.div>
    </motion.div>
  );
};
