import React from 'react';
import { ShieldCheck, Globe, Sun, Moon, Sparkles } from 'lucide-react';
import { Language } from '../../types';

interface HeaderTopBarProps {
  isID: boolean;
  isOperations?: boolean;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

const LANGUAGES: Language[] = ['ID', 'EN'];

/** Sits above the sticky bar and scrolls away; below lg the language switch lives in the mobile menu. */
export const HeaderTopBar: React.FC<HeaderTopBarProps> = ({
  isID,
  isOperations = false,
  language,
  onLanguageChange,
  isDarkMode = false,
  onToggleDarkMode,
}) => (
  <div className="site-topbar hidden bg-navy-dark text-white lg:block" data-header-topbar>
    <div className="mx-auto flex h-9 max-w-[1680px] items-center justify-between gap-3 px-10 2xl:px-14">
      <p className="flex min-w-0 items-center gap-2 text-xs font-medium tracking-wide text-white/85">
        {isOperations
          ? <ShieldCheck className="size-3.5 shrink-0 text-gold-light" aria-hidden />
          : <Sparkles className="size-3.5 shrink-0 text-gold-light" aria-hidden />}
        <span className="truncate">
          {isOperations
            ? (isID ? 'Ruang Kerja Operasional · Roomly' : 'Roomly Operations Workspace')
            : (isID ? 'Temukan tempat, ciptakan cerita.' : 'Find your place. Make a memory.')}
        </span>
      </p>

      <div className="flex shrink-0 items-center gap-3">
        <div className="flex items-center gap-2" role="group" aria-label={isID ? 'Bahasa' : 'Language'}>
          <Globe className="size-3.5 text-gold-light" aria-hidden />
          <div className="flex rounded-full bg-white/10 p-0.5">
            {LANGUAGES.map(code => (
              <button
                key={code}
                type="button"
                onClick={() => onLanguageChange(code)}
                aria-pressed={language === code}
                className={`min-h-6 min-w-8 cursor-pointer rounded-full px-2 text-[11px] font-semibold transition-colors duration-200 ${language === code ? 'bg-gold-light text-navy-dark' : 'text-white/75 hover:text-white'}`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {onToggleDarkMode && (
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-white/70 transition-colors duration-200 hover:bg-white/10 hover:text-white"
            title={isDarkMode ? (isID ? 'Mode terang' : 'Light mode') : (isID ? 'Mode gelap' : 'Dark mode')}
          >
            {isDarkMode ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </button>
        )}
      </div>
    </div>
  </div>
);
