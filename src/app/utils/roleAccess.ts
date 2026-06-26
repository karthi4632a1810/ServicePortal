import type { Page, UserRole } from '../types';

const EMPLOYEE_PAGES: Page[] = [
  'employee-portal',
  'service-catalog',
  'dynamic-form',
  'my-requests',
  'my-tasks',
  'request-detail',
  'settings',
];

const HOD_PAGES: Page[] = [
  ...EMPLOYEE_PAGES,
  'dashboard',
  'approvals',
  'accept',
  'workflow-pipeline',
];

const STAFF_PAGES: Page[] = [
  ...HOD_PAGES,
  'work-queue',
];

const SUPER_ADMIN_PAGES: Page[] = [
  ...STAFF_PAGES,
  'form-builder',
  'audit-log',
  'user-management',
  'settings',
];

export type AccessTier = 'super_admin' | 'hod' | 'staff' | 'employee';

export function hasAdminAccess(role: UserRole | undefined): boolean {
  if (!role) return false;
  return getAccessTier(role) !== 'employee';
}

export function isEmployeeSession(role: UserRole | undefined): boolean {
  return role === 'employee';
}

export function getAccessTier(role: UserRole): AccessTier {
  if (role === 'super_admin' || role === 'admin') return 'super_admin';
  if (role === 'hod') return 'hod';
  if (role === 'employee') return 'employee';
  return 'staff';
}

export function canAccessPage(role: UserRole | undefined, page: Page): boolean {
  if (!role) return false;
  if (page === 'user-management') return role === 'super_admin';
  const tier = getAccessTier(role);
  if (tier === 'super_admin') return SUPER_ADMIN_PAGES.includes(page);
  if (tier === 'staff') return STAFF_PAGES.includes(page);
  if (tier === 'hod') return HOD_PAGES.includes(page);
  return EMPLOYEE_PAGES.includes(page);
}

export function getDefaultPage(role: UserRole): Page {
  const tier = getAccessTier(role);
  if (tier === 'employee') return 'employee-portal';
  if (tier === 'hod') return 'approvals';
  if (tier === 'staff') return 'work-queue';
  return 'dashboard';
}

export const MANAGEABLE_ROLES = [
  { value: 'employee' as UserRole, label: 'Employee' },
  { value: 'hod' as UserRole, label: 'HOD' },
];

export const SUPER_ADMIN_STAFF_ID = '12345';

export function isFixedSuperAdmin(user: { role?: UserRole; employeeId?: string | null; email?: string }): boolean {
  const staffId = String(user.employeeId || '').trim();
  const email = String(user.email || '').toLowerCase();
  return user.role === 'super_admin'
    && (staffId === SUPER_ADMIN_STAFF_ID || email === 'superadmin@mapims.edu.in');
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    hod: 'Department HOD',
    employee: 'Employee',
    processor: 'Processor',
    it_team: 'IT Team',
    hr_team: 'HR Team',
    finance_team: 'Finance Team',
  };
  return labels[role] ?? role;
}

export const DEMO_ACCOUNTS = [
  { group: 'Super Admin', email: 'superadmin@mapims.edu.in', role: 'super_admin' as UserRole },
];
