import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, LogOut } from 'lucide-react';
import { isOperationsRole, roleLandingPath } from '../../lib/routes';

interface HeaderUserMenuProps {
  isID: boolean;
  user: { fullName: string; role?: string } | null;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const HeaderUserMenu: React.FC<HeaderUserMenuProps> = ({ isID, user, onLogout, onOpenAuth }) => {
  if (!user) {
    return (
      <motion.button
        type="button"
        onClick={onOpenAuth}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.98 }}
        aria-label={isID ? 'Masuk' : 'Sign in'}
        className="inline-flex items-center justify-center gap-2 min-h-11 min-w-11 sm:px-5 rounded-full bg-navy-dark hover:bg-navy text-white font-semibold text-[13px] transition-colors duration-200 cursor-pointer shrink-0"
      >
        <LogIn className="size-4 shrink-0 text-gold-light" aria-hidden />
        <span className="hidden sm:inline">{isID ? 'Masuk' : 'Sign in'}</span>
      </motion.button>
    );
  }

  const roleLabels: Record<string, { id: string; en: string }> = {
    ADMIN: { id: 'Administrator', en: 'Administrator' },
    RECEPTIONIST: { id: 'Resepsionis', en: 'Receptionist' },
    HOUSEKEEPING: { id: 'Housekeeping', en: 'Housekeeping' },
    MAINTENANCE: { id: 'Teknisi', en: 'Maintenance' },
    CUSTOMER: { id: 'Anggota', en: 'Member' },
  };
  const roleLabel = roleLabels[user.role ?? 'CUSTOMER'] ?? roleLabels.CUSTOMER;
  const initials = user.fullName.trim().split(/\s+/).map((name) => name.charAt(0)).slice(0, 2).join('').toUpperCase();
  const isPublic = !isOperationsRole(user.role);

  if (user.role === 'ADMIN') {
    return (
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        <Link
          to="/settings"
          title={user.fullName}
          aria-label={isID ? 'Pengaturan akun' : 'Account settings'}
          className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl p-1 transition-colors hover:bg-white/10 sm:justify-start sm:px-2"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gold-soft text-xs font-bold text-navy-dark sm:size-9" aria-hidden>{initials}</span>
          <span className="hidden max-w-[150px] flex-col gap-0.5 pr-1 text-left sm:flex">
            <span className="truncate text-sm font-semibold leading-tight text-white">{user.fullName}</span>
            <span className="text-xs leading-tight text-white/75">{isID ? roleLabel.id : roleLabel.en}</span>
          </span>
        </Link>
        <button
          type="button" onClick={onLogout}
          title={isID ? 'Keluar' : 'Log out'} aria-label={isID ? 'Keluar' : 'Log out'}
          className="hidden size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/20 text-white/85 transition-colors hover:bg-white/10 hover:text-white sm:inline-flex"
        >
          <LogOut className="size-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex shrink-0 items-center gap-1 border-l border-slate-200 pl-1.5 sm:gap-1.5 sm:pl-2.5 ${isPublic ? 'max-[375px]:border-0 max-[375px]:pl-0 xl:pl-3' : ''}`}>
      <Link
        to={user.role === 'CUSTOMER' ? '/settings' : roleLandingPath(user.role)}
        className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 sm:gap-2.5 cursor-pointer p-1 rounded-full hover:bg-navy-soft transition-colors duration-200 group shrink-0"
        title={user.fullName}
        aria-label={isPublic ? (isID ? `Pengaturan akun ${user.fullName}` : `Account settings for ${user.fullName}`) : undefined}
      >
        <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold sm:size-9 sm:text-xs ${isPublic
          ? 'bg-navy-soft text-navy-dark ring-1 ring-navy/10 ring-inset'
          : 'bg-navy-dark text-gold-light'}`}>
          {initials}
        </div>
        <div className="hidden 2xl:flex max-w-[140px] flex-col pr-2">
          <span className="truncate text-[13px] font-semibold text-navy leading-tight">
            {user.fullName}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            {isID ? roleLabel.id : roleLabel.en}
          </span>
        </div>
      </Link>
      <button
        type="button"
        onClick={onLogout}
        title={isID ? 'Keluar' : 'Log out'}
        aria-label={isID ? 'Keluar' : 'Log out'}
        className="hidden sm:inline-flex min-w-11 min-h-11 items-center justify-center rounded-full text-slate-500 hover:text-navy hover:bg-navy-soft transition-colors duration-200 cursor-pointer shrink-0"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
};
