import React, { useEffect, useState, useId } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Globe, Menu, X } from 'lucide-react';
import { Language, Notification } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getNavItems } from './navItems';
import { HeaderTopBar } from './HeaderTopBar';
import { HeaderLogo } from './HeaderLogo';
import { HeaderNav } from './HeaderNav';
import { HeaderNotifications } from './HeaderNotifications';
import { HeaderUserMenu } from './HeaderUserMenu';
import { HeaderMobileNav } from './HeaderMobileNav';
import { HeaderSearchDropdown } from './HeaderSearchDropdown';
import { isOperationsRole } from '../../lib/routes';

interface HeaderProps {
  activeBookingsCount: number;
  wishlistCount: number;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  notifications: Notification[];
  onMarkNotificationsRead: () => void;
  onMarkNotificationRead?: (notificationId: string) => void;
  onSelectCity: (city: string) => void;
  onOpenAuth: () => void;
  onOpenInvoiceByCode?: (bookingCode: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeBookingsCount,
  wishlistCount,
  language,
  onLanguageChange,
  isDarkMode = false,
  onToggleDarkMode,
  onSearchQueryChange,
  notifications,
  onMarkNotificationsRead,
  onMarkNotificationRead,
  onOpenAuth,
  onOpenInvoiceByCode,
}) => {
  const isID = language === 'ID';
  const { user, requestLogout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mobileNavId = useId();

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 4);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  useEffect(() => setMobileMenuOpen(false), [pathname]);

  const isAdmin = user?.role === 'ADMIN';
  const isOperations = isOperationsRole(user?.role);
  const isPublic = !isOperations;

  const handleSearchSubmit = (query: string) => {
    onSearchQueryChange(query);
    navigate('/explore');
  };

  const navItems = getNavItems({ isID, activeBookingsCount, wishlistCount, role: user?.role });
  const extendedNav = navItems.length > 5;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-navy focus:text-white focus:text-sm"
      >
        {isID ? 'Loncat ke konten' : 'Skip to content'}
      </a>

      {!isAdmin && (
        <HeaderTopBar
          isID={isID}
          isOperations={isOperations}
          language={language}
          onLanguageChange={onLanguageChange}
          isDarkMode={isDarkMode}
          onToggleDarkMode={onToggleDarkMode}
        />
      )}

      <header className={`site-header sticky top-0 z-50 w-full border-b text-slate-800 duration-300 ${isAdmin
        ? `border-slate-200 bg-white transition-shadow ${scrolled ? 'shadow-[0_8px_24px_rgba(15,35,68,0.12)]' : ''}`
        : `transition-[background-color,border-color,box-shadow] ${scrolled ? 'border-transparent bg-white/90 shadow-[0_10px_30px_rgba(15,35,68,0.08)] backdrop-blur-xl' : 'border-slate-200/70 bg-white'}`}`}>
        <div className={isAdmin ? 'bg-[#172953] bg-[radial-gradient(ellipse_at_left_top,#243d78_0%,transparent_68%)]' : undefined}>
          <div className={`mx-auto grid h-16 max-w-[1680px] grid-cols-[minmax(0,1fr)_auto] items-center sm:gap-6 sm:px-8 lg:h-[72px] lg:px-10 2xl:px-14 ${isPublic
            ? 'gap-3 px-4 max-[375px]:gap-1.5 max-[375px]:px-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-7 xl:gap-10'
            : `gap-2 px-4 min-[360px]:gap-3 ${isAdmin ? '' : 'lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]'}`}`}>
            <div className="flex min-w-0 items-center">
              <HeaderLogo isID={isID} />
            </div>

            {!isAdmin && <div className={isPublic ? 'hidden min-w-0 items-center justify-center lg:flex' : 'hidden h-full lg:block'}>
              {!extendedNav && <HeaderNav items={navItems} isPublic={isPublic} isID={isID} />}
            </div>}

            <div className={`flex shrink-0 items-center justify-end gap-1.5 sm:gap-2.5 ${isPublic ? 'max-[375px]:gap-1' : ''}`}>
              {isPublic && <HeaderSearchDropdown isID={isID} onOpen={() => setMobileMenuOpen(false)} onSubmit={handleSearchSubmit} />}

              {isAdmin && (
                <div className="mr-1 hidden items-center gap-2 rounded-xl border border-white/20 bg-white/5 py-0.5 pr-0.5 pl-2.5 lg:flex" role="group" aria-label={isID ? 'Bahasa' : 'Language'}>
                  <Globe className="size-4 text-gold-light" aria-hidden />
                  <div className="flex">
                    {(['ID', 'EN'] as const).map(code => (
                      <button
                        key={code} type="button" aria-pressed={language === code} onClick={() => onLanguageChange(code)}
                        className={`min-h-11 min-w-11 cursor-pointer rounded-lg text-xs font-semibold transition-colors ${language === code ? 'bg-gold-soft text-navy-dark' : 'text-white/80 hover:bg-white/15 hover:text-white'}`}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <HeaderNotifications
                key={user?.userId ?? 'guest'}
                isID={isID}
                isAdmin={isAdmin}
                onOpen={() => setMobileMenuOpen(false)}
                notifications={notifications}
                onMarkNotificationsRead={onMarkNotificationsRead}
                onMarkNotificationRead={onMarkNotificationRead}
                onOpenInvoiceByCode={onOpenInvoiceByCode}
              />

              <HeaderUserMenu
                isID={isID}
                user={user}
                onLogout={requestLogout}
                onOpenAuth={onOpenAuth}
              />

              <button
                type="button"
                onClick={() => setMobileMenuOpen(open => !open)}
                className={`inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center border transition-colors duration-200 lg:hidden ${isAdmin
                  ? 'rounded-xl border-white/20 text-white hover:bg-white/15'
                  : 'rounded-full border-slate-200 text-navy-dark hover:bg-slate-50 aria-expanded:border-navy/25 aria-expanded:bg-navy-soft'}`}
                aria-expanded={mobileMenuOpen}
                aria-controls={mobileNavId}
                aria-label={isID ? (mobileMenuOpen ? 'Tutup menu' : 'Buka menu') : (mobileMenuOpen ? 'Close menu' : 'Open menu')}
              >
                {mobileMenuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
              </button>
            </div>
          </div>
        </div>
        {extendedNav && (
          <div className={`mx-auto hidden max-w-[1680px] lg:block xl:px-10 2xl:px-14 ${isAdmin ? 'px-5' : 'px-10'}`}>
            <div className={`overflow-x-auto overscroll-x-contain px-1 ${isAdmin ? '' : 'border-t border-slate-100'}`}>
              <HeaderNav items={navItems} isAdmin={isAdmin} isID={isID} />
            </div>
          </div>
        )}

        <div id={mobileNavId}>
          <HeaderMobileNav
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            items={navItems}
            user={user}
            isID={isID}
            onLogout={requestLogout}
            language={language}
            onLanguageChange={onLanguageChange}
          />
        </div>
      </header>
    </>
  );
};
