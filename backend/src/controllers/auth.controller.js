import { z } from 'zod';
import authService from '../services/auth.service.js';
import { successResponse } from '../utils/response.js';
import { AppError } from '../utils/response.js';

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

const preferencesSchema = z.object({
  body: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    compactMode: z.boolean().optional(),
    animations: z.boolean().optional(),
  }),
});

export const authController = {
  login: async (req, res, next) => {
    try {
      const parsed = loginSchema.parse({ body: req.body });
      const { email, password } = parsed.body;
      const result = await authService.login(email, password, req);
      return successResponse(res, { message: 'Login successful', data: result });
    } catch (err) {
      if (err instanceof AppError) return next(err);
      if (err.name === 'ZodError') return next(new AppError(err.errors.map((e) => e.message).join(', '), 400));
      next(err);
    }
  },

  me: async (req, res, next) => {
    try {
      const user = await authService.getMe(req.user._id);
      return successResponse(res, { message: 'User profile retrieved', data: user });
    } catch (err) {
      next(err);
    }
  },

  logout: async (req, res) => {
    return successResponse(res, { message: 'Logged out successfully', data: null });
  },

  listUsers: async (req, res, next) => {
    try {
      const users = await authService.listUsers();
      return successResponse(res, { message: 'Users retrieved', data: users });
    } catch (err) {
      next(err);
    }
  },

  updatePreferences: async (req, res, next) => {
    try {
      const parsed = preferencesSchema.parse({ body: req.body });
      const preferences = await authService.updatePreferences(req.user._id, parsed.body);
      return successResponse(res, { message: 'Preferences updated', data: preferences });
    } catch (err) {
      if (err instanceof AppError) return next(err);
      if (err.name === 'ZodError') return next(new AppError(err.errors.map((e) => e.message).join(', '), 400));
      next(err);
    }
  },
};
