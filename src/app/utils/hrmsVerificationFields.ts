import type { FormField } from '../types';

export const HRMS_STAFF_ID_FIELD_ID = 'hrms-staff-id';

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
      width: 'full',
      hrmsSource: 'staff_id',
      helpText: 'Your staff ID — details load automatically from records.',
    },
  ];
}

export function ensureStaffVerificationFields(fields: FormField[]): FormField[] {
  const withoutEmployeeInfo = fields.filter((field) => {
    if (field.type === 'employee_info') return false;
    if (normLabel(field.label) === 'employee details') return false;
    if (field.type === 'section_title' && normLabel(field.label) === 'employee information') return false;
    if (field.hrmsSource === 'staff_id' || field.hrmsSource === 'phone') return false;
    if (field.id === HRMS_STAFF_ID_FIELD_ID || field.id === 'hrms-staff-phone') return false;
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

export function isStaffVerificationField(field: FormField): boolean {
  return field.hrmsSource === 'staff_id'
    || field.id === HRMS_STAFF_ID_FIELD_ID;
}
