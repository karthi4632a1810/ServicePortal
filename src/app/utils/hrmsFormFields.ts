import type { FormField } from '../types';
import { normalizeDateField } from './formDateFields';
import { sanitizeUserFacingText } from './userFacingText';

function normLabel(label: string): string {
  return label.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
}

export type HrmsFieldSource = 'staff_id' | 'phone' | 'department' | 'designation';

export function inferHrmsSource(field: FormField): HrmsFieldSource | undefined {
  if (field.hrmsSource) return field.hrmsSource;
  const label = normLabel(field.label);
  if (label === 'staff id' || label === 'employee id' || label === 'employee no' || label === 'emp id') {
    return 'staff_id';
  }
  if (label === 'phone' || label === 'mobile no' || label === 'mobile' || label === 'phone number') {
    return 'phone';
  }
  if (label === 'department') return 'department';
  if (label === 'designation') return 'designation';
  return undefined;
}

export function getEffectiveHrmsSource(field: FormField): HrmsFieldSource | undefined {
  return inferHrmsSource(field);
}

export function normalizeFormField(field: FormField): FormField {
  const label = normLabel(field.label);
  let next = { ...field };

  if (next.placeholder) next.placeholder = sanitizeUserFacingText(next.placeholder);
  if (next.helpText) next.helpText = sanitizeUserFacingText(next.helpText);

  if (label === 'employee details' && next.type !== 'employee_info') {
    next = { ...next, type: 'employee_info' };
  }

  const hrmsSource = inferHrmsSource(next);
  if (!hrmsSource) return normalizeDateField(next);

  if (hrmsSource === 'staff_id') {
    return normalizeDateField({
      ...next,
      type: 'text',
      label: 'Staff ID',
      hrmsSource,
      width: next.width === 'full' ? 'half' : (next.width ?? 'half'),
      placeholder: next.placeholder || 'e.g. 60464',
    });
  }

  if (hrmsSource === 'phone') {
    return normalizeDateField({
      ...next,
      type: 'phone',
      label: 'Phone',
      hrmsSource,
      width: next.width === 'full' ? 'half' : (next.width ?? 'half'),
      placeholder: next.placeholder || 'e.g. 9876543210',
    });
  }

  return normalizeDateField({
    ...next,
    type: next.type === 'text' || next.type === 'textarea' ? 'dropdown' : next.type,
    hrmsSource,
    options: [],
    placeholder: next.placeholder || (hrmsSource === 'department' ? 'Select department' : 'Select designation'),
  });
}

export function normalizeFormFields(fields: FormField[]): FormField[] {
  return fields.map(normalizeFormField);
}

export function resolveMasterFieldLabel(
  field: FormField,
  value: unknown,
  departments: Array<{ label: string; value: string }>,
  designations: Array<{ label: string; value: string }>,
): string {
  const source = getEffectiveHrmsSource(field);
  if (!source || source === 'staff_id' || source === 'phone') {
    return String(value ?? '');
  }
  if (value === undefined || value === null || value === '') return String(value ?? '');
  const options = source === 'department' ? departments : designations;
  return options.find((o) => o.value === String(value))?.label ?? String(value);
}
