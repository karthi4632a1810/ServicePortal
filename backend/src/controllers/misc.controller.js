import WorkflowTemplate from '../models/WorkflowTemplate.js';
import { dashboardService, searchService, auditService } from '../services/dashboard.service.js';
import departmentService from '../services/department.service.js';
import notificationService from '../services/notification.service.js';
import { successResponse } from '../utils/response.js';
import { formatFileSize } from '../utils/helpers.js';
import { toRelativeUploadPath, toPublicUploadUrl } from '../utils/uploadPaths.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export const workflowController = {
  list: async (req, res, next) => {
    try {
      const templates = await WorkflowTemplate.find({ active: true });
      return successResponse(res, { message: 'Workflow templates retrieved', data: templates });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req, res, next) => {
    try {
      const template = await WorkflowTemplate.findOne({ templateId: req.params.id });
      return successResponse(res, { message: 'Workflow template retrieved', data: template });
    } catch (err) {
      next(err);
    }
  },
};

export const dashboardController = {
  stats: async (req, res, next) => {
    try {
      const stats = await dashboardService.getStats(req.user);
      return successResponse(res, { message: 'Dashboard stats retrieved', data: stats });
    } catch (err) {
      next(err);
    }
  },

  weeklyChart: async (req, res, next) => {
    try {
      const data = await dashboardService.getWeeklyChart(req.user);
      return successResponse(res, { message: 'Weekly chart data retrieved', data });
    } catch (err) {
      next(err);
    }
  },

  statusChart: async (req, res, next) => {
    try {
      const data = await dashboardService.getStatusChart(req.user);
      return successResponse(res, { message: 'Status chart data retrieved', data });
    } catch (err) {
      next(err);
    }
  },

  departmentChart: async (req, res, next) => {
    try {
      const data = await dashboardService.getDepartmentChart(req.user);
      return successResponse(res, { message: 'Department chart data retrieved', data });
    } catch (err) {
      next(err);
    }
  },

  recentRequests: async (req, res, next) => {
    try {
      const data = await dashboardService.getRecentRequests(parseInt(req.query.limit, 10) || 5, req.user);
      return successResponse(res, { message: 'Recent requests retrieved', data });
    } catch (err) {
      next(err);
    }
  },
};

export const searchController = {
  search: async (req, res, next) => {
    try {
      const result = await searchService.search(req.query, req.user);
      return successResponse(res, {
        message: 'Search completed',
        data: result.results,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  },
};

export const auditController = {
  list: async (req, res, next) => {
    try {
      const result = await auditService.list(req.query);
      return successResponse(res, {
        message: 'Audit logs retrieved',
        data: result.logs,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  },
};

export const departmentController = {
  list: async (req, res, next) => {
    try {
      const departments = await departmentService.list();
      return successResponse(res, { message: 'Departments retrieved', data: departments });
    } catch (err) {
      next(err);
    }
  },

  queue: async (req, res, next) => {
    try {
      const result = await departmentService.getQueue(req.params.code, req.query);
      return successResponse(res, {
        message: 'Department queue retrieved',
        data: result.items,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  },
};

export const notificationController = {
  list: async (req, res, next) => {
    try {
      const result = await notificationService.getForUser(req.user._id, req.query);
      return successResponse(res, {
        message: 'Notifications retrieved',
        data: result.items,
        pagination: { total: result.total, page: result.page, limit: result.limit },
      });
    } catch (err) {
      next(err);
    }
  },
};

export const uploadController = {
  upload: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      const relativePath = toRelativeUploadPath(req.file.path);
      const data = {
        id: `att-${uuidv4().slice(0, 8)}`,
        name: req.file.originalname,
        size: formatFileSize(req.file.size),
        type: req.file.mimetype || path.extname(req.file.originalname).slice(1).toLowerCase() || 'application/octet-stream',
        path: relativePath,
        url: toPublicUploadUrl(relativePath),
        fieldId: req.uploadContext?.fieldId,
        batchKey: req.uploadContext?.batchKey,
        uploadedAt: new Date().toISOString(),
      };
      return successResponse(res, { message: 'File uploaded', data, statusCode: 201 });
    } catch (err) {
      next(err);
    }
  },
};
