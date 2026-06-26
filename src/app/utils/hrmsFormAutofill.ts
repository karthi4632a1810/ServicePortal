import type { Employee, FormField, FieldOption } from '../types';
import { getEffectiveHrmsSource } from './hrmsFormFields';

export type AutofillMasterOptions = {
  departments?: FieldOption[];
  designations?: FieldOption[];
};

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function findOptionIdByName(options: FieldOption[], name: string): string | undefined {
  if (!name?.trim() || !options?.length) return undefined;
  const n = normalizeName(name);
  const exact = options.find((o) => normalizeName(o.label) === n);
  if (exact) return exact.value;
  const partial = options.find(
    (o) => normalizeName(o.label).includes(n) || n.includes(normalizeName(o.label)),
  );
  return partial?.value;
}

function normLabel(label: string): string {
  return label.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
}

function formatDateForInput(value: unknown): string {
  if (!value) return '';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().slice(0, 10);
}

function mapToOption(value: string, field: FormField): string {
  const raw = value.trim();
  if (!field.options?.length) return raw;

  const lower = raw.toLowerCase();
  const exact = field.options.find(
    (o) => o.value.toLowerCase() === lower || o.label.toLowerCase() === lower,
  );
  if (exact) return exact.value;

  const aliases: Record<string, string> = {
    male: 'male',
    female: 'female',
    unmarried: 'single',
    single: 'single',
    married: 'married',
    divorced: 'divorced',
    widowed: 'widowed',
  };

  const mapped = aliases[lower];
  if (mapped) {
    const match = field.options.find((o) => o.value === mapped || o.label.toLowerCase() === mapped);
    if (match) return match.value;
  }

  return raw;
}

function valueForLabel(label: string, emp: Employee): unknown {
  switch (label) {
    case 'employee no':
    case 'emp id':
    case 'employee id':
      return emp.id;
    case 'name':
    case 'employee name':
      return emp.name;
    case 'first name':
      return emp.firstName || emp.name?.split(' ')[0] || '';
    case 'last name':
      return emp.lastName || '';
    case 'department':
      return emp.departmentId || emp.department;
    case 'designation':
      return emp.designationId || emp.designation;
    case 'gender':
      return emp.gender;
    case 'dob':
    case 'dob date of birth':
      return emp.dob;
    case 'doj':
    case 'doj date of joining':
    case 'date of joining':
      return emp.joinedDate;
    case 'qualification':
      return emp.qualification;
    case 'marital status':
      return emp.maritalStatus;
    case 'address':
      return emp.address;
    case 'pincode':
      return emp.pincode;
    case 'mobile no':
      return emp.mobile;
    case 'email':
    case 'e-mail id':
      return emp.email;
    case 'father name':
      return emp.fatherName;
    case 'pan no':
      return emp.panNo;
    case 'job type':
      return emp.jobType;
    default:
      return undefined;
  }
}

const SKIPPED_TYPES = new Set([
  'section_title',
  'divider',
  'employee_info',
  'file',
  'hidden',
  'signature',
]);

export function buildFormAutofill(
  employee: Employee,
  fields: FormField[],
  masterOptions?: AutofillMasterOptions,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const field of fields) {
    if (SKIPPED_TYPES.has(field.type)) continue;
    if (getEffectiveHrmsSource(field) === 'staff_id') continue;

    let value: unknown;

    if (getEffectiveHrmsSource(field) === 'department') {
      value = employee.departmentId
        || findOptionIdByName(masterOptions?.departments ?? [], employee.department ?? '');
    } else if (getEffectiveHrmsSource(field) === 'designation') {
      value = employee.designationId
        || findOptionIdByName(masterOptions?.designations ?? [], employee.designation ?? '');
    } else if (getEffectiveHrmsSource(field) === 'phone') {
      value = employee.mobile;
    } else {
      const label = normLabel(field.label);
      value = valueForLabel(label, employee);
    }

    if (value === undefined || value === null || String(value).trim() === '') continue;

    if (field.type === 'date') {
      value = formatDateForInput(value);
    } else if (field.type === 'dropdown' || field.type === 'radio') {
      if (getEffectiveHrmsSource(field)) {
        value = String(value);
      } else {
        value = mapToOption(String(value), field);
      }
    } else if (field.type === 'phone') {
      value = String(value).replace(/\D/g, '').slice(-10);
    } else {
      value = String(value);
    }

    result[field.id] = value;
  }

  return result;
}

export function normalizePhoneInput(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}
