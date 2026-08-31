import React from 'react';
import { motion } from 'motion/react';
import { Loader2, Eye, Maximize2, Bed, Users, Baby, CheckCircle2, ArrowRight } from 'lucide-react';
import { Hotel, RoomType } from '../../../types';
import { formatCurrency } from '../../../lib/utils';
import { label, POLICY_TYPE_LABELS, refundTerms } from './policyLabels';
import { applyImageFallback, ROOM_IMAGE_FALLBACK } from '../../../lib/imageFallback';

export const RoomsTab: React.FC<{
  hotel: Hotel;
  isLoadingDetail: boolean;
  isID: boolean;
  onSelectRoom: (hotel: Hotel, room: RoomType) => void;
}> = ({ hotel, isLoadingDetail, isID, onSelectRoom }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-navy font-serif">{isID ? 'Pilihan kamar' : 'Select your room'}</h3>
        <p className="text-[13px] text-slate-600 mt-0.5">
          {isID ? `${hotel.rooms.length} tipe kamar tersedia` : `${hotel.rooms.length} room types available`}
        </p>
      </div>
      {isLoadingDetail && (
        <span className="text-[12px] text-slate-400 flex items-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> {isID ? 'Memuat...' : 'Loading...'}
        </span>
      )}
    </div>

    <div className="space-y-4">
      {hotel.rooms.map((room, idx) => (
        <motion.div
          key={room.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.08 }}
          onClick={() => onSelectRoom(hotel, room)}
          className="group rounded-3xl border border-navy-soft hover:border-blue-100 bg-white hover:shadow-[0_16px_40px_rgba(30,58,138,0.1)] transition-all duration-200 overflow-hidden cursor-pointer"
        >
          <div className="flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-56 h-48 sm:h-auto shrink-0 bg-slate-100 overflow-hidden">
              <img src={room.image} alt={room.name}
                onError={(event) => applyImageFallback(event, ROOM_IMAGE_FALLBACK)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              {room.discountPercentage && (
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-[10px] font-bold">
                  -{room.discountPercentage}%
                </span>
              )}
              {room.images && room.images.length > 1 && (
                <span className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-slate-900/70 backdrop-blur-sm text-white text-[10px] font-medium">
                  {room.images.length} {isID ? 'foto' : 'photos'}
                </span>
              )}
            </div>

            <div className="flex-1 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[15px] font-semibold text-navy">{room.name}</h4>
                      {room.viewType && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium flex items-center gap-1">
                          <Eye className="w-3 h-3" />{room.viewType}
                        </span>
                      )}
                    </div>

                    {/* Room specs — every measurable field room-service returns */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-slate-500 font-light mt-2">
                      <span className="flex items-center gap-1"><Maximize2 className="w-3.5 h-3.5" />{room.size}</span>
                      <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{room.bedType}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{isID ? 'Maks' : 'Max'} {room.maxOccupancy} {isID ? 'tamu' : 'guests'}</span>
                      {room.capacityAdult !== undefined && (
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{room.capacityAdult} {isID ? 'dewasa' : 'adults'}</span>
                      )}
                      {room.capacityChild !== undefined && room.capacityChild > 0 && (
                        <span className="flex items-center gap-1"><Baby className="w-3.5 h-3.5" />{room.capacityChild} {isID ? 'anak' : 'children'}</span>
                      )}
                    </div>
                  </div>

                  {/* Live inventory straight from room-service's availability calendar */}
                  {room.availableRooms !== undefined && (
                    <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                      room.availableRooms === 0
                        ? 'bg-slate-100 text-slate-500'
                        : room.availableRooms <= 3
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {room.availableRooms === 0
                        ? (isID ? 'Penuh hari ini' : 'Sold out today')
                        : `${room.availableRooms}${room.totalInventory ? `/${room.totalInventory}` : ''} ${isID ? 'tersedia' : 'available'}`}
                    </span>
                  )}
                </div>

                {room.description && (
                  <p className="text-[12.5px] text-slate-500 font-light leading-relaxed">{room.description}</p>
                )}

                {/* Policies, grouped exactly the way room-service groups them */}
                {room.policies?.length ? (
                  <div className="space-y-2 pt-1">
                    {room.policies.map((group) => (
                      <div key={group.policyType} className="flex gap-2.5 text-[11.5px]">
                        <span className="shrink-0 w-32 font-medium text-slate-400">
                          {label(POLICY_TYPE_LABELS, group.policyType, isID)}
                        </span>
                        <div className="flex-1 space-y-1">
                          {group.items.map((p) => (
                            <div key={p.id}>
                              <span className="text-slate-700 font-light">{p.title}</span>
                              {group.policyType === 'REFUND' && refundTerms(p, isID) && (
                                <span className={`ml-1.5 font-medium ${p.isRefundable === false ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  — {refundTerms(p, isID)}
                                </span>
                              )}
                              {p.description && (
                                <p className="text-[11px] text-slate-400 font-light leading-relaxed">{p.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {room.features.map((ft, i) => (
                      <span key={i} className="text-[11px] text-slate-500 font-light flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />{ft}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-end justify-between pt-4 mt-2 border-t border-slate-50">
                <div>
                  {room.originalPrice && (
                    <span className="text-[12px] text-slate-400 line-through font-light block">{formatCurrency(room.originalPrice)}</span>
                  )}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-semibold text-navy">{formatCurrency(room.pricePerNight)}</span>
                    <span className="text-[12px] text-slate-400 font-light">/ {isID ? 'malam' : 'night'}</span>
                  </div>
                  {room.discountPercentage && (
                    <span className="text-[11px] text-emerald-600 font-medium">
                      {isID ? 'Hemat ' : 'Save '}{formatCurrency((room.originalPrice || 0) - room.pricePerNight)}
                    </span>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSelectRoom(hotel, room)}
                  type="button"
                  className="min-h-12 px-6 py-3 rounded-xl bg-gold hover:bg-gold-dark text-white text-[13px] font-semibold transition-colors duration-200 flex items-center gap-2 cursor-pointer"
                >
                  {isID ? 'Lihat Detail' : 'View Details'}
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);
