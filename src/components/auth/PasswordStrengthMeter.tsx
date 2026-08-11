import React from 'react';
import { motion } from 'motion/react';

interface PasswordStrengthMeterProps {
  password: string;
  isID: boolean;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password, isID }) => {
  const strength = password.length >= 12 ? 'strong' : password.length >= 8 ? 'medium' : 'weak';

  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: strength === 'strong' ? '100%' : strength === 'medium' ? '66%' : '33%' }}
          className={`h-full rounded-full ${strength === 'strong' ? 'bg-emerald-500' : strength === 'medium' ? 'bg-amber-400' : 'bg-rose-400'}`}
        />
      </div>
      <span className="text-[10px] font-medium text-slate-400">
        {strength === 'strong' ? (isID ? 'Kuat' : 'Strong') : strength === 'medium' ? (isID ? 'Sedang' : 'Medium') : (isID ? 'Lemah' : 'Weak')}
      </span>
    </motion.div>
  );
};
