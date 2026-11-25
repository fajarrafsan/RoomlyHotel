import { useId, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, LoaderCircle, LockKeyhole, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { Language } from '../../types';

interface AccountAccessGuardProps {
  language: Language;
  feature: string;
  onSignIn: () => void;
  children: ReactNode;
}

const action = 'inline-flex min-h-[50px] cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-center text-sm font-semibold leading-tight transition-colors';
const primary = action + ' bg-[#172953] text-white hover:bg-navy';
const secondary = action + ' border border-slate-300 bg-white text-[#172953] hover:border-navy/40 hover:bg-navy-soft/50';

export function AccountAccessGuard({ language, feature, onSignIn, children }: AccountAccessGuardProps) {
  const isID = language === 'ID';
  const { user, isLoading, sessionCheckError, retrySession, sessionEndReason } = useAuth();
  const headingId = useId();
  if (user) return <>{children}</>;

  const expired = sessionEndReason === 'expired';
  const heading = isLoading ? (isID ? 'Memeriksa sesi' : 'Checking your session')
    : sessionCheckError ? (isID ? 'Sesi belum dapat diperiksa' : 'We could not check your session')
      : expired ? (isID ? 'Masuk kembali untuk melanjutkan' : 'Sign in again to continue')
        : (isID ? `Masuk untuk membuka ${feature}` : `Sign in to access ${feature}`);
  const description = isLoading ? (isID ? 'Sedang memeriksa akses akun Roomly.' : 'Verifying access to your Roomly account.')
    : sessionCheckError ? (isID ? 'Periksa koneksi lalu coba periksa sesi lagi.' : 'Check your connection, then try verifying your session again.')
      : expired ? (isID ? 'Sesi masukmu sudah berakhir. Masuk kembali untuk membuka halaman ini.' : 'Your session has expired. Sign in again to open this page.')
        : (isID ? 'Setelah masuk, kamu akan langsung kembali ke halaman ini.' : 'You’ll return to this page as soon as you sign in.');

  return (
    <section className="settings-page mx-auto my-3 grid max-w-[1000px] overflow-hidden rounded-[24px] border border-[#e6dfd1] bg-white shadow-[0_16px_45px_rgba(15,35,68,0.08)] sm:my-8 sm:rounded-[28px] md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:my-10"
      aria-labelledby={headingId} data-account-access>
      <div className="flex min-h-[300px] min-w-0 flex-col justify-center px-5 py-7 sm:px-9 sm:py-10 md:min-h-[360px] lg:px-11 lg:py-12">
        <span className="mb-5 inline-grid size-12 shrink-0 place-items-center self-start rounded-[15px] border border-[#eddec1] bg-[#faf3e5] text-[#8b5b18] sm:mb-6 sm:size-13">
          {isLoading ? <LoaderCircle className="size-5 motion-safe:animate-spin" aria-hidden />
            : sessionCheckError ? <RefreshCw className="size-5" aria-hidden />
              : <LockKeyhole className="size-5" aria-hidden />}
        </span>
        <h1 id={headingId} className="max-w-[460px] font-serif text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.13] tracking-[-0.035em] text-[#172953] [overflow-wrap:anywhere]">
          {heading}
        </h1>
        <p className="mt-3 max-w-sm text-[15px] leading-6 text-slate-600 sm:mt-4 sm:text-base sm:leading-7"
          role={isLoading ? 'status' : undefined}>
          {description}
        </p>
        {!isLoading && (
          <div className="mt-6 flex flex-col gap-2.5 min-[540px]:flex-row min-[540px]:flex-wrap sm:mt-7">
            {sessionCheckError && (
              <button type="button" onClick={() => { void retrySession().catch(() => undefined); }} className={primary}>
                <RefreshCw className="size-4 shrink-0" aria-hidden />{isID ? 'Periksa sesi lagi' : 'Check session again'}
              </button>
            )}
            <button type="button" onClick={onSignIn} className={sessionCheckError ? secondary : primary}>
              {isID ? 'Masuk dan lanjutkan' : 'Sign in and continue'}<ArrowRight className="size-4 shrink-0" aria-hidden />
            </button>
            <Link to="/explore" className={secondary}>
              <Compass className="size-4 shrink-0" aria-hidden />{isID ? 'Jelajahi penginapan' : 'Explore stays'}
            </Link>
          </div>
        )}
      </div>
      <picture className="relative hidden overflow-hidden border-l border-[#e6dfd1] bg-[#eae4d7] md:block" aria-hidden>
        <source media="(min-width: 768px)" srcSet="/images/seed/rooms/suite-1.jpg" />
        <img alt="" decoding="async" className="absolute inset-0 size-full object-cover object-[59%_center]" />
      </picture>
    </section>
  );
}
