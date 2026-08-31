import React from 'react';
import { ShieldCheck, Globe, Sun, Moon } from 'lucide-react';
import { Language } from '../../types';

interface HeaderTopBarProps {
  isID: boolean;
  isOperations?: boolean;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const HeaderTopBar: React.FC<HeaderTopBarProps> = ({
  isID,
  isOperations = false,
  language,
  onLanguageChange,
  isDarkMode = false,
  onToggleDarkMode
}) => (
  <div className="border-b border-navy-soft bg-navy-soft/50">
    <div className="max-w-[1800px] mx-auto flex items-center justify-between py-1.5 sm:py-2 px-3 sm:px-8 lg:px-12 2xl:px-16">
      <div className="flex items-center gap-1.5 min-w-0">
        {isOperations ? (
          <>
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" aria-hidden />
            <span className="text-[11px] text-slate-600 font-semibold tracking-wide truncate">
              {isID ? 'Ruang Kerja Operasional · Roomly' : 'Roomly Operations Workspace'}
            </span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-3.5 h-3.5 text-gold shrink-0" aria-hidden />
            <span className="text-[11px] text-slate-600 font-medium tracking-wide truncate">
              {isID ? 'Jaminan harga terbaik' : 'Best price guarantee'}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-5 shrink-0">
        <div className="flex items-center gap-1.5" role="group" aria-label={isID ? 'Bahasa' : 'Language'}>
          <Globe className="w-3.5 h-3.5 text-navy" aria-hidden />
          <button
            type="button"
            onClick={() => onLanguageChange('ID')}
            aria-pressed={language === 'ID'}
            className={`min-h-8 px-1 text-[12px] font-semibold transition-colors duration-200 cursor-pointer ${
              language === 'ID' ? 'text-navy' : 'text-slate-500 hover:text-navy'
            }`}
          >
            ID
          </button>
          <span className="text-slate-300 text-[10px]" aria-hidden>/</span>
          <button
            type="button"
            onClick={() => onLanguageChange('EN')}
            aria-pressed={language === 'EN'}
            className={`min-h-8 px-1 text-[12px] font-semibold transition-colors duration-200 cursor-pointer ${
              language === 'EN' ? 'text-navy' : 'text-slate-500 hover:text-navy'
            }`}
          >
            EN
          </button>
        </div>

        {onToggleDarkMode && (
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="min-w-8 min-h-8 inline-flex items-center justify-center rounded-full text-slate-500 hover:text-navy hover:bg-white transition-colors duration-200 cursor-pointer"
            title={isDarkMode ? (isID ? 'Mode terang' : 'Light mode') : (isID ? 'Mode gelap' : 'Dark mode')}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  </div>
);
