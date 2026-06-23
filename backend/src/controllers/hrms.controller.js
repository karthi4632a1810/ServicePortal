import hrmsService from '../services/hrms.service.js';
import { successResponse } from '../utils/response.js';

export const hrmsController = {
  health: async (req, res, next) => {
    try {
      const status = await hrmsService.testConnection();
      return successResponse(res, {
        message: status.message,
        data: status,
        statusCode: status.connected ? 200 : 503,
      });
    } catch (err) {
      next(err);
    }
  },

  getEmployee: async (req, res, next) => {
    try {
      const phone = req.query.phone ? String(req.query.phone) : undefined;
      const employee = await hrmsService.getEmployee(req.params.employeeId, phone);
      return successResponse(res, { message: 'Employee verified from HRMS', data: employee });
    } catch (err) {
      err.statusCode = err.statusCode || 404;
      next(err);
    }
  },

  getColumns: async (req, res, next) => {
    try {
      const columns = await hrmsService.getTableColumns();
      return successResponse(res, {
        message: 'HRMS table columns',
        data: { columns },
      });
    } catch (err) {
      next(err);
    }
  },

  getDepartments: async (req, res, next) => {
    try {
      const departments = await hrmsService.getDepartments();
      return successResponse(res, { message: 'Departments loaded from HRMS', data: departments });
    } catch (err) {
      next(err);
    }
  },

  getDesignations: async (req, res, next) => {
    try {
      const departmentId = req.query.departmentId;
      const designations = await hrmsService.getDesignations(departmentId);
      return successResponse(res, { message: 'Designations loaded from HRMS', data: designations });
    } catch (err) {
      err.statusCode = err.statusCode || 400;
      next(err);
    }
  },
};
