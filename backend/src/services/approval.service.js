import Request from '../models/Request.js';
import workflowEngine from './workflowEngine.service.js';
import { isSuperAdmin } from '../utils/roles.js';
import { canAccessRequest } from '../utils/requestScope.js';
import { AppError } from '../utils/response.js';

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
    dueDate: obj.dueDate?.toISOString?.(),
    queueStatus: obj.queueStatus,
  };
}

export class ApprovalService {
  async getPendingForUser(user, { status = 'pending', page = 1, limit = 20 } = {}) {
    const allRequests = await Request.find({}).sort('-submittedAt');
    let filtered = allRequests;

    if (status === 'pending') {
      filtered = allRequests.filter((req) => {
        const step = req.workflow[req.currentStep - 1];
        return step?.status === 'pending' && workflowEngine.canUserActOnStep(user, step, req);
      });
    } else if (status === 'approved') {
      filtered = allRequests.filter((req) =>
        req.workflow.some((s) => s.completedBy === user.name && s.status === 'approved')
      );
    } else if (status === 'rejected') {
      filtered = allRequests.filter((req) =>
        req.workflow.some((s) => s.completedBy === user.name && s.status === 'rejected')
      );
    } else if (status === 'forwarded') {
      filtered = allRequests.filter((req) =>
        req.comments.some((c) => c.by === user.name && c.text?.toLowerCase().includes('forward'))
      );
    } else if (status === 'completed') {
      filtered = allRequests.filter((req) => req.status === 'completed');
    } else if (status === 'all') {
      filtered = allRequests;
    }

    filtered = filtered.filter((req) => canAccessRequest(user, req));

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

  async processAction(requestId, action, { user, remarks }) {
    const request = await Request.findById(requestId);
    if (!request) {
      throw new AppError('Request not found', 404);
    }

    const step = workflowEngine.getCurrentStep(request);
    if (!workflowEngine.canUserActOnStep(user, step, request) && !isSuperAdmin(user.role)) {
      throw new AppError('You are not authorized to act on this request', 403);
    }
    if (!canAccessRequest(user, request)) {
      throw new AppError('You do not have access to this request', 403);
    }

    if ((action === 'reject' || action === 'request_info') && !String(remarks || '').trim()) {
      throw new AppError('Remarks are required for this action', 400);
    }

    const { v4: uuidv4 } = await import('uuid');
    const ApprovalLog = (await import('../models/ApprovalLog.js')).default;
    const notificationService = (await import('./notification.service.js')).default;

    await workflowEngine.processApproval(request, action, {
      userName: user.name,
      userRole: user.role,
      remarks,
    });

    const actionLabels = {
      approve: 'approved',
      reject: 'rejected',
      forward: 'forwarded',
      request_info: 'sent back for more information',
    };

    request.comments.push({
      id: `c-${uuidv4().slice(0, 8)}`,
      by: user.name,
      role: user.role.replace(/_/g, ' '),
      text: remarks || `Request ${actionLabels[action] || action}`,
      timestamp: new Date(),
      type: 'action',
    });

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

    if (action === 'approve') await notificationService.notifyApproved(request, user);
    if (action === 'reject') await notificationService.notifyRejected(request, user);
    if (request.status === 'completed') await notificationService.notifyCompleted(request);

    return mapRequest(request);
  }
}

export default new ApprovalService();
