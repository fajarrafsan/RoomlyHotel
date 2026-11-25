import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';

interface AuthFieldInputProps {
  icon: LucideIcon;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  disabled?: boolean;
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
  maxLength,
  pattern,
  disabled,
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
      className={`relative rounded-xl border bg-slate-50/70 transition-colors duration-200 ${
        ariaInvalid
          ? 'border-rose-400 ring-2 ring-rose-100'
          : focused
            ? 'border-navy/65 ring-[3px] ring-navy/10 bg-white'
            : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <Icon
        className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
          focused ? 'text-navy' : 'text-slate-500'
        }`}
        aria-hidden
      />
      <input
        id={id}
        name={name}
        required={required}
        disabled={disabled}
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
        maxLength={maxLength}
        pattern={pattern}
        placeholder={placeholder}
        className={`w-full min-h-[50px] pl-11 py-3 bg-transparent text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none rounded-xl disabled:cursor-not-allowed disabled:opacity-60 ${rightSlot ? 'pr-12' : 'pr-4'} ${inputClassName}`}
      />
      {rightSlot}
    </div>
  );
};
