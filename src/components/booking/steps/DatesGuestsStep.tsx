import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Users, User, Baby, Minus, Plus, Moon, BedDouble, ArrowRight } from 'lucide-react';
import { RoomType } from '../../../types';
import { formatDate, formatCurrency } from '../../../lib/utils';
import { fadeTween } from '../../../lib/motion';
import { RoomAvailabilityCalendar } from '../RoomAvailabilityCalendar';
import { applyImageFallback, ROOM_IMAGE_FALLBACK } from '../../../lib/imageFallback';

interface DatesGuestsStepProps {
  isID: boolean;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  nights: number;
  selectedRoom: RoomType;
  onCheckInChange: (value: string) => void;
  onCheckOutChange: (value: string) => void;
  onAdultsChange: (value: number) => void;
  onChildrenChange: (value: number) => void;
}

export const DatesGuestsStep: React.FC<DatesGuestsStepProps> = ({
  isID, checkIn, checkOut, adults, children, nights,
  selectedRoom, onCheckInChange, onCheckOutChange, onAdultsChange, onChildrenChange
}) => {
  const totalGuests = adults + children;
  const maxOccupancy = selectedRoom.maxOccupancy;
  const maxAdults = selectedRoom.capacityAdult ?? maxOccupancy;
  const maxChildren = selectedRoom.capacityChild ?? maxOccupancy;
  const canAddAdult = adults + children < maxOccupancy && adults < maxAdults;
  const canAddChild = adults + children < maxOccupancy && children < maxChildren;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h4 className="font-serif text-xl text-navy tracking-tight flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gold" aria-hidden />
          {isID ? 'Pilih tanggal & tamu' : 'Select dates & guests'}
        </h4>
        <p className="text-[13px] text-slate-500">
          {isID ? 'Pilih tanggal check-in dan check-out untuk melihat ketersediaan kamar.'
            : 'Select your check-in and check-out dates to see room availability.'}
        </p>
      </div>

      <div className="flex items-center gap-4 p-4 rounded-2xl bg-navy-soft/60 border border-navy-soft">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-navy-soft shrink-0">
          <img src={selectedRoom.image} alt={selectedRoom.name} onError={(event) => applyImageFallback(event, ROOM_IMAGE_FALLBACK)} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-navy truncate">{selectedRoom.name}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[12px] text-slate-600 flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5 text-gold" aria-hidden />{selectedRoom.bedType}
            </span>
            <span className="text-navy-soft">·</span>
            <span className="text-[12px] text-slate-600">
              {formatCurrency(selectedRoom.pricePerNight)} / {isID ? 'malam' : 'night'}
            </span>
          </div>
        </div>
      </div>

      <RoomAvailabilityCalendar
        isID={isID} roomId={selectedRoom.id} checkIn={checkIn} checkOut={checkOut}
        onCheckInChange={onCheckInChange} onCheckOutChange={onCheckOutChange}
      />

      <motion.div
        initial={false}
        animate={checkIn && checkOut ? { opacity: 1 } : { opacity: 0.7 }}
        transition={fadeTween}
        className="p-4 rounded-2xl bg-navy-soft/50 border border-navy-soft flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-white border border-navy-soft flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-navy" aria-hidden />
          </div>
          <div className="min-w-0">
            {checkIn && checkOut ? (
              <>
                <p className="text-[13px] font-semibold text-navy">
                  {formatDate(checkIn, isID ? 'ID' : 'EN')} <ArrowRight className="w-3 h-3 inline mx-1 text-gold" aria-hidden /> {formatDate(checkOut, isID ? 'ID' : 'EN')}
                </p>
                <p className="text-[11px] text-slate-500">{nights} {isID ? 'malam menginap' : 'nights stay'}</p>
              </>
            ) : (
              <p className="text-[13px] font-medium text-slate-400">{isID ? 'Pilih tanggal menginap' : 'Select your stay dates'}</p>
            )}
          </div>
        </div>
        {checkIn && checkOut && (
          <span className="px-3 py-1.5 bg-white border border-navy-soft text-navy text-[11px] font-semibold rounded-full flex items-center gap-1.5 shrink-0">
            <Moon className="w-3 h-3 text-gold" aria-hidden />{nights} {isID ? 'malam' : 'nights'}
          </span>
        )}
      </motion.div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h5 className="text-[13px] font-semibold text-navy">{isID ? 'Jumlah tamu' : 'Number of guests'}</h5>
          {totalGuests >= maxOccupancy && (
            <span className="px-2.5 py-1 rounded-full bg-gold-soft border border-gold-light/50 text-[11px] font-semibold text-gold-dark flex items-center gap-1.5">
              <Users className="w-3 h-3" aria-hidden />
              {isID ? 'Kapasitas maksimum' : 'Max capacity reached'}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`flex items-center justify-between p-4 rounded-2xl border transition-colors duration-200 ${
            !canAddAdult ? 'border-gold-light/60 bg-gold-soft/40' : 'border-navy-soft hover:border-navy/25'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-navy-soft flex items-center justify-center">
                <User className="w-4 h-4 text-navy" aria-hidden />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-navy">{isID ? 'Dewasa' : 'Adults'}</p>
                <p className="text-[11px] text-slate-500">
                  {isID ? 'Usia 13+' : 'Age 13+'} · {isID ? 'Maks' : 'Max'} {maxAdults}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAdultsChange(Math.max(1, adults - 1))}
                disabled={adults <= 1}
                aria-label={isID ? 'Kurangi dewasa' : 'Decrease adults'}
                className="min-w-11 min-h-11 rounded-full border border-navy-soft flex items-center justify-center text-navy hover:bg-navy-soft transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold text-navy w-5 text-center tabular-nums">{adults}</span>
              <button
                type="button"
                onClick={() => onAdultsChange(Math.min(maxAdults, maxOccupancy - children, adults + 1))}
                disabled={!canAddAdult}
                aria-label={isID ? 'Tambah dewasa' : 'Increase adults'}
                className="min-w-11 min-h-11 rounded-full border border-navy-soft flex items-center justify-center text-navy hover:bg-navy-soft transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className={`flex items-center justify-between p-4 rounded-2xl border transition-colors duration-200 ${
            !canAddChild ? 'border-gold-light/60 bg-gold-soft/40' : 'border-navy-soft hover:border-navy/25'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-navy-soft flex items-center justify-center">
                <Baby className="w-4 h-4 text-navy" aria-hidden />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-navy">{isID ? 'Anak' : 'Children'}</p>
                <p className="text-[11px] text-slate-500">
                  {isID ? 'Usia 0-12' : 'Age 0-12'} · {isID ? 'Maks' : 'Max'} {maxChildren}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChildrenChange(Math.max(0, children - 1))}
                disabled={children <= 0}
                aria-label={isID ? 'Kurangi anak' : 'Decrease children'}
                className="min-w-11 min-h-11 rounded-full border border-navy-soft flex items-center justify-center text-navy hover:bg-navy-soft transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold text-navy w-5 text-center tabular-nums">{children}</span>
              <button
                type="button"
                onClick={() => onChildrenChange(Math.min(maxChildren, maxOccupancy - adults, children + 1))}
                disabled={!canAddChild}
                aria-label={isID ? 'Tambah anak' : 'Increase children'}
                className="min-w-11 min-h-11 rounded-full border border-navy-soft flex items-center justify-center text-navy hover:bg-navy-soft transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`flex items-center justify-between gap-2 p-3 rounded-xl border ${
        totalGuests >= maxOccupancy ? 'border-gold-light/60 bg-gold-soft/50' : 'border-navy-soft bg-navy-soft/40'
      }`}>
        <span className="text-[12px] text-slate-600 flex items-center gap-2">
          <Users className="w-4 h-4 text-navy" aria-hidden />
          {totalGuests} {isID ? 'tamu total' : 'guests total'}
          <span className="text-slate-400">· {isID ? 'Maks' : 'Max'} {selectedRoom.maxOccupancy} {isID ? 'tamu' : 'guests'}</span>
        </span>
        {totalGuests < maxOccupancy && (
          <span className="text-[11px] text-slate-500 hidden sm:block">
            {isID ? `Sisa ${maxOccupancy - totalGuests} kapasitas` : `${maxOccupancy - totalGuests} spots left`}
          </span>
        )}
      </div>
    </div>
  );
};
