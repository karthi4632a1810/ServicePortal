import type { FormField } from '../types';
import { getEffectiveHrmsSource, resolveMasterFieldLabel } from './hrmsFormFields';
import { isStaffVerificationField } from './hrmsVerificationFields';
import { isDateOfJoiningLabel } from './formDateFields';

export interface FormattedAnswerRow {
  id: string;
  label: string;
  value: string;
  fieldType: FormField['type'] | 'section' | 'divider';
  isStructural: boolean;
  isHrmsMirror: boolean;
}

function normLabel(label: string): string {
  return label.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
}

function isHrmsMirrorField(field: FormField): boolean {
  if (isStaffVerificationField(field)) return true;
  const source = getEffectiveHrmsSource(field);
  if (source === 'department' || source === 'designation' || source === 'phone') return true;
  const label = normLabel(field.label);
  if (['name', 'employee name', 'full name', 'staff name'].includes(label)) return true;
  if (label === 'department' || label === 'designation') return true;
  if (isDateOfJoiningLabel(field.label)) return true;
  return false;
}

function isStructuralField(field: FormField): boolean {
  return field.type === 'section_title'
    || field.type === 'divider'
    || field.type === 'hidden'
    || field.type === 'employee_info';
}

function humanizeKey(key: string): string {
  if (/^f\d+$/i.test(key)) return `Field ${key.slice(1)}`;
  return key.replace(/_/g, ' ').replace(/\bhrms\b/gi, '').trim();
}

function formatRawValue(
  field: FormField,
  raw: unknown,
  masters: {
    departments: Array<{ label: string; value: string }>;
    designations: Array<{ label: string; value: string }>;
  },
): string {
  if (raw === undefined || raw === null || raw === '') return '—';
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean).join(', ') || '—';

  const source = getEffectiveHrmsSource(field);
  if (source === 'department' || source === 'designation') {
    return resolveMasterFieldLabel(field, raw, masters.departments, masters.designations);
  }

  const str = String(raw);
  if (field.options?.length) {
    const match = field.options.find((o) => o.value === str || o.label === str);
    if (match) return match.label;
  }

  return str;
}

export function formatRequestAnswers(
  fields: FormField[],
  answers: Record<string, unknown>,
  masters: {
    departments: Array<{ label: string; value: string }>;
    designations: Array<{ label: string; value: string }>;
  } = { departments: [], designations: [] },
): FormattedAnswerRow[] {
  const orderedFields = fields.length > 0
    ? fields
    : Object.keys(answers).map((id) => ({
      id,
      type: 'text' as const,
      label: humanizeKey(id),
    }));

  return orderedFields.flatMap((field) => {
    if (field.type === 'section_title') {
      return [{
        id: field.id,
        label: field.label,
        value: '',
        fieldType: 'section' as const,
        isStructural: true,
        isHrmsMirror: false,
      }];
    }
    if (field.type === 'divider') {
      return [{
        id: field.id,
        label: '',
        value: '',
        fieldType: 'divider' as const,
        isStructural: true,
        isHrmsMirror: false,
      }];
    }
    if (field.type === 'hidden' || field.type === 'employee_info') return [];

    const raw = answers[field.id];
    if (raw === undefined || raw === null || raw === '') return [];

    return [{
      id: field.id,
      label: field.label?.trim() || humanizeKey(field.id),
      value: formatRawValue(field, raw, masters),
      fieldType: field.type,
      isStructural: isStructuralField(field),
      isHrmsMirror: isHrmsMirrorField(field),
    }];
  });
}

export function getRequestSummaryRows(rows: FormattedAnswerRow[]): FormattedAnswerRow[] {
  return rows.filter((r) => !r.isStructural && !r.isHrmsMirror && r.value !== '—');
}
