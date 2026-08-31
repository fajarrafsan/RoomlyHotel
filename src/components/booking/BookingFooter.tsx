import { ArrowRight, ChevronLeft, ShieldCheck } from 'lucide-react';

interface BookingFooterProps {
  isID: boolean;
  step: 1 | 2 | 3;
  isSubmitting: boolean;
  canProceed: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export const BookingFooter: React.FC<BookingFooterProps> = ({
  isID,
  step,
  isSubmitting,
  canProceed,
  onBack,
  onNext,
  onSubmit
}) => {
  return (
    <div className="p-4 sm:p-5 bg-white border-t border-navy-soft flex items-center justify-between gap-3">
      {step > 1 ? (
        <button
          type="button"
          onClick={onBack}
          className="min-h-12 px-4 sm:px-5 rounded-xl bg-navy-soft hover:bg-navy-soft/80 text-navy font-semibold text-[14px] transition-colors duration-200 inline-flex items-center gap-2 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden />
          <span>{isID ? 'Kembali' : 'Back'}</span>
        </button>
      ) : <div />}

      {step < 3 ? (
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="min-h-12 px-6 rounded-xl bg-gold hover:bg-gold-dark text-white font-semibold text-[14px] transition-colors duration-200 inline-flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gold"
        >
          <span>{isID ? 'Lanjutkan' : 'Continue'}</span>
          <ArrowRight className="w-4 h-4" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="min-h-12 px-5 sm:px-6 rounded-xl bg-gold hover:bg-gold-dark text-white font-semibold text-[14px] transition-colors duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" aria-hidden />
          ) : (
            <ShieldCheck className="w-4 h-4" aria-hidden />
          )}
          <span>{isID ? 'Konfirmasi & bayar' : 'Confirm & pay'}</span>
        </button>
      )}
    </div>
  );
};
