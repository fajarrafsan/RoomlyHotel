import { useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker, useLocation, useNavigate, type BlockerFunction } from 'react-router-dom';
import { LOGOUT_REQUEST_EVENT, useAuth } from '../../context/AuthContext';

export type CheckoutLeaveHold = 'navigation' | 'logout' | null;

/**
 * While active, holds back every in-app navigation (links, programmatic moves,
 * and the browser's back/forward) and the header's log out until the guest
 * confirms, and asks the browser to warn before a reload or closing the tab.
 */
export function useCheckoutLeaveGuard(active: boolean, afterLogoutPath: string, processing = false) {
  const { logout, user, isLoggingOut } = useAuth();
  const navigate = useNavigate();
  const [isLogoutHeld, setIsLogoutHeld] = useState(false);
  const [logoutFailed, setLogoutFailed] = useState(false);
  const logoutInFlightRef = useRef(false);
  const navigationAnsweredRef = useRef(false);
  // Confirming a log out also moves the guest off this page; that move must pass.
  const hasLoggedOutRef = useRef(false);

  // Stays on this page's path while it animates out, so once the guest has left
  // the next navigation is no longer held back.
  const { pathname } = useLocation();
  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      active && Boolean(user) && !hasLoggedOutRef.current && currentLocation.pathname === pathname && nextLocation.pathname !== pathname,
    [active, pathname, user],
  );
  const blocker = useBlocker(shouldBlock);

  // The dialog's buttons stay clickable while it fades out, and the router throws
  // if a held navigation is settled twice, so always answer from the latest state.
  const latestRef = useRef({ blocker, isLogoutHeld, afterLogoutPath, processing, isLoggingOut });
  latestRef.current = { blocker, isLogoutHeld, afterLogoutPath, processing, isLoggingOut };

  useEffect(() => {
    if (blocker.state !== 'blocked') navigationAnsweredRef.current = false;
  }, [blocker.state]);

  const resetHeldNavigation = useCallback(() => {
    const held = latestRef.current.blocker;
    if (held.state !== 'blocked' || navigationAnsweredRef.current) return;
    navigationAnsweredRef.current = true;
    held.reset();
  }, []);

  const stay = useCallback(() => {
    if (logoutInFlightRef.current || latestRef.current.isLoggingOut) return;
    setIsLogoutHeld(false);
    setLogoutFailed(false);
    resetHeldNavigation();
  }, [resetHeldNavigation]);

  const leave = useCallback(async () => {
    const latest = latestRef.current;
    if (latest.processing || latest.isLoggingOut || logoutInFlightRef.current) return;
    if (latest.isLogoutHeld && !hasLoggedOutRef.current) {
      logoutInFlightRef.current = true;
      setLogoutFailed(false);
      try {
        // The guest's form and session stay intact when the server cannot log out.
        await logout();
        hasLoggedOutRef.current = true;
        setIsLogoutHeld(false);
        resetHeldNavigation();
        navigate(latestRef.current.afterLogoutPath, { replace: true });
      } catch {
        setLogoutFailed(true);
      } finally {
        logoutInFlightRef.current = false;
      }
    } else if (latest.blocker.state === 'blocked' && !navigationAnsweredRef.current) {
      navigationAnsweredRef.current = true;
      latest.blocker.proceed();
    }
  }, [logout, navigate, resetHeldNavigation]);

  // The guard can switch off while something is held, for example once the
  // booking finishes; a stale hold would otherwise stay open.
  useEffect(() => {
    if (!user) {
      setIsLogoutHeld(false);
      setLogoutFailed(false);
      resetHeldNavigation();
    } else if (!active) stay();
  }, [active, user, blocker.state, stay, resetHeldNavigation]);

  useEffect(() => {
    if (!active || !user) return;
    const holdLogout = (event: Event) => {
      event.preventDefault();
      if (logoutInFlightRef.current || latestRef.current.isLoggingOut) return;
      resetHeldNavigation();
      setLogoutFailed(false);
      setIsLogoutHeld(true);
    };
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener(LOGOUT_REQUEST_EVENT, holdLogout);
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => {
      window.removeEventListener(LOGOUT_REQUEST_EVENT, holdLogout);
      window.removeEventListener('beforeunload', warnBeforeUnload);
    };
  }, [active, user, resetHeldNavigation]);

  const hold: CheckoutLeaveHold = user ? (isLogoutHeld ? 'logout' : blocker.state === 'blocked' ? 'navigation' : null) : null;
  return { hold, stay, leave, isLoggingOut, logoutFailed };
}
