// Thin wrapper around Google Identity Services (GIS) for the "Sign In With
// Google" ID-token flow. We use our own styled button + `prompt()` instead of
// Google's rendered button so it matches the rest of AuthModal's design —
// this is Google's documented pattern for custom buttons. `prompt()` can
// silently no-op (no visible UI) if the browser suppresses One Tap (e.g. the
// user dismissed it recently) — callers should treat the promise never
// resolving/rejecting within a few seconds as "nothing happened" and let the
// user retry, rather than hanging a loading spinner forever.

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdClient {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  prompt: (momentListener?: (notification: unknown) => void) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleIdClient;
      };
    };
  }
}

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
let scriptLoadPromise: Promise<void> | null = null;

function loadGisScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services script')));
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
export const isGoogleSignInConfigured = GOOGLE_CLIENT_ID.length > 0;

/**
 * Triggers the Google One Tap / Sign In flow and resolves with the raw ID
 * token (JWT) once the user picks an account, or rejects if the user closes
 * the prompt / no Google session is available.
 */
export async function requestGoogleIdToken(): Promise<string> {
  if (!isGoogleSignInConfigured) {
    throw new Error('VITE_GOOGLE_CLIENT_ID belum diset di frontend.');
  }
  await loadGisScript();
  const google = window.google;
  if (!google?.accounts?.id) {
    throw new Error('Google Identity Services gagal dimuat.');
  }

  return new Promise<string>((resolve, reject) => {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      auto_select: false,
      cancel_on_tap_outside: true,
      callback: (response) => {
        if (response?.credential) {
          resolve(response.credential);
        } else {
          reject(new Error('Google tidak mengembalikan credential.'));
        }
      },
    });

    google.accounts.id.prompt((notification: any) => {
      const isNotDisplayed = typeof notification?.isNotDisplayed === 'function' && notification.isNotDisplayed();
      const isSkipped = typeof notification?.isSkippedMoment === 'function' && notification.isSkippedMoment();
      if (!isNotDisplayed && !isSkipped) return;

      const reason = isNotDisplayed ? notification.getNotDisplayedReason?.() : notification.getSkippedReason?.();

      // Chrome disables FedCM (the browser API One Tap now relies on) for an
      // origin after repeated dismissals, or via the site-permissions icon
      // next to the address bar — this is the #1 real-world cause of Google
      // Sign-In silently failing, so it gets its own actionable message.
      if (reason === 'suppressed_by_user' || reason === 'opt_out_or_no_session') {
        reject(new Error(
          'Chrome menonaktifkan "Sign in pihak ketiga" untuk situs ini. Klik ikon di sebelah kiri address bar (atau buka chrome://settings/content/federatedIdentityApi) lalu izinkan, atau gunakan email/password.'
        ));
        return;
      }
      if (reason === 'unregistered_origin') {
        reject(new Error('Origin ini (http://localhost:3000) belum terdaftar sebagai Authorized JavaScript origin di Google Cloud Console untuk Client ID ini.'));
        return;
      }
      reject(new Error(`Google Sign-In tidak tersedia (${reason || 'dibatalkan'}). Gunakan email/password sebagai alternatif.`));
    });
  });
}
