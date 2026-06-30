export const SUPER_ADMIN_ROLES = ['super_admin', 'admin'];
export const MD_ROLES = ['md'];
export const HOD_ROLES = ['hod'];
export const PROCESSOR_ROLES = ['processor', 'it_team', 'hr_team', 'finance_team'];
export const EMPLOYEE_ROLES = ['employee'];

export function isSuperAdmin(role) {
  return SUPER_ADMIN_ROLES.includes(role);
}

export function isMd(role) {
  return role === 'md';
}

export function isHod(role) {
  return role === 'hod';
}

export function isEmployee(role) {
  return role === 'employee';
}

export function isProcessor(role) {
  return PROCESSOR_ROLES.includes(role);
}

export function hasStaffAccess(role) {
  return isSuperAdmin(role) || isMd(role) || isHod(role) || isProcessor(role);
}

export function canSeeAllDepartments(role) {
  return isSuperAdmin(role) || isMd(role);
}

export function authorizeRole(userRole, allowedRoles) {
  if (!allowedRoles.length) return true;
  if (allowedRoles.includes(userRole)) return true;
  if (allowedRoles.includes('admin') && isSuperAdmin(userRole)) return true;
  return false;
}
