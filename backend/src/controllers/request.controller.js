import requestService from '../services/request.service.js';
import { successResponse } from '../utils/response.js';
import { createAuditLog, getClientMeta } from '../middleware/audit.js';

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
      );
      return successResponse(res, { message: 'Requests retrieved', data: requests, pagination });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req, res, next) => {
    try {
      const request = await requestService.getRequestById(req.params.id);
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
      const requests = await requestService.getRequestsByEmployee(req.params.employeeId);
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
      const { queueStatus, assignedTo, assignedToUserId } = req.body;
      const request = await requestService.updateQueueStatus(req.params.id, {
        queueStatus, assignedTo, assignedToUserId, user: req.user,
      });
      return successResponse(res, { message: 'Queue status updated', data: request });
    } catch (err) {
      next(err);
    }
  },
};
