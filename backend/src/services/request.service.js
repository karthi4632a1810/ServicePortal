import { v4 as uuidv4 } from 'uuid';
import Request from '../models/Request.js';
import Form from '../models/Form.js';
import ApprovalLog from '../models/ApprovalLog.js';
import { generateRequestNumber } from '../utils/helpers.js';
import { paginatedFind } from '../utils/pagination.js';
import { AppError } from '../utils/response.js';
import workflowEngine from './workflowEngine.service.js';
import hrmsService from './hrms.service.js';
import formService from './form.service.js';
import notificationService from './notification.service.js';
import { mergeRequestScope, canAccessRequest } from '../utils/requestScope.js';

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
    attachments: r.attachments,
    priority: r.priority,
    assignedTo: r.assignedTo,
    dueDate: r.dueDate?.toISOString?.() || r.dueDate,
    queueStatus: r.queueStatus,
  };
}

export class RequestService {
  async createRequest({ employeeId, formId, answers, priority = 'medium', attachments = [] }) {
    const employee = await hrmsService.getEmployee(employeeId);
    if (employee.status === 'inactive') {
      throw new AppError('Employee is not active', 400);
    }

    const formMeta = await Form.findOne({ formId, active: true });
    if (!formMeta) throw new AppError('Form not found or inactive', 404);

    const workflow = await workflowEngine.buildWorkflow(formMeta.workflowTemplateId, employee);
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + (formMeta.slaHours || 48));

    const request = await Request.create({
      requestNumber: generateRequestNumber(),
      formId,
      formTitle: formMeta.title,
      formVersion: formMeta.currentVersion,
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
      attachments,
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
    return mapRequestToFrontend(request);
  }

  async getRequestsByEmployee(employeeId, user = null) {
    const query = { 'employee.id': employeeId.toUpperCase() };
    const scopedQuery = mergeRequestScope(query, user);
    const requests = await Request.find(scopedQuery).sort('-submittedAt');
    return requests.map(mapRequestToFrontend);
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

  async updateQueueStatus(requestId, { queueStatus, assignedTo, assignedToUserId, user }) {
    const request = await Request.findById(requestId);
    if (!request) throw new AppError('Request not found', 404);

    request.queueStatus = queueStatus;
    if (assignedTo) request.assignedTo = assignedTo;
    if (assignedToUserId) request.assignedToUserId = assignedToUserId;

    if (queueStatus === 'in_progress') request.status = 'processing';
    if (queueStatus === 'completed') {
      await workflowEngine.completeProcessing(request, { userName: user.name, remarks: 'Queue processing completed' });
    }
    if (queueStatus === 'cancelled') request.status = 'cancelled';

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
}

export default new RequestService();
