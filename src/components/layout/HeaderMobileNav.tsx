import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, LogOut, User as UserIcon } from 'lucide-react';
import { VIEW_PATHS } from '../../lib/routes';
import { HeaderNavItem } from './navItems';
import { AuthUser } from '../../types';

interface HeaderMobileNavProps {
  open: boolean;
  onClose: () => void;
  items: HeaderNavItem[];
  user?: AuthUser | null;
  isID?: boolean;
  onLogout?: () => void;
}

export const HeaderMobileNav: React.FC<HeaderMobileNavProps> = ({
  open,
  onClose,
  items,
  user,
  isID = true,
  onLogout
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="lg:hidden border-t border-navy-soft bg-white overflow-hidden"
      >
        <div className="p-4 space-y-3">
          {/* Logged In Mobile Profile Card */}
          {user && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100/80 flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-navy text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900 truncate">{user.fullName}</p>
                  <p className="text-[11px] text-slate-400 font-medium truncate">{user.email}</p>
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={() => { onLogout(); onClose(); }}
                  className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors shrink-0 text-xs font-semibold flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="text-[11px]">{isID ? 'Keluar' : 'Logout'}</span>
                </button>
              )}
            </div>
          )}

          <div className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === VIEW_PATHS.overview}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                      isActive ? 'bg-navy-soft text-navy font-semibold' : 'text-slate-600 hover:bg-navy-soft/60'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-navy' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge !== null && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
