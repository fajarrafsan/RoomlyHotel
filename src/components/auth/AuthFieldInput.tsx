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
  inputClassName = '',
  rightSlot,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className={`relative rounded-xl border transition-all duration-200 ${focused ? 'border-slate-900 ring-1 ring-slate-900/5' : 'border-slate-200 hover:border-slate-300'}`}>
      <Icon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        required
        type={type}
        inputMode={inputMode}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        minLength={minLength}
        placeholder={placeholder}
        className={`w-full pl-10 py-3 bg-transparent text-[13px] font-medium text-slate-900 placeholder-slate-300 focus:outline-none rounded-xl ${rightSlot ? 'pr-10' : 'pr-4'} ${inputClassName}`}
      />
      {rightSlot}
    </div>
  );
};
