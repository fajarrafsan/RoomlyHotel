import React from 'react';
import { motion } from 'motion/react';
import { Building2, X, Check } from 'lucide-react';
import { pillTween } from '../../lib/motion';

interface BookingWizardHeaderProps {
  isID: boolean;
  hotelName: string;
  roomName: string;
  step: number;
  onClose: () => void;
}

const steps = [
  { key: 1, labelID: 'Tanggal & Tamu', labelEN: 'Dates & Guests' },
  { key: 2, labelID: 'Data Tamu', labelEN: 'Guest Details' },
  { key: 3, labelID: 'Konfirmasi & Bayar', labelEN: 'Review & Pay' },
];

export const BookingWizardHeader: React.FC<BookingWizardHeaderProps> = ({
  isID,
  hotelName,
  roomName,
  step,
  onClose
}) => {
  return (
    <>
      <div className="px-5 sm:px-6 py-5 bg-navy text-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-gold-light" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-light">
              {isID ? 'Reservasi' : 'Reservation'}
            </p>
            <h3 className="font-serif text-lg leading-tight truncate">
              {hotelName}
            </h3>
            <p className="text-[12px] text-white/70 truncate">{roomName}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={isID ? 'Tutup' : 'Close'}
          className="min-w-11 min-h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors duration-200 cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 sm:px-6 py-4 bg-white border-b border-navy-soft">
        <div className="flex items-center">
          {steps.map((s, idx) => {
            const isCompleted = step > s.key;
            const isActive = step === s.key;
            const isLast = idx === steps.length - 1;

            return (
              <React.Fragment key={s.key}>
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-colors duration-200 ${
                      isCompleted || isActive
                        ? 'bg-navy border-navy text-white'
                        : 'bg-white border-navy-soft text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden /> : s.key}
                  </div>
                  <span className={`text-[11px] font-medium whitespace-nowrap ${
                    isActive ? 'text-navy' : isCompleted ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    {isID ? s.labelID : s.labelEN}
                  </span>
                </div>

                {!isLast && (
                  <div className="flex-1 h-0.5 mx-2 mb-5 relative bg-navy-soft rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-navy rounded-full"
                      initial={false}
                      animate={{ width: isCompleted ? '100%' : '0%' }}
                      transition={pillTween}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </>
  );
};
