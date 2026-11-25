import React from 'react';
import { Check } from 'lucide-react';

interface BookingWizardHeaderProps {
  isID: boolean;
  step: 1 | 2 | 3;
  disabled: boolean;
  onStep: (step: 1 | 2 | 3) => void;
}

const steps = [
  { key: 1, labelID: 'Tanggal & tamu', labelEN: 'Dates & guests' },
  { key: 2, labelID: 'Data tamu', labelEN: 'Guest details' },
  { key: 3, labelID: 'Tinjau & bayar', labelEN: 'Review & pay' },
] as const;

const stepClass = 'flex min-h-[58px] w-full flex-col items-center justify-center gap-1.5 rounded-xl px-1 py-2 text-center text-xs font-bold leading-tight sm:min-h-12 sm:flex-row sm:gap-2.5 sm:px-2 sm:text-sm';

export const BookingWizardHeader: React.FC<BookingWizardHeaderProps> = ({ isID, step, disabled, onStep }) => (
  <ol className="grid min-w-0 grid-cols-3 gap-1 rounded-t-[24px] border-b border-slate-200 bg-slate-50 p-2.5 sm:gap-2 sm:px-5 sm:py-3" aria-label={isID ? 'Langkah reservasi' : 'Booking steps'} data-checkout-steps>
    {steps.map(item => {
      const done = step > item.key;
      const active = step === item.key;
      const content = (
        <>
          <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold sm:size-7 ${active ? 'bg-navy-dark text-white' : done ? 'bg-gold-soft text-gold-dark' : 'bg-slate-200 text-slate-700'}`} aria-hidden>
            {done ? <Check className="size-3.5" strokeWidth={2.75} /> : item.key}
          </span>
          <span>{isID ? item.labelID : item.labelEN}</span>
        </>
      );
      return (
        <li key={item.key} className="min-w-0" aria-current={active ? 'step' : undefined}>
          {done ? (
            <button type="button" onClick={() => onStep(item.key)} disabled={disabled}
              className={stepClass + ' cursor-pointer text-navy-dark hover:bg-white hover:shadow-sm disabled:cursor-not-allowed'}>
              <span className="sr-only">{isID ? 'Kembali ke ' : 'Back to '}</span>{content}
            </button>
          ) : (
            <div className={stepClass + (active ? ' bg-navy-soft text-navy-dark' : ' text-slate-600')}>{content}</div>
          )}
        </li>
      );
    })}
  </ol>
);
