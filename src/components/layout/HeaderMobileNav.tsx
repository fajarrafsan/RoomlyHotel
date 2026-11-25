import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ChevronRight, Globe, LogOut } from 'lucide-react';
import { ADMIN_PATHS, VIEW_PATHS } from '../../lib/routes';
import { fadeTween } from '../../lib/motion';
import { HeaderNavItem } from './navItems';
import { AuthUser, Language } from '../../types';

interface HeaderMobileNavProps {
  open: boolean;
  onClose: () => void;
  items: HeaderNavItem[];
  user?: AuthUser | null;
  isID?: boolean;
  onLogout?: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const LANGUAGES: Language[] = ['ID', 'EN'];
const ADMIN_SECTIONS = [
  { key: 'operations', id: 'Operasional', en: 'Operations' },
  { key: 'finance', id: 'Keuangan', en: 'Finance' },
  { key: 'management', id: 'Pengelolaan', en: 'Management' },
] as const;

export const HeaderMobileNav: React.FC<HeaderMobileNavProps> = ({
  open,
  onClose,
  items,
  user,
  isID = true,
  onLogout,
  language,
  onLanguageChange,
}) => {
  const reduceMotion = useReducedMotion();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';

    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onCloseRef.current(); };
    // The desktop nav takes over at this width, so an open panel would keep the page locked.
    const desktop = window.matchMedia('(min-width: 1024px)');
    const onViewportChange = () => { if (desktop.matches) onCloseRef.current(); };

    window.addEventListener('keydown', onKey);
    desktop.addEventListener('change', onViewportChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', onViewportChange);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);

  const transition = reduceMotion ? { duration: 0 } : fadeTween;
  const isAdmin = user?.role === 'ADMIN';
  const groups = isAdmin
    ? ADMIN_SECTIONS.map(({ key, id, en }) => ({ key, label: isID ? id : en, items: items.filter(item => item.section === key) }))
    : [{ key: 'primary', label: '', items }];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            className="absolute inset-x-0 top-full h-dvh bg-[#0b1f3a]/45 lg:hidden"
            onClick={onClose}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
            aria-hidden
          />
          <motion.div
            key="panel"
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={transition}
            className="absolute inset-x-0 top-full overflow-hidden rounded-b-[26px] border-t border-slate-100 bg-white shadow-[0_24px_48px_rgba(11,31,58,0.18)] lg:hidden"
            data-header-mobile-nav
          >
            <div className="max-h-[calc(100dvh-64px)] overflow-y-auto overscroll-contain p-3 sm:p-4">
              {user && (
                <div className="mb-2 flex items-center justify-between gap-3 rounded-2xl bg-navy-dark p-3 text-white">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-gold-light">
                      {user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{user.fullName}</p>
                      <p className="truncate text-xs text-white/75">{user.email}</p>
                    </div>
                  </div>
                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => { onLogout(); onClose(); }}
                      className="flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-white/10 px-3.5 text-xs font-semibold transition-colors duration-200 hover:bg-white/20"
                    >
                      <LogOut className="size-3.5" aria-hidden />
                      <span>{isID ? 'Keluar' : 'Logout'}</span>
                    </button>
                  )}
                </div>
              )}

              <nav className={isAdmin ? 'space-y-3' : ''} aria-label={isID ? 'Navigasi utama seluler' : 'Mobile primary navigation'}>
                {groups.map(group => (
                  <div key={group.key} className={`space-y-0.5 ${isAdmin ? 'rounded-xl border border-slate-200 p-1.5' : ''}`}>
                    {group.label && <p className="px-2.5 pt-1.5 pb-0.5 text-xs font-semibold text-slate-600">{group.label}</p>}
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          end={item.path === VIEW_PATHS.overview || item.path === ADMIN_PATHS.dashboard}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex min-h-[52px] w-full cursor-pointer items-center justify-between px-2.5 py-2 text-[15px] font-medium transition-colors duration-200 ${isAdmin ? 'rounded-lg' : 'rounded-2xl'} ${
                              isActive ? 'bg-navy-soft/60 text-navy-dark' : 'text-slate-600 hover:bg-slate-50 hover:text-navy-dark'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <div className="flex items-center gap-3">
                                <span className={`flex size-9 items-center justify-center rounded-full transition-colors duration-200 ${isActive ? 'bg-navy-dark text-gold-light' : 'bg-slate-100 text-slate-500'}`}>
                                  <Icon className="size-4" aria-hidden />
                                </span>
                                <span>{item.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {item.badge !== null && (
                                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${item.badgeColor}`}>
                                    {item.badge}
                                  </span>
                                )}
                                <ChevronRight className={`size-4 ${isActive ? 'text-navy' : 'text-slate-400'}`} aria-hidden />
                              </div>
                            </>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                ))}
              </nav>

              <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-100 px-2.5 pt-3">
                <p className="flex items-center gap-2.5 text-sm font-medium text-slate-600">
                  <Globe className="size-4 text-gold" aria-hidden />
                  {isID ? 'Bahasa' : 'Language'}
                </p>
                <div className="flex gap-0.5 rounded-full bg-slate-100 p-0.5" role="group" aria-label={isID ? 'Bahasa' : 'Language'}>
                  {LANGUAGES.map(code => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => onLanguageChange(code)}
                      aria-pressed={language === code}
                      className={`min-h-11 min-w-12 cursor-pointer rounded-full px-3 text-[13px] font-semibold transition-colors duration-150 ${language === code ? 'bg-white text-navy-dark shadow-[0_1px_4px_rgba(21,42,102,0.16)]' : 'text-slate-500 hover:text-navy-dark'}`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
