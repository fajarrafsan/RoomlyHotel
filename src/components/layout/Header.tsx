import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isOperations = isOperationsRole(user?.role);

  const handleSearchSubmit = (query: string) => {
    onSearchQueryChange(query);
    navigate('/explore');
  };

  const navItems = getNavItems({ isID, activeBookingsCount, wishlistCount, role: user?.role });

  return (
    <header className="site-header sticky top-0 z-50 bg-white border-b border-navy-soft w-full text-slate-800">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-navy focus:text-white focus:text-sm"
      >
        {isID ? 'Loncat ke konten' : 'Skip to content'}
      </a>

      <HeaderTopBar
        isID={isID}
        isOperations={isOperations}
        language={language}
        onLanguageChange={onLanguageChange}
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
      />

      <div className="max-w-[1800px] mx-auto px-3 sm:px-8 lg:px-12 2xl:px-16">
        <div className="h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-6">
          <div className="flex items-center gap-4 sm:gap-10 min-w-0">
            <HeaderLogo isID={isID} />
            <HeaderNav items={navItems} />
          </div>

          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {!isOperations && <HeaderSearchDropdown isID={isID} onSubmit={handleSearchSubmit} />}

            <HeaderNotifications
              isID={isID}
              notifications={notifications}
              onMarkNotificationsRead={onMarkNotificationsRead}
              onMarkNotificationRead={onMarkNotificationRead}
              onOpenInvoiceByCode={onOpenInvoiceByCode}
            />

            <HeaderUserMenu
              isID={isID}
              user={user}
              onLogout={() => logout()}
              onOpenAuth={onOpenAuth}
            />

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden min-w-11 min-h-11 inline-flex items-center justify-center rounded-xl text-navy hover:bg-navy-soft transition-colors duration-200 cursor-pointer shrink-0"
              aria-expanded={mobileMenuOpen}
              aria-label={isID ? 'Buka menu' : 'Toggle menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <HeaderMobileNav
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        items={navItems}
        user={user}
        isID={isID}
        onLogout={() => logout()}
      />
    </header>
  );
};
