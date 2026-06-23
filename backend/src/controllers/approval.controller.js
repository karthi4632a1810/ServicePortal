import approvalService from '../services/approval.service.js';
import { successResponse } from '../utils/response.js';
import { createAuditLog, getClientMeta } from '../middleware/audit.js';

export const approvalController = {
  list: async (req, res, next) => {
    try {
      const { status, page, limit } = req.query;
      const result = await approvalService.getPendingForUser(req.user, { status, page, limit });
      return successResponse(res, {
        message: 'Approvals retrieved',
        data: result.requests,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  },

  approve: async (req, res, next) => {
    try {
      const request = await approvalService.processAction(req.params.requestId, 'approve', {
        user: req.user,
        remarks: req.body.remarks,
      });
      const meta = getClientMeta(req);
      await createAuditLog({
        action: 'REQUEST_APPROVED',
        entity: 'Request',
        entityId: request.requestNumber,
        user: req.user.name,
        userId: req.user._id,
        department: req.user.department,
        ip: meta.ip,
        browser: meta.browser,
        details: `Request approved: ${request.requestNumber}`,
        severity: 'success',
      });
      return successResponse(res, { message: 'Request approved', data: request });
    } catch (err) {
      next(err);
    }
  },

  reject: async (req, res, next) => {
    try {
      const request = await approvalService.processAction(req.params.requestId, 'reject', {
        user: req.user,
        remarks: req.body.remarks,
      });
      const meta = getClientMeta(req);
      await createAuditLog({
        action: 'REQUEST_REJECTED',
        entity: 'Request',
        entityId: request.requestNumber,
        user: req.user.name,
        userId: req.user._id,
        department: req.user.department,
        ip: meta.ip,
        browser: meta.browser,
        details: `Request rejected: ${request.requestNumber}`,
        severity: 'error',
      });
      return successResponse(res, { message: 'Request rejected', data: request });
    } catch (err) {
      next(err);
    }
  },

  forward: async (req, res, next) => {
    try {
      const request = await approvalService.processAction(req.params.requestId, 'forward', {
        user: req.user,
        remarks: req.body.remarks,
      });
      return successResponse(res, { message: 'Request forwarded', data: request });
    } catch (err) {
      next(err);
    }
  },

  requestInfo: async (req, res, next) => {
    try {
      const request = await approvalService.processAction(req.params.requestId, 'request_info', {
        user: req.user,
        remarks: req.body.remarks,
      });
      return successResponse(res, { message: 'More information requested', data: request });
    } catch (err) {
      next(err);
    }
  },
};
