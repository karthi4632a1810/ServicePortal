import type { FormField } from '../types';

export const HRMS_STAFF_ID_FIELD_ID = 'hrms-staff-id';
export const HRMS_STAFF_PHONE_FIELD_ID = 'hrms-staff-phone';

function normLabel(label: string): string {
  return label.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
}

export function isStaffIdLabel(label: string): boolean {
  const l = normLabel(label);
  return [
    'staff id',
    'employee id',
    'employee no',
    'emp id',
    'emp id no',
    'employee number',
  ].includes(l) || l.startsWith('emp id');
}

export function isVerificationPhoneLabel(label: string): boolean {
  const l = normLabel(label);
  if (l.includes('cug')) return false;
  return ['mobile no', 'mobile', 'phone', 'phone number', 'mobile number'].includes(l);
}

export function createStaffVerificationFields(): FormField[] {
  return [
    {
      id: HRMS_STAFF_ID_FIELD_ID,
      type: 'text',
      label: 'Staff ID',
      required: true,
      placeholder: 'e.g. 60464',
      width: 'half',
      hrmsSource: 'staff_id',
      helpText: 'Enter your HRMS staff ID to load your details.',
    },
    {
      id: HRMS_STAFF_PHONE_FIELD_ID,
      type: 'phone',
      label: 'Phone',
      required: true,
      placeholder: 'e.g. 9876543210',
      width: 'half',
      hrmsSource: 'phone',
      helpText: 'Registered mobile number must match HRMS records.',
    },
  ];
}

export function ensureStaffVerificationFields(fields: FormField[]): FormField[] {
  const withoutEmployeeInfo = fields.filter((field) => {
    if (field.type === 'employee_info') return false;
    if (normLabel(field.label) === 'employee details') return false;
    if (field.hrmsSource === 'staff_id' || field.hrmsSource === 'phone') return false;
    if (field.id === HRMS_STAFF_ID_FIELD_ID || field.id === HRMS_STAFF_PHONE_FIELD_ID) return false;
    if (isStaffIdLabel(field.label)) return false;
    if (isVerificationPhoneLabel(field.label)) return false;
    return true;
  });

  return [...createStaffVerificationFields(), ...withoutEmployeeInfo];
}

export function getStaffIdFromAnswers(fields: FormField[], answers: Record<string, unknown>): string {
  const field = fields.find((f) => f.hrmsSource === 'staff_id' || f.id === HRMS_STAFF_ID_FIELD_ID);
  return field ? String(answers[field.id] ?? '').trim() : '';
}

export function getPhoneFromAnswers(fields: FormField[], answers: Record<string, unknown>): string {
  const field = fields.find((f) => f.hrmsSource === 'phone' || f.id === HRMS_STAFF_PHONE_FIELD_ID);
  return field ? String(answers[field.id] ?? '').trim() : '';
}

export function isStaffVerificationField(field: FormField): boolean {
  return field.hrmsSource === 'staff_id'
    || field.hrmsSource === 'phone'
    || field.id === HRMS_STAFF_ID_FIELD_ID
    || field.id === HRMS_STAFF_PHONE_FIELD_ID;
}
