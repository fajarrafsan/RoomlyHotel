import React from 'react';
import { motion } from 'motion/react';
import { X, Loader2, AlertCircle } from 'lucide-react';

interface AdminFormModalProps {
  title: string;
  subtitle?: string;
  isID: boolean;
  submitting: boolean;
  error?: string | null;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}

export const AdminFormModal: React.FC<AdminFormModalProps> = ({
  title, subtitle, isID, submitting, error, submitLabel, onClose, onSubmit, children,
}) => (
  <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/40 backdrop-blur-sm p-4 sm:p-8">
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-full max-w-2xl bg-white rounded-3xl border border-slate-100 shadow-2xl my-auto"
    >
      <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-400 font-light mt-0.5 font-mono">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="p-6 space-y-5">
        {children}

        {error && (
          <p className="text-[12px] text-rose-600 font-medium flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-semibold transition-all cursor-pointer"
          >
            {isID ? 'Batal' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </form>
    </motion.div>
  </div>
);

const FIELD_CLASS =
  'w-full p-2.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-900 transition-colors';

interface FieldLabelProps {
  label: string;
  required?: boolean;
  hint?: string;
}

interface FieldProps extends FieldLabelProps {
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, required, hint, children }) => (
  <label className="block">
    <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </span>
    {children}
    {hint && <span className="text-[10px] text-slate-400 font-light block mt-1">{hint}</span>}
  </label>
);

export const TextField: React.FC<
  FieldLabelProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'>
> = ({ label, required, hint, ...inputProps }) => (
  <Field label={label} required={required} hint={hint}>
    <input {...inputProps} required={required} className={FIELD_CLASS} />
  </Field>
);

export const TextAreaField: React.FC<
  FieldLabelProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>
> = ({ label, required, hint, ...props }) => (
  <Field label={label} required={required} hint={hint}>
    <textarea {...props} required={required} className={`${FIELD_CLASS} resize-none`} />
  </Field>
);

export const SelectField: React.FC<
  FieldLabelProps
  & { options: { value: string; label: string }[] }
  & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'children'>
> = ({ label, required, hint, options, ...props }) => (
  <Field label={label} required={required} hint={hint}>
    <select {...props} required={required} className={FIELD_CLASS}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </Field>
);
