import { ensureStaffVerificationFields } from './hrmsVerificationFields.js';
import { normalizeDateField } from './formDateFields.js';
import { sanitizeUserFacingText } from './userFacingText.js';

function normLabel(label) {
  return String(label || '').toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
}

export function inferHrmsSource(field) {
  if (field?.hrmsSource) return field.hrmsSource;
  const label = normLabel(field?.label);
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

export function normalizeFormField(field) {
  if (!field || typeof field !== 'object') return field;

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

export function normalizeFormFields(fields) {
  if (!Array.isArray(fields)) return fields;
  return fields.map(normalizeFormField);
}

export function normalizeFormSchema(schema) {
  if (!schema || typeof schema !== 'object') return schema;
  return {
    ...schema,
    fields: ensureStaffVerificationFields(normalizeFormFields(schema.fields)),
  };
}
