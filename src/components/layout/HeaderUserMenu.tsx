import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, LogOut } from 'lucide-react';
import { VIEW_PATHS } from '../../lib/routes';

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
        onClick={onOpenAuth}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-1 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] sm:text-xs transition-colors cursor-pointer shrink-0"
      >
        <LogIn className="w-3.5 h-3.5 shrink-0" />
        <span>{isID ? 'Masuk' : 'Sign In'}</span>
      </motion.button>
    );
  }

  return (
    <div className="flex items-center gap-1 sm:gap-3 pl-1.5 sm:pl-3 border-l border-slate-100 shrink-0">
      <Link
        to={user.role === 'ADMIN' ? VIEW_PATHS.admin : VIEW_PATHS.settings}
        className="flex items-center gap-1.5 sm:gap-3 cursor-pointer p-0.5 sm:p-1 rounded-xl hover:bg-slate-100 transition-all group shrink-0"
        title={user.fullName}
      >
        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-slate-900 text-white font-semibold flex items-center justify-center text-[10px] sm:text-xs shrink-0 shadow-xs">
          {user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div className="hidden xl:flex flex-col">
          <span className="text-[13px] font-semibold text-slate-900 leading-tight">
            {user.fullName}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {user.role === 'ADMIN' ? (isID ? 'Administrator' : 'Admin') : (isID ? 'Anggota' : 'Member')}
          </span>
        </div>
      </Link>
      <button
        onClick={onLogout}
        title={isID ? 'Keluar' : 'Log out'}
        className="hidden sm:flex p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer shrink-0"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
};
