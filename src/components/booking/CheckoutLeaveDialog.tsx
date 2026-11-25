import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertCircle, CalendarX2, Loader2, LogOut } from 'lucide-react';
import { fadeTween } from '../../lib/motion';
import type { CheckoutLeaveHold } from './useCheckoutLeaveGuard';

interface CheckoutLeaveDialogProps {
  isID: boolean;
  /** What is waiting on the guest's answer; the dialog is closed when nothing is. */
  hold: CheckoutLeaveHold;
  /** The booking is being created, so leaving is not offered at all. */
  processing: boolean;
  loggingOut?: boolean;
  logoutFailed?: boolean;
  onStay: () => void;
  onLeave: () => void | Promise<void>;
}

export const CheckoutLeaveDialog: React.FC<CheckoutLeaveDialogProps> = ({ isID, hold, processing, loggingOut = false, logoutFailed = false, onStay, onLeave }) => {
  const open = hold !== null;
  const isLogout = hold === 'logout';
  const busyLogout = isLogout && loggingOut;
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const bodyId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const stayRef = useRef<HTMLButtonElement>(null);
  const onStayRef = useRef(onStay);
  onStayRef.current = onStay;
  const busyRef = useRef(busyLogout);
  busyRef.current = busyLogout;
  const dismiss = () => { if (!busyRef.current) onStayRef.current(); };

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    stayRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (!busyRef.current) onStayRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const buttons = Array.from(panelRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (!first || !last) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);

  if (typeof document === 'undefined') return null;

  const transition = reduceMotion ? { duration: 0 } : fadeTween;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="booking-checkout fixed inset-0 z-[80] flex overflow-y-auto p-4"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          data-checkout-leave-dialog
        >
          <div className="fixed inset-0 bg-[#0b1f3a]/55" onClick={dismiss} aria-hidden />
          <motion.div
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={bodyId}
            aria-busy={busyLogout || processing}
            tabIndex={-1}
            initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
            transition={transition}
            className="relative m-auto w-full max-w-[420px] rounded-[26px] bg-white p-6 text-center shadow-[0_24px_64px_rgba(11,31,58,0.3)] sm:p-7"
          >
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold-soft text-gold-dark">
              {processing || busyLogout ? <Loader2 className="size-6 animate-spin motion-reduce:animate-none" aria-hidden /> : isLogout ? <LogOut className="size-6" aria-hidden /> : <CalendarX2 className="size-6" aria-hidden />}
            </div>
            <h2 id={titleId} className="mt-4 font-serif text-[24px] leading-tight tracking-[-0.02em] text-navy-dark">
              {busyLogout
                ? (isID ? 'Sedang keluar dari akun' : 'Signing out of your account')
                : processing
                ? (isID ? 'Reservasimu sedang diproses' : 'Your reservation is being processed')
                : isLogout
                  ? (isID ? 'Keluar dari akun?' : 'Log out of your account?')
                  : (isID ? 'Tinggalkan reservasi?' : 'Leave this reservation?')}
            </h2>
            <p id={bodyId} className="mt-2 text-[15px] leading-6 text-slate-600">
              {busyLogout
                ? (isID ? 'Mohon tunggu sampai sesi akunmu selesai ditutup.' : 'Please wait while your account session is being closed.')
                : processing
                ? (isID ? 'Mohon tunggu sebentar sampai halaman pembayaran terbuka.' : 'Please wait a moment until the payment page opens.')
                : (isID ? 'Tanggal dan data tamu yang sudah kamu isi akan hilang, dan kamar ini belum dipesan.' : "The dates and guest details you've entered will be lost, and this room isn't booked yet.")}
            </p>
            {isLogout && logoutFailed && !busyLogout && (
              <p className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-left text-[13px] leading-5 text-rose-800" role="alert">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{isID ? 'Permintaan keluar belum dapat dikonfirmasi. Halaman dan isianmu tetap dipertahankan. Coba lagi atau lanjutkan reservasi.' : 'Sign-out could not be confirmed. This page and your entries have been kept. Try again or continue booking.'}</span>
              </p>
            )}
            <div className="mt-6 space-y-2.5">
              <button
                ref={stayRef}
                type="button"
                onClick={dismiss}
                disabled={busyLogout}
                className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-gold px-5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(161,98,7,0.2)] transition-colors duration-200 hover:bg-gold-dark disabled:cursor-wait disabled:opacity-50"
              >
                {processing ? (isID ? 'Mengerti' : 'Got it') : (isID ? 'Lanjutkan reservasi' : 'Keep booking')}
              </button>
              {!processing && (
                <button
                  type="button"
                  onClick={() => { void onLeave(); }}
                  disabled={busyLogout}
                  className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:border-rose-200 hover:text-rose-700 disabled:cursor-wait disabled:opacity-50"
                >
                  {busyLogout && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />}
                  {busyLogout ? (isID ? 'Sedang keluar...' : 'Signing out...') : isLogout ? (logoutFailed ? (isID ? 'Coba keluar lagi' : 'Try signing out again') : (isID ? 'Ya, keluar' : 'Yes, log out')) : (isID ? 'Ya, tinggalkan' : 'Yes, leave')}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
