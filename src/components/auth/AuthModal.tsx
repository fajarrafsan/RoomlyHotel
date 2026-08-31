import React, { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  X, Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowRight,
  CheckCircle2, ShieldCheck, ArrowLeft, BadgeCheck, Heart,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ApiError, OtpRequiredError } from '../../lib/http';
import { isGoogleSignInConfigured, requestGoogleIdToken } from '../../lib/googleAuth';
import { Language } from '../../types';
import { AuthFieldInput } from './AuthFieldInput';
import { GoogleSignInButton } from './GoogleSignInButton';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { isOperationsRole, roleLandingPath } from '../../lib/routes';
import { fadeTween, modalTween, pillTween } from '../../lib/motion';

interface AuthModalProps {
  onClose: () => void;
  language: Language;
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

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, language }) => {
  const isID = language === 'ID';
  const navigate = useNavigate();
  const { login, register, loginWithGoogle, verifyAdminOtp } = useAuth();
  const reduceMotion = useReducedMotion();
  const ids = {
    name: useId(),
    email: useId(),
    password: useId(),
    otp: useId(),
    error: useId(),
    title: useId(),
  };

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admin accounts require a second-factor OTP emailed on login — this swaps
  // the form for a one-time-code step instead of failing the login outright.
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        const loggedUser = await login(email, password);
        onClose();
        if (isOperationsRole(loggedUser?.role)) {
          navigate(roleLandingPath(loggedUser?.role));
        }
      } else {
        await register(fullName, email, password);
        onClose();
      }
    } catch (err) {
      if (err instanceof OtpRequiredError) {
        setOtpEmail(err.email);
      } else if (err instanceof ApiError) {
        const fieldErrors = err.body?.errors ? Object.values(err.body.errors).join(', ') : null;
        setError(fieldErrors || err.message);
      } else {
        setError(isID ? 'Terjadi kesalahan. Pastikan backend sedang berjalan.' : 'Something went wrong. Make sure the backend is running.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleSubmitting(true);
    try {
      const idToken = await requestGoogleIdToken();
      const loggedUser = await loginWithGoogle(idToken);
      onClose();
      if (isOperationsRole(loggedUser?.role)) {
        navigate(roleLandingPath(loggedUser?.role));
      }
    } catch (err) {
      if (err instanceof OtpRequiredError) {
        setOtpEmail(err.email);
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(isID ? 'Google Sign-In gagal. Coba lagi.' : 'Google Sign-In failed. Please try again.');
      }
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail) return;
    setError(null);
    setIsVerifyingOtp(true);
    try {
      const loggedUser = await verifyAdminOtp(otpEmail, otpCode);
      onClose();
      if (isOperationsRole(loggedUser?.role)) {
        navigate(roleLandingPath(loggedUser?.role));
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(isID ? 'Kode OTP salah atau kedaluwarsa.' : 'The OTP code is wrong or expired.');
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const isValidEmail = email.includes('@') && email.includes('.');

  const heading = otpEmail
    ? (isID ? 'Verifikasi kode' : 'Verify your code')
    : mode === 'login'
      ? (isID ? 'Selamat datang kembali' : 'Welcome back')
      : (isID ? 'Buat akun baru' : 'Create your account');

  const subheading = otpEmail
    ? (isID ? `Kode OTP telah dikirim ke ${otpEmail}` : `An OTP code has been sent to ${otpEmail}`)
    : mode === 'login'
      ? (isID ? 'Masuk untuk melanjutkan reservasi Anda.' : 'Sign in to continue your booking.')
      : (isID ? 'Daftar untuk mulai menjelajah penginapan.' : 'Register to start exploring stays.');

  const panelTitle = otpEmail
    ? (isID ? <>Aman & <span className="italic text-gold-light">terverifikasi</span></> : <>Secure & <span className="italic text-gold-light">verified</span></>)
    : mode === 'login'
      ? (isID ? <>Menginap lebih <span className="italic text-gold-light">mudah</span></> : <>Stay, simply <span className="italic text-gold-light">better</span></>)
      : (isID ? <>Bergabung dengan <span className="italic text-gold-light">Roomly</span></> : <>Join <span className="italic text-gold-light">Roomly</span></>);

  const trustItems = [
    { icon: ShieldCheck, text: isID ? 'Jaminan harga terbaik' : 'Best price guarantee' },
    { icon: BadgeCheck, text: isID ? 'Pembayaran terenkripsi' : 'Encrypted payments' },
    { icon: Heart, text: isID ? 'Wishlist tersimpan aman' : 'Wishlist saved securely' },
  ];

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
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={fadeTween}
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-navy-dark/50" aria-hidden onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={ids.title}
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={modalTween}
        className="auth-modal relative z-10 bg-white rounded-3xl max-w-[860px] w-full max-h-[92vh] shadow-[0_24px_80px_rgba(30,58,138,0.18)] border border-navy-soft overflow-hidden my-auto grid md:grid-cols-[0.88fr_1.12fr] transform-gpu will-change-transform"
        onClick={(e) => e.stopPropagation()}
      >
        <aside className="hidden md:flex flex-col justify-between bg-navy text-white p-8 lg:p-10 relative overflow-hidden">
          <div className="pointer-events-none absolute -bottom-16 -right-10 w-56 h-56 rounded-full bg-gold/20 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -top-10 -left-10 w-40 h-40 rounded-full bg-gold-light/10 blur-2xl" aria-hidden />
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                <HotelMark className="w-5 h-5 text-gold-light" />
              </div>
              <div>
                <p className="font-serif text-lg leading-none">Roomly</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/60 mt-1">
                  {isID ? 'Hotel & Resor' : 'Hotels & Resorts'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[12px] font-semibold tracking-[0.16em] uppercase text-gold-light">
                {otpEmail
                  ? (isID ? 'Keamanan akun' : 'Account security')
                  : mode === 'register'
                    ? (isID ? 'Keanggotaan' : 'Membership')
                    : (isID ? 'Akses tamu' : 'Guest access')}
              </p>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={otpEmail ? 'otp' : mode}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={fadeTween}
                  className="font-serif text-[1.85rem] leading-[1.2] tracking-tight"
                >
                  {panelTitle}
                </motion.p>
              </AnimatePresence>
              <p className="text-[14px] text-white/70 leading-relaxed max-w-[16rem]">
                {otpEmail
                  ? (isID ? 'Masukkan kode sekali pakai untuk melindungi akun operasional Anda.' : 'Enter the one-time code to protect your operations account.')
                  : (isID ? 'Kelola reservasi, wishlist, dan invoice dalam satu akun.' : 'Manage bookings, wishlist, and invoices in one account.')}
              </p>
            </div>
          </div>

          <ul className="space-y-3">
            {trustItems.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-[13px] text-white/80">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-gold-light" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </aside>

        <div className="relative flex flex-col overflow-y-auto max-h-[92vh] md:max-h-none">
          <button
            type="button"
            onClick={onClose}
            aria-label={isID ? 'Tutup' : 'Close'}
            className="absolute top-3 right-3 z-10 min-w-11 min-h-11 rounded-full bg-navy-soft/80 hover:bg-navy-soft flex items-center justify-center text-slate-500 hover:text-navy transition-colors duration-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="pt-8 pb-4 sm:pt-10 sm:pb-5 px-5 sm:px-8">
            <div className="flex items-center gap-2.5 md:hidden mb-5">
              <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
                <HotelMark className="w-5 h-5 text-gold-light" />
              </div>
              <span className="font-serif text-lg text-navy">Roomly</span>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.h2
                key={heading}
                id={ids.title}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={fadeTween}
                className="font-serif text-2xl sm:text-[1.65rem] text-navy tracking-tight leading-snug pr-10"
              >
                {heading}
              </motion.h2>
            </AnimatePresence>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={subheading}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fadeTween}
                className="text-[14px] text-slate-600 mt-1.5 leading-relaxed"
              >
                {subheading}
              </motion.p>
            </AnimatePresence>
          </div>

          {otpEmail ? (
            <form onSubmit={handleOtpSubmit} className="px-5 pb-7 sm:px-8 sm:pb-10 space-y-4">
              <div>
                <label htmlFor={ids.otp} className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  {isID ? 'Kode OTP' : 'OTP Code'}
                </label>
                <AuthFieldInput
                  id={ids.otp}
                  name="otp"
                  autoComplete="one-time-code"
                  icon={ShieldCheck}
                  value={otpCode}
                  onChange={setOtpCode}
                  inputMode="numeric"
                  autoFocus
                  ariaInvalid={!!error}
                  ariaDescribedBy={error ? ids.error : undefined}
                  placeholder="000000"
                  inputClassName="tracking-[0.3em]"
                />
              </div>

              {errorBanner}

              <button
                type="submit"
                disabled={isVerifyingOtp}
                className="w-full min-h-12 py-3 rounded-xl bg-navy hover:bg-navy-dark text-white text-[14px] font-semibold transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isVerifyingOtp ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" aria-hidden />
                ) : (
                  <>
                    <span>{isID ? 'Verifikasi' : 'Verify'}</span>
                    <ArrowRight className="w-4 h-4 text-gold-light" aria-hidden />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setOtpEmail(null); setOtpCode(''); setError(null); }}
                className="w-full min-h-11 flex items-center justify-center gap-1.5 text-[13px] text-slate-500 hover:text-navy font-medium transition-colors duration-200 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
                {isID ? 'Kembali ke halaman masuk' : 'Back to sign in'}
              </button>
            </form>
          ) : (
            <>
              <div className="px-5 mb-5 sm:px-8">
                <LayoutGroup id="auth-mode-tabs">
                <div className="relative flex items-center p-1 bg-navy-soft rounded-full" role="tablist" aria-label={isID ? 'Mode akun' : 'Account mode'}>
                  {([
                    { id: 'login' as const, label: isID ? 'Masuk' : 'Sign In' },
                    { id: 'register' as const, label: isID ? 'Daftar' : 'Register' },
                  ]).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={mode === tab.id}
                      onClick={() => { setMode(tab.id); setError(null); }}
                      className={`relative z-10 flex-1 min-h-11 py-2 rounded-full text-[13px] font-semibold transition-colors duration-200 cursor-pointer ${
                        mode === tab.id ? 'text-white' : 'text-slate-600 hover:text-navy'
                      }`}
                    >
                      {mode === tab.id && (
                        reduceMotion ? (
                          <span className="absolute inset-0 z-0 bg-navy rounded-full" />
                        ) : (
                          <motion.span
                            layoutId="auth-mode-pill"
                            className="absolute inset-0 z-0 bg-navy rounded-full"
                            transition={pillTween}
                          />
                        )
                      )}
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  ))}
                </div>
                </LayoutGroup>
              </div>

              <form onSubmit={handleSubmit} className="px-5 pb-7 sm:px-8 sm:pb-10 space-y-4">
                <div
                  className={`grid transition-[grid-template-rows,margin] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${mode === 'register' ? '' : '-mb-4'}`}
                  style={{ gridTemplateRows: mode === 'register' ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden min-h-0" aria-hidden={mode !== 'register'}>
                    <div className="pb-4">
                      <label htmlFor={ids.name} className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                        {isID ? 'Nama Lengkap' : 'Full Name'}
                      </label>
                      <AuthFieldInput
                        id={ids.name}
                        name="name"
                        autoComplete="name"
                        icon={UserIcon}
                        value={fullName}
                        onChange={setFullName}
                        required={mode === 'register'}
                        tabIndex={mode === 'register' ? 0 : -1}
                        placeholder={isID ? 'Nama sesuai identitas' : 'Your full name'}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor={ids.email} className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Email
                  </label>
                  <AuthFieldInput
                    id={ids.email}
                    name="email"
                    autoComplete="email"
                    icon={Mail}
                    type="email"
                    value={email}
                    onChange={setEmail}
                    ariaInvalid={!!error}
                    placeholder="you@example.com"
                    rightSlot={isValidEmail && (
                      <CheckCircle2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600" aria-hidden />
                    )}
                  />
                </div>

                <div>
                  <label htmlFor={ids.password} className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    {isID ? 'Kata Sandi' : 'Password'}
                  </label>
                  <AuthFieldInput
                    id={ids.password}
                    name="password"
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    icon={Lock}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={setPassword}
                    minLength={mode === 'register' ? 8 : undefined}
                    ariaInvalid={!!error}
                    ariaDescribedBy={error ? ids.error : undefined}
                    placeholder="••••••••"
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword
                          ? (isID ? 'Sembunyikan kata sandi' : 'Hide password')
                          : (isID ? 'Tampilkan kata sandi' : 'Show password')}
                        aria-pressed={showPassword}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-11 min-h-11 inline-flex items-center justify-center text-slate-400 hover:text-navy transition-colors duration-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                  {mode === 'register' && password.length > 0 && (
                    <PasswordStrengthMeter password={password} isID={isID} />
                  )}
                  {mode === 'register' && (
                    <p className="text-[12px] text-slate-500 mt-2">
                      {isID ? 'Min. 8 karakter dengan kombinasi huruf & angka.' : 'Min. 8 characters with letters & numbers.'}
                    </p>
                  )}
                </div>

                {errorBanner}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="w-full min-h-12 py-3 rounded-xl bg-gold hover:bg-gold-dark text-white text-[14px] font-semibold transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" aria-hidden />
                  ) : (
                    <>
                      <span>{mode === 'login' ? (isID ? 'Masuk' : 'Sign In') : (isID ? 'Daftar' : 'Create Account')}</span>
                      <ArrowRight className="w-4 h-4" aria-hidden />
                    </>
                  )}
                </button>

                <div className="flex items-center gap-3 py-0.5">
                  <div className="flex-1 h-px bg-navy-soft" />
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider">{isID ? 'atau' : 'or'}</span>
                  <div className="flex-1 h-px bg-navy-soft" />
                </div>

                <GoogleSignInButton
                  isID={isID}
                  onClick={handleGoogleSignIn}
                  submitting={isGoogleSubmitting}
                  disabled={isSubmitting}
                  configured={isGoogleSignInConfigured}
                />

                <p className="text-center text-[13px] text-slate-500 pt-1">
                  {mode === 'login' ? (isID ? 'Belum punya akun? ' : "Don't have an account? ") : (isID ? 'Sudah punya akun? ' : 'Already have an account? ')}
                  <button
                    type="button"
                    onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
                    className="font-semibold text-navy hover:text-gold underline-offset-2 hover:underline transition-colors duration-200 cursor-pointer"
                  >
                    {mode === 'login' ? (isID ? 'Daftar sekarang' : 'Register') : (isID ? 'Masuk' : 'Sign In')}
                  </button>
                </p>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
