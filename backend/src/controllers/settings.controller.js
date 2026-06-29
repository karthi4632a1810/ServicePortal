import settingsService from '../services/settings.service.js';
import { successResponse } from '../utils/response.js';

export const settingsController = {
  getOrganization: async (req, res, next) => {
    try {
      const data = await settingsService.getOrganization();
      return successResponse(res, { message: 'Organization settings retrieved', data });
    } catch (err) {
      next(err);
    }
  },

  updateOrganization: async (req, res, next) => {
    try {
      const data = await settingsService.updateOrganization(req.body, req.user);
      return successResponse(res, { message: 'Organization settings saved', data });
    } catch (err) {
      next(err);
    }
  },
};
