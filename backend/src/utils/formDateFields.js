function normFieldLabel(label) {
  return String(label || '').toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
}

export function isDateOfJoiningLabel(label) {
  const l = normFieldLabel(label).replace(/[()]/g, '');
  return l === 'date of joining' || l === 'doj' || l === 'doj date of joining' || l.includes('doj date of joining');
}

export function normalizeDateField(field) {
  if (!field || field.type !== 'date') return field;
  if (isDateOfJoiningLabel(field.label)) {
    return { ...field, label: 'Date of Joining' };
  }
  return { ...field, label: 'Date', defaultValue: field.defaultValue ?? 'today' };
}
