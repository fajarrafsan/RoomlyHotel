import React, { useState, useEffect, useId, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  X, Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowRight,
  CheckCircle2, ShieldCheck, MapPin, LockKeyhole,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ApiError, OtpRequiredError } from '../../lib/http';
import { AuthUser, Language } from '../../types';
import { AuthFieldInput } from './AuthFieldInput';
import { AdminOtpForm } from './AdminOtpForm';
import { GoogleSignInButton } from './GoogleSignInButton';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { isOperationsRole, roleLandingPath } from '../../lib/routes';
import { easeSmooth, fadeTween } from '../../lib/motion';
import { applyImageFallback } from '../../lib/imageFallback';

interface AuthModalProps {
  onClose: () => void;
  language: Language;
  returnTo?: string | null;
}

const HotelMark: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M3 21h18" />
    <path d="M5 21V7l7-4 7 4v14" />
    <path d="M9 21v-5a3 3 0 0 1 6 0v5" />
    <path d="M12 3v4" />
    <circle cx="12" cy="11" r="1.2" fill="currentColor" />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, language, returnTo }) => {
  const isID = language === 'ID';
  const navigate = useNavigate();
  const { login, register, loginWithGoogle } = useAuth();
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const ids = {
    name: useId(),
    email: useId(),
    password: useId(),
    error: useId(),
    title: useId(),
    description: useId(),
    loginTab: useId(),
    registerTab: useId(),
    tabPanel: useId(),
  };

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [otpAttempt, setOtpAttempt] = useState<OtpRequiredError | null>(null);
  const [isOtpBusy, setIsOtpBusy] = useState(false);
  const busy = isSubmitting || isGoogleSubmitting || isOtpBusy;
  const busyRef = useRef(busy);
  busyRef.current = busy;

  const finishSignIn = (signedInUser?: AuthUser) => {
    onClose();
    // This destination comes from the local route guard, never an external URL.
    const destination = returnTo?.startsWith('/') && !returnTo.startsWith('//') && !returnTo.includes('\\') ? returnTo : null;
    if (signedInUser && isOperationsRole(signedInUser.role) && destination?.split('?')[0] !== '/settings') {
      navigate(roleLandingPath(signedInUser.role), { replace: true });
    } else if (destination) {
      navigate(destination, { replace: true });
    }
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!busyRef.current) onClose();
      }
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), a[href], iframe, [tabindex="0"]'
      )).filter((element) => !element.matches(':disabled') && !element.closest('[inert]') && element.tabIndex >= 0 && element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || !last) {
        e.preventDefault();
        dialog.focus();
      } else if (e.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement as HTMLElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement as HTMLElement))) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        const loggedUser = await login(email, password);
        finishSignIn(loggedUser);
      } else {
        await register(fullName, email, password);
        finishSignIn();
      }
    } catch (err) {
      if (err instanceof OtpRequiredError) {
        setPassword('');
        setOtpAttempt(err);
      } else if (err instanceof ApiError) {
        const fieldErrors = err.body?.errors ? Object.values(err.body.errors).join(', ') : null;
        setError(fieldErrors || err.message);
      } else {
        setError(isID ? 'Belum bisa terhubung. Silakan coba lagi sebentar.' : 'Unable to connect. Please try again in a moment.');
      }
    } finally {
      busyRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async (idToken: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setError(null);
    setIsGoogleSubmitting(true);
    try {
      const loggedUser = await loginWithGoogle(idToken);
      finishSignIn(loggedUser);
    } catch (err) {
      if (err instanceof OtpRequiredError) {
        setPassword('');
        setOtpAttempt(err);
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof DOMException && err.name === 'TimeoutError') {
        setError(isID ? 'Login Google terlalu lama. Silakan coba lagi.' : 'Google sign-in took too long. Please try again.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(isID ? 'Google Sign-In gagal. Coba lagi.' : 'Google Sign-In failed. Please try again.');
      }
    } finally {
      busyRef.current = false;
      setIsGoogleSubmitting(false);
    }
  };

  const isValidEmail = email.includes('@') && email.includes('.');

  const heading = otpAttempt
    ? (isID ? 'Verifikasi admin' : 'Admin verification')
    : mode === 'login'
      ? (isID ? 'Selamat datang kembali' : 'Welcome back')
      : (isID ? 'Buat akun baru' : 'Create your account');

  const subheading = otpAttempt
    ? <>
        {isID ? 'Masukkan kode 6 digit yang dikirim ke' : 'Enter the 6-digit code sent to'}
        <span className="mt-0.5 block break-all font-semibold text-navy-dark">{otpAttempt.email}</span>
      </>
    : mode === 'login'
      ? (isID ? 'Masuk untuk melanjutkan reservasi Anda.' : 'Sign in to continue your booking.')
      : (isID ? 'Daftar untuk mulai menjelajah penginapan.' : 'Register to start exploring stays.');

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setError(null);
  };

  const errorBanner = (
    <AnimatePresence>
      {error && (
        <motion.div
          id={ids.error}
          role="alert"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fadeTween}
          className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-[13px] font-medium flex items-start gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" aria-hidden />
          {error}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <motion.div
      initial="enter"
      animate="open"
      exit="exit"
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-3 sm:p-6"
      onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}
    >
      <motion.div
        variants={{ enter: { opacity: 0 }, open: { opacity: 1 }, exit: { opacity: 0 } }}
        transition={reduceMotion ? { duration: 0 } : fadeTween}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[3px]"
        aria-hidden
        onClick={() => { if (!busy) onClose(); }}
      />
      <motion.div
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={ids.title}
        aria-describedby={ids.description}
        variants={{
          enter: { y: reduceMotion ? 0 : 12, scale: reduceMotion ? 1 : 0.985 },
          open: { y: 0, scale: 1, opacity: 1 },
          exit: { y: reduceMotion ? 0 : 6, opacity: 0 },
        }}
        transition={{ duration: reduceMotion ? 0 : 0.24, ease: easeSmooth }}
        className={`auth-modal relative z-10 my-auto grid max-h-[calc(100dvh-1.5rem)] w-full overflow-y-auto border border-white/70 bg-white shadow-[0_32px_120px_rgba(9,20,44,0.3)] outline-none sm:max-h-[calc(100dvh-3rem)] ${otpAttempt ? 'max-w-[440px] rounded-[22px] before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-[#b18b46]' : 'max-w-[940px] rounded-[28px] md:grid-cols-[0.44fr_0.56fr]'}`}
        onClick={(event) => event.stopPropagation()}
      >
        {!otpAttempt && <aside className="relative m-3 mr-0 hidden min-h-[620px] flex-col justify-between overflow-hidden rounded-[20px] bg-slate-900 p-8 text-white md:flex lg:p-9">
          <img
            src="/images/seed/hotels/samudra-belitung.png"
            alt=""
            aria-hidden
            onError={applyImageFallback}
            className="absolute inset-0 h-full w-full object-cover object-[44%_center]"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-950/10 to-[#102647]" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-t from-[#102647]/95 via-transparent to-transparent" aria-hidden />

          <div className="relative flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl border border-white/30 bg-white/10">
              <HotelMark className="size-6 text-gold-light" />
            </span>
            <div>
              <p className="font-serif text-[26px] leading-none tracking-tight">Roomly<span className="text-gold-light">.</span></p>
              <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-white/80">
                {isID ? 'Hotel & Resor' : 'Hotels & Resorts'}
              </p>
            </div>
          </div>

          <div className="relative mt-48">
            <div className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-light">
              <span className="h-px w-7 bg-gold-light/70" aria-hidden />
              {isID ? 'Menginap dengan rasa' : 'A stay to remember'}
            </div>
            <p className="font-serif text-[39px] leading-[1.2] tracking-[-0.035em] lg:text-[42px]">
              {isID ? <>Jeda istimewa,<br /><span className="italic text-[#f0d7a3]">cerita baru.</span></> : <>A little escape.<br /><span className="italic text-[#f0d7a3]">A new story.</span></>}
            </p>
            <p className="mt-5 max-w-[260px] text-sm leading-6 text-white/80">
              {isID ? 'Temukan tempat favorit Anda. Kami bantu membuat setiap perjalanan terasa lebih mudah.' : 'Find your favourite place. We make every step of your journey feel a little easier.'}
            </p>
            <div className="mt-8 border-t border-white/20 pt-5">
              <p className="flex items-center gap-2 text-xs font-medium text-white/90">
                <MapPin className="size-3.5 text-gold-light" aria-hidden />
                Belitung, Indonesia
              </p>
              <p className="mt-2 text-[11px] tracking-wide text-white/60">
                {isID ? 'Satu akun. Banyak destinasi.' : 'One account. So many destinations.'}
              </p>
            </div>
          </div>
        </aside>}

        <section className={`relative min-w-0 ${otpAttempt ? 'px-5 pb-3 pt-6 sm:px-8 sm:pt-7' : 'px-6 pb-6 pt-8 sm:px-9 lg:px-11'}`}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={isID ? 'Tutup' : 'Close'}
            className="absolute right-3 top-3 z-10 flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-wait disabled:opacity-40"
          >
            <X className="size-[18px]" aria-hidden />
          </button>

          {!otpAttempt && <div className="mb-7 flex items-center gap-2.5 md:hidden">
            <span className="flex size-9 items-center justify-center rounded-lg bg-navy-dark">
              <HotelMark className="size-5 text-gold-light" />
            </span>
            <span className="font-serif text-[24px] text-navy-dark">Roomly<span className="text-gold">.</span></span>
          </div>}

          <header className="mb-5 pr-7">
            {otpAttempt
              ? <span className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-[#f5eddd] text-[#75531b]"><ShieldCheck className="size-5" aria-hidden /></span>
              : <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                  {isID ? 'Selamat datang di Roomly' : 'Welcome to Roomly'}
                </p>}
            <h2
              id={ids.title}
              className="font-serif text-[28px] leading-tight tracking-[-0.035em] text-navy-dark sm:text-[31px]"
            >
              {heading}
            </h2>
            <p
              id={ids.description}
              className="mt-2 break-words text-sm leading-6 text-slate-600"
            >
              {subheading}
            </p>
          </header>

          {otpAttempt ? (
            <AdminOtpForm
              attempt={otpAttempt}
              isID={isID}
              onBack={() => { setOtpAttempt(null); setError(null); }}
              onBusyChange={(value) => { busyRef.current = value; setIsOtpBusy(value); }}
              onVerified={finishSignIn}
            />
          ) : (
            <>
              <div className="relative isolate mb-4 grid grid-cols-2 gap-1 rounded-xl border border-slate-200/70 bg-slate-100/80 p-1" role="tablist" aria-label={isID ? 'Mode akun' : 'Account mode'}>
                <div className="pointer-events-none absolute inset-1 -z-10" aria-hidden>
                  <div className={`h-full w-1/2 px-0.5 motion-safe:transition-transform motion-safe:duration-250 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] ${mode === 'register' ? 'translate-x-full' : ''}`}>
                    <div className="h-full rounded-lg bg-white shadow-sm ring-1 ring-slate-200/60" />
                  </div>
                </div>
                {([
                  { id: 'login' as const, label: isID ? 'Masuk' : 'Sign in', tabId: ids.loginTab },
                  { id: 'register' as const, label: isID ? 'Daftar' : 'Register', tabId: ids.registerTab },
                ]).map((tab) => (
                  <button
                    key={tab.id}
                    id={tab.tabId}
                    type="button"
                    role="tab"
                    disabled={busy}
                    aria-selected={mode === tab.id}
                    aria-controls={ids.tabPanel}
                    tabIndex={mode === tab.id ? 0 : -1}
                    onClick={() => switchMode(tab.id)}
                    onKeyDown={(event) => {
                      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                      event.preventDefault();
                      const nextMode = event.key === 'Home' ? 'login' : event.key === 'End' ? 'register' : mode === 'login' ? 'register' : 'login';
                      switchMode(nextMode);
                      document.getElementById(nextMode === 'login' ? ids.loginTab : ids.registerTab)?.focus();
                    }}
                    className={`min-h-11 cursor-pointer rounded-lg px-3 text-[13px] font-semibold motion-safe:transition-colors disabled:cursor-not-allowed ${mode === tab.id ? 'text-navy' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div id={ids.tabPanel} role="tabpanel" aria-labelledby={mode === 'login' ? ids.loginTab : ids.registerTab}>
                <GoogleSignInButton
                  isID={isID}
                  onCredential={handleGoogleSignIn}
                  submitting={isGoogleSubmitting}
                  disabled={busy}
                />

                <div className="my-4 flex items-center gap-3">
                  <span className="h-px flex-1 bg-slate-200/80" />
                  <span className="text-xs text-slate-500">{isID ? 'atau dengan email' : 'or with email'}</span>
                  <span className="h-px flex-1 bg-slate-200/80" />
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <div className="auth-mode-detail" data-open={mode === 'register'} inert={mode !== 'register'} aria-hidden={mode !== 'register'}>
                      <div className="-mx-1 min-h-0 overflow-hidden px-1">
                        <div className="pb-4">
                          <label htmlFor={ids.name} className="mb-2 block text-[13px] font-semibold text-slate-700">
                            {isID ? 'Nama lengkap' : 'Full name'}
                          </label>
                          <AuthFieldInput id={ids.name} name="name" autoComplete="name" icon={UserIcon} value={fullName} onChange={setFullName} disabled={busy || mode !== 'register'} placeholder={isID ? 'Nama sesuai identitas' : 'Your full name'} />
                        </div>
                      </div>
                    </div>
                    <label htmlFor={ids.email} className="mb-2 block text-[13px] font-semibold text-slate-700">
                      {isID ? 'Alamat email' : 'Email address'}
                    </label>
                    <AuthFieldInput
                      id={ids.email} name="email" autoComplete="email" icon={Mail} type="email" value={email} onChange={setEmail}
                      disabled={busy} ariaInvalid={!!error} ariaDescribedBy={error ? ids.error : undefined}
                      placeholder={isID ? 'nama@email.com' : 'you@example.com'}
                      rightSlot={isValidEmail && <CheckCircle2 className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-emerald-600" aria-hidden />}
                    />
                  </div>
                  <div>
                    <label htmlFor={ids.password} className="mb-2 block text-[13px] font-semibold text-slate-700">
                      {isID ? 'Kata sandi' : 'Password'}
                    </label>
                    <AuthFieldInput
                      id={ids.password} name="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} icon={Lock}
                      type={showPassword ? 'text' : 'password'} value={password} onChange={setPassword}
                      minLength={mode === 'register' ? 8 : undefined} disabled={busy}
                      ariaInvalid={!!error} ariaDescribedBy={error ? ids.error : undefined}
                      placeholder={mode === 'register' ? (isID ? 'Buat kata sandi Anda' : 'Create a password') : (isID ? 'Masukkan kata sandi' : 'Enter your password')}
                      rightSlot={
                        <button
                          type="button" onClick={() => setShowPassword(!showPassword)} disabled={busy}
                          aria-label={showPassword ? (isID ? 'Sembunyikan kata sandi' : 'Hide password') : (isID ? 'Tampilkan kata sandi' : 'Show password')}
                          aria-pressed={showPassword}
                          className="absolute right-1.5 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-navy disabled:cursor-not-allowed"
                        >
                          {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                        </button>
                      }
                    />
                    <div className="auth-mode-detail" data-open={mode === 'register'} inert={mode !== 'register'} aria-hidden={mode !== 'register'}>
                      <div className="min-h-0 overflow-hidden">
                        <div className="pt-2">
                          {password.length > 0 && <PasswordStrengthMeter password={password} isID={isID} />}
                          <p className="text-xs leading-5 text-slate-500">
                            {isID ? 'Minimal 8 karakter, dengan kombinasi huruf dan angka.' : 'At least 8 characters, with letters and numbers.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {errorBanner}

                  <button type="submit" disabled={busy} aria-busy={isSubmitting} className="auth-primary">
                    {isSubmitting ? (
                      <><span className="auth-spinner" aria-hidden /><span role="status">{mode === 'login' ? (isID ? 'Sedang masuk…' : 'Signing in…') : (isID ? 'Sedang membuat akun…' : 'Creating your account…')}</span></>
                    ) : (
                      <><span>{mode === 'login' ? (isID ? 'Masuk ke akun' : 'Sign in to your account') : (isID ? 'Buat akun Roomly' : 'Create your Roomly account')}</span><ArrowRight className="size-4" aria-hidden /></>
                    )}
                  </button>
                </form>

                <p className="mt-3 flex flex-wrap items-center justify-center gap-x-1 text-[13px] text-slate-500">
                  {mode === 'login' ? (isID ? 'Baru di Roomly?' : 'New to Roomly?') : (isID ? 'Sudah punya akun?' : 'Already have an account?')}
                  <button type="button" disabled={busy} onClick={() => switchMode(mode === 'login' ? 'register' : 'login')} className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-navy underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50">
                    {mode === 'login' ? (isID ? 'Daftar sekarang' : 'Create an account') : (isID ? 'Masuk di sini' : 'Sign in here')}
                  </button>
                </p>
              </div>
            </>
          )}

          {!otpAttempt && <div className="mt-3 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
            <LockKeyhole className="size-3" aria-hidden />
            <span>{isID ? 'Data pribadi Anda tetap terlindungi.' : 'Your personal information stays protected.'}</span>
          </div>}
        </section>
      </motion.div>
    </motion.div>
  );
};
