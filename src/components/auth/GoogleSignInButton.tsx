import { useEffect, useRef, useState } from 'react';
import { isGoogleSignInConfigured, mountGoogleSignInButton } from '../../lib/googleAuth';

interface GoogleSignInButtonProps {
  isID: boolean;
  onCredential: (credential: string) => void;
  submitting: boolean;
  disabled: boolean;
}

export function GoogleSignInButton({ isID, onCredential, submitting, disabled }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const credentialRef = useRef(onCredential);
  const disabledRef = useRef(disabled);
  credentialRef.current = onCredential;
  disabledRef.current = disabled;
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isGoogleSignInConfigured || !containerRef.current) return;
    const controller = new AbortController();
    setLoadState('loading');
    void mountGoogleSignInButton(containerRef.current, isID ? 'id' : 'en', (credential) => {
      if (!disabledRef.current) credentialRef.current(credential);
    }, controller.signal)
      .then(() => {
        if (!controller.signal.aborted) setLoadState('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadState('error');
      });
    return () => controller.abort();
  }, [isID, attempt]);

  if (!isGoogleSignInConfigured) {
    return <p className="text-center text-sm text-slate-500">{isID ? 'Login Google belum tersedia. Gunakan email untuk masuk.' : 'Google sign-in is unavailable. You can sign in with email.'}</p>;
  }

  return (
    <div className="relative flex h-11 items-center justify-center" aria-busy={submitting || loadState === 'loading'}>
      <div
        ref={containerRef}
        inert={disabled || loadState !== 'ready'}
        className={`flex w-full max-w-[400px] justify-center ${submitting || loadState !== 'ready' ? 'invisible' : ''}`}
      />
      {(submitting || loadState === 'loading') && (
        <p role="status" className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700">
          <span className="size-4 animate-spin rounded-full border-2 border-navy-soft border-t-navy" aria-hidden />
          {submitting
            ? (isID ? 'Memverifikasi login Google…' : 'Verifying Google sign-in…')
            : (isID ? 'Memuat tombol Google…' : 'Loading Google sign-in…')}
        </p>
      )}
      {loadState === 'error' && (
        <button type="button" disabled={disabled} onClick={() => { setLoadState('loading'); setAttempt((value) => value + 1); }} className="absolute inset-0 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-navy hover:bg-slate-50 disabled:cursor-not-allowed">
          {isID ? 'Gagal memuat Google. Coba lagi' : 'Could not load Google. Try again'}
        </button>
      )}
    </div>
  );
}
