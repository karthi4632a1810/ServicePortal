import { getInitials } from './helpers.js';

export function pick(row, ...keys) {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null) {
      const cleaned = String(value).trim().replace(/,+$/, '').trim();
      if (cleaned !== '') return cleaned;
    }
  }
  return '';
}

export function normalizePhone(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.length <= 10) return digits;
  return digits.slice(-10);
}

export function phoneMatchesRow(row, inputPhone) {
  const target = normalizePhone(inputPhone);
  if (!target || target.length < 10) return false;
  const candidates = [
    pick(row, 'mobile_1', 'mobile_2', 'staff_mobile', 'staff_phone', 'mobile', 'phone'),
  ].map(normalizePhone);
  return candidates.includes(target);
}

export function formatDateValue(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().slice(0, 10);
}

export function buildFullName(row) {
  const title = pick(row, 'staff_title');
  const name = pick(row, 'staff_name', 'employee_name', 'name');
  const initial = pick(row, 'staff_initial');
  const withInitial = [name, initial].filter(Boolean).join(' ').trim();
  return [title, withInitial || name].filter(Boolean).join(' ').trim() || name || 'Unknown';
}

export function buildAddress(row) {
  const permanent = pick(row, 'permanent_address');
  if (permanent) return permanent;

  const parts = [
    pick(row, 'door_no'),
    pick(row, 'street'),
    pick(row, 'post'),
    pick(row, 'taluk'),
    pick(row, 'district'),
    pick(row, 'state'),
    pick(row, 'country'),
    pick(row, 'pincode'),
  ].filter(Boolean);

  return parts.join(', ');
}

export function buildLocation(row) {
  const parts = [
    pick(row, 'post'),
    pick(row, 'taluk'),
    pick(row, 'district'),
    pick(row, 'state'),
  ].filter(Boolean);
  return parts.join(', ');
}

export function resolveEmploymentStatus(row) {
  if (row?.del === 0 || row?.del === '0') return 'inactive';

  const relieving = row?.releaving_date ?? row?.releaving_date;
  if (relieving) {
    const raw = String(relieving);
    if (raw !== '0000-00-00' && !raw.startsWith('0000')) {
      const d = new Date(relieving);
      if (!Number.isNaN(d.getTime()) && d <= new Date()) return 'inactive';
    }
  }

  return 'active';
}

export function mapStaffRow(row) {
  const title = pick(row, 'staff_title');
  const rawName = pick(row, 'staff_name', 'employee_name', 'name');
  const initial = pick(row, 'staff_initial');
  const name = buildFullName(row);
  const id = pick(row, 'staff_id', 'staff_id_temp', 'employee_id', 'id');
  const departmentId = pick(row, 'department', 'staff_department', 'dept_id');
  const designationId = pick(row, 'designation', 'staff_designation', 'desg_id');
  const location = buildLocation(row);

  return {
    id,
    profileId: pick(row, 'id'),
    name,
    title,
    firstName: rawName,
    lastName: initial,
    departmentId,
    designationId,
    department: departmentId,
    designation: designationId,
    branch: location,
    location,
    email: pick(row, 'email_id', 'staff_email', 'email', 'staff_mail', 'official_email'),
    mobile: pick(row, 'mobile_1', 'mobile_2', 'staff_mobile', 'staff_phone', 'mobile', 'phone'),
    mobile2: pick(row, 'mobile_2'),
    reportingManager: '',
    reportingManagerId: pick(row, 'super_auth', 'atten_auth'),
    hod: '',
    gender: pick(row, 'staff_gender', 'gender'),
    dob: formatDateValue(row.staff_dob ?? row.dob ?? row.date_of_birth),
    joinedDate: formatDateValue(row.joined_date ?? row.join_date ?? row.date_of_joining),
    qualification: pick(row, 'qualification', 'subject_specialization'),
    maritalStatus: pick(row, 'marital_status'),
    religion: pick(row, 'staff_religion', 'religion'),
    community: pick(row, 'staff_community', 'community'),
    fatherName: pick(row, 'father_name'),
    pincode: pick(row, 'pincode'),
    address: buildAddress(row),
    jobType: pick(row, 'job_type'),
    payrollType: pick(row, 'payroll_type'),
    attendanceCategoryId: pick(row, 'att_category'),
    experience: pick(row, 'experience', 'previous_experience'),
    panNo: pick(row, 'pan_no'),
    bloodGroupId: pick(row, 'staff_bg'),
    status: resolveEmploymentStatus(row),
    avatar: pick(row, 'staff_initial') || getInitials(name),
    details: row,
  };
}

export function normalizeEmployee(data) {
  const location = data.location || data.branch || data.Branch || '';
  return {
    id: data.id || data.employeeId || data.EmployeeID,
    profileId: data.profileId,
    name: data.name || data.EmployeeName,
    title: data.title,
    firstName: data.firstName,
    lastName: data.lastName,
    departmentId: data.departmentId,
    designationId: data.designationId,
    department: data.department || data.Department || '',
    designation: data.designation || data.Designation || '',
    branch: location,
    location,
    email: data.email || data.Email || '',
    mobile: data.mobile || data.Mobile || '',
    mobile2: data.mobile2,
    reportingManager: data.reportingManager || data.ReportingManager || '',
    hod: data.hod || data.ReportingHOD || data.HOD || '',
    gender: data.gender,
    dob: data.dob,
    joinedDate: data.joinedDate,
    qualification: data.qualification,
    maritalStatus: data.maritalStatus,
    religion: data.religion,
    community: data.community,
    fatherName: data.fatherName,
    pincode: data.pincode,
    address: data.address,
    jobType: data.jobType,
    payrollType: data.payrollType,
    attendanceCategory: data.attendanceCategory,
    experience: data.experience,
    panNo: data.panNo,
    bloodGroup: data.bloodGroup,
    status: (data.status || data.EmploymentStatus || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active',
    avatar: data.avatar || getInitials(data.name || data.EmployeeName || ''),
    details: data.details,
  };
}
