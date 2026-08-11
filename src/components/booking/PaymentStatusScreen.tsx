import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Loader2, CheckCircle2, XCircle, RotateCw } from 'lucide-react';

interface PaymentStatusScreenProps {
  isID: boolean;
  paymentStatus: string;
  redirectUrl: string;
  isChecking: boolean;
  checkError: string | null;
  onCheck: () => void;
  onReopen: () => void;
  onDone: () => void;
}

export const PaymentStatusScreen: React.FC<PaymentStatusScreenProps> = ({
  isID, paymentStatus, redirectUrl, isChecking, checkError, onCheck, onReopen, onDone,
}) => {
  const isPaid = paymentStatus === 'PAID';
  const isFailed = ['FAILED', 'EXPIRED', 'CANCELLED'].includes(paymentStatus);

  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-5"
      >
        {isPaid ? (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">{isID ? 'Pembayaran Berhasil!' : 'Payment Successful!'}</h2>
            <p className="text-sm text-slate-500">
              {isID ? 'Reservasi kamu sudah dikonfirmasi.' : 'Your reservation has been confirmed.'}
            </p>
            <button
              onClick={onDone}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold transition-colors"
            >
              {isID ? 'Lihat Pesanan Saya' : 'View My Bookings'}
            </button>
          </>
        ) : isFailed ? (
          <>
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              {isID ? 'Pembayaran Tidak Berhasil' : 'Payment Unsuccessful'}
            </h2>
            <p className="text-sm text-slate-500">
              {isID ? `Status: ${paymentStatus}. Kamu bisa cek detailnya di halaman Pesanan Saya.` : `Status: ${paymentStatus}. You can check details in My Bookings.`}
            </p>
            <button
              onClick={onDone}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold transition-colors"
            >
              {isID ? 'Lihat Pesanan Saya' : 'View My Bookings'}
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              {isID ? 'Menunggu Konfirmasi Pembayaran' : 'Waiting for Payment Confirmation'}
            </h2>
            <p className="text-sm text-slate-500">
              {isID
                ? 'Selesaikan pembayaran di tab yang baru terbuka. Halaman ini otomatis memeriksa status secara berkala.'
                : 'Complete the payment in the tab that just opened. This page checks the status automatically.'}
            </p>

            <button
              onClick={onReopen}
              className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[13px] font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              {isID ? 'Buka Lagi Halaman Pembayaran' : 'Reopen Payment Page'}
            </button>

            <button
              onClick={onCheck}
              disabled={isChecking}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
              {isID ? 'Saya Sudah Bayar, Cek Sekarang' : "I've Paid, Check Now"}
            </button>

            {checkError && <p className="text-[12px] text-rose-600">{checkError}</p>}

            <button
              onClick={onDone}
              className="text-[12px] text-slate-400 hover:text-slate-600 font-medium transition-colors"
            >
              {isID ? 'Nanti saja, cek di Pesanan Saya' : "I'll check later in My Bookings"}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};
