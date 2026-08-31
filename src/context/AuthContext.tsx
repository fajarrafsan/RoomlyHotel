import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import { AUTH_SESSION_EXPIRED_EVENT, OtpRequiredError } from '../lib/http';
import { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<AuthUser>;
  verifyAdminOtp: (email: string, otp: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_FLAG = 'roomly_has_active_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const clearExpiredSession = () => {
      localStorage.removeItem(SESSION_FLAG);
      setUser(null);
    };
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, clearExpiredSession);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, clearExpiredSession);
  }, []);

  useEffect(() => {
    const hasSession = localStorage.getItem(SESSION_FLAG) === 'true';
    if (!hasSession) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    authApi
      .me()
      .then((profile) => {
        setUser({ userId: profile.userId, fullName: profile.fullName, email: profile.email, role: profile.role, hotelId: profile.hotelId });
      })
      .catch(() => {
        localStorage.removeItem(SESSION_FLAG);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login({ email, password });
    if (result.otpRequired) {
      throw new OtpRequiredError(email);
    }
    const loggedUser: AuthUser = { userId: result.user.userId, fullName: result.user.fullName, email: result.user.email, role: result.user.role, hotelId: result.user.hotelId };
    localStorage.setItem(SESSION_FLAG, 'true');
    setUser(loggedUser);
    return loggedUser;
  }, []);

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    await authApi.register({ fullName, email, password });
    await login(email, password);
  }, [login]);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const result = await authApi.google(idToken);
    if (result.otpRequired) {
      throw new OtpRequiredError(result.user.email);
    }
    const loggedUser: AuthUser = { userId: result.user.userId, fullName: result.user.fullName, email: result.user.email, role: result.user.role, hotelId: result.user.hotelId };
    localStorage.setItem(SESSION_FLAG, 'true');
    setUser(loggedUser);
    return loggedUser;
  }, []);

  const verifyAdminOtp = useCallback(async (email: string, otp: string) => {
    const result = await authApi.verifyAdminOtp(email, otp);
    const loggedUser: AuthUser = { userId: result.user.userId, fullName: result.user.fullName, email: result.user.email, role: result.user.role, hotelId: result.user.hotelId };
    localStorage.setItem(SESSION_FLAG, 'true');
    setUser(loggedUser);
    return loggedUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem(SESSION_FLAG);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, loginWithGoogle, verifyAdminOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
