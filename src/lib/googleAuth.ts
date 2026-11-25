interface GoogleCredentialResponse {
  credential?: string;
  state?: string;
}

interface GoogleIdClient {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    use_fedcm_for_button: boolean;
  }): void;
  renderButton(element: HTMLElement, options: {
    type: 'standard';
    theme: 'outline';
    size: 'large';
    text: 'continue_with';
    shape: 'rectangular';
    width: number;
    locale: 'id' | 'en';
    state: string;
  }): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdClient } };
  }
}

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GIS_LOAD_TIMEOUT_MS = 8000;
const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
export const isGoogleSignInConfigured = GOOGLE_CLIENT_ID.length > 0;

let scriptLoadPromise: Promise<void> | null = null;
let initializedClient: GoogleIdClient | null = null;
let nextButtonId = 0;
const credentialHandlers = new Map<string, (credential: string) => void>();

function loadGisScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement('script');
    const cleanup = () => {
      window.clearTimeout(timer);
      script.removeEventListener('load', loaded);
      script.removeEventListener('error', failed);
    };
    const loaded = () => {
      if (!window.google?.accounts?.id) return failed();
      cleanup();
      resolve();
    };
    const failed = () => {
      cleanup();
      script.remove();
      reject(new Error('Google Identity Services gagal dimuat.'));
    };
    const timer = window.setTimeout(() => {
      cleanup();
      script.remove();
      reject(new DOMException('Google Identity Services belum merespons.', 'TimeoutError'));
    }, GIS_LOAD_TIMEOUT_MS);

    script.addEventListener('load', loaded);
    script.addEventListener('error', failed);
    if (!existing) {
      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    scriptLoadPromise = null;
    throw error;
  });
  return scriptLoadPromise;
}

export async function mountGoogleSignInButton(
  element: HTMLElement,
  locale: 'id' | 'en',
  onCredential: (credential: string) => void,
  signal: AbortSignal,
): Promise<void> {
  await loadGisScript();
  if (signal.aborted) return;

  const client = window.google?.accounts.id;
  if (!client) throw new Error('Google Identity Services gagal dimuat.');
  if (initializedClient !== client) {
    client.initialize({
      client_id: GOOGLE_CLIENT_ID,
      use_fedcm_for_button: true,
      callback: ({ credential, state }) => {
        if (credential && state) credentialHandlers.get(state)?.(credential);
      },
    });
    initializedClient = client;
  }

  const state = `roomly-google-${++nextButtonId}`;
  credentialHandlers.set(state, onCredential);
  signal.addEventListener('abort', () => {
    credentialHandlers.delete(state);
    element.replaceChildren();
  }, { once: true });

  client.renderButton(element, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    width: Math.min(element.clientWidth || 280, 400),
    locale,
    state,
  });
}
