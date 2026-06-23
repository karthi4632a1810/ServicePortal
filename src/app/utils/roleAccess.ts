import type { Page, UserRole } from '../types';

const EMPLOYEE_PAGES: Page[] = [
  'employee-portal',
  'service-catalog',
  'dynamic-form',
  'my-requests',
  'request-detail',
  'settings',
];

const HOD_PAGES: Page[] = [
  ...EMPLOYEE_PAGES,
  'dashboard',
  'approvals',
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
  'settings',
];

export type AccessTier = 'super_admin' | 'hod' | 'staff' | 'employee';

export function getAccessTier(role: UserRole): AccessTier {
  if (role === 'super_admin' || role === 'admin') return 'super_admin';
  if (role === 'hod') return 'hod';
  if (role === 'employee') return 'employee';
  return 'staff';
}

export function canAccessPage(role: UserRole | undefined, page: Page): boolean {
  if (!role) return false;
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
  { group: 'Super Admin', email: 'karthikeyan@company.com', role: 'super_admin' as UserRole },
  { group: 'Department HOD', email: 'anita.verma@company.com', role: 'hod' as UserRole },
  { group: 'Department HOD', email: 'suresh.mehta@company.com', role: 'hod' as UserRole },
  { group: 'Employee', email: 'arjun.sharma@company.com', role: 'employee' as UserRole },
  { group: 'Employee', email: 'rahul.gupta@company.com', role: 'employee' as UserRole },
  { group: 'Employee', email: 'sneha.reddy@company.com', role: 'employee' as UserRole },
];
