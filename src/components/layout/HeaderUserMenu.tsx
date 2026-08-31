import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, LogOut } from 'lucide-react';
import { roleLandingPath } from '../../lib/routes';

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
        className="inline-flex items-center justify-center gap-1.5 min-h-11 px-3 sm:px-4 rounded-xl bg-navy hover:bg-navy-dark text-white font-semibold text-[12px] sm:text-[13px] transition-colors duration-200 cursor-pointer shrink-0"
      >
        <LogIn className="w-3.5 h-3.5 shrink-0" aria-hidden />
        <span>{isID ? 'Masuk' : 'Sign in'}</span>
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

  return (
    <div className="flex items-center gap-1 sm:gap-2 pl-1.5 sm:pl-3 border-l border-navy-soft shrink-0">
      <Link
        to={user.role === 'CUSTOMER' ? '/settings' : roleLandingPath(user.role)}
        className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer p-1 rounded-xl hover:bg-navy-soft transition-colors duration-200 group shrink-0"
        title={user.fullName}
      >
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-navy text-white font-semibold flex items-center justify-center text-[11px] sm:text-xs shrink-0">
          {user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div className="hidden xl:flex flex-col">
          <span className="text-[13px] font-semibold text-navy leading-tight">
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
        className="hidden sm:inline-flex min-w-11 min-h-11 items-center justify-center rounded-xl text-slate-500 hover:text-navy hover:bg-navy-soft transition-colors duration-200 cursor-pointer shrink-0"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
};
