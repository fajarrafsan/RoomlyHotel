import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { ADMIN_PATHS, VIEW_PATHS } from '../../lib/routes';
import { HeaderNavItem } from './navItems';

// Both "/" and "/admin" are prefixes of their siblings, so they need exact
// matching or they'd stay highlighted on every child route.
const EXACT_MATCH_PATHS: string[] = [VIEW_PATHS.overview, ADMIN_PATHS.dashboard];

export const HeaderNav: React.FC<{ items: HeaderNavItem[] }> = ({ items }) => (
  <nav className="hidden lg:flex items-center gap-1">
    {items.map((item) => {
      const Icon = item.icon;
      return (
        <NavLink
          key={item.path}
          to={item.path}
          end={EXACT_MATCH_PATHS.includes(item.path)}
          className={({ isActive }) =>
            `relative h-9 px-4 rounded-full text-[13px] font-medium transition-all cursor-pointer flex items-center gap-2 ${
              isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="nav-active-pill"
                  className="absolute inset-0 bg-slate-100 rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}

              <Icon className={`relative z-10 w-4 h-4 shrink-0 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
              <span className="relative z-10 whitespace-nowrap">{item.label}</span>
              {item.badge !== null && (
                <span className={`relative z-10 ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </>
          )}
        </NavLink>
      );
    })}
  </nav>
);
