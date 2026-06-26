import type { Request } from '../types';
import type { WFRequest, WFStep, WFComment, WFPriority, WFPipelineStatus } from '../data/workflowData';

const FORM_ICONS: Record<string, string> = {
  'WiFi / Network Access Request': 'Wifi',
  'Official Email ID Request': 'Mail',
  'Leave Application': 'CalendarOff',
  'Salary / Travel Advance Request': 'IndianRupee',
  'Miss Punch / Attendance Correction': 'Clock',
  'IT Asset Request': 'Monitor',
  'Printer Request Form': 'Monitor',
  'System Request Form': 'Send',
};

const COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2'];

function mapStepStatus(status: string, index: number, currentStep: number): WFStep['status'] {
  if (status === 'approved') return 'done';
  if (status === 'rejected') return 'rejected';
  if (index + 1 === currentStep) return 'active';
  return 'pending';
}

function hasAssignee(req: Request): boolean {
  return Boolean(
    req.assignedTo
    || req.assignedToEmployeeId
    || req.assignees?.some((a) => a.status !== 'cancelled'),
  );
}

function resolvePipelineStatus(req: Request): WFPipelineStatus {
  if (req.status === 'rejected' || req.status === 'cancelled') return 'rejected';
  if (req.status === 'completed') return 'completed';

  const receiverAccepted = Boolean(req.receiverAcceptedBy || req.receiverApprovedBy);
  if (receiverAccepted) {
    const queueStatus = req.queueStatus || 'pending';
    if (queueStatus === 'in_progress' || queueStatus === 'pending_hod_review') {
      return 'processing';
    }
    return hasAssignee(req) ? 'assigned' : 'accepted';
  }

  if (req.status === 'approved') return hasAssignee(req) ? 'assigned' : 'accepted';
  return 'accepted';
}

export function isPipelineRequest(req: Request): boolean {
  if (['submitted', 'sent_back'].includes(req.status)) return false;

  const receiverAccepted = Boolean(req.receiverAcceptedBy || req.receiverApprovedBy);
  if (receiverAccepted) return true;

  if (['completed', 'rejected', 'cancelled', 'approved'].includes(req.status)) return true;
  if (req.status === 'processing') return false;

  return false;
}

export function mapRequestToWorkflow(req: Request, index = 0): WFRequest {
  const initials = req.employee.avatar || req.employee.name.split(' ').map((p) => p[0]).join('').slice(0, 2);
  const dueAt = req.dueDate || req.submittedAt;
  const slaHours = 48;
  const isOverdue = req.dueDate ? new Date(req.dueDate).getTime() < Date.now() && !['completed', 'rejected', 'cancelled'].includes(req.status) : false;

  return {
    id: req.id,
    requestNumber: req.requestNumber,
    formId: req.formId,
    formTitle: req.formTitle,
    category: req.category,
    categoryIcon: FORM_ICONS[req.formTitle] || 'FileText',
    employeeName: req.employee.name,
    employeeId: req.employee.id,
    employeeDept: req.employee.department,
    department: req.department,
    employeeDesignation: req.employee.designation,
    employeeInitials: initials,
    employeeColor: COLORS[index % COLORS.length],
    status: req.status,
    pipelineStatus: resolvePipelineStatus(req),
    priority: req.priority as WFPriority,
    submittedAt: req.submittedAt,
    dueAt,
    slaHours,
    currentStep: req.currentStep,
    commentsCount: req.comments?.length ?? 0,
    attachmentsCount: req.attachments?.length ?? 0,
    assignedTo: req.assignedTo,
    assignedInitials: req.assignedTo?.split(' ').map((p) => p[0]).join(''),
    assignedToEmployeeId: req.assignedToEmployeeId,
    receiverApprovedBy: req.receiverApprovedBy || req.receiverAcceptedBy,
    receiverAcceptedBy: req.receiverAcceptedBy || req.receiverApprovedBy,
    staffFinishRemarks: req.staffFinishRemarks,
    staffFinishedBy: req.staffFinishedBy,
    assignees: req.assignees,
    queueStatus: req.queueStatus,
    watchers: [req.employee.hod].filter(Boolean),
    tags: [req.category.split(' ')[0]?.toLowerCase() ?? 'request'],
    branch: req.employee.branch,
    isNew: Date.now() - new Date(req.submittedAt).getTime() < 86400000,
    isOverdue,
    answers: Object.fromEntries(Object.entries(req.answers ?? {}).map(([k, v]) => [k, String(v ?? '')])),
    steps: req.workflow.map((step, i) => ({
      id: step.id,
      label: step.name,
      type: step.type,
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
  return requests.filter(isPipelineRequest).map((r, i) => mapRequestToWorkflow(r, i));
}
