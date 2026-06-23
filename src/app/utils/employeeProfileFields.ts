import type { LucideIcon } from 'lucide-react';
import { Building2, Phone, Briefcase, User, Calendar } from 'lucide-react';
import type { Employee } from '../types';

export interface EmployeeProfileField {
  icon: LucideIcon;
  label: string;
  value: string;
}

function formatDate(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function present(value?: string | null): string {
  return value?.trim() ?? '';
}

export function getEmployeeProfileFields(employee: Employee): EmployeeProfileField[] {
  const mobile = [present(employee.mobile), present(employee.mobile2)].filter(Boolean).join(' / ');

  const candidates: EmployeeProfileField[] = [
    { icon: Building2, label: 'Department', value: present(employee.department) },
    { icon: Briefcase, label: 'Designation', value: present(employee.designation) },
    { icon: Phone, label: 'Mobile', value: mobile },
    { icon: Calendar, label: 'Date of Joining', value: formatDate(employee.joinedDate) },
    { icon: User, label: 'Gender', value: present(employee.gender) },
    { icon: Calendar, label: 'Date of Birth', value: formatDate(employee.dob) },
  ];

  return candidates.filter((field) => field.value.length > 0);
}
