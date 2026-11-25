import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertCircle, Loader2, LogOut, X } from 'lucide-react';
import { AuthUser, Language } from '../../types';

interface LogoutConfirmDialogProps {
  open: boolean;
  language: Language;
  user: AuthUser | null;
  busy: boolean;
  failed: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmDialog({ open, language, user, busy, failed, onCancel, onConfirm }: LogoutConfirmDialogProps) {
  const isID = language === 'ID';
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const bodyId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const stateRef = useRef({ busy, onCancel });
  stateRef.current = { busy, onCancel };

  useEffect(() => {
    if (!open) return;
    const priorFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!stateRef.current.busy) stateRef.current.onCancel();
      }
      if (event.key !== 'Tab') return;
      const controls = [...(panelRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || !last) { event.preventDefault(); panelRef.current?.focus(); }
      else if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement as HTMLButtonElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement as HTMLButtonElement))) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = priorOverflow;
      if (priorFocus?.isConnected) priorFocus.focus({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (open && busy) panelRef.current?.focus({ preventScroll: true });
    else if (open && failed) confirmRef.current?.focus({ preventScroll: true });
  }, [open, busy, failed]);

  if (typeof document === 'undefined') return null;
  return createPortal(<AnimatePresence>{open && (
    <motion.div className="auth-modal fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.16 }} data-logout-confirm>
      <div className="fixed inset-0 bg-[#0b1f3a]/60 backdrop-blur-[3px]" aria-hidden onClick={() => { if (!busy) onCancel(); }} />
      <motion.div ref={panelRef} role="alertdialog" aria-modal="true" aria-busy={busy} aria-labelledby={titleId} aria-describedby={bodyId} tabIndex={-1} initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.2 }} className="relative my-auto w-full max-w-[440px] rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_28px_90px_rgba(10,25,46,0.25)] outline-none sm:p-8">
        <button type="button" disabled={busy} onClick={onCancel} aria-label={isID ? 'Tutup konfirmasi keluar' : 'Close sign-out confirmation'} className="absolute right-3 top-3 flex size-11 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-navy disabled:cursor-wait disabled:opacity-40"><X className="size-[18px]" aria-hidden /></button>
        <span className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-gold-light/40 bg-gold-soft/60 text-gold"><LogOut className="size-6" aria-hidden /></span>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">{isID ? 'Konfirmasi akun' : 'Account confirmation'}</p>
        <h2 id={titleId} className="font-serif text-[28px] leading-[1.2] tracking-tight text-navy-dark">{isID ? 'Keluar dari Roomly?' : 'Sign out of Roomly?'}</h2>
        {user && <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"><p className="truncate text-sm font-semibold text-navy-dark" title={user.fullName}>{user.fullName}</p><p className="mt-0.5 truncate text-xs text-slate-500" title={user.email}>{user.email}</p></div>}
        <p id={bodyId} className="mt-4 text-sm leading-6 text-slate-600">{isID ? 'Kamu perlu masuk lagi untuk membuka pengaturan dan pesanan. Keluar dari akun tidak membatalkan reservasi yang sudah dibuat.' : 'You will need to sign in again to access settings and bookings. Signing out does not cancel reservations you have already made.'}</p>
        {failed && <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-[13px] leading-5 text-rose-700"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />{isID ? 'Permintaan keluar belum berhasil dikonfirmasi. Periksa koneksi lalu coba lagi.' : 'Sign-out could not be confirmed. Check your connection and try again.'}</p>}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button ref={cancelRef} type="button" disabled={busy} onClick={onCancel} className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-navy-dark transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50">{isID ? 'Tetap masuk' : 'Stay signed in'}</button>
          <button ref={confirmRef} type="button" disabled={busy} onClick={onConfirm} className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-navy-dark px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy disabled:cursor-wait disabled:opacity-65">{busy ? <><Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />{isID ? 'Keluar…' : 'Signing out…'}</> : failed ? (isID ? 'Coba lagi' : 'Try again') : (isID ? 'Ya, keluar' : 'Yes, sign out')}</button>
        </div>
      </motion.div>
    </motion.div>
  )}</AnimatePresence>, document.body);
}
