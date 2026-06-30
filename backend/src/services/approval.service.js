import Request from '../models/Request.js';
import workflowEngine from './workflowEngine.service.js';
import hrmsService from './hrms.service.js';
import { isSuperAdmin, isHod } from '../utils/roles.js';
import { canAccessRequest, departmentsMatch, mergeRequestScope } from '../utils/requestScope.js';
import { AppError } from '../utils/response.js';

const APPROVAL_STEP_TYPES = new Set(['hod', 'reporting_manager', 'specific_user', 'specific_role', 'parallel']);

function isApprovalStep(step) {
  return step && APPROVAL_STEP_TYPES.has(step.type);
}

function isReceiverDeptHod(user, req) {
  if (isSuperAdmin(user.role)) return true;
  if (!isHod(user.role)) return false;
  return departmentsMatch(user.department, req.department || req.employee?.department);
}

function userCanApproveNow(user, req) {
  const step = req.workflow[req.currentStep - 1];
  if (!step || step.status !== 'pending') return false;
  if (isApprovalStep(step)) {
    return workflowEngine.canUserActOnStep(user, step, req);
  }
  // Receiving dept HOD accepts work after requester HOD approved step 1
  if (step.type === 'department_processor' && !req.receiverApprovedBy) {
    const requesterHodStep = req.workflow[0];
    if (!requesterHodStep || requesterHodStep.status !== 'approved') return false;
    return isReceiverDeptHod(user, req);
  }
  return false;
}

function userApprovedInPast(user, req) {
  return req.workflow.some((s) => s.completedBy === user.name && s.status === 'approved');
}

function userCanSendBackNow(user, req) {
  if (['sent_back', 'completed', 'cancelled'].includes(req.status)) return false;
  const userApproved = req.workflow.some((s) => s.completedBy === user.name && s.status === 'approved');
  const userRejected = req.workflow.some((s) => s.completedBy === user.name && s.status === 'rejected');
  return userApproved || userRejected;
}

function mapRequest(r) {
  const obj = r.toObject ? r.toObject() : r;
  return {
    id: obj._id.toString(),
    requestNumber: obj.requestNumber,
    formId: obj.formId,
    formTitle: obj.formTitle,
    department: obj.department,
    category: obj.category,
    employee: obj.employee,
    status: obj.status,
    submittedAt: obj.submittedAt?.toISOString?.(),
    updatedAt: obj.updatedAt?.toISOString?.(),
    answers: obj.answers,
    workflow: obj.workflow,
    currentStep: obj.currentStep,
    comments: obj.comments?.map((c) => ({
      ...c,
      timestamp: c.timestamp?.toISOString?.() || c.timestamp,
    })),
    attachments: obj.attachments,
    priority: obj.priority,
    assignedTo: obj.assignedTo,
    assignedToEmployeeId: obj.assignedToEmployeeId,
    receiverApprovedBy: obj.receiverApprovedBy,
    receiverApprovedAt: obj.receiverApprovedAt?.toISOString?.(),
    receiverAcceptedBy: obj.receiverApprovedBy,
    receiverAcceptedAt: obj.receiverApprovedAt?.toISOString?.(),
    staffFinishRemarks: obj.staffFinishRemarks,
    staffFinishedBy: obj.staffFinishedBy,
    staffFinishedAt: obj.staffFinishedAt?.toISOString?.(),
    assignees: obj.assignees || [],
    dueDate: obj.dueDate?.toISOString?.(),
    queueStatus: obj.queueStatus,
  };
}

function filterByStatus(accessible, user, status) {
  if (status === 'pending') {
    return accessible.filter((req) => userCanApproveNow(user, req));
  }
  if (status === 'approved') {
    return accessible.filter((req) => {
      if (req.status === 'sent_back') return false;
      if (!userApprovedInPast(user, req)) return false;
      return !userCanApproveNow(user, req);
    });
  }
  if (status === 'rejected') {
    return accessible.filter((req) => {
      if (req.status === 'sent_back') return false;
      return req.workflow.some((s) => s.completedBy === user.name && s.status === 'rejected');
    });
  }
  if (status === 'forwarded') {
    return accessible.filter((req) =>
      req.comments.some((c) => c.by === user.name && c.text?.toLowerCase().includes('forward')),
    );
  }
  if (status === 'completed') {
    return accessible.filter((req) => req.status === 'completed');
  }
  return accessible;
}

export class ApprovalService {
  async loadAccessibleRequests(user) {
    const scopedQuery = mergeRequestScope({}, user);
    const allRequests = await Request.find(scopedQuery).sort('-submittedAt');
    return allRequests.filter((req) => canAccessRequest(user, req));
  }

  async getTabSummary(user) {
    const accessible = await this.loadAccessibleRequests(user);
    return {
      pending: filterByStatus(accessible, user, 'pending').map(mapRequest),
      approved: filterByStatus(accessible, user, 'approved').map(mapRequest),
      rejected: filterByStatus(accessible, user, 'rejected').map(mapRequest),
      all: accessible.map(mapRequest),
    };
  }

  async getPendingForUser(user, { status = 'pending', page = 1, limit = 20 } = {}) {
    const accessible = await this.loadAccessibleRequests(user);
    const filtered = filterByStatus(accessible, user, status);

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(skip, skip + limitNum);

    return {
      requests: paginated.map(mapRequest),
      pagination: {
        total: filtered.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(filtered.length / limitNum) || 1,
      },
    };
  }

  async processAction(requestId, action, { user, remarks, forwardToStaffId }) {
    const request = await Request.findById(requestId);
    if (!request) {
      throw new AppError('Request not found', 404);
    }

    const step = workflowEngine.getCurrentStep(request);
    const isReceiverAcceptPhase = step?.type === 'department_processor' && !request.receiverApprovedBy;
    const isConfirmCompletionPhase = step?.type === 'department_processor' && request.queueStatus === 'pending_hod_review';

    if (action === 'request_info') {
      if (!userCanSendBackNow(user, request) && !isSuperAdmin(user.role)) {
        throw new AppError('Send Back is only available from the Approved or Rejected tab', 403);
      }
    } else if (action === 'forward') {
      if (!forwardToStaffId) {
        throw new AppError('Staff ID is required to forward', 400);
      }
      if (isReceiverAcceptPhase || step?.type === 'department_processor') {
        throw new AppError('Forward is not available at this workflow step', 400);
      }
      if (!workflowEngine.canUserActOnStep(user, step, request) && !isSuperAdmin(user.role)) {
        throw new AppError('You are not authorized to forward this request', 403);
      }
    } else if (isReceiverAcceptPhase) {
      if (!isReceiverDeptHod(user, request) && !isSuperAdmin(user.role)) {
        throw new AppError('Only the receiving department HOD can act on this request', 403);
      }
      if (action === 'approve') {
        throw new AppError('Use Accept for Processing to accept this request', 400);
      }
    } else if (isConfirmCompletionPhase) {
      if (!isReceiverDeptHod(user, request) && !isSuperAdmin(user.role)) {
        throw new AppError('Only the receiving department HOD can confirm completion', 403);
      }
      throw new AppError('Use Confirm Completion or Send Back for Rework for this request', 400);
    } else if (!workflowEngine.canUserActOnStep(user, step, request) && !isSuperAdmin(user.role)) {
      throw new AppError('You are not authorized to act on this request', 403);
    }

    if (!canAccessRequest(user, request)) {
      throw new AppError('You do not have access to this request', 403);
    }

    if (step?.type === 'department_processor' && action === 'approve' && !isReceiverAcceptPhase) {
      throw new AppError('Assign a staff member and complete the work from the Work Queue', 400);
    }

    if ((action === 'reject' || action === 'request_info') && !String(remarks || '').trim()) {
      throw new AppError('Remarks are required for this action', 400);
    }

    const { v4: uuidv4 } = await import('uuid');
    const ApprovalLog = (await import('../models/ApprovalLog.js')).default;
    const notificationService = (await import('./notification.service.js')).default;

    let forwardToEmployee;
    if (action === 'forward') {
      forwardToEmployee = await hrmsService.getEmployee(forwardToStaffId, undefined, { mode: 'auto' });
      if (!departmentsMatch(forwardToEmployee.department, request.employee?.department)) {
        throw new AppError('Forward target must be in the same department as the requester', 400);
      }
      if (String(forwardToEmployee.id) === String(user.employeeId || '').trim()) {
        throw new AppError('You cannot forward a request to yourself', 400);
      }
    }

    await workflowEngine.processApproval(request, action, {
      userName: user.name,
      userRole: user.role,
      remarks,
      forwardToEmployee,
    });

    const actionLabels = {
      approve: 'approved',
      reject: 'rejected',
      forward: 'forwarded',
      request_info: 'sent back for more information',
    };

    if (action !== 'request_info') {
      const commentText = action === 'forward' && forwardToEmployee
        ? `${remarks || 'Forwarded'} → ${forwardToEmployee.name} (Staff ID: ${forwardToEmployee.id})`
        : remarks || `Request ${actionLabels[action] || action}`;

      request.comments.push({
        id: `c-${uuidv4().slice(0, 8)}`,
        by: user.name,
        role: user.role.replace(/_/g, ' '),
        text: commentText,
        timestamp: new Date(),
        type: 'action',
      });
    }

    await request.save();

    await ApprovalLog.create({
      requestId: request._id,
      requestNumber: request.requestNumber,
      action,
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      department: user.department,
      remarks,
      stepIndex: request.currentStep - 1,
      stepName: step?.name,
    });

    if (action === 'approve') {
      if (request.status === 'pending_approval') {
        await notificationService.notifyApprovalRequired(request);
      } else {
        await notificationService.notifyApproved(request, user);
      }
    }
    if (action === 'reject') await notificationService.notifyRejected(request, user);
    if (request.status === 'completed') await notificationService.notifyCompleted(request);

    return mapRequest(request);
  }
}

export default new ApprovalService();
