import type { RequestStatus } from '../types';

export type WFPipelineStatus =
  | 'accepted'
  | 'assigned'
  | 'processing'
  | 'completed'
  | 'rejected';

/** @deprecated Use WFPipelineStatus — kept as alias for pipeline column keys */
export type WFStatus = WFPipelineStatus;

export type WFPriority = 'critical' | 'high' | 'medium' | 'low';

export interface WFStep {
  id: string;
  label: string;
  type?: string;
  status: 'done' | 'active' | 'pending' | 'rejected';
  actor?: string;
  role?: string;
  completedAt?: string;
  comment?: string;
}

export interface WFComment {
  id: string;
  author: string;
  role: string;
  initials: string;
  color: string;
  text: string;
  timestamp: string;
  type: 'comment' | 'action' | 'system';
}

export interface WFRequest {
  id: string;
  requestNumber: string;
  formId: string;
  formTitle: string;
  category: string;
  categoryIcon: string;
  employeeName: string;
  employeeId: string;
  employeeDept: string;
  department: string;
  employeeDesignation: string;
  employeeInitials: string;
  employeeColor: string;
  status: RequestStatus;
  pipelineStatus: WFPipelineStatus;
  priority: WFPriority;
  submittedAt: string;
  dueAt: string;
  slaHours: number;
  steps: WFStep[];
  currentStep: number;
  commentsCount: number;
  attachmentsCount: number;
  assignedTo?: string;
  assignedInitials?: string;
  assignedToEmployeeId?: string;
  receiverApprovedBy?: string;
  receiverAcceptedBy?: string;
  staffFinishRemarks?: string;
  staffFinishedBy?: string;
  assignees?: Array<{ employeeId: string; name: string; status: string }>;
  queueStatus?: 'pending' | 'in_progress' | 'pending_hod_review' | 'paused' | 'completed' | 'cancelled';
  watchers: string[];
  tags: string[];
  branch: string;
  comments: WFComment[];
  answers: Record<string, string>;
  isNew?: boolean;
  isOverdue?: boolean;
}

export interface ColumnConfig {
  status: WFPipelineStatus;
  label: string;
  accent: string;
  trackBg: string;
  headerBg: string;
  badgeBg: string;
  badgeText: string;
  iconName: string;
}

export const COLUMNS: ColumnConfig[] = [
  {
    status: 'accepted',
    label: 'Accepted',
    accent: '#059669',
    trackBg: 'bg-emerald-50/80 dark:bg-emerald-950/30',
    headerBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    iconName: 'CheckCircle',
  },
  {
    status: 'assigned',
    label: 'Assigned to',
    accent: '#2563EB',
    trackBg: 'bg-blue-50/80 dark:bg-blue-950/30',
    headerBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeBg: 'bg-blue-100 dark:bg-blue-900',
    badgeText: 'text-blue-700 dark:text-blue-300',
    iconName: 'User',
  },
  {
    status: 'processing',
    label: 'Processing',
    accent: '#7C3AED',
    trackBg: 'bg-purple-50/80 dark:bg-purple-950/30',
    headerBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeBg: 'bg-purple-100 dark:bg-purple-900',
    badgeText: 'text-purple-700 dark:text-purple-300',
    iconName: 'Loader2',
  },
  {
    status: 'completed',
    label: 'Completed',
    accent: '#0D9488',
    trackBg: 'bg-teal-50/80 dark:bg-teal-950/30',
    headerBg: 'bg-teal-50 dark:bg-teal-950/40',
    badgeBg: 'bg-teal-100 dark:bg-teal-900',
    badgeText: 'text-teal-700 dark:text-teal-300',
    iconName: 'CheckSquare',
  },
  {
    status: 'rejected',
    label: 'Rejected',
    accent: '#DC2626',
    trackBg: 'bg-red-50/80 dark:bg-red-950/30',
    headerBg: 'bg-red-50 dark:bg-red-950/40',
    badgeBg: 'bg-red-100 dark:bg-red-900',
    badgeText: 'text-red-700 dark:text-red-300',
    iconName: 'XCircle',
  },
];

export const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: '#DC2626', bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-700 dark:text-red-400', border: 'border-l-red-500' },
  high:     { label: 'High',     color: '#D97706', bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-400', border: 'border-l-amber-500' },
  medium:   { label: 'Medium',   color: '#2563EB', bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-400', border: 'border-l-blue-400' },
  low:      { label: 'Low',      color: '#94A3B8', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-l-slate-300' },
};
