import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Clock3, RotateCcw } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { ApiError, type OtpRequiredError } from '../../lib/http';
import type { AuthUser } from '../../types';
import type { AdminOtpChallengeDto } from '../../types/api';

interface AdminOtpFormProps {
  attempt: OtpRequiredError;
  isID: boolean;
  onBack: () => void;
  onBusyChange: (busy: boolean) => void;
  onVerified: (user: AuthUser) => void;
}

function startCountdown(challenge: AdminOtpChallengeDto | null) {
  const duration = challenge?.expiresInSeconds ?? 300;
  return { duration, expiresAt: Date.now() + duration * 1000, challengeId: challenge?.challengeId };
}

export function AdminOtpForm({ attempt, isID, onBack, onBusyChange, onVerified }: AdminOtpFormProps) {
  const { verifyAdminOtp } = useAuth();
  const codeId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const [countdown, setCountdown] = useState(() => startCountdown(attempt.challenge));
  const [remaining, setRemaining] = useState(countdown.duration);
  const [code, setCode] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [pending, setPending] = useState<'verify' | 'resend' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const expired = remaining === 0;

  useEffect(() => {
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((countdown.expiresAt - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) window.clearInterval(interval);
    };
    const interval = window.setInterval(tick, 250);
    tick();
    inputRef.current?.focus({ preventScroll: true });
    return () => window.clearInterval(interval);
  }, [countdown]);

  const submitCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busyRef.current || Date.now() >= countdown.expiresAt || code.length !== 6) return;
    busyRef.current = true;
    onBusyChange(true);
    setPending('verify');
    setError(null);
    try {
      onVerified(await verifyAdminOtp(attempt.email, code));
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401
        ? (isID ? 'Kode salah atau sudah kedaluwarsa.' : 'The code is incorrect or has expired.')
        : (isID ? 'Verifikasi gagal. Coba lagi sebentar.' : 'Verification failed. Try again in a moment.'));
    } finally {
      busyRef.current = false;
      onBusyChange(false);
      setPending(null);
    }
  };

  const resendCode = async () => {
    if (busyRef.current || !expired || !countdown.challengeId || sessionEnded) return;
    busyRef.current = true;
    onBusyChange(true);
    setPending('resend');
    setError(null);
    setResent(false);
    try {
      const result = await authApi.resendAdminOtp(attempt.email, countdown.challengeId);
      if (!result.otpChallenge) throw new Error('Missing OTP challenge');
      const updated = startCountdown(result.otpChallenge);
      setRemaining(updated.duration);
      setCountdown(updated);
      setCode('');
      setSelection({ start: 0, end: 0 });
      setResent(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setSessionEnded(true);
        setError(isID ? 'Sesi verifikasi sudah berakhir. Masuk lagi untuk meminta kode baru.' : 'This verification session has ended. Sign in again to request a new code.');
      } else if (err instanceof ApiError && (err.status === 409 || err.status === 429)) {
        setError(isID ? 'Kode belum bisa dikirim ulang. Coba lagi sebentar.' : 'A new code is not available yet. Try again in a moment.');
      } else {
        setError(isID ? 'Kode baru belum berhasil dikirim. Silakan coba lagi.' : 'The new code could not be sent. Please try again.');
      }
    } finally {
      busyRef.current = false;
      onBusyChange(false);
      setPending(null);
    }
  };

  const time = [Math.floor(remaining / 60), remaining % 60].map(value => String(value).padStart(2, '0')).join(':');
  return (
    <form onSubmit={submitCode} className="space-y-4">
      <div>
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <label htmlFor={codeId} className="text-sm font-semibold text-navy-dark">
            {isID ? 'Kode verifikasi' : 'Verification code'}
          </label>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${expired ? 'bg-amber-100 text-amber-900' : 'bg-navy-soft text-navy-dark'}`}>
            <Clock3 className="size-3.5" aria-hidden />
            <span role="timer">
              <span className="sr-only">{isID ? 'Waktu tersisa ' : 'Time remaining '}</span>{time}
            </span>
          </span>
        </div>
        <div className="group relative">
          <input
            ref={inputRef}
            id={codeId}
            name="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            aria-invalid={Boolean(error && !expired) || undefined}
            aria-describedby={error ? errorId : undefined}
            required
            disabled={pending !== null || expired}
            value={code}
            onChange={(event) => { setCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(null); }}
            onSelect={(event) => {
              const { selectionStart, selectionEnd } = event.currentTarget;
              setSelection({ start: selectionStart ?? 0, end: selectionEnd ?? 0 });
            }}
            className="absolute inset-0 z-10 size-full cursor-text text-base opacity-0 disabled:cursor-not-allowed"
          />
          <div className="grid grid-cols-6 gap-1.5 sm:gap-2" aria-hidden>
            {Array.from({ length: 6 }, (_, index) => (
              <span
                key={index}
                className={`grid h-12 place-items-center rounded-[10px] border text-xl font-semibold tabular-nums sm:h-14 sm:text-2xl ${expired ? 'border-slate-200 bg-slate-50 text-slate-400' : 'border-slate-200 bg-white text-navy-dark'} ${index >= selection.start && index < selection.end ? 'group-focus-within:bg-navy-soft' : ''} ${index === Math.min(selection.start, 5) ? 'group-focus-within:border-navy group-focus-within:ring-2 group-focus-within:ring-navy/15' : ''}`}
              >
                {code[index] || <span className="h-0.5 w-2.5 rounded-full bg-slate-300" />}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-3 h-0.5 overflow-hidden rounded-full bg-slate-200/70" aria-hidden>
          <div className="h-full rounded-full bg-[#ad843b] motion-safe:transition-[width] motion-safe:duration-500"
            style={{ width: `${(remaining / countdown.duration) * 100}%` }} />
        </div>
        <p role="status" className={`mt-2 text-xs font-medium empty:mt-0 ${expired ? 'text-amber-800' : 'text-emerald-700'}`}>
          {expired ? (isID ? 'Kode kedaluwarsa. Minta kode baru untuk melanjutkan.' : 'The code expired. Request a new code to continue.')
            : resent ? (isID ? 'Kode baru sudah dikirim.' : 'A new code was sent.') : ''}
        </p>
      </div>

      {error && <p id={errorId} role="alert" className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">{error}</p>}

      <button type="submit" disabled={pending !== null || expired || code.length !== 6} aria-busy={pending === 'verify'} className="auth-primary auth-otp-primary">
        {pending === 'verify'
          ? <><span className="auth-spinner" aria-hidden /><span role="status">{isID ? 'Memverifikasi…' : 'Verifying…'}</span></>
          : <>{isID ? 'Verifikasi dan masuk' : 'Verify and sign in'}<ArrowRight className="size-4" aria-hidden /></>}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 border-t border-slate-200 pt-3">
        <div>
          <p className="text-sm font-semibold text-navy-dark">{isID ? 'Email belum masuk?' : 'Didn’t get the email?'}</p>
          <p className="mt-0.5 text-xs text-slate-600">{isID ? 'Coba periksa folder Spam.' : 'Check your spam folder.'}</p>
        </div>
        {countdown.challengeId && (
          <button
            type="button"
            disabled={!expired || pending !== null || sessionEnded}
            aria-busy={pending === 'resend'}
            onClick={resendCode}
            className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg bg-navy-soft px-2.5 text-xs font-semibold text-navy-dark hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:bg-transparent disabled:text-slate-500"
          >
            <RotateCcw className={`size-4 ${pending === 'resend' ? 'motion-safe:animate-spin' : ''}`} aria-hidden />
            {pending === 'resend'
              ? (isID ? 'Mengirim…' : 'Sending…')
              : (isID ? 'Kirim ulang' : 'Resend code')}
          </button>
        )}
      </div>

      <button type="button" disabled={pending !== null} onClick={onBack}
        className="mx-auto flex min-h-11 w-fit cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-slate-600 hover:text-navy disabled:cursor-wait disabled:opacity-50">
        <ArrowLeft className="size-4" aria-hidden />
        {isID ? 'Kembali ke login' : 'Back to sign in'}
      </button>
    </form>
  );
}
