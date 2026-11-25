import { ArrowRight, ChevronLeft, ExternalLink, LoaderCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import type { BookingQuoteResponse } from '../../types/api';

interface BookingFooterProps {
  isID: boolean;
  step: 1 | 2 | 3;
  isSubmitting: boolean;
  canProceed: boolean;
  nights: number;
  quote?: BookingQuoteResponse | null;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

const primaryClass = 'ml-auto inline-flex min-h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-navy-dark px-3 text-center text-sm font-bold leading-tight text-white hover:bg-navy motion-safe:transition-colors disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-600 sm:px-5';

export function BookingFooter({
  isID, step, isSubmitting, canProceed, nights, quote, onBack, onNext, onSubmit,
}: BookingFooterProps) {
  const isSticky = step > 1 || canProceed;
  return (
    <div className={`flex items-center justify-between gap-2 rounded-b-[24px] border-t border-slate-200 bg-white px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:gap-4 sm:px-6 lg:px-7 ${isSticky ? 'sticky bottom-0 z-20 shadow-[0_-5px_18px_rgba(15,35,68,0.05)]' : ''}`} data-checkout-footer>
      <div className="min-w-0 lg:hidden">
        {quote ? (
          <div className="space-y-0.5" aria-live="polite">
            <p className="text-xs font-semibold text-slate-600">{isID ? 'Total pembayaran' : 'Total payment'}</p>
            <p className="text-base font-bold leading-tight tracking-tight text-navy-dark tabular-nums [overflow-wrap:anywhere]">{formatCurrency(quote.totalAmount)}</p>
          </div>
        ) : nights > 0 ? (
          <p className="text-xs font-medium leading-4 text-slate-600" role="status">
            {quote === null ? (isID ? 'Tarif belum tersedia.' : 'Rates unavailable.') : (isID ? 'Memuat tarif…' : 'Loading rates…')}
          </p>
        ) : (
          <p className="text-xs font-medium leading-4 text-slate-600">{isID ? 'Pilih tanggal untuk lanjut.' : 'Select dates to continue.'}</p>
        )}
      </div>

      {step > 1 ? (
        <button type="button" onClick={onBack} disabled={isSubmitting}
          className="hidden min-h-12 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-navy-dark disabled:cursor-not-allowed disabled:opacity-60 lg:inline-flex">
          <ChevronLeft className="size-4" aria-hidden />{isID ? 'Kembali' : 'Back'}
        </button>
      ) : !canProceed && (
        <p className="hidden text-sm leading-5 text-slate-600 lg:block">{isID ? 'Pilih tanggal check-in dan check-out untuk lanjut.' : 'Choose check-in and check-out dates to continue.'}</p>
      )}

      {step < 3 ? (
        <button type="button" onClick={onNext} disabled={!canProceed} className={primaryClass}>
          {isID ? 'Lanjutkan' : 'Continue'}<ArrowRight className="size-4 shrink-0" aria-hidden />
        </button>
      ) : (
        <button type="button" onClick={onSubmit} disabled={isSubmitting || !canProceed} aria-busy={isSubmitting} className={primaryClass}>
          {isSubmitting
            ? <LoaderCircle className="size-4 shrink-0 motion-safe:animate-spin" aria-hidden />
            : <ExternalLink className="size-4 shrink-0" aria-hidden />}
          {isSubmitting
            ? (isID ? 'Menyiapkan…' : 'Preparing…')
            : (isID ? 'Konfirmasi & bayar' : 'Confirm & pay')}
        </button>
      )}
    </div>
  );
}
