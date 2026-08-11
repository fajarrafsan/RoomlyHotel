import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Users, User, Baby, Minus, Plus, Moon, BedDouble, ArrowRight } from 'lucide-react';
import { RoomType } from '../../../types';
import { formatDate, formatCurrency } from '../../../lib/utils';
import { RoomAvailabilityCalendar } from '../RoomAvailabilityCalendar';

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
      {/* Section Header */}
      <div className="space-y-1">
        <h4 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-400" />
          {isID ? 'Pilih Tanggal & Tamu' : 'Select Dates & Guests'}
        </h4>
        <p className="text-[13px] text-slate-400 font-light">
          {isID ? 'Pilih tanggal check-in dan check-out untuk melihat ketersediaan kamar.'
            : 'Select your check-in and check-out dates to see room availability.'}
        </p>
      </div>

      {/* Room Info Card */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 shrink-0">
          <img src={selectedRoom.image} alt={selectedRoom.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-slate-900 truncate">{selectedRoom.name}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[12px] text-slate-500 font-light flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5 text-slate-400" />{selectedRoom.bedType}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[12px] text-slate-500 font-light">
              {formatCurrency(selectedRoom.pricePerNight)} / {isID ? 'malam' : 'night'}
            </span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <RoomAvailabilityCalendar
        isID={isID} roomId={selectedRoom.id} checkIn={checkIn} checkOut={checkOut}
        onCheckInChange={onCheckInChange} onCheckOutChange={onCheckOutChange}
      />

      {/* Date Summary */}
      <motion.div
        initial={false}
        animate={checkIn && checkOut ? { opacity: 1 } : { opacity: 0.7 }}
        className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            {checkIn && checkOut ? (
              <>
                <p className="text-[13px] font-semibold text-slate-900">
                  {formatDate(checkIn, isID ? 'ID' : 'EN')} <ArrowRight className="w-3 h-3 inline mx-1 text-slate-300" /> {formatDate(checkOut, isID ? 'ID' : 'EN')}
                </p>
                <p className="text-[11px] text-slate-400 font-light">{nights} {isID ? 'malam menginap' : 'nights stay'}</p>
              </>
            ) : (
              <p className="text-[13px] font-medium text-slate-400">{isID ? 'Pilih tanggal menginap' : 'Select your stay dates'}</p>
            )}
          </div>
        </div>
        {checkIn && checkOut && (
          <span className="px-3 py-1.5 bg-white border border-slate-100 text-slate-700 text-[11px] font-semibold rounded-full shadow-sm flex items-center gap-1.5">
            <Moon className="w-3 h-3 text-slate-400" />{nights} {isID ? 'malam' : 'nights'}
          </span>
        )}
      </motion.div>

      {/* Guest Counters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h5 className="text-[13px] font-semibold text-slate-900">{isID ? 'Jumlah Tamu' : 'Number of Guests'}</h5>
          {totalGuests >= maxOccupancy && (
            <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-700 flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              {isID ? 'Kapasitas maksimum' : 'Max capacity reached'}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Adults */}
          <div className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
            !canAddAdult ? 'border-amber-200 bg-amber-50/40' : 'border-slate-100 hover:border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-900">{isID ? 'Dewasa' : 'Adults'}</p>
                <p className="text-[11px] text-slate-400 font-light">
                  {isID ? 'Usia 13+' : 'Age 13+'} · {isID ? 'Maks' : 'Max'} {maxAdults}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => onAdultsChange(Math.max(1, adults - 1))} disabled={adults <= 1}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold text-slate-900 w-4 text-center">{adults}</span>
              <button onClick={() => onAdultsChange(Math.min(maxAdults, maxOccupancy - children, adults + 1))} disabled={!canAddAdult}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Children */}
          <div className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
            !canAddChild ? 'border-amber-200 bg-amber-50/40' : 'border-slate-100 hover:border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <Baby className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-900">{isID ? 'Anak' : 'Children'}</p>
                <p className="text-[11px] text-slate-400 font-light">
                  {isID ? 'Usia 0-12' : 'Age 0-12'} · {isID ? 'Maks' : 'Max'} {maxChildren}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => onChildrenChange(Math.max(0, children - 1))} disabled={children <= 0}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold text-slate-900 w-4 text-center">{children}</span>
              <button onClick={() => onChildrenChange(Math.min(maxChildren, maxOccupancy - adults, children + 1))} disabled={!canAddChild}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Total Summary */}
      <div className={`flex items-center justify-between gap-2 p-3 rounded-xl border ${
        totalGuests >= maxOccupancy ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100 bg-slate-50'
      }`}>
        <span className="text-[12px] text-slate-500 font-light flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          {totalGuests} {isID ? 'tamu total' : 'guests total'}
          <span className="text-slate-400">· {isID ? 'Maks' : 'Max'} {selectedRoom.maxOccupancy} {isID ? 'tamu' : 'guests'}</span>
        </span>
        {totalGuests < maxOccupancy && (
          <span className="text-[11px] text-slate-400 font-light hidden sm:block">
            {isID ? `Sisa ${maxOccupancy - totalGuests} kapasitas` : `${maxOccupancy - totalGuests} spots left`}
          </span>
        )}
      </div>
    </div>
  );
};