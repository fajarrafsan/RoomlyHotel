import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { X, LogIn, UserPlus, Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowRight, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ApiError, OtpRequiredError } from '../../lib/http';
import { isGoogleSignInConfigured, requestGoogleIdToken } from '../../lib/googleAuth';
import { Language } from '../../types';
import { AuthFieldInput } from './AuthFieldInput';
import { GoogleSignInButton } from './GoogleSignInButton';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

interface AuthModalProps {
  onClose: () => void;
  language: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, language }) => {
  const isID = language === 'ID';
  const navigate = useNavigate();
  const { login, register, loginWithGoogle, verifyAdminOtp } = useAuth();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        const loggedUser = await login(email, password);
        onClose();
        if (loggedUser?.role === 'ADMIN') {
          navigate('/admin');
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
      if (loggedUser?.role === 'ADMIN') {
        navigate('/admin');
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
      if (loggedUser?.role === 'ADMIN') {
        navigate('/admin');
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[60] bg-slate-950/30 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-white rounded-2xl max-w-[420px] w-full max-h-[92vh] shadow-[0_25px_80px_rgba(0,0,0,0.12)] border border-slate-100 overflow-hidden relative my-auto flex flex-col overflow-y-auto"
      >
        {/* Close Button */}
        <button onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors">
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="pt-8 pb-4 sm:pt-10 sm:pb-6 px-5 sm:px-8 text-center shrink-0">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-3 sm:mb-5 shadow-lg shadow-slate-900/20">
            {otpEmail ? <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" /> : mode === 'login' ? <LogIn className="w-5 h-5 sm:w-6 sm:h-6" /> : <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />}
          </motion.div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
            {otpEmail
              ? (isID ? 'Verifikasi Kode OTP' : 'Verify OTP Code')
              : mode === 'login' ? (isID ? 'Selamat Datang Kembali' : 'Welcome Back') : (isID ? 'Buat Akun Baru' : 'Create Account')}
          </h2>
          <p className="text-xs sm:text-[13px] text-slate-400 font-light mt-1">
            {otpEmail
              ? (isID ? `Kode OTP telah dikirim ke ${otpEmail}` : `An OTP code has been sent to ${otpEmail}`)
              : mode === 'login' ? (isID ? 'Masuk untuk melanjutkan reservasi Anda' : 'Sign in to continue your booking') : (isID ? 'Daftar untuk mulai menjelajah penginapan' : 'Register to start exploring stays')}
          </p>
        </div>

        {otpEmail ? (
          <form onSubmit={handleOtpSubmit} className="px-5 pb-6 sm:px-8 sm:pb-8 space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                {isID ? 'Kode OTP' : 'OTP Code'}
              </label>
              <AuthFieldInput
                icon={ShieldCheck}
                value={otpCode}
                onChange={setOtpCode}
                inputMode="numeric"
                autoFocus
                placeholder="000000"
                inputClassName="tracking-[0.3em]"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[12px] font-medium flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />{error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button type="submit" disabled={isVerifyingOtp} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-slate-900/10">
              {isVerifyingOtp ? (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>{isID ? 'Verifikasi' : 'Verify'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>

            <button type="button" onClick={() => { setOtpEmail(null); setOtpCode(''); setError(null); }}
              className="w-full flex items-center justify-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-600 font-medium transition-colors pt-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              {isID ? 'Kembali ke halaman masuk' : 'Back to sign in'}
            </button>
          </form>
        ) : (
        <>
        {/* Tab Switcher */}
        <div className="px-5 mb-4 sm:px-8 sm:mb-6 shrink-0">
          <div className="flex items-center p-1 bg-slate-50 rounded-xl border border-slate-100">
            <button onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2 sm:py-2.5 rounded-lg text-xs sm:text-[13px] font-medium transition-all duration-200 cursor-pointer ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              {isID ? 'Masuk' : 'Sign In'}
            </button>
            <button onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-2 sm:py-2.5 rounded-lg text-xs sm:text-[13px] font-medium transition-all duration-200 cursor-pointer ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              {isID ? 'Daftar' : 'Register'}
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 pb-6 sm:px-8 sm:pb-8 space-y-3.5 sm:space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div key="name-field" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  {isID ? 'Nama Lengkap' : 'Full Name'}
                </label>
                <AuthFieldInput
                  icon={UserIcon}
                  value={fullName}
                  onChange={setFullName}
                  placeholder={isID ? 'Nama sesuai identitas' : 'Your full name'}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Email</label>
            <AuthFieldInput
              icon={Mail}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              rightSlot={isValidEmail && <CheckCircle2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />}
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              {isID ? 'Kata Sandi' : 'Password'}
            </label>
            <AuthFieldInput
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              minLength={mode === 'register' ? 8 : undefined}
              placeholder="••••••••"
              rightSlot={
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            {mode === 'register' && password.length > 0 && <PasswordStrengthMeter password={password} isID={isID} />}
            {mode === 'register' && (
              <p className="text-[11px] text-slate-400 font-light mt-2">
                {isID ? 'Min. 8 karakter dengan kombinasi huruf & angka.' : 'Min. 8 characters with letters & numbers.'}
              </p>
            )}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[12px] font-medium flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />{error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.button type="submit" disabled={isSubmitting} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-slate-900/10">
            {isSubmitting ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? (isID ? 'Masuk' : 'Sign In') : (isID ? 'Daftar' : 'Create Account')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>

          {/* ===== DIVIDER + GOOGLE SIGN IN ===== */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[11px] text-slate-400 font-light">{isID ? 'atau' : 'or'}</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <GoogleSignInButton
            isID={isID}
            onClick={handleGoogleSignIn}
            submitting={isGoogleSubmitting}
            disabled={isSubmitting}
            configured={isGoogleSignInConfigured}
          />

          {/* Footer Toggle */}
          <p className="text-center text-[12px] text-slate-400 font-light pt-2">
            {mode === 'login' ? (isID ? 'Belum punya akun? ' : "Don't have an account? ") : (isID ? 'Sudah punya akun? ' : 'Already have an account? ')}
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
              className="font-semibold text-slate-900 hover:underline underline-offset-2 transition-colors">
              {mode === 'login' ? (isID ? 'Daftar sekarang' : 'Register') : (isID ? 'Masuk' : 'Sign In')}
            </button>
          </p>
        </form>
        </>
        )}
      </motion.div>
    </motion.div>
  );
};
