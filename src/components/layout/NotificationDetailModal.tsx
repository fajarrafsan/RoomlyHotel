import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Tag, Clock, Receipt, Building2, Calendar, CreditCard, ArrowUpRight } from 'lucide-react';
import { Notification } from '../../types';
import { parseNotificationMessage } from '../../lib/notificationFormatter';

interface NotificationDetailModalProps {
  notification: Notification | null;
  onClose: () => void;
  isID: boolean;
  onOpenInvoiceByCode?: (bookingCode: string) => void;
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  onClose,
  isID,
  onOpenInvoiceByCode,
}) => {
  if (!notification) return null;

  const parsed = parseNotificationMessage(notification.message);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden relative my-auto max-h-[90vh] flex flex-col"
        >
          {/* Accent Line */}
          <div className="h-1 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-amber-500 shrink-0" />

          {/* Modal Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  notification.type === 'booking'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : notification.type === 'promo'
                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {notification.type === 'booking' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : notification.type === 'promo' ? (
                  <Tag className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-base text-slate-900 leading-tight">
                  {notification.title}
                </h3>
                <span className="text-[11px] text-slate-400 font-light block mt-0.5">
                  {notification.time}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center border border-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-700">
            {/* Clean Message Intro */}
            <p className="text-[13px] leading-relaxed text-slate-600 font-normal">
              {parsed.cleanPreview}
            </p>

            {/* Formatted Invoice / Stay Card if present */}
            {(parsed.bookingCode || parsed.invoiceNumber || parsed.hotelName) && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 uppercase tracking-wider">
                    <Receipt className="w-4 h-4 text-teal-600" />
                    <span>{isID ? 'Rincian Notifikasi' : 'Notification Summary'}</span>
                  </div>
                  {parsed.invoiceNumber && (
                    <span className="px-2.5 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-[11px] font-mono font-semibold text-teal-800">
                      {parsed.invoiceNumber}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                  {parsed.bookingCode && (
                    <div className="p-2.5 rounded-xl bg-white border border-slate-100 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        {isID ? 'Kode Booking' : 'Booking Code'}
                      </span>
                      <code className="font-mono font-bold text-slate-800 text-[12px]">
                        {parsed.bookingCode}
                      </code>
                    </div>
                  )}

                  {parsed.totalPaid && (
                    <div className="p-2.5 rounded-xl bg-white border border-slate-100 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        {isID ? 'Total Dibayar' : 'Total Paid'}
                      </span>
                      <span className="font-semibold text-emerald-600 text-[13px]">
                        {parsed.totalPaid}
                      </span>
                    </div>
                  )}

                  {parsed.hotelName && (
                    <div className="p-2.5 rounded-xl bg-white border border-slate-100 space-y-0.5 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {isID ? 'Hotel & Kamar' : 'Hotel & Room'}
                      </span>
                      <p className="font-semibold text-slate-900">
                        {parsed.hotelName} {parsed.roomType ? `· ${parsed.roomType}` : ''}
                      </p>
                    </div>
                  )}

                  {parsed.stayDates && (
                    <div className="p-2.5 rounded-xl bg-white border border-slate-100 space-y-0.5 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {isID ? 'Tanggal Menginap' : 'Stay Dates'}
                      </span>
                      <p className="font-medium text-slate-700">{parsed.stayDates}</p>
                    </div>
                  )}
                </div>

                {/* Direct Action Button */}
                {parsed.bookingCode && onOpenInvoiceByCode && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenInvoiceByCode(parsed.bookingCode!);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-[12px] font-semibold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>{isID ? 'Lihat Invoice Lengkap' : 'View Full Invoice'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
            <button
              onClick={onClose}
              className="py-2 px-5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-[12px] font-semibold transition-all cursor-pointer"
            >
              {isID ? 'Tutup' : 'Close'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
