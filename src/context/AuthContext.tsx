import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { authApi } from '../api/auth';
import { ApiError, AUTH_SESSION_EXPIRED_EVENT, invalidateAuthSessionRequests, OtpRequiredError } from '../lib/http';
import { AuthUser } from '../types';
import { LoginResultDto } from '../types/api';

export type SessionEndReason = 'logout' | 'expired' | 'other-tab' | null;
export type AuthOperationError = 'network' | 'server' | 'forbidden';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  sessionCheckError: AuthOperationError | null;
  sessionEndReason: SessionEndReason;
  retrySession: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<AuthUser>;
  verifyAdminOtp: (email: string, otp: string) => Promise<AuthUser>;
  /** Executes an already-confirmed logout. Server errors preserve the session. */
  logout: () => Promise<void>;
  /** Lets an unsaved-work guard intercept, otherwise opens the shared confirmation. */
  requestLogout: () => void;
  logoutRequested: boolean;
  isLoggingOut: boolean;
  logoutError: AuthOperationError | null;
  cancelLogout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
export const AUTH_SESSION_STORAGE_KEY = 'roomly_has_active_session';
const SESSION_SYNC_KEY = 'roomly_auth_sync';
export const LOGOUT_REQUEST_EVENT = 'roomly:logout-request';

function readSessionHint(): boolean {
  try { return localStorage.getItem(AUTH_SESSION_STORAGE_KEY) === 'true'; } catch { return false; }
}

function writeSessionHint(active: boolean): void {
  try {
    if (active) localStorage.setItem(AUTH_SESSION_STORAGE_KEY, 'true');
    else localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  } catch { /* Cookies remain authoritative when browser storage is unavailable. */ }
}

function broadcastSessionChange(): void {
  try {
    // No profile or token is shared through storage. A new value asks other tabs
    // to verify the HttpOnly cookie even if the boolean hint was already true.
    localStorage.setItem(SESSION_SYNC_KEY, `${Date.now()}:${Math.random()}`);
  } catch { /* The current tab can still finish signing in or out. */ }
}

function errorKind(error: unknown): AuthOperationError {
  if (error instanceof ApiError) return error.status === 401 || error.status === 403 ? 'forbidden' : 'server';
  return 'network';
}

function toUser(profile: AuthUser): AuthUser {
  return { userId: profile.userId, fullName: profile.fullName, email: profile.email, role: profile.role, hotelId: profile.hotelId };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionCheckError, setSessionCheckError] = useState<AuthOperationError | null>(null);
  const [sessionEndReason, setSessionEndReason] = useState<SessionEndReason>(null);
  const [logoutRequested, setLogoutRequested] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<AuthOperationError | null>(null);
  const mounted = useRef(true);
  const userRef = useRef<AuthUser | null>(null);
  const hintRef = useRef(readSessionHint());
  const generation = useRef(0);
  const requestedRef = useRef(false);
  const logoutPromise = useRef<Promise<void> | null>(null);
  const sessionCheck = useRef<{ generation: number; promise: Promise<void> } | null>(null);

  const publishUser = useCallback((next: AuthUser | null) => {
    userRef.current = next;
    if (mounted.current) setUser(next);
  }, []);

  const setRequested = useCallback((requested: boolean) => {
    requestedRef.current = requested;
    if (mounted.current) setLogoutRequested(requested);
  }, []);

  const clearSession = useCallback((reason: Exclude<SessionEndReason, null>, broadcast = false) => {
    generation.current += 1;
    invalidateAuthSessionRequests();
    hintRef.current = false;
    writeSessionHint(false);
    publishUser(null);
    setRequested(false);
    if (mounted.current) {
      setSessionEndReason(reason);
      setSessionCheckError(null);
      setLogoutError(null);
      setIsLoading(false);
    }
    if (broadcast) broadcastSessionChange();
  }, [publishUser, setRequested]);

  const retrySession = useCallback((): Promise<void> => {
    if (logoutPromise.current) return Promise.resolve();
    if (sessionCheck.current?.generation === generation.current) return sessionCheck.current.promise;
    if (!readSessionHint() && !hintRef.current) {
      if (mounted.current) setIsLoading(false);
      return Promise.resolve();
    }
    hintRef.current = true;
    const requestGeneration = ++generation.current;
    invalidateAuthSessionRequests();
    publishUser(null);
    setRequested(false);
    setIsLoading(true);
    setSessionCheckError(null);
    const entry = { generation: requestGeneration, promise: Promise.resolve() as Promise<void> };
    entry.promise = authApi.me()
      .then(profile => {
        if (!mounted.current || generation.current !== requestGeneration) return;
        publishUser(toUser(profile));
        setSessionEndReason(null);
        setSessionCheckError(null);
      })
      .catch(error => {
        if (!mounted.current || generation.current !== requestGeneration) return;
        if (error instanceof ApiError && error.status === 401) {
          clearSession('expired');
        } else {
          // A timeout, unavailable server, or forbidden Origin is not evidence
          // that the cookie expired. Hide private content and offer verification.
          publishUser(null);
          setSessionCheckError(errorKind(error));
        }
      })
      .finally(() => {
        if (sessionCheck.current === entry) sessionCheck.current = null;
        if (mounted.current && generation.current === requestGeneration) setIsLoading(false);
      });
    sessionCheck.current = entry;
    return entry.promise;
  }, [clearSession, publishUser, setRequested]);

  useEffect(() => {
    mounted.current = true;
    const onExpired = () => {
      // Repeated private 401s after signing out must not turn a successful logout
      // into an expired-session warning or interrupt a later anonymous visit.
      if (userRef.current || hintRef.current) clearSession('expired');
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== AUTH_SESSION_STORAGE_KEY && event.key !== SESSION_SYNC_KEY) return;
      if (event.storageArea && event.storageArea !== localStorage) return;
      if (!readSessionHint()) {
        if (userRef.current || hintRef.current) clearSession('other-tab');
      } else if (!logoutPromise.current) {
        hintRef.current = true;
        void retrySession();
      }
    };
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired);
    window.addEventListener('storage', onStorage);
    if (readSessionHint()) void retrySession();
    else setIsLoading(false);
    return () => {
      mounted.current = false;
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired);
      window.removeEventListener('storage', onStorage);
    };
  }, [clearSession, retrySession]);

  const signIn = useCallback(async (operation: () => Promise<LoginResultDto>, otpEmail = ''): Promise<AuthUser> => {
    if (logoutPromise.current) throw new Error('Sign-out is in progress. Please wait.');
    const requestGeneration = ++generation.current;
    invalidateAuthSessionRequests();
    setRequested(false);
    setLogoutError(null);
    setSessionCheckError(null);
    try {
      const result = await operation();
      if (!mounted.current || generation.current !== requestGeneration) throw new Error('This sign-in attempt is no longer active. Please try again.');
      if (result.otpRequired) throw new OtpRequiredError(result.user?.email || otpEmail, result.otpChallenge ?? null);
      const loggedUser = toUser(result.user);
      hintRef.current = true;
      writeSessionHint(true);
      publishUser(loggedUser);
      setSessionEndReason(null);
      broadcastSessionChange();
      return loggedUser;
    } finally {
      if (mounted.current && generation.current === requestGeneration) setIsLoading(false);
    }
  }, [publishUser, setRequested]);

  const login = useCallback((email: string, password: string) => signIn(() => authApi.login({ email, password }), email), [signIn]);
  const loginWithGoogle = useCallback((idToken: string) => signIn(() => authApi.google(idToken)), [signIn]);
  const verifyAdminOtp = useCallback((email: string, otp: string) => signIn(() => authApi.verifyAdminOtp(email, otp), email), [signIn]);
  const register = useCallback(async (fullName: string, email: string, password: string) => {
    const registrationGeneration = generation.current;
    await authApi.register({ fullName, email, password });
    if (!mounted.current || generation.current !== registrationGeneration) throw new Error('This registration attempt is no longer active. Please sign in to continue.');
    await login(email, password);
  }, [login]);

  const logout = useCallback((): Promise<void> => {
    if (logoutPromise.current) return logoutPromise.current;
    // Invalidate old profile/refresh responses before the server revokes cookies.
    generation.current += 1;
    invalidateAuthSessionRequests();
    setIsLoading(false);
    setIsLoggingOut(true);
    setLogoutError(null);
    const pending = Promise.resolve()
      .then(() => authApi.logout())
      .then(() => clearSession('logout', true))
      .catch(error => {
        if (mounted.current && (userRef.current || hintRef.current)) setLogoutError(errorKind(error));
        // The public logout endpoint already handles expired cookies with 200.
        // Any error response must stay an error, rather than only hiding the UI.
        throw error;
      })
      .finally(() => {
        if (logoutPromise.current === pending) logoutPromise.current = null;
        if (mounted.current) setIsLoggingOut(false);
      });
    logoutPromise.current = pending;
    return pending;
  }, [clearSession]);

  const requestLogout = useCallback(() => {
    if (!userRef.current || logoutPromise.current || requestedRef.current) return;
    const notCancelled = window.dispatchEvent(new Event(LOGOUT_REQUEST_EVENT, { cancelable: true }));
    if (notCancelled) {
      setLogoutError(null);
      setRequested(true);
    }
  }, [setRequested]);

  const cancelLogout = useCallback(() => {
    if (logoutPromise.current) return;
    setRequested(false);
    setLogoutError(null);
  }, [setRequested]);

  return <AuthContext.Provider value={{
    user, isLoading, sessionCheckError, sessionEndReason, retrySession,
    login, register, loginWithGoogle, verifyAdminOtp, logout, requestLogout,
    logoutRequested, isLoggingOut, logoutError, cancelLogout,
  }}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
