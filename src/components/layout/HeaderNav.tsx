import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { ADMIN_PATHS, VIEW_PATHS } from '../../lib/routes';
import { HeaderNavItem } from './navItems';
import { pillTween } from '../../lib/motion';

const EXACT_MATCH_PATHS: string[] = [VIEW_PATHS.overview, ADMIN_PATHS.dashboard];

export const HeaderNav: React.FC<{ items: HeaderNavItem[] }> = ({ items }) => (
  <nav className="hidden lg:flex items-center gap-0.5" aria-label="Primary">
    {items.map((item) => {
      const Icon = item.icon;
      return (
        <NavLink
          key={item.path}
          to={item.path}
          end={EXACT_MATCH_PATHS.includes(item.path)}
          className={({ isActive }) =>
            `relative min-h-11 px-3.5 rounded-full text-[13px] font-medium transition-colors duration-200 cursor-pointer flex items-center gap-2 ${
              isActive ? 'text-navy' : 'text-slate-600 hover:text-navy'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="nav-active-pill"
                  className="absolute inset-0 bg-navy-soft rounded-full"
                  transition={pillTween}
                />
              )}

              <Icon className={`relative z-10 w-4 h-4 shrink-0 ${isActive ? 'text-navy' : 'text-slate-400'}`} aria-hidden />
              <span className="relative z-10 whitespace-nowrap">{item.label}</span>
              {item.badge !== null && (
                <span className={`relative z-10 ml-0.5 min-w-5 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-center ${item.badgeColor}`}>
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
