import type { FormField } from '../types';

export function normFieldLabel(label: string): string {
  return label.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
}

export function isDateOfJoiningLabel(label?: string): boolean {
  const l = normFieldLabel(label || '').replace(/[()]/g, '');
  return l === 'date of joining' || l === 'doj' || l === 'doj date of joining' || l.includes('doj date of joining');
}

export function getTodayDateInput(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeDateField(field: FormField): FormField {
  if (field.type !== 'date') return field;
  if (isDateOfJoiningLabel(field.label)) {
    return { ...field, label: 'Date of Joining' };
  }
  return { ...field, label: 'Date', defaultValue: field.defaultValue ?? 'today' };
}

export function buildDefaultDateFormValues(fields: FormField[]): Record<string, string> {
  const today = getTodayDateInput();
  const result: Record<string, string> = {};
  for (const field of fields) {
    if (field.type !== 'date' || isDateOfJoiningLabel(field.label)) continue;
    result[field.id] = today;
  }
  return result;
}
