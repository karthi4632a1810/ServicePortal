import { v4 as uuidv4 } from 'uuid';
import Request from '../models/Request.js';
import Form from '../models/Form.js';
import User from '../models/User.js';
import ApprovalLog from '../models/ApprovalLog.js';
import { generateRequestNumber } from '../utils/helpers.js';
import { paginatedFind } from '../utils/pagination.js';
import { AppError } from '../utils/response.js';
import workflowEngine from './workflowEngine.service.js';
import hrmsService from './hrms.service.js';
import formService from './form.service.js';
import notificationService from './notification.service.js';
import { mergeRequestScope, canAccessRequest, departmentsMatch } from '../utils/requestScope.js';
import { isSuperAdmin, isHod, hasStaffAccess } from '../utils/roles.js';
import { canReceiverHodAcceptNow, repairMdWorkflowIfNeeded, isMdApprovalPending } from '../utils/workflowHelpers.js';

function mapRequestToFrontend(doc) {
  const r = doc.toObject ? doc.toObject() : doc;
  return {
    id: r._id.toString(),
    requestNumber: r.requestNumber,
    formId: r.formId,
    formTitle: r.formTitle,
    department: r.department,
    category: r.category,
    employee: r.employee,
    status: r.status,
    submittedAt: r.submittedAt?.toISOString?.() || r.submittedAt,
    updatedAt: r.updatedAt?.toISOString?.() || r.updatedAt,
    answers: r.answers,
    workflow: r.workflow.map((s) => ({
      ...s,
      completedAt: s.completedAt?.toISOString?.() || s.completedAt,
    })),
    currentStep: r.currentStep,
    comments: r.comments.map((c) => ({
      ...c,
      timestamp: c.timestamp?.toISOString?.() || c.timestamp,
    })),
    attachments: (r.attachments || []).map((a) => ({
      ...a,
      url: a.path ? `/api/uploads/${String(a.path).replace(/\\/g, '/')}` : undefined,
      uploadedAt: a.uploadedAt?.toISOString?.() || a.uploadedAt,
    })),
    priority: r.priority,
    assignedTo: r.assignedTo,
    assignedToEmployeeId: r.assignedToEmployeeId,
    assignedToUserId: r.assignedToUserId?.toString?.() || r.assignedToUserId,
    receiverApprovedBy: r.receiverApprovedBy,
    receiverApprovedAt: r.receiverApprovedAt?.toISOString?.() || r.receiverApprovedAt,
    receiverAcceptedBy: r.receiverApprovedBy,
    receiverAcceptedAt: r.receiverApprovedAt?.toISOString?.() || r.receiverApprovedAt,
    staffFinishRemarks: r.staffFinishRemarks,
    staffFinishedBy: r.staffFinishedBy,
    staffFinishedAt: r.staffFinishedAt?.toISOString?.() || r.staffFinishedAt,
    assignees: (r.assignees || []).map((a) => ({
      employeeId: a.employeeId,
      name: a.name,
      userId: a.userId?.toString?.() || a.userId,
      status: a.status || 'pending',
    })),
    dueDate: r.dueDate?.toISOString?.() || r.dueDate,
    queueStatus: r.queueStatus,
    mdApprove: r.mdApprove === true,
  };
}

async function ensureMdWorkflow(request) {
  const mdApprove = await formService.resolveMdApprove(request.formId);
  if (!mdApprove) return false;
  const repaired = repairMdWorkflowIfNeeded(request, mdApprove);
  if (repaired) {
    await request.save();
    if (isMdApprovalPending(request)) {
      await notificationService.notifyApprovalRequired(request);
    }
  }
  return repaired;
}

function withTaskType(doc, taskType) {
  return { ...mapRequestToFrontend(doc), taskType };
}

export class RequestService {
  async createRequest({ employeeId, formId, answers, priority = 'medium', attachments = [] }) {
    const employee = await hrmsService.getEmployee(employeeId);
    if (employee.status === 'inactive') {
      throw new AppError('Employee is not active', 400);
    }

    const formMeta = await Form.findOne({ formId, active: true });
    if (!formMeta) throw new AppError('Form not found or inactive', 404);

    const mdApprove = await formService.resolveMdApprove(formId);
    const workflow = await workflowEngine.buildWorkflow(formMeta.workflowTemplateId, employee);
    if (mdApprove) {
      workflowEngine.injectMdApprovalStep(workflow);
    }
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + (formMeta.slaHours || 48));

    const normalizedAttachments = (attachments || []).map((a) => ({
      id: a.id || `att-${uuidv4().slice(0, 8)}`,
      name: a.name,
      size: a.size,
      type: a.type,
      path: a.path,
      fieldId: a.fieldId,
      uploadedBy: employee.name,
      uploadedAt: a.uploadedAt ? new Date(a.uploadedAt) : new Date(),
    }));

    const request = await Request.create({
      requestNumber: generateRequestNumber(),
      formId,
      formTitle: formMeta.title,
      formVersion: formMeta.currentVersion,
      mdApprove,
      department: employee.department,
      category: formMeta.category,
      employee,
      status: 'pending_approval',
      answers,
      workflow,
      currentStep: 1,
      comments: [{
        id: `c-${uuidv4().slice(0, 8)}`,
        by: 'System',
        role: 'Automated',
        text: 'Request submitted successfully. Routed for approval.',
        timestamp: new Date(),
        type: 'system',
      }],
      attachments: normalizedAttachments,
      priority,
      dueDate,
      slaHours: formMeta.slaHours,
      submittedAt: new Date(),
    });

    await notificationService.notifyApprovalRequired(request);
    return mapRequestToFrontend(request);
  }

  async getRequestById(id) {
    const request = await Request.findById(id);
    if (!request) throw new AppError('Request not found', 404);
    await ensureMdWorkflow(request);
    return mapRequestToFrontend(request);
  }

  async getRequestsByEmployee(employeeId, user = null) {
    const query = { 'employee.id': employeeId.toUpperCase() };
    const scopedQuery = mergeRequestScope(query, user);
    const requests = await Request.find(scopedQuery).sort('-submittedAt');
    return requests.map(mapRequestToFrontend);
  }

  async getAssignedToUser(user) {
    const userEmpId = String(user.employeeId || '').trim();
    const results = [];
    const seen = new Set();

    const assigneeOr = [];
    if (userEmpId) {
      assigneeOr.push({ assignedToEmployeeId: userEmpId });
      assigneeOr.push({ 'assignees.employeeId': userEmpId });
    }
    if (user._id) {
      assigneeOr.push({ assignedToUserId: user._id });
    }

    if (assigneeOr.length) {
      const workTasks = await Request.find({
        status: 'processing',
        $or: assigneeOr,
        queueStatus: { $in: ['pending', 'in_progress', 'pending_hod_review'] },
      }).sort('-updatedAt');

      for (const doc of workTasks) {
        const id = doc._id.toString();
        if (seen.has(id)) continue;
        seen.add(id);
        results.push(withTaskType(doc, 'work'));
      }
    }

    if (isHod(user.role) || isSuperAdmin(user.role)) {
      const confirmTasks = await Request.find({
        status: 'processing',
        queueStatus: 'pending_hod_review',
      }).sort('-updatedAt');

      for (const doc of confirmTasks) {
        if (!isSuperAdmin(user.role) && !this.isReceiverDeptHod(user, doc)) continue;
        const id = doc._id.toString();
        if (seen.has(id)) {
          const existing = results.find((t) => t.id === id);
          if (existing) existing.taskType = 'confirm_completion';
          continue;
        }
        seen.add(id);
        results.push(withTaskType(doc, 'confirm_completion'));
      }
    }

    return results;
  }

  async listRequests(filters = {}, options = {}, user = null) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.department) query.department = new RegExp(filters.department, 'i');
    if (filters.formId) query.formId = filters.formId;
    if (filters.employeeId) query['employee.id'] = filters.employeeId.toUpperCase();
    if (filters.search) {
      query.$or = [
        { requestNumber: new RegExp(filters.search, 'i') },
        { formTitle: new RegExp(filters.search, 'i') },
        { 'employee.name': new RegExp(filters.search, 'i') },
        { 'employee.id': new RegExp(filters.search, 'i') },
      ];
    }

    const scopedQuery = mergeRequestScope(query, user);
    const { items, pagination } = await paginatedFind(Request, scopedQuery, options);
    for (const item of items) {
      await ensureMdWorkflow(item);
    }
    return { requests: items.map(mapRequestToFrontend), pagination };
  }

  async addComment(requestId, { by, role, text, type = 'comment' }) {
    const request = await Request.findById(requestId);
    if (!request) throw new AppError('Request not found', 404);

    request.comments.push({
      id: `c-${uuidv4().slice(0, 8)}`,
      by,
      role,
      text,
      timestamp: new Date(),
      type,
    });
    await request.save();
    return mapRequestToFrontend(request);
  }

  isReceiverDeptHod(user, request) {
    if (isSuperAdmin(user.role)) return true;
    if (!isHod(user.role)) return false;
    return departmentsMatch(user.department, request.department || request.employee?.department);
  }

  async acceptForProcessing(requestId, user, remarks) {
    const request = await Request.findById(requestId);
    if (!request) throw new AppError('Request not found', 404);
    await ensureMdWorkflow(request);
    if (!canAccessRequest(user, request)) {
      throw new AppError('You do not have access to this request', 403);
    }

    const step = workflowEngine.getCurrentStep(request);
    if (!step || step.type !== 'department_processor' || step.status !== 'pending') {
      throw new AppError('This request is not awaiting department acceptance', 400);
    }

    if (!canReceiverHodAcceptNow(request)) {
      const mdStep = request.workflow?.find((s) => s.type === 'specific_role' && s.role === 'md');
      if (mdStep && mdStep.status !== 'approved') {
        throw new AppError('Managing Director must approve this request before department acceptance', 400);
      }
      throw new AppError('All prior approval steps must be completed before department acceptance', 400);
    }

    if (request.receiverApprovedBy) {
      throw new AppError('This request is already accepted for processing', 400);
    }

    if (!this.isReceiverDeptHod(user, request)) {
      throw new AppError('Only the receiving department HOD can accept this request', 403);
    }

    request.receiverApprovedBy = user.name;
    request.receiverApprovedAt = new Date();
    request.status = 'processing';
    request.queueStatus = request.queueStatus || 'pending';

    request.comments.push({
      id: `c-${uuidv4().slice(0, 8)}`,
      by: user.name,
      role: user.role.replace(/_/g, ' '),
      text: remarks || `Accepted for processing by ${request.department || 'department'} HOD`,
      timestamp: new Date(),
      type: 'action',
    });

    await request.save();

    await ApprovalLog.create({
      requestId: request._id,
      requestNumber: request.requestNumber,
      action: 'accept',
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      department: user.department,
      remarks: remarks || 'Accepted for department processing',
      stepIndex: request.currentStep - 1,
      stepName: step.name,
    });

    return mapRequestToFrontend(request);
  }

  async assignRequest(requestId, staffIdOrIds, user) {
    const request = await Request.findById(requestId);
    if (!request) throw new AppError('Request not found', 404);
    if (!canAccessRequest(user, request)) {
      throw new AppError('You do not have access to this request', 403);
    }

    const step = workflowEngine.getCurrentStep(request);
    if (!step || step.type !== 'department_processor' || step.status !== 'pending') {
      throw new AppError('This request is not ready for work assignment', 400);
    }

    if (!request.receiverApprovedBy) {
      throw new AppError('Receiving department HOD must accept before assigning staff', 400);
    }

    if (!this.isReceiverDeptHod(user, request) && !isSuperAdmin(user.role)) {
      throw new AppError('You are not authorized to assign work', 403);
    }

    if (['in_progress', 'pending_hod_review'].includes(request.queueStatus)) {
      throw new AppError('Work is already in progress; cannot reassign', 400);
    }

    const ids = (Array.isArray(staffIdOrIds) ? staffIdOrIds : [staffIdOrIds])
      .map((id) => String(id || '').trim())
      .filter(Boolean);
    if (!ids.length) throw new AppError('At least one Staff ID is required', 400);

    if (!request.assignees) request.assignees = [];

    const added = [];
    const receiverDept = request.department || request.employee?.department;
    for (const id of ids) {
      if (request.assignees.some((a) => String(a.employeeId) === id)) continue;
      const employee = await hrmsService.getEmployee(id, undefined, { mode: 'auto' });
      if (
        receiverDept
        && employee.department
        && !isSuperAdmin(user.role)
        && !departmentsMatch(employee.department, receiverDept)
      ) {
        throw new AppError(
          `${employee.name} (${id}) is in ${employee.department}. Assign only staff from ${receiverDept}.`,
          400,
        );
      }
      const assigneeUser = await User.findOne({
        $or: [{ employeeId: id }, { email: `${id.toLowerCase()}@portal.local` }],
        active: true,
      });
      request.assignees.push({
        employeeId: id,
        name: employee.name,
        userId: assigneeUser?._id || null,
        status: 'pending',
      });
      added.push(`${employee.name} (${id})`);
    }

    if (!added.length) throw new AppError('All staff IDs are already assigned', 400);

    const primary = request.assignees[0];
    request.assignedTo = primary.name;
    request.assignedToEmployeeId = primary.employeeId;
    request.assignedToUserId = primary.userId || null;
    step.assignee = request.assignees.map((a) => a.name).join(', ');
    request.status = 'processing';
    request.queueStatus = 'pending';

    request.comments.push({
      id: `c-${uuidv4().slice(0, 8)}`,
      by: user.name,
      role: user.role.replace(/_/g, ' '),
      text: `Assigned to: ${added.join(', ')}`,
      timestamp: new Date(),
      type: 'action',
    });

    await request.save();

    await ApprovalLog.create({
      requestId: request._id,
      requestNumber: request.requestNumber,
      action: 'assign',
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      department: user.department,
      remarks: added.join(', '),
      stepIndex: request.currentStep - 1,
      stepName: step.name,
    });

    return mapRequestToFrontend(request);
  }

  canUserWorkOnRequest(user, request) {
    if (!user || !request) return false;
    if (isSuperAdmin(user.role)) return true;
    const userEmpId = String(user.employeeId || '').trim();
    const assignees = request.assignees || [];
    if (assignees.length) {
      return assignees.some((a) => {
        if (userEmpId && String(a.employeeId) === userEmpId) return true;
        if (a.userId && String(a.userId) === String(user._id)) return true;
        return false;
      });
    }
    const empId = String(request.assignedToEmployeeId || '').trim();
    if (empId && userEmpId && empId === userEmpId) return true;
    if (request.assignedToUserId && String(request.assignedToUserId) === String(user._id)) return true;
    if (request.assignedTo && String(request.assignedTo).trim().toLowerCase() === String(user.name).trim().toLowerCase()) {
      return true;
    }
    return false;
  }

  async updateQueueStatus(requestId, { queueStatus, assignedTo, assignedToUserId, user }) {
    const request = await Request.findById(requestId);
    if (!request) throw new AppError('Request not found', 404);
    if (!canAccessRequest(user, request)) {
      throw new AppError('You do not have access to this request', 403);
    }
    const hasAssignees = (request.assignees?.length || 0) > 0 || request.assignedToEmployeeId;
    if (!hasAssignees) {
      throw new AppError('Assign staff before starting work', 400);
    }
    if (!this.canUserWorkOnRequest(user, request)) {
      throw new AppError('Only assigned staff can update this work', 403);
    }

    if (queueStatus === 'in_progress' && request.queueStatus !== 'pending') {
      throw new AppError('Work can only be started from assigned status', 400);
    }

    request.queueStatus = queueStatus;
    if (assignedTo) request.assignedTo = assignedTo;
    if (assignedToUserId) request.assignedToUserId = assignedToUserId;

    if (queueStatus === 'in_progress') {
      request.status = 'processing';
      const userEmpId = String(user.employeeId || '').trim();
      for (const a of request.assignees || []) {
        if (userEmpId && String(a.employeeId) === userEmpId) a.status = 'in_progress';
        else if (a.userId && String(a.userId) === String(user._id)) a.status = 'in_progress';
      }
    }
    if (queueStatus === 'cancelled') request.status = 'cancelled';

    request.comments.push({
      id: `c-${uuidv4().slice(0, 8)}`,
      by: user.name,
      role: user.role.replace(/_/g, ' '),
      text: queueStatus === 'in_progress' ? 'Work started' : `Queue status: ${queueStatus}`,
      timestamp: new Date(),
      type: 'action',
    });

    await request.save();

    await ApprovalLog.create({
      requestId: request._id,
      requestNumber: request.requestNumber,
      action: queueStatus === 'in_progress' ? 'start' : queueStatus,
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      department: user.department,
    });

    return mapRequestToFrontend(request);
  }

  async submitForReview(requestId, remarks, user) {
    const request = await Request.findById(requestId);
    if (!request) throw new AppError('Request not found', 404);

    const hasAssignees = (request.assignees?.length || 0) > 0 || request.assignedToEmployeeId;
    if (!hasAssignees) throw new AppError('Assign staff before finishing work', 400);
    if (!this.canUserWorkOnRequest(user, request)) {
      throw new AppError('Only assigned staff can finish this work', 403);
    }
    if (request.queueStatus !== 'in_progress') {
      throw new AppError('Work must be in progress before finishing', 400);
    }
    if (!String(remarks || '').trim()) {
      throw new AppError('Remarks are required when finishing work', 400);
    }

    const trimmed = String(remarks).trim();
    request.queueStatus = 'pending_hod_review';
    request.status = 'processing';
    request.staffFinishRemarks = trimmed;
    request.staffFinishedBy = user.name;
    request.staffFinishedAt = new Date();

    const userEmpId = String(user.employeeId || '').trim();
    for (const a of request.assignees || []) {
      if (userEmpId && String(a.employeeId) === userEmpId) a.status = 'completed';
      else if (a.userId && String(a.userId) === String(user._id)) a.status = 'completed';
    }

    request.comments.push({
      id: `c-${uuidv4().slice(0, 8)}`,
      by: user.name,
      role: user.role.replace(/_/g, ' '),
      text: `Work finished — submitted for HOD review: ${trimmed}`,
      timestamp: new Date(),
      type: 'action',
    });

    await request.save();

    await ApprovalLog.create({
      requestId: request._id,
      requestNumber: request.requestNumber,
      action: 'submit_for_review',
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      department: user.department,
      remarks: trimmed,
      stepIndex: request.currentStep - 1,
      stepName: workflowEngine.getCurrentStep(request)?.name,
    });

    await notificationService.notifyCompletionReviewRequired(request, user);

    return mapRequestToFrontend(request);
  }

  async confirmCompletion(requestId, remarks, user) {
    const request = await Request.findById(requestId);
    if (!request) throw new AppError('Request not found', 404);
    if (!canAccessRequest(user, request)) {
      throw new AppError('You do not have access to this request', 403);
    }
    if (!this.isReceiverDeptHod(user, request) && !isSuperAdmin(user.role)) {
      throw new AppError('Only the receiving department HOD can confirm completion', 403);
    }
    if (request.queueStatus !== 'pending_hod_review') {
      throw new AppError('This request is not awaiting completion confirmation', 400);
    }

    const step = workflowEngine.getCurrentStep(request);
    await workflowEngine.completeProcessing(request, {
      userName: user.name,
      remarks: remarks?.trim() || request.staffFinishRemarks || 'Work confirmed complete',
    });

    request.comments.push({
      id: `c-${uuidv4().slice(0, 8)}`,
      by: user.name,
      role: user.role.replace(/_/g, ' '),
      text: remarks?.trim() || 'Completion confirmed by department HOD',
      timestamp: new Date(),
      type: 'action',
    });

    await request.save();

    await ApprovalLog.create({
      requestId: request._id,
      requestNumber: request.requestNumber,
      action: 'confirm_completion',
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      department: user.department,
      remarks: remarks?.trim() || request.staffFinishRemarks,
      stepIndex: request.currentStep - 1,
      stepName: step?.name,
    });

    await notificationService.notifyCompleted(request);

    return mapRequestToFrontend(request);
  }

  async sendBackForRework(requestId, remarks, user) {
    const request = await Request.findById(requestId);
    if (!request) throw new AppError('Request not found', 404);
    if (!canAccessRequest(user, request)) {
      throw new AppError('You do not have access to this request', 403);
    }
    if (!this.isReceiverDeptHod(user, request) && !isSuperAdmin(user.role)) {
      throw new AppError('Only the receiving department HOD can send work back', 403);
    }
    if (request.queueStatus !== 'pending_hod_review') {
      throw new AppError('This request is not awaiting completion confirmation', 400);
    }
    if (!String(remarks || '').trim()) {
      throw new AppError('Remarks are required when sending back for rework', 400);
    }

    const trimmed = String(remarks).trim();
    const finishedBy = request.staffFinishedBy;
    request.queueStatus = 'in_progress';
    request.status = 'processing';
    request.staffFinishRemarks = undefined;
    request.staffFinishedBy = undefined;
    request.staffFinishedAt = undefined;

    const userEmpId = String(user.employeeId || '').trim();
    for (const a of request.assignees || []) {
      if (finishedBy && a.name === finishedBy) {
        a.status = 'in_progress';
      } else if (userEmpId && String(a.employeeId) === userEmpId) {
        a.status = 'in_progress';
      }
    }

    request.comments.push({
      id: `c-${uuidv4().slice(0, 8)}`,
      by: user.name,
      role: user.role.replace(/_/g, ' '),
      text: `Sent back for rework: ${trimmed}`,
      timestamp: new Date(),
      type: 'action',
    });

    await request.save();

    await ApprovalLog.create({
      requestId: request._id,
      requestNumber: request.requestNumber,
      action: 'send_back_rework',
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      department: user.department,
      remarks: trimmed,
      stepIndex: request.currentStep - 1,
      stepName: workflowEngine.getCurrentStep(request)?.name,
    });

    return mapRequestToFrontend(request);
  }
}

export default new RequestService();
