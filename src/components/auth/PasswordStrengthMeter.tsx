import React from 'react';
import { motion } from 'motion/react';
import { easeSmooth } from '../../lib/motion';

interface PasswordStrengthMeterProps {
  password: string;
  isID: boolean;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password, isID }) => {
  const strength = password.length >= 12 ? 'strong' : password.length >= 8 ? 'medium' : 'weak';
  const label =
    strength === 'strong'
      ? (isID ? 'Kuat' : 'Strong')
      : strength === 'medium'
        ? (isID ? 'Sedang' : 'Medium')
        : (isID ? 'Lemah' : 'Weak');

  return (
    <div className="mt-2 flex items-center gap-2" aria-live="polite">
      <div className="flex-1 h-1.5 rounded-full bg-navy-soft overflow-hidden" aria-hidden>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: strength === 'strong' ? 1 : strength === 'medium' ? 0.66 : 0.33 }}
          transition={{ duration: 0.3, ease: easeSmooth }}
          className={`h-full w-full origin-left rounded-full ${
            strength === 'strong' ? 'bg-emerald-600' : strength === 'medium' ? 'bg-gold' : 'bg-rose-500'
          }`}
        />
      </div>
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
    </div>
  );
};
