export const APP_NAME = 'PaperZero';
export const APP_TAGLINE = 'Digital forms, zero paper';

export const FORM_CATEGORIES = {
  IT: 'IT Forms',
  ALL: 'Forms',
} as const;

export const DEFAULT_FORM_CATEGORY = FORM_CATEGORIES.ALL;

export const LEGACY_OWNER_DEPT_MAP: Record<string, { id: string; name: string }> = {
  IT: { id: '14', name: 'Information Technology' },
};

export const LEGACY_CATEGORY_MAP: Record<string, string> = {
  'IT Services': FORM_CATEGORIES.IT,
};

export function normalizeFormCategory(category: string) {
  return LEGACY_CATEGORY_MAP[category] ?? category;
}

export type DepartmentKey = 'IT' | 'Other';

export interface DepartmentTagStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
  label: string;
}

export const DEPARTMENT_TAG_STYLES: Record<DepartmentKey, DepartmentTagStyle> = {
  IT: {
    label: 'IT',
    bg: 'bg-blue-50 dark:bg-blue-950',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  Other: {
    label: 'Other',
    bg: 'bg-gray-50 dark:bg-gray-900',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-700',
    dot: 'bg-gray-500',
  },
};

export function resolveDepartmentKey(department?: string, category?: string): DepartmentKey {
  const dept = (department || '').trim();
  const cat = normalizeFormCategory(category || '');

  if (dept === 'IT' || dept === 'Information Technology' || cat === FORM_CATEGORIES.IT) return 'IT';
  return 'Other';
}

export function getDepartmentTagStyle(department?: string, category?: string): DepartmentTagStyle {
  return DEPARTMENT_TAG_STYLES[resolveDepartmentKey(department, category)];
}

const HRMS_TAG_PALETTE: DepartmentTagStyle[] = [
  { label: '', bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
  { label: '', bg: 'bg-purple-50 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' },
  { label: '', bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
  { label: '', bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  { label: '', bg: 'bg-rose-50 dark:bg-rose-950', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', dot: 'bg-rose-500' },
  { label: '', bg: 'bg-cyan-50 dark:bg-cyan-950', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800', dot: 'bg-cyan-500' },
];

export function getHrmsDepartmentTagStyle(departmentId?: string): DepartmentTagStyle {
  const idx = parseInt(String(departmentId || '0'), 10);
  const palette = HRMS_TAG_PALETTE[Number.isNaN(idx) ? 0 : Math.abs(idx) % HRMS_TAG_PALETTE.length];
  return palette;
}
