import React from 'react';
import { motion } from 'motion/react';
import { Building2, X, Check } from 'lucide-react';

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
      {/* Top Header */}
      <div className="px-6 py-5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-slate-700" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight truncate">
              {isID ? 'Reservasi Hotel' : 'Hotel Reservation'}
            </h3>
            <p className="text-[12px] text-slate-400 font-light truncate">
              {hotelName} · {roomName}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stepper */}
      <div className="px-6 py-5 bg-white border-b border-slate-100">
        <div className="flex items-center">
          {steps.map((s, idx) => {
            const isCompleted = step > s.key;
            const isActive = step === s.key;
            const isLast = idx === steps.length - 1;

            return (
              <React.Fragment key={s.key}>
                {/* Step Circle + Label */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor: isCompleted || isActive ? '#0f172a' : '#ffffff',
                      borderColor: isCompleted || isActive ? '#0f172a' : '#e2e8f0',
                    }}
                    transition={{ duration: 0.3 }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border-2 ${
                      isCompleted || isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : s.key}
                  </motion.div>
                  <span className={`text-[11px] font-medium whitespace-nowrap transition-colors duration-200 ${
                    isActive ? 'text-slate-900' : isCompleted ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    {isID ? s.labelID : s.labelEN}
                  </span>
                </div>

                {/* Connector Line */}
                {!isLast && (
                  <div className="flex-1 h-px mx-3 mb-5 relative">
                    <div className="absolute inset-0 bg-slate-100" />
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-slate-900"
                      initial={{ width: '0%' }}
                      animate={{ width: isCompleted ? '100%' : '0%' }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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