import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, Send, CheckCircle, Clock, Info, Upload,
  User, Building2, Mail, Phone, MapPin, Briefcase, AlertCircle,
} from 'lucide-react';
import { LottiePlayer } from '../components/animations/LottiePlayer';
import { RippleButton } from '../components/animations/RippleButton';
import { FloatingParticles } from '../components/animations/FloatingOrbs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { cn } from '../components/ui/utils';
import { useApp } from '../context/AppContext';
import { MOCK_EMPLOYEES } from '../data/mockData';
import type { FormField, FormSchema } from '../types';

function EmployeeInfoPanel() {
  const emp = MOCK_EMPLOYEES[0];
  return (
    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
      <div className="flex items-center gap-3 mb-3">
        <div className="size-10 rounded-full bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold" style={{ fontSize: '13px' }}>{emp.avatar}</span>
        </div>
        <div>
          <p className="text-foreground" style={{ fontSize: '13px', fontWeight: 600 }}>{emp.name}</p>
          <p className="text-muted-foreground" style={{ fontSize: '11px' }}>{emp.id}</p>
        </div>
        <div className="ml-auto px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
          style={{ fontSize: '10px', fontWeight: 600 }}>ACTIVE</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: Building2, label: emp.department },
          { icon: Briefcase, label: emp.designation },
          { icon: Mail, label: emp.email },
          { icon: Phone, label: emp.mobile },
          { icon: MapPin, label: emp.branch },
          { icon: User, label: `HOD: ${emp.hod}` },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-muted-foreground" style={{ fontSize: '11px' }}>
            <Icon className="size-3 shrink-0" />
            <span className="truncate">{label}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-muted-foreground flex items-center gap-1" style={{ fontSize: '10px' }}>
        <Info className="size-3" /> Employee details are auto-filled from HRMS and cannot be edited.
      </p>
    </div>
  );
}

function FormFieldRenderer({ field, value, onChange }: {
  field: FormField;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const baseInput = "w-full h-10 px-3 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
  const baseTextarea = "w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none";

  if (field.type === 'section_title') {
    return (
      <div className="col-span-full pt-2">
        <h3 className="text-foreground border-b border-border pb-2" style={{ fontSize: '14px', fontWeight: 600 }}>{field.label}</h3>
      </div>
    );
  }

  if (field.type === 'divider') {
    return <div className="col-span-full border-t border-border" />;
  }

  if (field.type === 'employee_info') {
    return <div className="col-span-full"><EmployeeInfoPanel /></div>;
  }

  const widthClass = field.width === 'half' ? '' : field.width === 'third' ? '' : 'col-span-full';

  return (
    <div className={cn(field.width === 'full' || !field.width ? 'col-span-full' : '')}>
      <label className="block mb-1.5 text-foreground" style={{ fontSize: '12px', fontWeight: 500 }}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </label>

      {field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'number' ? (
        <input
          type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
          value={value as string ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseInput}
          style={{ fontSize: '13px' }}
        />
      ) : field.type === 'textarea' ? (
        <textarea
          value={value as string ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={baseTextarea}
          style={{ fontSize: '13px' }}
        />
      ) : field.type === 'date' || field.type === 'time' ? (
        <input
          type={field.type}
          value={value as string ?? ''}
          onChange={e => onChange(e.target.value)}
          className={baseInput}
          style={{ fontSize: '13px' }}
        />
      ) : field.type === 'dropdown' ? (
        <select
          value={value as string ?? ''}
          onChange={e => onChange(e.target.value)}
          className={cn(baseInput, 'cursor-pointer')}
          style={{ fontSize: '13px' }}
        >
          <option value="">{field.placeholder ?? 'Select an option'}</option>
          {field.options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : field.type === 'radio' ? (
        <div className="flex flex-wrap gap-3">
          {field.options?.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={field.id}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="accent-primary"
              />
              <span className="text-foreground" style={{ fontSize: '13px' }}>{opt.label}</span>
            </label>
          ))}
        </div>
      ) : field.type === 'checkbox' ? (
        <div className="flex flex-wrap gap-3">
          {field.options?.map(opt => {
            const vals = (value as string[] | undefined) ?? [];
            return (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vals.includes(opt.value)}
                  onChange={e => {
                    const next = e.target.checked ? [...vals, opt.value] : vals.filter(v => v !== opt.value);
                    onChange(next);
                  }}
                  className="accent-primary"
                />
                <span className="text-foreground" style={{ fontSize: '13px' }}>{opt.label}</span>
              </label>
            );
          })}
        </div>
      ) : field.type === 'multiselect' ? (
        <div className="flex flex-wrap gap-2">
          {field.options?.map(opt => {
            const vals = (value as string[] | undefined) ?? [];
            const selected = vals.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  const next = selected ? vals.filter(v => v !== opt.value) : [...vals, opt.value];
                  onChange(next);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-lg border transition-all',
                  selected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:border-primary/50'
                )}
                style={{ fontSize: '12px' }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      ) : field.type === 'file' ? (
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
          <Upload className="size-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
            Drop files here or <span className="text-primary">browse</span>
          </p>
          <p className="text-muted-foreground" style={{ fontSize: '10px' }}>PDF, JPG, PNG up to 10MB</p>
        </div>
      ) : null}

      {field.helpText && (
        <p className="mt-1.5 text-muted-foreground flex items-start gap-1" style={{ fontSize: '11px' }}>
          <Info className="size-3 mt-0.5 shrink-0" />
          {field.helpText}
        </p>
      )}
    </div>
  );
}

export function DynamicFormPage() {
  const { selectedForm, navigate, requests, setRequests } = useApp();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!selectedForm) {
    navigate('service-catalog');
    return null;
  }

  const form: FormSchema = selectedForm;

  const handleFieldChange = (fieldId: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) setErrors(prev => { const n = { ...prev }; delete n[fieldId]; return n; });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    form.fields.forEach(f => {
      if (f.required && ['text', 'textarea', 'number', 'email', 'phone', 'date', 'time', 'dropdown', 'radio'].includes(f.type)) {
        if (!formData[f.id]) errs[f.id] = `${f.label} is required`;
      }
    });
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1200);
  };

  const reqNum = React.useRef(`REQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`);

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 flex items-center justify-center min-h-[60vh] relative overflow-hidden"
      >
        <FloatingParticles count={30} color="#10b981" />
        <div className="text-center max-w-md relative z-10">
          {/* Lottie success animation */}
          <div className="flex justify-center mb-4">
            <LottiePlayer animation="success" size={110} loop={false} />
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-foreground mb-2"
            style={{ fontSize: '24px', fontWeight: 700 }}
          >
            Request Submitted!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-muted-foreground mb-1"
            style={{ fontSize: '14px' }}
          >
            Your service request has been successfully submitted.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 300 }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary my-5 border border-primary/20"
            style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.02em' }}
          >
            {reqNum.current}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-muted-foreground mb-8"
            style={{ fontSize: '12px' }}
          >
            Estimated SLA: <strong className="text-foreground">{form.estimatedTime}</strong>. You will receive
            email notifications at each approval stage.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex gap-3 justify-center"
          >
            <RippleButton variant="primary" onClick={() => navigate('my-requests')}>
              Track Request
            </RippleButton>
            <RippleButton
              variant="ghost"
              onClick={() => { setSubmitted(false); setFormData({}); navigate('service-catalog'); }}
            >
              New Request
            </RippleButton>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-[800px] space-y-5"
    >
      {/* Back */}
      <button
        onClick={() => navigate('service-catalog')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        style={{ fontSize: '13px' }}
      >
        <ChevronLeft className="size-4" />
        Back to Service Catalog
      </button>

      {/* Form Header */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <User className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-foreground" style={{ fontSize: '18px', fontWeight: 600 }}>{form.title}</h1>
              <p className="text-muted-foreground" style={{ fontSize: '13px' }}>{form.description}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-muted-foreground flex items-center gap-1" style={{ fontSize: '11px' }}>
                  <Clock className="size-3" /> {form.estimatedTime}
                </span>
                <span className="text-muted-foreground flex items-center gap-1" style={{ fontSize: '11px' }}>
                  <Building2 className="size-3" /> {form.department}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation errors */}
      <AnimatePresence>
        {Object.keys(errors).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30"
          >
            <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-destructive" style={{ fontSize: '13px', fontWeight: 500 }}>Please fix the following errors:</p>
              <ul className="mt-1 space-y-0.5">
                {Object.values(errors).map((err, i) => (
                  <li key={i} className="text-destructive" style={{ fontSize: '12px' }}>• {err}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Fields */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            {form.fields.map((field) => (
              <FormFieldRenderer
                key={field.id}
                field={field}
                value={formData[field.id]}
                onChange={(val) => handleFieldChange(field.id, val)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground flex items-center gap-1" style={{ fontSize: '11px' }}>
          <Info className="size-3" />
          By submitting, you confirm the above information is accurate.
        </p>
        <div className="flex gap-3">
          <RippleButton variant="ghost" onClick={() => navigate('service-catalog')}>
            Cancel
          </RippleButton>
          <RippleButton
            variant="primary"
            loading={submitting}
            onClick={handleSubmit}
            icon={<Send className="size-4" />}
          >
            Submit Request
          </RippleButton>
        </div>
      </div>
    </motion.div>
  );
}
