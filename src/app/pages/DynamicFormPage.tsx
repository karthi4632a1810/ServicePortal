import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams, useLocation } from 'react-router';
import {
  ChevronLeft, Send, CheckCircle, Clock, Info, Upload,
  Building2, AlertCircle, Loader2, X, FileText,
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
import { buildDefaultDateFormValues } from '../utils/formDateFields';
import {
  ensureStaffVerificationFields,
  getStaffIdFromAnswers,
} from '../utils/hrmsVerificationFields';
import { sanitizeUserFacingText } from '../utils/userFacingText';
import {
  formatUploadBatchKey,
  formatUploadSize,
  isAllowedUploadFile,
  MAX_UPLOAD_BYTES,
} from '../utils/uploadPaths';
import type { FormField, FormSchema, FieldOption, Employee, Attachment } from '../types';

function FormFieldRenderer({ field, value, onChange, hrmsDepartments, hrmsDesignations, selectedDepartmentId, hrmsFound, readOnly, pendingFiles, onFilesChange }: {
  field: FormField;
  value: unknown;
  onChange: (val: unknown) => void;
  hrmsDepartments: FieldOption[];
  hrmsDesignations: FieldOption[];
  selectedDepartmentId: string;
  hrmsFound?: boolean | null;
  readOnly?: boolean;
  pendingFiles?: File[];
  onFilesChange?: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const hrmsSource = getEffectiveHrmsSource(field);
  const isVerificationField = hrmsSource === 'staff_id';
  const isVerified = isVerificationField && hrmsFound === true;
  const isReadOnly = readOnly || isVerificationField;

  const addFiles = (incoming: FileList | File[] | null) => {
    if (!onFilesChange || !incoming?.length) return;
    const next = [...(pendingFiles || [])];
    for (const file of Array.from(incoming)) {
      if (!isAllowedUploadFile(file)) continue;
      next.push(file);
    }
    onFilesChange(next);
  };

  const removeFile = (index: number) => {
    if (!onFilesChange) return;
    onFilesChange((pendingFiles || []).filter((_, i) => i !== index));
  };

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

  const widthClass = field.width === 'full' || !field.width ? 'col-span-full' : 'col-span-full sm:col-span-1';
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
          readOnly={isReadOnly}
          className={cn(inputClass, isReadOnly && 'bg-muted/50 cursor-default')}
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
        <div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addFiles(e.dataTransfer.files);
            }}
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
              dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
            )}
          >
            <Upload className="size-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
              Drop files here or <span className="text-primary">browse</span>
            </p>
            <p className="text-muted-foreground" style={{ fontSize: '10px' }}>PDF, JPG, PNG up to 10MB</p>
          </div>
          {(pendingFiles?.length ?? 0) > 0 && (
            <ul className="mt-3 space-y-2">
              {pendingFiles!.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30"
                >
                  <FileText className="size-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-foreground truncate" style={{ fontSize: '12px' }}>{file.name}</p>
                    <p className="text-muted-foreground" style={{ fontSize: '10px' }}>{formatUploadSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
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
  const { selectedForm, navigate, submitRequest, pageParams, currentUser, forms, setSelectedForm, fetchEmployee, isEmployeeSession, loading: appLoading } = useApp();
  const routerNavigate = useNavigate();
  const { formId } = useParams();
  const location = useLocation();
  const isPublicForm = location.pathname.startsWith('/forms/');

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedRequestNumber, setSubmittedRequestNumber] = useState('');
  const [hrmsEmployee, setHrmsEmployee] = useState<Employee | null>(null);
  const [hrmsFound, setHrmsFound] = useState<boolean | null>(null);
  const [hrmsError, setHrmsError] = useState<string | null>(null);
  const [hrmsLoading, setHrmsLoading] = useState(false);
  const [hrmsRefreshing, setHrmsRefreshing] = useState(false);
  const [hrmsDepartments, setHrmsDepartments] = useState<FieldOption[]>([]);
  const [hrmsDesignations, setHrmsDesignations] = useState<FieldOption[]>([]);
  const [pendingFiles, setPendingFiles] = useState<Record<string, File[]>>({});
  const uploadBatchRef = useRef<string | null>(null);

  const form: FormSchema | null = isPublicForm
    ? forms.find(f => f.id === formId) ?? null
    : selectedForm;

  const normalizedFields = useMemo(
    () => (form ? ensureStaffVerificationFields(normalizeFormFields(form.fields)) : []),
    [form],
  );

  const hrmsDepartmentsRef = useRef(hrmsDepartments);
  const hrmsDesignationsRef = useRef(hrmsDesignations);
  hrmsDepartmentsRef.current = hrmsDepartments;
  hrmsDesignationsRef.current = hrmsDesignations;

  const isLiveHrmsEmployee = (emp: Employee) =>
    emp.hrmsSource === 'hrms' || emp.hrmsSource === 'hrms_api';

  const applyAutofill = useCallback((emp: Employee) => {
    setHrmsFound(true);
    setHrmsEmployee(emp);
    const autofill = buildFormAutofill(emp, normalizedFields, {
      departments: hrmsDepartmentsRef.current,
      designations: hrmsDesignationsRef.current,
    });
    setFormData((prev) => ({ ...prev, ...autofill }));
  }, [normalizedFields]);

  const staffId = getStaffIdFromAnswers(normalizedFields, formData);
  const verifyRequestRef = useRef(0);

  const verifyHrmsEmployee = useCallback(async (id: string) => {
    const normalizedId = id.trim();
    if (!normalizedId) {
      setHrmsFound(null);
      setHrmsError(null);
      setHrmsEmployee(null);
      return;
    }

    const requestId = ++verifyRequestRef.current;
    setHrmsLoading(true);
    setHrmsRefreshing(false);
    setHrmsError(null);

    try {
      const emp = await fetchEmployee(normalizedId, undefined, (updated) => {
        if (requestId !== verifyRequestRef.current) return;
        applyAutofill(updated);
        if (isLiveHrmsEmployee(updated)) setHrmsRefreshing(false);
      });
      if (requestId !== verifyRequestRef.current) return;
      if (!emp) {
        setHrmsFound(false);
        setHrmsEmployee(null);
        setHrmsError('Employee not found');
        setHrmsRefreshing(false);
        return;
      }
      applyAutofill(emp);
      setHrmsRefreshing(!isLiveHrmsEmployee(emp));
    } catch (err) {
      if (requestId !== verifyRequestRef.current) return;
      setHrmsFound(false);
      setHrmsEmployee(null);
      setHrmsRefreshing(false);
      setHrmsError(sanitizeUserFacingText(err instanceof Error ? err.message : 'Failed to load employee details'));
    } finally {
      if (requestId === verifyRequestRef.current) setHrmsLoading(false);
    }
  }, [fetchEmployee, applyAutofill]);

  useEffect(() => {
    if (isPublicForm && form) {
      setSelectedForm(form);
    }
  }, [isPublicForm, form, setSelectedForm]);

  useEffect(() => {
    if (isPublicForm && !appLoading && !isEmployeeSession) {
      routerNavigate('/', { replace: true });
    }
  }, [isPublicForm, appLoading, isEmployeeSession, routerNavigate]);

  useEffect(() => {
    setFormData(buildDefaultDateFormValues(normalizedFields));
    setHrmsFound(null);
    setHrmsError(null);
    setHrmsEmployee(null);
    setErrors({});
  }, [form?.id, normalizedFields]);

  useEffect(() => {
    if (!form?.id || !normalizedFields.length) return;

    let active = true;
    (async () => {
      const profile = await getEmployeeProfile();
      if (!active) return;

      const staffField = normalizedFields.find(f => getEffectiveHrmsSource(f) === 'staff_id');
      const nextStaff = (currentUser?.employeeId || profile?.employeeId || '').trim();

      if (!nextStaff) return;

      if (staffField) {
        setFormData(prev => ({ ...prev, [staffField.id]: nextStaff }));
      }

      await verifyHrmsEmployee(nextStaff);
    })();

    return () => { active = false; };
  }, [form?.id, normalizedFields, verifyHrmsEmployee, currentUser?.employeeId]);

  useEffect(() => {
    const id = staffId.trim();
    if (!id || currentUser?.employeeId) return;

    const timer = setTimeout(() => {
      verifyHrmsEmployee(id);
    }, 600);

    return () => clearTimeout(timer);
  }, [staffId, verifyHrmsEmployee, currentUser?.employeeId]);

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

  useEffect(() => {
    if (!hrmsEmployee) return;
    applyAutofill(hrmsEmployee);
  }, [hrmsEmployee, hrmsDepartments, hrmsDesignations, applyAutofill]);

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
    if (hrmsFound !== true) errs._hrms = hrmsError || 'Could not load your details. Check your Staff ID.';
    normalizedFields.forEach(f => {
      if (getEffectiveHrmsSource(f) === 'staff_id') return;
      if (f.type === 'file') {
        if (f.required && !(pendingFiles[f.id]?.length)) {
          errs[f.id] = `${f.label} is required`;
        }
        (pendingFiles[f.id] || []).forEach((file) => {
          if (file.size > MAX_UPLOAD_BYTES) {
            errs[f.id] = `${file.name} exceeds 10MB limit`;
          } else if (!isAllowedUploadFile(file)) {
            errs[f.id] = `${file.name} is not an allowed file type`;
          }
        });
        return;
      }
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
      const hrmsPhone = hrmsEmployee?.mobile ? normalizePhoneInput(hrmsEmployee.mobile) : '';
      await saveEmployeeProfile({ employeeId: staffId, phone: hrmsPhone });

      const batchKey = uploadBatchRef.current || formatUploadBatchKey(staffId);
      uploadBatchRef.current = batchKey;

      const attachments: Attachment[] = [];
      const answers: Record<string, unknown> = { ...formData };

      for (const field of normalizedFields) {
        if (field.type !== 'file') continue;
        const files = pendingFiles[field.id] || [];
        const uploadedNames: string[] = [];
        for (const file of files) {
          const uploadRes = await api.uploadFile(file, {
            formId: form.id,
            staffId,
            batchKey,
            fieldId: field.id,
          });
          attachments.push(uploadRes.data);
          uploadedNames.push(uploadRes.data.name);
        }
        if (uploadedNames.length) {
          answers[field.id] = uploadedNames.join(', ');
        } else {
          delete answers[field.id];
        }
      }

      const result = await submitRequest({
        employeeId: staffId,
        formId: form.id,
        answers,
        priority: 'medium',
        attachments,
      });
      setSubmittedRequestNumber(result.requestNumber);
      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit request. Please try again.';
      setErrors({ _form: message });
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
              if (isPublicForm) routerNavigate('/track');
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
      className="p-4 sm:p-6 w-full space-y-4 sm:space-y-5"
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
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
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
          {(hrmsLoading || hrmsRefreshing) && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15 text-primary">
              <Loader2 className="size-4 animate-spin shrink-0" />
              <p style={{ fontSize: '12px' }}>
                {hrmsLoading ? 'Loading your details…' : 'Fetching full details from HRMS…'}
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
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
                readOnly={Boolean(currentUser?.employeeId && getEffectiveHrmsSource(field) === 'staff_id')}
                pendingFiles={field.type === 'file' ? (pendingFiles[field.id] || []) : undefined}
                onFilesChange={field.type === 'file'
                  ? (files) => setPendingFiles((prev) => ({ ...prev, [field.id]: files }))
                  : undefined}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-muted-foreground flex items-center gap-1 text-center sm:text-left" style={{ fontSize: '11px' }}>
          <Info className="size-3 shrink-0" />
          By submitting, you confirm the above information is accurate.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <RippleButton variant="ghost" onClick={goBack} className="w-full sm:w-auto">
            Cancel
          </RippleButton>
          <RippleButton
            variant="primary"
            loading={submitting}
            onClick={handleSubmit}
            icon={<Send className="size-4" />}
            className="w-full sm:w-auto"
          >
            Submit Request
          </RippleButton>
        </div>
      </div>
    </motion.div>
  );
}
