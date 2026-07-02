export type UserRole = 'super_admin' | 'admin' | 'md' | 'hod' | 'it_team' | 'hr_team' | 'finance_team' | 'processor' | 'employee';
export type RequestStatus = 'submitted' | 'pending_approval' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled' | 'sent_back';
export type FieldType =
  | 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'date' | 'time'
  | 'dropdown' | 'multiselect' | 'radio' | 'checkbox' | 'file'
  | 'signature' | 'hidden' | 'readonly' | 'employee_info'
  | 'section_title' | 'divider';

export type Page =
  | 'dashboard'
  | 'employee-portal'
  | 'service-catalog'
  | 'dynamic-form'
  | 'my-requests'
  | 'my-tasks'
  | 'request-detail'
  | 'approvals'
  | 'accept'
  | 'workflow-pipeline'
  | 'work-queue'
  | 'form-builder'
  | 'audit-log'
  | 'settings'
  | 'user-management';

export interface OrganizationSettings {
  companyName: string;
  companyDomain: string;
  defaultSlaHours: number;
  adminEmail: string;
}

export interface Employee {
  id: string;
  name: string;
  departmentId?: string;
  designationId?: string;
  department: string;
  designation: string;
  branch: string;
  location?: string;
  email: string;
  mobile: string;
  reportingManager: string;
  hod: string;
  status: 'active' | 'inactive';
  avatar?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dob?: string;
  joinedDate?: string;
  qualification?: string;
  bloodGroup?: string;
  maritalStatus?: string;
  religion?: string;
  community?: string;
  fatherName?: string;
  pincode?: string;
  address?: string;
  jobType?: string;
  payrollType?: string;
  attendanceCategory?: string;
  experience?: string;
  panNo?: string;
  mobile2?: string;
  hrmsSource?: 'portal_user' | 'request_snapshot' | 'portal_cache_fallback' | 'hrms' | 'hrms_api';
  details?: Record<string, unknown>;
}

export interface FieldOption {
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  options?: FieldOption[];
  width?: 'full' | 'half' | 'third';
  helpText?: string;
  icon?: string;
  hrmsSource?: 'staff_id' | 'phone' | 'department' | 'designation';
}

export interface FormSchema {
  id: string;
  title: string;
  departmentId?: string;
  department: string;
  icon: string;
  description: string;
  category: string;
  version: number;
  fields: FormField[];
  active: boolean;
  estimatedTime: string;
  slaHours: number;
  mdApprove?: boolean;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'hod' | 'reporting_manager' | 'specific_user' | 'specific_role' | 'department_processor' | 'parallel';
  assignee?: string;
  assigneeEmployeeId?: string;
  role?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  completedAt?: string;
  completedBy?: string;
  comment?: string;
}

export interface Request {
  id: string;
  requestNumber: string;
  formId: string;
  formTitle: string;
  department: string;
  category: string;
  employee: Employee;
  status: RequestStatus;
  submittedAt: string;
  updatedAt: string;
  answers: Record<string, unknown>;
  workflow: WorkflowStep[];
  currentStep: number;
  comments: Comment[];
  attachments: Attachment[];
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  assignedToEmployeeId?: string;
  assignedToUserId?: string;
  receiverApprovedBy?: string;
  receiverApprovedAt?: string;
  receiverAcceptedBy?: string;
  receiverAcceptedAt?: string;
  staffFinishRemarks?: string;
  staffFinishedBy?: string;
  staffFinishedAt?: string;
  assignees?: Array<{ employeeId: string; name: string; userId?: string; status: string }>;
  queueStatus?: 'pending' | 'in_progress' | 'pending_hod_review' | 'paused' | 'completed' | 'cancelled';
  dueDate?: string;
  completedAt?: string;
}

export type MyTaskType = 'work' | 'confirm_completion' | 'completed';

export interface MyTask extends Request {
  taskType?: MyTaskType;
}

export interface Comment {
  id: string;
  by: string;
  role: string;
  text: string;
  timestamp: string;
  type: 'comment' | 'action' | 'system';
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  path?: string;
  url?: string;
  fieldId?: string;
  batchKey?: string;
  uploadedAt?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  user: string;
  department: string;
  ip: string;
  browser: string;
  timestamp: string;
  details: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface Approver {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  designation?: string | null;
  email: string;
  employeeId?: string | null;
  avatar?: string;
  initials: string;
  active?: boolean;
  preferences?: import('../utils/userPreferences').UserPreferences;
  notificationPreferences?: import('../utils/notificationPreferences').NotificationPreferences;
}

export interface DashboardStats {
  totalToday: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
  processing: number;
  avgProcessingHours: number;
  slaBreached: number;
}
