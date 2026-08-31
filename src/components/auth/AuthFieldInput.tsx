import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';

interface AuthFieldInputProps {
  icon: LucideIcon;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minLength?: number;
  inputMode?: 'text' | 'numeric' | 'email';
  autoFocus?: boolean;
  id?: string;
  name?: string;
  autoComplete?: string;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  required?: boolean;
  tabIndex?: number;
  /** Extra classes for the input element itself (e.g. OTP letter-spacing). */
  inputClassName?: string;
  /** Optional trailing adornment, e.g. show-password toggle or a check icon. */
  rightSlot?: React.ReactNode;
}

export const AuthFieldInput: React.FC<AuthFieldInputProps> = ({
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  minLength,
  inputMode,
  autoFocus,
  id,
  name,
  autoComplete,
  ariaInvalid,
  ariaDescribedBy,
  required = true,
  tabIndex,
  inputClassName = '',
  rightSlot,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={`relative rounded-xl border bg-[#F8FAFC] transition-colors duration-200 ${
        focused
          ? 'border-navy ring-2 ring-navy/15 bg-white'
          : 'border-navy-soft hover:border-navy/30'
      }`}
    >
      <Icon
        className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
          focused ? 'text-gold' : 'text-slate-400'
        }`}
        aria-hidden
      />
      <input
        id={id}
        name={name}
        required={required}
        tabIndex={tabIndex}
        type={type}
        inputMode={inputMode}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        aria-invalid={ariaInvalid || undefined}
        aria-describedby={ariaDescribedBy}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        minLength={minLength}
        placeholder={placeholder}
        className={`w-full min-h-12 pl-10 py-3 bg-transparent text-[14px] font-medium text-navy placeholder-slate-400 focus:outline-none rounded-xl ${rightSlot ? 'pr-12' : 'pr-4'} ${inputClassName}`}
      />
      {rightSlot}
    </div>
  );
};
