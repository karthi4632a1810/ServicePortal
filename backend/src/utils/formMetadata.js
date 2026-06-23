export const DEFAULT_FORM_CATEGORY = 'Forms';

export const LEGACY_OWNER_DEPT_MAP = {
  IT: { id: '14', name: 'Information Technology' },
};

export function getFormFileFolder(form, formId) {
  if (form?.filename?.includes('/')) {
    return form.filename.split('/')[0];
  }
  if (formId?.includes('-it-') || formId?.startsWith('form-it-')) return 'it';
  return 'it';
}

export function resolveFormDepartmentMeta({ departmentId, department, legacyCode }) {
  if (departmentId && department) {
    return { departmentId: String(departmentId), department: String(department).trim() };
  }

  const legacy = LEGACY_OWNER_DEPT_MAP[legacyCode || department];
  if (legacy) {
    return { departmentId: legacy.id, department: legacy.name };
  }

  return {
    departmentId: departmentId ? String(departmentId) : '',
    department: department ? String(department).trim() : '',
  };
}

export function buildFormMetadataFields({ departmentId, department, legacyCode }) {
  const resolved = resolveFormDepartmentMeta({ departmentId, department, legacyCode });
  return {
    departmentId: resolved.departmentId,
    department: resolved.department,
    category: DEFAULT_FORM_CATEGORY,
  };
}

export function enrichFormSchema(schema) {
  if (!schema || typeof schema !== 'object') return schema;

  const meta = buildFormDepartmentMetaFromSchema(schema);
  return {
    ...schema,
    departmentId: meta.departmentId,
    department: meta.department,
    category: DEFAULT_FORM_CATEGORY,
  };
}

export function buildFormDepartmentMetaFromSchema(schema) {
  if (schema.departmentId && schema.department && !LEGACY_OWNER_DEPT_MAP[schema.department]) {
    return {
      departmentId: String(schema.departmentId),
      department: String(schema.department).trim(),
    };
  }

  return resolveFormDepartmentMeta({
    departmentId: schema.departmentId,
    department: schema.department,
    legacyCode: schema.department,
  });
}
