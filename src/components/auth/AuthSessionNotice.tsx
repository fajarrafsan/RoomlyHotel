import React from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';
import { Language } from '../../types';

export type AuthNoticeKind = 'logout' | 'expired' | 'other-tab';

export function AuthSessionNotice({ kind, language, onDismiss, onSignIn }: { kind: AuthNoticeKind; language: Language; onDismiss: () => void; onSignIn: () => void }) {
  const isID = language === 'ID';
  const success = kind === 'logout';
  return <div className="auth-modal fixed inset-x-4 bottom-4 z-[90] mx-auto flex max-w-[560px] items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_48px_rgba(12,31,59,0.16)] sm:bottom-6" role="status" aria-live="polite" data-auth-session-notice>
    {success ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden /> : <Info className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />}
    <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-navy-dark">{success ? (isID ? 'Berhasil keluar dari akun' : 'You are signed out') : kind === 'expired' ? (isID ? 'Sesi masuk sudah berakhir' : 'Your session has expired') : (isID ? 'Akun keluar melalui tab lain' : 'You were signed out in another tab')}</p><p className="mt-1 text-xs leading-5 text-slate-600">{success ? (isID ? 'Reservasimu tetap tersimpan. Sampai jumpa di perjalanan berikutnya.' : 'Your reservations remain saved. See you on your next journey.') : (isID ? 'Masuk kembali untuk mengakses data akunmu.' : 'Sign in again to access your account details.')}</p>{!success && <button type="button" onClick={onSignIn} className="mt-1 inline-flex min-h-11 cursor-pointer items-center text-xs font-semibold text-gold hover:text-navy">{isID ? 'Masuk kembali' : 'Sign in again'}</button>}</div>
    <button type="button" onClick={onDismiss} aria-label={isID ? 'Tutup pemberitahuan sesi' : 'Dismiss session notice'} className="-mr-1 -mt-1 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-navy"><X className="size-4" aria-hidden /></button>
  </div>;
}
