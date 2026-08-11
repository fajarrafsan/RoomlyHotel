import React from 'react';
import { motion } from 'motion/react';
import { CreditCard, ShieldCheck, AlertCircle, Receipt, Moon, Users, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';

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
      {/* Section Header */}
      <div className="space-y-1">
        <h4 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-slate-400" />
          {isID ? 'Tinjau & Bayar' : 'Review & Pay'}
        </h4>
        <p className="text-[13px] text-slate-400 font-light">
          {isID ? 'Periksa detail reservasi Anda sebelum melanjutkan ke pembayaran.'
            : 'Please review your booking details before proceeding to payment.'}
        </p>
      </div>

      {/* Secure Payment Info */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-slate-500" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-slate-900">{isID ? 'Pembayaran Aman' : 'Secure Payment'}</p>
          <p className="text-[12px] text-slate-400 font-light leading-relaxed mt-0.5">
            {isID ? 'Anda akan diarahkan ke Midtrans untuk memilih metode pembayaran — transfer bank, GoPay, QRIS, atau kartu kredit.'
              : 'You will be redirected to Midtrans to choose a payment method — bank transfer, GoPay, QRIS, or credit card.'}
          </p>
        </div>
      </motion.div>

      {/* Price Breakdown Card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
          <Receipt className="w-4 h-4 text-slate-400" />
          <span className="text-[13px] font-semibold text-slate-900">{isID ? 'Ringkasan Biaya' : 'Price Breakdown'}</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[13px] text-slate-600 font-light">{roomName} x {nights} {isID ? 'malam' : 'nights'}</span>
            </div>
            <span className="text-[13px] font-medium text-slate-900">{formatCurrency(estimatedTotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-slate-400 font-light">{isID ? 'Pajak & Layanan' : 'Taxes & Fees'}</span>
            <span className="text-[13px] text-slate-400 font-light">{isID ? 'Termasuk' : 'Included'}</span>
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-[13px] font-semibold text-slate-900">{isID ? 'Total' : 'Total'}</span>
            <p className="text-[11px] text-slate-400 font-light mt-0.5">{isID ? 'Termasuk semua pajak & biaya' : 'Includes all taxes & fees'}</p>
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(estimatedTotal)}</span>
        </div>
      </motion.div>

      {/* Cancellation Policy */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
        <p className="text-[12px] text-emerald-700 font-medium leading-relaxed">
          {isID ? 'Gratis pembatalan hingga 24 jam sebelum check-in. Uang akan dikembalikan penuh.'
            : 'Free cancellation up to 24 hours before check-in. Full refund guaranteed.'}
        </p>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[12px] font-medium flex items-start gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />{error}
        </motion.div>
      )}
    </div>
  );
};