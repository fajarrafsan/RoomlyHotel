import React, { useId } from 'react';
import { LoaderCircle } from 'lucide-react';
import { OperationsDialog } from './OperationsDialog';
import { OperationsNotice, operationField, operationPrimary, operationSecondary } from './OperationsPage';

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
}) => {
  const formId = useId();
  return (
    <OperationsDialog title={title} description={subtitle} isID={isID} busy={submitting} size="form" onClose={onClose}
      footer={<div className="space-y-2">
        {error && <div className="max-h-24 overflow-y-auto"><OperationsNotice>{error}</OperationsNotice></div>}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={onClose} disabled={submitting} className={operationSecondary}>
            {isID ? 'Batal' : 'Cancel'}
          </button>
          <button type="submit" form={formId} disabled={submitting} className={operationPrimary}>
            {submitting && <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />}
            {submitLabel}
          </button>
        </div>
      </div>}>
      <form id={formId} onSubmit={onSubmit}>
        <fieldset disabled={submitting} className="min-w-0 space-y-4">{children}</fieldset>
      </form>
    </OperationsDialog>
  );
};

const FIELD_CLASS = operationField + ' focus-visible:outline-2 focus-visible:outline-navy focus-visible:outline-offset-1';

interface FieldLabelProps {
  label: string;
  required?: boolean;
  hint?: string;
}

interface FieldProps extends FieldLabelProps {
  id?: string;
  describedBy?: string;
  children: (binding: { id: string; 'aria-describedby'?: string }) => React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ id, describedBy, label, required, hint, children }) => {
  const generated = useId();
  const fieldId = id ?? generated;
  const hintId = hint ? generated + '-hint' : undefined;
  const description = [describedBy, hintId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="min-w-0">
      <label htmlFor={fieldId} className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}{required && <span aria-hidden className="ml-0.5 text-rose-700">*</span>}
      </label>
      {children({ id: fieldId, 'aria-describedby': description })}
      {hint && <p id={hintId} className="mt-1 break-words text-xs text-slate-600">{hint}</p>}
    </div>
  );
};

export const TextField: React.FC<
  FieldLabelProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'>
> = ({ label, required, hint, id, 'aria-describedby': describedBy, ...inputProps }) => (
  <Field label={label} required={required} hint={hint} id={id} describedBy={describedBy}>
    {binding => <input {...inputProps} {...binding} required={required} className={FIELD_CLASS} />}
  </Field>
);

export const TextAreaField: React.FC<
  FieldLabelProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>
> = ({ label, required, hint, id, 'aria-describedby': describedBy, ...props }) => (
  <Field label={label} required={required} hint={hint} id={id} describedBy={describedBy}>
    {binding => <textarea {...props} {...binding} required={required} className={`${FIELD_CLASS} resize-none`} />}
  </Field>
);

export const SelectField: React.FC<
  FieldLabelProps
  & { options: { value: string; label: string }[] }
  & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'children'>
> = ({ label, required, hint, options, id, 'aria-describedby': describedBy, ...props }) => (
  <Field label={label} required={required} hint={hint} id={id} describedBy={describedBy}>
    {binding => <select {...props} {...binding} required={required} className={FIELD_CLASS}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>}
  </Field>
);
