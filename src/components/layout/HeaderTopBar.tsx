import React from 'react';
import { ShieldCheck, Globe, Sun, Moon } from 'lucide-react';
import { Language } from '../../types';

interface HeaderTopBarProps {
  isID: boolean;
  /** ADMIN sessions get an operations label instead of the storefront tagline. */
  isAdmin?: boolean;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const HeaderTopBar: React.FC<HeaderTopBarProps> = ({
  isID,
  isAdmin = false,
  language,
  onLanguageChange,
  isDarkMode = false,
  onToggleDarkMode
}) => (
  <div className="border-b border-slate-100">
    <div className="max-w-[1800px] mx-auto flex items-center justify-between py-1.5 sm:py-2 px-3 sm:px-8 lg:px-12 2xl:px-16">
      <div className="flex items-center gap-1.5 min-w-0">
        {isAdmin ? (
          <>
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold tracking-wide truncate">
              {isID ? 'Konsol Operasional · Roomly Admin' : 'Operations Console · Roomly Admin'}
            </span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium tracking-wide truncate">
              {isID ? 'Jaminan Harga Terbaik' : 'Best Price Guarantee'}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-5 shrink-0">
        {/* Language Toggle */}
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <button
            onClick={() => onLanguageChange('ID')}
            className={`text-[11px] font-semibold transition-colors cursor-pointer ${
              language === 'ID' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            ID
          </button>
          <span className="text-slate-200 text-[10px]">/</span>
          <button
            onClick={() => onLanguageChange('EN')}
            className={`text-[11px] font-semibold transition-colors cursor-pointer ${
              language === 'EN' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            EN
          </button>
        </div>

        {/* Dark Mode Toggle — only shown when dark mode is enabled */}
        {onToggleDarkMode && (
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            title={isDarkMode ? (isID ? 'Mode Terang' : 'Light Mode') : (isID ? 'Mode Gelap' : 'Dark Mode')}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  </div>
);
