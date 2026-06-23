import type { Request } from '../types';
import type { WFRequest, WFStep, WFComment, WFPriority, WFStatus } from '../data/workflowData';

const FORM_ICONS: Record<string, string> = {
  'WiFi / Network Access Request': 'Wifi',
  'Official Email ID Request': 'Mail',
  'Leave Application': 'CalendarOff',
  'Salary / Travel Advance Request': 'IndianRupee',
  'Miss Punch / Attendance Correction': 'Clock',
  'IT Asset Request': 'Monitor',
};

const COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2'];

function mapStepStatus(status: string, index: number, currentStep: number): WFStep['status'] {
  if (status === 'approved') return 'done';
  if (status === 'rejected') return 'rejected';
  if (index + 1 === currentStep) return 'active';
  return 'pending';
}

function mapRequestStatus(status: Request['status']): WFStatus {
  if (status === 'sent_back' || status === 'cancelled') return 'submitted';
  return status as WFStatus;
}

export function mapRequestToWorkflow(req: Request, index = 0): WFRequest {
  const initials = req.employee.avatar || req.employee.name.split(' ').map((p) => p[0]).join('').slice(0, 2);
  const dueAt = req.dueDate || req.submittedAt;
  const slaHours = 48;
  const isOverdue = req.dueDate ? new Date(req.dueDate).getTime() < Date.now() && !['completed', 'rejected', 'cancelled'].includes(req.status) : false;

  return {
    id: req.id,
    requestNumber: req.requestNumber,
    formTitle: req.formTitle,
    category: req.category,
    categoryIcon: FORM_ICONS[req.formTitle] || 'FileText',
    employeeName: req.employee.name,
    employeeId: req.employee.id,
    employeeDept: req.employee.department,
    employeeDesignation: req.employee.designation,
    employeeInitials: initials,
    employeeColor: COLORS[index % COLORS.length],
    status: mapRequestStatus(req.status),
    priority: req.priority as WFPriority,
    submittedAt: req.submittedAt,
    dueAt,
    slaHours,
    currentStep: req.currentStep,
    commentsCount: req.comments?.length ?? 0,
    attachmentsCount: req.attachments?.length ?? 0,
    assignedTo: req.assignedTo,
    assignedInitials: req.assignedTo?.split(' ').map((p) => p[0]).join(''),
    watchers: [req.employee.hod].filter(Boolean),
    tags: [req.category.split(' ')[0]?.toLowerCase() ?? 'request'],
    branch: req.employee.branch,
    isNew: Date.now() - new Date(req.submittedAt).getTime() < 86400000,
    isOverdue,
    answers: Object.fromEntries(Object.entries(req.answers).map(([k, v]) => [k, String(v ?? '')])),
    steps: req.workflow.map((step, i) => ({
      id: step.id,
      label: step.name,
      status: mapStepStatus(step.status, i, req.currentStep),
      actor: step.completedBy || step.assignee,
      role: step.role,
      completedAt: step.completedAt,
      comment: step.comment,
    })),
    comments: (req.comments ?? []).map((c): WFComment => ({
      id: c.id,
      author: c.by,
      role: c.role,
      initials: c.by.split(' ').map((p) => p[0]).join('').slice(0, 2),
      color: '#2563EB',
      text: c.text,
      timestamp: c.timestamp,
      type: c.type,
    })),
  };
}

export function requestsToWorkflow(requests: Request[]): WFRequest[] {
  return requests.map((r, i) => mapRequestToWorkflow(r, i));
}
