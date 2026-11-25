import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { fadeTween } from '../../lib/motion';

const dialogWidths = { compact: 'max-w-[550px]', form: 'max-w-[760px]', wide: 'max-w-4xl' };

export function OperationsDialog({ title, description, isID, busy = false, size = 'compact', onClose, children, footer }: {
  title: string;
  description?: string;
  isID: boolean;
  busy?: boolean;
  size?: keyof typeof dialogWidths;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const state = useRef({ busy, onClose });
  state.current = { busy, onClose };
  const reduced = useReducedMotion();

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    close.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!state.current.busy) state.current.onClose();
      }
      if (event.key !== 'Tab') return;
      const controls = [...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], summary') ?? [])]
        .filter(control => control.tabIndex >= 0 && control.getClientRects().length > 0);
      const target = document.activeElement as HTMLElement;
      if (!controls.length || !controls.includes(target) || (event.shiftKey ? target === controls[0] : target === controls.at(-1))) {
        event.preventDefault();
        (event.shiftKey ? controls.at(-1) : controls[0])?.focus();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = overflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-2 sm:items-center sm:p-5">
      <motion.div aria-hidden className="absolute inset-0 bg-slate-950/55 backdrop-blur-[3px]" onClick={() => { if (!state.current.busy) state.current.onClose(); }} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={fadeTween} />
      <motion.div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy} tabIndex={-1}
        initial={reduced ? false : { y: 12 }} animate={{ y: 0 }} transition={fadeTween}
        className={`operations-page relative flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_28px_90px_rgba(8,24,54,0.3)] outline-none sm:max-h-[calc(100dvh-2.5rem)] ${dialogWidths[size]}`}>
        <header className="relative shrink-0 border-t-2 border-gold-light bg-[#162951] px-4 py-4 pr-16 text-white sm:px-5 sm:pr-16">
          <h2 id={titleId} className="font-serif text-2xl leading-tight tracking-tight">{title}</h2>
          {description && <p className="mt-1 break-words text-sm text-white/85">{description}</p>}
          <button ref={close} type="button" disabled={busy} onClick={onClose} aria-label={isID ? 'Tutup' : 'Close'}
            className="absolute top-2.5 right-3 grid size-11 cursor-pointer place-items-center rounded-xl border border-white/25 text-white hover:bg-white/15 disabled:cursor-wait disabled:opacity-60">
            <X className="size-5" aria-hidden />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5">{children}</div>
        {footer && <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">{footer}</footer>}
      </motion.div>
    </div>,
    document.body,
  );
}
