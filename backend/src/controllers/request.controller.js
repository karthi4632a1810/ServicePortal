import requestService from '../services/request.service.js';
import { successResponse, AppError } from '../utils/response.js';
import { createAuditLog, getClientMeta } from '../middleware/audit.js';
import hrmsService from '../services/hrms.service.js';
import { canTrackEmployee, canAccessRequest } from '../utils/requestScope.js';
import { isEmployee } from '../utils/roles.js';
export const requestController = {
  list: async (req, res, next) => {
    try {
      const { status, department, formId, employeeId, search, page, limit } = req.query;
      const filters = { status, department, formId, employeeId, search };

      if (req.user.role === 'employee') {
        filters.employeeId = req.user.employeeId;
      }

      const { requests, pagination } = await requestService.listRequests(
        filters,
        { page, limit },
        req.user,
      );
      return successResponse(res, { message: 'Requests retrieved', data: requests, pagination });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req, res, next) => {
    try {
      const request = await requestService.getRequestById(req.params.id);
      if (req.user && !canAccessRequest(req.user, request)) {
        throw new AppError('You do not have access to this request', 403);
      }
      const meta = getClientMeta(req);
      await createAuditLog({
        action: 'REQUEST_VIEWED',
        entity: 'Request',
        entityId: request.requestNumber,
        user: req.user?.name || 'Anonymous',
        userId: req.user?._id,
        department: req.user?.department || request.department,
        ip: meta.ip,
        browser: meta.browser,
        details: `Request ${request.requestNumber} viewed`,
      });
      return successResponse(res, { message: 'Request retrieved', data: request });
    } catch (err) {
      next(err);
    }
  },

  getByEmployee: async (req, res, next) => {
    try {
      const targetId = req.params.employeeId.trim();
      if (req.user) {
        if (isEmployee(req.user.role) && String(req.user.employeeId) !== targetId) {
          throw new AppError('You can only view your own requests', 403);
        }
        if (!isEmployee(req.user.role)) {
          const department = await hrmsService.resolveEmployeeDepartment(targetId);
          if (!canTrackEmployee(req.user, department)) {
            throw new AppError('You can only track staff in your department', 403);
          }
        }
      }
      const requests = await requestService.getRequestsByEmployee(targetId, req.user);
      return successResponse(res, { message: 'Employee requests retrieved', data: requests });
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const { employeeId, formId, answers, priority, attachments } = req.body;
      const request = await requestService.createRequest({
        employeeId, formId, answers, priority, attachments,
      });
      const meta = getClientMeta(req);
      await createAuditLog({
        action: 'REQUEST_SUBMITTED',
        entity: 'Request',
        entityId: request.requestNumber,
        user: request.employee.name,
        department: request.employee.department,
        ip: meta.ip,
        browser: meta.browser,
        details: `${request.formTitle} submitted`,
        severity: 'info',
      });
      return successResponse(res, { message: 'Request submitted successfully', data: request, statusCode: 201 });
    } catch (err) {
      next(err);
    }
  },

  addComment: async (req, res, next) => {
    try {
      const existing = await requestService.getRequestById(req.params.id);
      if (!canAccessRequest(req.user, existing)) {
        throw new AppError('You do not have access to this request', 403);
      }
      const { text } = req.body;
      const request = await requestService.addComment(req.params.id, {
        by: req.user.name,
        role: req.user.role,
        text,
        type: 'comment',
      });
      return successResponse(res, { message: 'Comment added', data: request });
    } catch (err) {
      next(err);
    }
  },

  updateQueue: async (req, res, next) => {
    try {
      const existing = await requestService.getRequestById(req.params.id);
      if (!canAccessRequest(req.user, existing)) {
        throw new AppError('You do not have access to this request', 403);
      }
      const { queueStatus, assignedTo, assignedToUserId } = req.body;
      const request = await requestService.updateQueueStatus(req.params.id, {
        queueStatus, assignedTo, assignedToUserId, user: req.user,
      });
      return successResponse(res, { message: 'Queue status updated', data: request });
    } catch (err) {
      next(err);
    }
  },

  assign: async (req, res, next) => {
    try {
      const { staffId, staffIds } = req.body;
      const ids = staffIds?.length ? staffIds : staffId;
      const request = await requestService.assignRequest(req.params.id, ids, req.user);
      return successResponse(res, { message: 'Work assigned successfully', data: request });
    } catch (err) {
      next(err);
    }
  },

  acceptProcessing: async (req, res, next) => {
    try {
      const { remarks } = req.body;
      const request = await requestService.acceptForProcessing(req.params.id, req.user, remarks);
      return successResponse(res, { message: 'Request accepted for processing', data: request });
    } catch (err) {
      next(err);
    }
  },

  getAssignedToMe: async (req, res, next) => {
    try {
      const requests = await requestService.getAssignedToUser(req.user);
      return successResponse(res, { message: 'Assigned tasks retrieved', data: requests });
    } catch (err) {
      next(err);
    }
  },

  submitForReview: async (req, res, next) => {
    try {
      const { remarks } = req.body;
      const request = await requestService.submitForReview(req.params.id, remarks, req.user);
      return successResponse(res, { message: 'Work submitted for HOD review', data: request });
    } catch (err) {
      next(err);
    }
  },

  confirmCompletion: async (req, res, next) => {
    try {
      const { remarks } = req.body;
      const request = await requestService.confirmCompletion(req.params.id, remarks, req.user);
      return successResponse(res, { message: 'Completion confirmed', data: request });
    } catch (err) {
      next(err);
    }
  },

  sendBackForRework: async (req, res, next) => {
    try {
      const { remarks } = req.body;
      const request = await requestService.sendBackForRework(req.params.id, remarks, req.user);
      return successResponse(res, { message: 'Sent back for rework', data: request });
    } catch (err) {
      next(err);
    }
  },
};
