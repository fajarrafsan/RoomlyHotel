import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CreditCard, ShieldCheck, Receipt, Moon } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import { fadeTween } from '../../../lib/motion';

interface ReviewPayStepProps {
  isID: boolean;
  nights: number;
  estimatedTotal: number;
  roomName: string;
  error: string | null;
}

export const ReviewPayStep: React.FC<ReviewPayStepProps> = ({
  isID, nights, estimatedTotal, roomName, error
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h4 className="font-serif text-xl text-navy tracking-tight flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-gold" aria-hidden />
          {isID ? 'Tinjau & bayar' : 'Review & pay'}
        </h4>
        <p className="text-[13px] text-slate-500">
          {isID ? 'Periksa detail reservasi Anda sebelum melanjutkan ke pembayaran.'
            : 'Please review your booking details before proceeding to payment.'}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={fadeTween}
        className="flex items-start gap-3 p-4 rounded-2xl bg-navy-soft/50 border border-navy-soft"
      >
        <div className="w-11 h-11 rounded-xl bg-white border border-navy-soft flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-navy" aria-hidden />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-navy">{isID ? 'Pembayaran aman' : 'Secure payment'}</p>
          <p className="text-[12px] text-slate-500 leading-relaxed mt-0.5">
            {isID ? 'Anda akan diarahkan ke Midtrans untuk memilih metode pembayaran — transfer bank, GoPay, QRIS, atau kartu kredit.'
              : 'You will be redirected to Midtrans to choose a payment method — bank transfer, GoPay, QRIS, or credit card.'}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={fadeTween}
        className="p-5 rounded-2xl bg-white border border-navy-soft space-y-4"
      >
        <div className="flex items-center gap-2 pb-3 border-b border-navy-soft">
          <Receipt className="w-4 h-4 text-gold" aria-hidden />
          <span className="text-[13px] font-semibold text-navy">{isID ? 'Ringkasan biaya' : 'Price breakdown'}</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Moon className="w-3.5 h-3.5 text-gold shrink-0" aria-hidden />
              <span className="text-[13px] text-slate-600">
                {roomName} x {nights} {isID ? 'malam (estimasi tarif dasar)' : 'nights (base-rate estimate)'}
              </span>
            </div>
            <span className="text-[13px] font-medium text-navy shrink-0">{formatCurrency(estimatedTotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-slate-400">{isID ? 'Tarif musiman, pajak & layanan' : 'Seasonal rates, taxes & fees'}</span>
            <span className="text-[13px] text-slate-400 shrink-0">{isID ? 'Dihitung server' : 'Calculated by server'}</span>
          </div>
        </div>

        <div className="h-px bg-navy-soft" />

        <div className="flex items-center justify-between gap-3 pt-1">
          <div>
            <span className="text-[13px] font-semibold text-navy">{isID ? 'Estimasi subtotal' : 'Estimated subtotal'}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isID ? 'Total final ditampilkan setelah server membuat reservasi' : 'The final server total appears after booking creation'}
            </p>
          </div>
          <span className="font-serif text-2xl text-navy tracking-tight shrink-0">{formatCurrency(estimatedTotal)}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={fadeTween}
        className="flex items-start gap-3 p-4 rounded-2xl bg-gold-soft border border-gold-light/50"
      >
        <AlertCircle className="w-4 h-4 text-gold mt-0.5 shrink-0" aria-hidden />
        <p className="text-[12px] text-gold-dark font-medium leading-relaxed">
          {isID
            ? 'Ketentuan pembatalan dan jumlah pengembalian dana mengikuti kebijakan kamar serta evaluasi server saat pembatalan diajukan.'
            : 'Cancellation eligibility and refund amounts follow the room policy and the server evaluation when cancellation is requested.'}
        </p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={fadeTween}
          className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[12px] font-medium flex items-start gap-2"
          role="alert"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />{error}
        </motion.div>
      )}
    </div>
  );
};
