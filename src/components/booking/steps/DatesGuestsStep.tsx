import React from 'react';
import { CalendarCheck, CalendarDays, Minus, Plus, UsersRound } from 'lucide-react';
import { RoomType } from '../../../types';
import { formatDate } from '../../../lib/utils';
import { RoomAvailabilityCalendar } from '../RoomAvailabilityCalendar';
import { formatNights } from '../BookingSummary';

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

const stepperButton = 'flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-navy-dark transition-colors duration-150 hover:border-gold/60 hover:text-gold-dark disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-slate-200 disabled:hover:text-navy-dark';

export const DatesGuestsStep: React.FC<DatesGuestsStepProps> = ({
  isID, checkIn, checkOut, adults, children, nights,
  selectedRoom, onCheckInChange, onCheckOutChange, onAdultsChange, onChildrenChange
}) => {
  const lang = isID ? 'ID' : 'EN';
  const totalGuests = adults + children;
  const maxOccupancy = selectedRoom.maxOccupancy;
  const maxAdults = selectedRoom.capacityAdult ?? maxOccupancy;
  const maxChildren = selectedRoom.capacityChild ?? maxOccupancy;
  const canAddAdult = adults + children < maxOccupancy && adults < maxAdults;
  const canAddChild = adults + children < maxOccupancy && children < maxChildren;
  const picking = !checkIn ? 'in' : !checkOut ? 'out' : null;
  const chooseDate = isID ? 'Pilih tanggal' : 'Select a date';
  const dates = [
    { key: 'in', title: 'Check-in', value: checkIn },
    { key: 'out', title: 'Check-out', value: checkOut },
  ];

  const guestRows = [
    {
      key: 'adults', title: isID ? 'Dewasa' : 'Adults', hint: `${isID ? 'Usia 13+' : 'Age 13+'} · ${isID ? 'Maks' : 'Max'} ${maxAdults}`, value: adults,
      canRemove: adults > 1, canAdd: canAddAdult,
      onRemove: () => onAdultsChange(Math.max(1, adults - 1)),
      onAdd: () => onAdultsChange(Math.min(maxAdults, maxOccupancy - children, adults + 1)),
      removeLabel: isID ? 'Kurangi dewasa' : 'Decrease adults', addLabel: isID ? 'Tambah dewasa' : 'Increase adults',
    },
    {
      key: 'children', title: isID ? 'Anak' : 'Children', hint: `${isID ? 'Usia 0-12' : 'Age 0-12'} · ${isID ? 'Maks' : 'Max'} ${maxChildren}`, value: children,
      canRemove: children > 0, canAdd: canAddChild,
      onRemove: () => onChildrenChange(Math.max(0, children - 1)),
      onAdd: () => onChildrenChange(Math.min(maxChildren, maxOccupancy - adults, children + 1)),
      removeLabel: isID ? 'Kurangi anak' : 'Decrease children', addLabel: isID ? 'Tambah anak' : 'Increase children',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <h2 className="font-serif text-[25px] leading-tight tracking-tight text-navy-dark sm:text-[31px]" tabIndex={-1} data-checkout-step-heading>
          {isID ? 'Kapan kamu menginap?' : 'When are you staying?'}
        </h2>
        <p className="mt-1 text-sm leading-5 text-slate-600" aria-live="polite">
          {picking === 'in'
            ? (isID ? 'Pilih tanggal check-in di kalender.' : 'Choose your check-in date on the calendar.')
            : picking === 'out'
              ? (isID ? 'Sekarang pilih tanggal check-out.' : 'Now choose your check-out date.')
              : (isID ? `${formatNights(nights, true)} menginap. Klik tanggal lain untuk mengubah.` : `${formatNights(nights, false)} selected. Click another date to change it.`)}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-2 sm:gap-3">
        {dates.map(({ key, title, value }) => {
          const Icon = value ? CalendarCheck : CalendarDays;
          return (
            <div key={key} className={`min-w-0 rounded-xl border px-2.5 py-2 sm:px-3.5 sm:py-3 ${picking === key ? 'border-gold-light bg-gold-soft/50' : 'border-slate-200 bg-slate-50'}`}>
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Icon className="size-3.5 shrink-0 text-gold-dark sm:size-4" aria-hidden />{title}
              </dt>
              <dd className="mt-1 text-sm font-bold leading-5 text-navy-dark [overflow-wrap:anywhere]">{value ? formatDate(value, lang) : chooseDate}</dd>
            </div>
          );
        })}
      </dl>

      <RoomAvailabilityCalendar
        isID={isID} roomId={selectedRoom.id} checkIn={checkIn} checkOut={checkOut}
        onCheckInChange={onCheckInChange} onCheckOutChange={onCheckOutChange}
      />

      <section className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3.5 sm:px-4" aria-labelledby="checkout-guests-heading">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h3 id="checkout-guests-heading" className="flex items-center gap-2 text-[17px] font-bold leading-tight text-navy-dark">
            <UsersRound className="size-4 shrink-0 text-gold-dark" aria-hidden />{isID ? 'Jumlah tamu' : 'Number of guests'}
          </h3>
          <p className={`text-[13px] font-medium leading-5 ${totalGuests >= maxOccupancy ? 'text-gold-dark' : 'text-slate-500'}`} aria-live="polite">
            {totalGuests >= maxOccupancy
              ? (isID ? `Kapasitas maksimum ${maxOccupancy} tamu` : `Maximum of ${maxOccupancy} guests reached`)
              : (isID ? `${totalGuests} dari maksimal ${maxOccupancy} tamu` : `${totalGuests} of up to ${maxOccupancy} guests`)}
          </p>
        </div>

        <div className="mt-2 divide-y divide-slate-200">
          {guestRows.map((row) => (
            <div key={row.key} className="flex min-h-[68px] items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold leading-6 text-navy-dark">{row.title}</p>
                <p className="text-[13px] leading-5 text-slate-500">{row.hint}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={row.onRemove} disabled={!row.canRemove} aria-label={row.removeLabel} className={stepperButton}><Minus className="size-4" aria-hidden /></button>
                <span className="w-7 text-center text-[17px] font-semibold tabular-nums text-navy-dark" aria-live="polite">{row.value}</span>
                <button type="button" onClick={row.onAdd} disabled={!row.canAdd} aria-label={row.addLabel} className={stepperButton}><Plus className="size-4" aria-hidden /></button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
