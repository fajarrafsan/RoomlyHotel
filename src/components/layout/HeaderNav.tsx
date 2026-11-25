import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ADMIN_PATHS, VIEW_PATHS } from '../../lib/routes';
import { HeaderNavItem } from './navItems';
import { pillTween } from '../../lib/motion';

const EXACT_MATCH_PATHS: string[] = [VIEW_PATHS.overview, ADMIN_PATHS.dashboard];

export const HeaderNav: React.FC<{ items: HeaderNavItem[]; isAdmin?: boolean; isPublic?: boolean; isID?: boolean }> = ({ items, isAdmin, isPublic, isID = true }) => {
  const reduceMotion = useReducedMotion();
  const extended = items.length > 5;
  if (isAdmin) {
    return (
      <nav className="hidden min-w-max items-center gap-0.5 py-2 lg:flex xl:gap-1" aria-label={isID ? 'Navigasi admin' : 'Admin navigation'}>
        {items.map(({ path, label, icon: Icon, section }, index) => {
          const startsGroup = index > 0 && section !== items[index - 1].section;
          return (
            <div key={path} className={startsGroup ? 'ml-1 border-l border-slate-200 pl-1.5 xl:ml-2 xl:pl-2.5' : undefined}>
              <NavLink
                to={path}
                end={EXACT_MATCH_PATHS.includes(path)}
                className={({ isActive }) =>
                  `relative isolate flex min-h-11 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-[13px] font-semibold transition-colors xl:gap-2 xl:px-3.5 ${isActive ? 'text-navy-dark' : 'text-slate-600 hover:bg-slate-100 hover:text-navy-dark'}`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span aria-hidden layoutId="admin-nav-active" className="absolute inset-0 -z-10 rounded-lg border border-navy/15 bg-navy-soft" transition={reduceMotion ? { duration: 0 } : pillTween} />
                    )}
                    <Icon className={`size-4 shrink-0 ${isActive ? 'text-navy' : 'text-slate-500'}`} aria-hidden />
                    {label}
                  </>
                )}
              </NavLink>
            </div>
          );
        })}
      </nav>
    );
  }
  if (isPublic) {
    return (
      <nav aria-label={isID ? 'Navigasi utama' : 'Primary navigation'} className="flex shrink-0 items-center gap-0.5 rounded-2xl bg-slate-100/80 p-1 ring-1 ring-slate-200/70 ring-inset xl:gap-1">
        {items.map(({ path, label, badge, badgeColor }) => (
          <NavLink
            key={path}
            to={path}
            end={EXACT_MATCH_PATHS.includes(path)}
            className={({ isActive }) =>
              `relative isolate flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold whitespace-nowrap transition-colors xl:px-3.5 ${isActive ? 'text-navy-dark' : 'text-slate-600 hover:bg-white/70 hover:text-navy-dark'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    aria-hidden
                    layoutId="public-nav-active"
                    className="absolute inset-0 -z-10 rounded-xl border border-slate-200/80 bg-white shadow-sm"
                    transition={reduceMotion ? { duration: 0 } : pillTween}
                  />
                )}
                {label}
                {badge !== null && (
                  <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] leading-4 font-bold tabular-nums ${badgeColor}`}>
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    );
  }
  return (
  <nav className={`hidden h-full min-w-0 items-stretch gap-0.5 lg:flex xl:gap-1.5 ${extended ? 'min-h-14 w-max justify-start' : 'justify-center'}`} aria-label="Primary">
    {items.map((item) => {
      const Icon = item.icon;
      return (
        <NavLink
          key={item.path}
          to={item.path}
          end={EXACT_MATCH_PATHS.includes(item.path)}
          className={({ isActive }) =>
            `group/nav-item flex cursor-pointer items-center gap-2 px-3 text-sm font-medium transition-colors duration-200 xl:px-3.5 ${
              isActive ? 'text-navy-dark' : 'text-slate-600 hover:text-navy-dark'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {extended && <Icon className={`relative z-10 w-4 h-4 shrink-0 ${isActive ? 'text-navy' : 'text-slate-400'}`} aria-hidden />}
              <span className={`relative z-10 flex items-center self-stretch whitespace-nowrap ${
                isActive ? '' : 'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-t-full after:bg-gold/40 after:transition-transform after:duration-200 group-hover/nav-item:after:scale-x-100 motion-reduce:after:transition-none'
              }`}>
                {item.label}
                {isActive && (
                  <motion.span
                    aria-hidden
                    layoutId="nav-active-underline"
                    className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-gold"
                    transition={reduceMotion ? { duration: 0 } : pillTween}
                  />
                )}
              </span>
              {item.badge !== null && (
                <span className={`relative z-10 ml-0.5 min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold ${item.badgeColor}`}>
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
};
