import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams, useLocation } from 'react-router';
import {
  ChevronLeft, Send, CheckCircle, Clock, Info, Upload,
  Building2, AlertCircle,
} from 'lucide-react';
import { LottiePlayer } from '../components/animations/LottiePlayer';
import { RippleButton } from '../components/animations/RippleButton';
import { FloatingParticles } from '../components/animations/FloatingOrbs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { cn } from '../components/ui/utils';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { getEmployeeProfile, saveEmployeeProfile } from '../utils/employeeAutofillDb';
import { buildFormAutofill, normalizePhoneInput } from '../utils/hrmsFormAutofill';
import { getEffectiveHrmsSource, normalizeFormFields } from '../utils/hrmsFormFields';
import {
  ensureStaffVerificationFields,
  getPhoneFromAnswers,
  getStaffIdFromAnswers,
} from '../utils/hrmsVerificationFields';
import type { FormField, FormSchema, FieldOption } from '../types';

function FormFieldRenderer({ field, value, onChange, hrmsDepartments, hrmsDesignations, selectedDepartmentId, hrmsFound }: {
  field: FormField;
  value: unknown;
  onChange: (val: unknown) => void;
  hrmsDepartments: FieldOption[];
  hrmsDesignations: FieldOption[];
  selectedDepartmentId: string;
  hrmsFound?: boolean | null;
}) {
  const hrmsSource = getEffectiveHrmsSource(field);
  const isVerificationField = hrmsSource === 'staff_id' || hrmsSource === 'phone';
  const isVerified = isVerificationField && hrmsFound === true;
  const inputClass = cn(
    'w-full h-10 px-3 rounded-lg border bg-input-background text-foreground placeholder:text-muted-foreground transition-all',
    isVerified
      ? 'border-emerald-500 outline outline-1 outline-emerald-500 focus:border-emerald-500'
      : 'border-border outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
  );
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

  const widthClass = field.width === 'full' || !field.width ? 'col-span-full' : '';
  const dropdownOptions = getEffectiveHrmsSource(field) === 'department'
    ? hrmsDepartments
    : getEffectiveHrmsSource(field) === 'designation'
      ? hrmsDesignations
      : (field.options ?? []);
  const designationDisabled = getEffectiveHrmsSource(field) === 'designation' && !selectedDepartmentId;

  return (
    <div className={widthClass}>
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
          className={inputClass}
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
          className={inputClass}
          style={{ fontSize: '13px' }}
        />
      ) : field.type === 'dropdown' ? (
        <select
          value={value as string ?? ''}
          onChange={e => onChange(e.target.value)}
          disabled={designationDisabled}
          className={cn(inputClass, 'cursor-pointer', designationDisabled && 'opacity-60 cursor-not-allowed')}
          style={{ fontSize: '13px' }}
        >
          <option value="">
            {getEffectiveHrmsSource(field) === 'designation' && !selectedDepartmentId
              ? 'Select department first'
              : field.placeholder ?? 'Select an option'}
          </option>
          {dropdownOptions.map(opt => (
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
  const { selectedForm, navigate, submitRequest, pageParams, currentUser, forms, setSelectedForm, fetchEmployee } = useApp();
  const routerNavigate = useNavigate();
  const { formId } = useParams();
  const location = useLocation();
  const isPublicForm = location.pathname.startsWith('/forms/');

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedRequestNumber, setSubmittedRequestNumber] = useState('');
  const [hrmsLoading, setHrmsLoading] = useState(false);
  const [hrmsFound, setHrmsFound] = useState<boolean | null>(null);
  const [hrmsError, setHrmsError] = useState<string | null>(null);
  const [hrmsDepartments, setHrmsDepartments] = useState<FieldOption[]>([]);
  const [hrmsDesignations, setHrmsDesignations] = useState<FieldOption[]>([]);

  const form: FormSchema | null = isPublicForm
    ? forms.find(f => f.id === formId) ?? null
    : selectedForm;

  const normalizedFields = useMemo(
    () => (form ? ensureStaffVerificationFields(normalizeFormFields(form.fields)) : []),
    [form],
  );

  const staffId = getStaffIdFromAnswers(normalizedFields, formData);
  const phone = getPhoneFromAnswers(normalizedFields, formData);

  useEffect(() => {
    if (isPublicForm && form) {
      setSelectedForm(form);
    }
  }, [isPublicForm, form, setSelectedForm]);

  useEffect(() => {
    let active = true;
    getEmployeeProfile().then(profile => {
      if (!active || !profile) return;
      const staffField = normalizedFields.find(f => getEffectiveHrmsSource(f) === 'staff_id');
      const phoneField = normalizedFields.find(f => getEffectiveHrmsSource(f) === 'phone');
      setFormData(prev => ({
        ...prev,
        ...(staffField ? { [staffField.id]: profile.employeeId } : {}),
        ...(phoneField ? { [phoneField.id]: profile.phone } : {}),
      }));
    });
    return () => { active = false; };
  }, [normalizedFields]);

  useEffect(() => {
    const id = staffId;
    const ph = normalizePhoneInput(phone);

    if (!id || ph.length < 10) {
      setHrmsFound(null);
      setHrmsError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setHrmsLoading(true);
      setHrmsError(null);
      try {
        const emp = await fetchEmployee(id, phone);
        if (!emp) {
          setHrmsFound(false);
          setHrmsError('Employee not found in HRMS');
          return;
        }
        setHrmsFound(true);
        const autofill = buildFormAutofill(emp, normalizedFields);
        setFormData(prev => ({ ...prev, ...autofill }));
      } catch (err) {
        setHrmsFound(false);
        setHrmsError(err instanceof Error ? err.message : 'HRMS verification failed');
      } finally {
        setHrmsLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [staffId, phone, fetchEmployee, normalizedFields]);

  const departmentFieldId = normalizedFields.find(f => getEffectiveHrmsSource(f) === 'department')?.id;
  const selectedDepartmentId = departmentFieldId ? String(formData[departmentFieldId] ?? '') : '';

  useEffect(() => {
    api.getDepartments()
      .then(res => setHrmsDepartments(res.data.map(d => ({ label: d.name, value: String(d.id) }))))
      .catch(() => setHrmsDepartments([]));
  }, []);

  useEffect(() => {
    if (!selectedDepartmentId) {
      setHrmsDesignations([]);
      return;
    }
    api.getDesignations(selectedDepartmentId)
      .then(res => setHrmsDesignations(res.data.map(d => ({ label: d.name, value: String(d.id) }))))
      .catch(() => setHrmsDesignations([]));
  }, [selectedDepartmentId]);

  if (!form) {
    if (isPublicForm) {
      routerNavigate('/', { replace: true });
    } else {
      navigate('service-catalog');
    }
    return null;
  }

  const goBack = () => {
    if (isPublicForm) {
      routerNavigate('/');
    } else {
      navigate('service-catalog');
    }
  };

  const handleFieldChange = (fieldId: string, value: unknown) => {
    const changedField = normalizedFields.find(f => f.id === fieldId);
    setFormData(prev => {
      const next = { ...prev, [fieldId]: value };
      if (getEffectiveHrmsSource(changedField!) === 'department') {
        normalizedFields
          .filter(f => getEffectiveHrmsSource(f) === 'designation')
          .forEach(f => { next[f.id] = ''; });
      }
      return next;
    });
    if (errors[fieldId]) setErrors(prev => { const n = { ...prev }; delete n[fieldId]; return n; });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!staffId) errs._hrms = 'Staff ID is required';
    if (!phone) errs._hrms = 'Phone number is required';
    if (normalizePhoneInput(phone).length < 10) errs._hrms = 'Enter a valid 10-digit phone number';
    if (hrmsFound !== true) errs._hrms = hrmsError || 'Verify your Staff ID and phone number against HRMS before submitting';
    normalizedFields.forEach(f => {
      if (getEffectiveHrmsSource(f) === 'staff_id' || getEffectiveHrmsSource(f) === 'phone') return;
      if (f.required && ['text', 'textarea', 'number', 'email', 'phone', 'date', 'time', 'dropdown', 'radio'].includes(f.type)) {
        if (!formData[f.id]) errs[f.id] = `${f.label} is required`;
      }
    });
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      await saveEmployeeProfile({ employeeId: staffId, phone });

      const result = await submitRequest({
        employeeId: staffId,
        formId: form.id,
        answers: formData,
        priority: 'medium',
      });
      setSubmittedRequestNumber(result.requestNumber);
      setSubmitted(true);
    } catch {
      setErrors({ _form: 'Failed to submit request. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

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
            Your form has been successfully submitted.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 300 }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary my-5 border border-primary/20"
            style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.02em' }}
          >
            {submittedRequestNumber}
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
            <RippleButton variant="primary" onClick={() => {
              if (isPublicForm) routerNavigate('/login');
              else navigate('my-requests');
            }}>
              {isPublicForm ? 'Sign In to Track' : 'Track Request'}
            </RippleButton>
            <RippleButton
              variant="ghost"
              onClick={() => { setSubmitted(false); setFormData({}); goBack(); }}
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
      className="p-6 w-full space-y-5"
    >
      {/* Back */}
      <button
        onClick={goBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        style={{ fontSize: '13px' }}
      >
        <ChevronLeft className="size-4" />
        {isPublicForm ? 'Back to Home' : 'Back to Form Catalog'}
      </button>

      {/* Form Header */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="size-5 text-primary" />
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
            {normalizedFields.map((field) => (
              <FormFieldRenderer
                key={field.id}
                field={field}
                value={formData[field.id]}
                onChange={(val) => handleFieldChange(field.id, val)}
                hrmsDepartments={hrmsDepartments}
                hrmsDesignations={hrmsDesignations}
                selectedDepartmentId={selectedDepartmentId}
                hrmsFound={hrmsFound}
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
          <RippleButton variant="ghost" onClick={goBack}>
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
