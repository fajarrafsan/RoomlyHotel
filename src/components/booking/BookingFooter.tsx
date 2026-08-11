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
    <div className="p-5 md:p-6 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
      {step > 1 ? (
        <button
          onClick={onBack}
          className="py-3 px-5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-sm transition-all duration-200 flex items-center gap-2 border border-slate-200 active:scale-[0.97]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{isID ? 'Kembali' : 'Back'}</span>
        </button>
      ) : <div />}

      {step < 3 ? (
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="py-3 px-7 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-lg shadow-slate-900/10 transition-all duration-200 flex items-center gap-2 active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none"
        >
          <span>{isID ? 'Lanjutkan' : 'Next Step'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="py-3.5 px-8 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xl shadow-slate-900/15 transition-all duration-200 flex items-center gap-2.5 active:scale-[0.97] disabled:opacity-40 disabled:shadow-none"
        >
          {isSubmitting ? (
            <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <ShieldCheck className="w-5 h-5" />
          )}
          <span>{isID ? 'Konfirmasi & Bayar Sekarang' : 'Confirm & Pay Now'}</span>
        </button>
      )}
    </div>
  );
};