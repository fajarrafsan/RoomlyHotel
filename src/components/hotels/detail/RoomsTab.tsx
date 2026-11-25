import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Loader2, Eye, Maximize2, BedDouble, Users, CheckCircle2, ArrowRight,
  Coffee, ShieldCheck, CircleAlert, ChevronDown, Images,
} from 'lucide-react';
import { Hotel, RoomType } from '../../../types';
import { formatCurrency } from '../../../lib/utils';
import { label, POLICY_TYPE_LABELS, refundTerms } from './policyLabels';
import { applyImageFallback, ROOM_IMAGE_FALLBACK } from '../../../lib/imageFallback';
import { fadeTween } from '../../../lib/motion';

interface RoomsTabProps {
  hotel: Hotel;
  isLoadingDetail: boolean;
  isID: boolean;
  onSelectRoom: (hotel: Hotel, room: RoomType) => void;
}

export const RoomsTab: React.FC<RoomsTabProps> = ({ hotel, isLoadingDetail, isID, onSelectRoom }) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fadeTween}
      className="space-y-4"
      aria-label={isID ? 'Pilihan kamar' : 'Room options'}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-semibold tracking-tight text-slate-900">
            {isID ? 'Temukan kamar yang pas' : 'Find your perfect room'}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {isID ? `${hotel.rooms.length} tipe kamar · Bandingkan fasilitas dan harga` : `${hotel.rooms.length} room types · Compare features and prices`}
          </p>
        </div>
        {isLoadingDetail && (
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500" role="status">
            <Loader2 className="size-4 animate-spin" aria-hidden /> {isID ? 'Memuat…' : 'Loading…'}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {hotel.rooms.map((room) => {
          const refund = room.policies?.find(group => group.policyType === 'REFUND')?.items[0];
          const breakfast = room.policies?.find(group => group.policyType === 'BREAKFAST')?.items[0];
          const refundSummary = refund
            ? refundTerms(refund, isID) || (refund.isRefundable === true ? (isID ? 'Bisa refund sesuai kebijakan' : 'Refundable subject to policy') : refund.title)
            : null;
          const breakfastSummary = breakfast
            ? (isID && /^breakfast included$/i.test(breakfast.title) ? 'Termasuk sarapan' : breakfast.title)
            : null;
          const bedLabel = isID ? room.bedType.replace(/\bBeds?\b/gi, 'tempat tidur') : room.bedType;
          const roomSize = room.size.replace(/\bsqm\b/gi, 'm²');
          const guestBreakdown = [
            room.capacityAdult !== undefined ? `${room.capacityAdult} ${isID ? 'dewasa' : 'adults'}` : null,
            room.capacityChild ? `${room.capacityChild} ${isID ? 'anak' : 'children'}` : null,
          ].filter(Boolean).join(' · ');

          return (
            <article key={room.id} data-room-card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_3px_16px_rgba(15,23,42,0.035)] transition-shadow duration-200 hover:shadow-[0_6px_24px_rgba(15,23,42,0.07)]">
              <div className="grid items-start gap-4 p-4 sm:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)_172px] lg:gap-5">
                <button
                  type="button"
                  onClick={() => onSelectRoom(hotel, room)}
                  aria-label={isID ? `Lihat foto dan detail ${room.name}` : `View photos and details of ${room.name}`}
                  className="group relative block aspect-[16/10] sm:aspect-[4/3] w-full self-start overflow-hidden rounded-xl bg-slate-100 text-left cursor-pointer"
                >
                  <img
                    src={room.image}
                    alt={room.name}
                    loading="lazy"
                    decoding="async"
                    onError={(event) => applyImageFallback(event, ROOM_IMAGE_FALLBACK)}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
                  />
                  {room.discountPercentage && (
                    <span className="absolute left-2.5 top-2.5 rounded-md bg-navy-dark px-2 py-1 text-xs font-semibold text-white">
                      -{room.discountPercentage}%
                    </span>
                  )}
                  <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm">
                    <Images className="size-3.5" aria-hidden />
                    {room.images?.length ? `${room.images.length} ${isID ? 'foto' : 'photos'}` : (isID ? 'Lihat foto' : 'View photos')}
                  </span>
                </button>

                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-lg font-semibold leading-tight tracking-tight text-slate-900">{room.name}</h4>
                    {room.availableRooms !== undefined && (
                      <span className={`rounded-md px-2 py-1 text-xs font-semibold ${room.availableRooms === 0 ? 'bg-slate-100 text-slate-600' : room.availableRooms <= 3 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
                        {room.availableRooms === 0
                          ? (isID ? 'Penuh hari ini' : 'Sold out today')
                          : (isID ? `${room.availableRooms} kamar tersedia` : `${room.availableRooms} rooms available`)}
                      </span>
                    )}
                  </div>

                  <dl className="grid grid-cols-3 gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                    <div className="min-w-0">
                      <dt className="mb-1 flex items-center gap-1.5 text-xs text-slate-500"><Maximize2 className="size-3.5 shrink-0" aria-hidden />{isID ? 'Luas' : 'Area'}</dt>
                      <dd className="text-sm font-semibold text-slate-800">{roomSize}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="mb-1 flex items-center gap-1.5 text-xs text-slate-500"><BedDouble className="size-3.5 shrink-0" aria-hidden />{isID ? 'Tempat tidur' : 'Beds'}</dt>
                      <dd className="text-sm font-semibold text-slate-800">{bedLabel}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="mb-1 flex items-center gap-1.5 text-xs text-slate-500"><Users className="size-3.5 shrink-0" aria-hidden />{isID ? 'Kapasitas' : 'Capacity'}</dt>
                      <dd className="text-sm font-semibold text-slate-800">{room.maxOccupancy} {isID ? 'tamu' : 'guests'}</dd>
                    </div>
                  </dl>

                  {(guestBreakdown || room.viewType) && (
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-600">
                      {guestBreakdown && <span>{guestBreakdown}</span>}
                      {room.viewType && <span className="inline-flex items-center gap-1.5"><Eye className="size-3.5" aria-hidden />{room.viewType}</span>}
                    </p>
                  )}

                  {room.description && <p className="line-clamp-2 text-[13px] leading-5 text-slate-600">{room.description}</p>}

                  {(breakfastSummary || refundSummary) ? (
                    <div className="space-y-1.5 text-[13px]">
                      {breakfastSummary && <p className="flex items-start gap-2 text-slate-700"><Coffee className="mt-0.5 size-3.5 shrink-0 text-gold" aria-hidden /><span>{breakfastSummary}</span></p>}
                      {refundSummary && (
                        <p className={`flex items-start gap-2 leading-5 ${refund?.isRefundable === false ? 'text-amber-800' : 'text-emerald-800'}`}>
                          {refund?.isRefundable === false ? <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden /> : <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />}
                          <span>{refundSummary}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                      {room.features.slice(0, 3).map((feature, index) => (
                        <span key={index} className="inline-flex items-center gap-1.5 text-xs text-slate-700"><CheckCircle2 className="size-3.5 shrink-0 text-emerald-700" aria-hidden />{feature}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:col-span-2 lg:col-span-1 lg:ml-0 lg:min-h-[165px] lg:flex-col lg:items-stretch lg:justify-between lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                  <div className="min-w-0 lg:text-right">
                    <p className="mb-1 text-xs text-slate-500">{isID ? 'Harga per malam' : 'Price per night'}</p>
                    {room.originalPrice && <p className="text-xs text-slate-500 line-through">{formatCurrency(room.originalPrice)}</p>}
                    <p className="text-xl font-semibold tracking-tight text-navy-dark">{formatCurrency(room.pricePerNight)}</p>
                    {room.discountPercentage && room.originalPrice && <p className="mt-1 text-xs font-medium text-emerald-800">{isID ? 'Hemat ' : 'Save '}{formatCurrency(room.originalPrice - room.pricePerNight)}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectRoom(hotel, room)}
                    aria-label={isID ? `Lihat detail ${room.name}` : `View details of ${room.name}`}
                    className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-navy-dark px-4 py-3 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-navy"
                  >
                    {isID ? 'Lihat detail' : 'View details'}<ArrowRight className="size-4" aria-hidden />
                  </button>
                </div>
              </div>

              {!!room.policies?.length && (
                <details className="group/policy border-t border-slate-100">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-navy [&::-webkit-details-marker]:hidden">
                    {isID ? 'Lihat semua kebijakan kamar' : 'View all room policies'}
                    <ChevronDown className="size-4 shrink-0 transition-transform duration-200 group-open/policy:rotate-180 motion-reduce:transition-none" aria-hidden />
                  </summary>
                  <div className="grid gap-3 bg-slate-50 p-4 sm:grid-cols-2">
                    {room.policies.map(group => (
                      <div key={group.policyType} className="rounded-xl border border-slate-200/80 bg-white p-3.5">
                        <h5 className="mb-2 text-[13px] font-semibold text-slate-900">{label(POLICY_TYPE_LABELS, group.policyType, isID)}</h5>
                        <div className="space-y-3">
                          {group.items.map(policy => (
                            <div key={policy.id}>
                              <p className="text-[13px] font-medium text-slate-800">{policy.title}</p>
                              {group.policyType === 'REFUND' && refundTerms(policy, isID) && <p className="mt-1 text-[13px] leading-5 text-slate-700">{refundTerms(policy, isID)}</p>}
                              {policy.description && <p className="mt-1 text-[13px] leading-5 text-slate-600">{policy.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </article>
          );
        })}
      </div>
    </motion.section>
  );
};
