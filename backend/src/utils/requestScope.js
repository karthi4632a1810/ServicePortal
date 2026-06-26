import { isHod, isSuperAdmin, isEmployee } from './roles.js';

export function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function departmentsMatch(a, b) {
  const na = String(a || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const nb = String(b || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

/** MongoDB filter: super admin sees all; HOD sees own department only. */
export function getRequestDepartmentFilter(user) {
  if (!user || isSuperAdmin(user.role)) return {};
  if (isHod(user.role) && user.department) {
    const dept = escapeRegex(user.department.trim());
    const re = new RegExp(`^${dept}$`, 'i');
    return {
      $or: [{ department: re }, { 'employee.department': re }],
    };
  }
  return {};
}

export function mergeRequestScope(baseFilter, user) {
  const scope = getRequestDepartmentFilter(user);
  if (!scope || !Object.keys(scope).length) return baseFilter;
  if (!baseFilter || !Object.keys(baseFilter).length) return { ...scope };
  return { $and: [baseFilter, scope] };
}

export function canAccessRequest(user, request) {
  if (!user || isSuperAdmin(user.role)) return true;
  if (isHod(user.role)) {
    const dept = request?.department || request?.employee?.department;
    return departmentsMatch(user.department, dept);
  }
  if (isEmployee(user.role)) {
    const empId = String(request?.employee?.id || '').trim();
    if (empId && empId === String(user.employeeId || '').trim()) return true;
    const userEmpId = String(user.employeeId || '').trim();
    const assignees = request?.assignees || [];
    if (assignees.some((a) => userEmpId && String(a.employeeId) === userEmpId)) return true;
    if (request?.assignedToEmployeeId && userEmpId && String(request.assignedToEmployeeId) === userEmpId) {
      return true;
    }
    return false;
  }
  return true;
}

export function canTrackEmployee(user, employeeDepartment) {
  if (!user || isSuperAdmin(user.role)) return true;
  if (isHod(user.role)) return departmentsMatch(user.department, employeeDepartment);
  if (isEmployee(user.role)) return true;
  return true;
}
