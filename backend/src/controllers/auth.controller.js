import { z } from 'zod';
import authService from '../services/auth.service.js';
import { successResponse } from '../utils/response.js';
import { AppError } from '../utils/response.js';

const loginSchema = z.object({
  body: z.object({
    email: z.string().min(1).optional(),
    staffId: z.string().min(1).optional(),
    identifier: z.string().min(1).optional(),
    password: z.string().min(1),
  }).refine((body) => body.identifier || body.email || body.staffId, {
    message: 'Email or Staff ID is required',
  }),
});

const employeeLoginSchema = z.object({
  body: z.object({
    staffId: z.string().min(1),
    password: z.string().min(1),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1),
    newPassword: z.string().min(4),
    confirmPassword: z.string().min(4),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    newPassword: z.string().min(4),
    confirmPassword: z.string().min(4),
  }),
});

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    department: z.string().min(1).optional(),
    role: z.enum(['employee', 'hod', 'md']).optional(),
    active: z.boolean().optional(),
  }),
});

const createUserSchema = z.object({
  body: z.object({
    staffId: z.string().min(1),
    role: z.enum(['employee', 'hod', 'md']).optional(),
  }),
});

const bulkRoleSchema = z.object({
  body: z.object({
    userIds: z.array(z.string().min(1)).min(1),
    role: z.enum(['employee', 'hod']),
  }),
});

const bulkResetSchema = z.object({
  body: z.object({
    userIds: z.array(z.string().min(1)).min(1),
    newPassword: z.string().min(4).optional(),
    confirmPassword: z.string().min(4).optional(),
  }),
});

const importUsersSchema = z.object({
  body: z.object({
    users: z.array(z.object({
      staffId: z.string().min(1).optional(),
      staff_id: z.string().min(1).optional(),
      employeeId: z.string().min(1).optional(),
      role: z.enum(['employee', 'hod', 'md']).optional(),
    }).refine((u) => u.staffId || u.staff_id || u.employeeId, {
      message: 'Each entry needs staffId, staff_id, or employeeId',
    })).min(1),
  }),
});

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

const preferencesSchema = z.object({
  body: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    accentColor: hexColor.optional(),
    sidebarColor: z.union([hexColor, z.null()]).optional(),
    backgroundColor: z.union([hexColor, z.null()]).optional(),
    compactMode: z.boolean().optional(),
    animations: z.boolean().optional(),
  }),
});

const notificationPreferencesSchema = z.object({
  body: z.object({
    inAppRealtime: z.boolean().optional(),
    inAppNewTask: z.boolean().optional(),
    inAppSubmitted: z.boolean().optional(),
    inAppApprovalRequired: z.boolean().optional(),
    inAppRequestApproved: z.boolean().optional(),
    inAppRequestRejected: z.boolean().optional(),
    inAppRequestCompleted: z.boolean().optional(),
    inAppSlaReminder: z.boolean().optional(),
  }),
});

export const authController = {
  login: async (req, res, next) => {
    try {
      const parsed = loginSchema.parse({ body: req.body });
      const { email, staffId, identifier, password } = parsed.body;
      const loginId = identifier || email || staffId;
      const result = await authService.loginWithIdentifier(loginId, password, req);
      return successResponse(res, { message: 'Login successful', data: result });
    } catch (err) {
      if (err instanceof AppError) return next(err);
      if (err.name === 'ZodError') return next(new AppError(err.errors.map((e) => e.message).join(', '), 400));
      next(err);
    }
  },

  employeeLogin: async (req, res, next) => {
    try {
      const parsed = employeeLoginSchema.parse({ body: req.body });
      const { staffId, password } = parsed.body;
      const result = await authService.employeeLogin(staffId, password, req);
      return successResponse(res, { message: 'Login successful', data: result });
    } catch (err) {
      if (err instanceof AppError) return next(err);
      if (err.name === 'ZodError') return next(new AppError(err.errors.map((e) => e.message).join(', '), 400));
      next(err);
    }
  },

  changePassword: async (req, res, next) => {
    try {
      const parsed = changePasswordSchema.parse({ body: req.body });
      const { oldPassword, newPassword, confirmPassword } = parsed.body;
      if (newPassword !== confirmPassword) {
        throw new AppError('New password and confirmation do not match', 400);
      }
      await authService.changePassword(req.user._id, oldPassword, newPassword);
      return successResponse(res, { message: 'Password changed successfully', data: null });
    } catch (err) {
      if (err instanceof AppError) return next(err);
      if (err.name === 'ZodError') return next(new AppError(err.errors.map((e) => e.message).join(', '), 400));
      next(err);
    }
  },

  resetUserPassword: async (req, res, next) => {
    try {
      const parsed = resetPasswordSchema.parse({ body: req.body });
      const { newPassword, confirmPassword } = parsed.body;
      if (newPassword !== confirmPassword) {
        throw new AppError('New password and confirmation do not match', 400);
      }
      const user = await authService.resetUserPassword(req.user, req.params.id, newPassword, req);
      return successResponse(res, { message: 'Password reset successfully', data: user });
    } catch (err) {
      if (err instanceof AppError) return next(err);
      if (err.name === 'ZodError') return next(new AppError(err.errors.map((e) => e.message).join(', '), 400));
      next(err);
    }
  },

  updateUser: async (req, res, next) => {
    try {
      const parsed = updateUserSchema.parse({ body: req.body });
      const user = await authService.updateUser(req.user, req.params.id, parsed.body, req);
      return successResponse(res, { message: 'User updated successfully', data: user });
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

  createUser: async (req, res, next) => {
    try {
      const parsed = createUserSchema.parse({ body: req.body });
      const { staffId, role } = parsed.body;
      const user = await authService.createUserFromStaffId(req.user, staffId, role || 'employee', req);
      return successResponse(res, { message: 'User created successfully', data: user });
    } catch (err) {
      if (err instanceof AppError) return next(err);
      if (err.name === 'ZodError') return next(new AppError(err.errors.map((e) => e.message).join(', '), 400));
      next(err);
    }
  },

  bulkUpdateRole: async (req, res, next) => {
    try {
      const parsed = bulkRoleSchema.parse({ body: req.body });
      const users = await authService.bulkUpdateRole(req.user, parsed.body.userIds, parsed.body.role, req);
      return successResponse(res, { message: 'Roles updated', data: users });
    } catch (err) {
      if (err instanceof AppError) return next(err);
      if (err.name === 'ZodError') return next(new AppError(err.errors.map((e) => e.message).join(', '), 400));
      next(err);
    }
  },

  bulkResetPassword: async (req, res, next) => {
    try {
      const parsed = bulkResetSchema.parse({ body: req.body });
      const { userIds, newPassword, confirmPassword } = parsed.body;
      const password = newPassword || 'mapims';
      if (newPassword && newPassword !== confirmPassword) {
        throw new AppError('New password and confirmation do not match', 400);
      }
      const users = await authService.bulkResetPassword(req.user, userIds, password, req);
      return successResponse(res, { message: 'Passwords reset successfully', data: users });
    } catch (err) {
      if (err instanceof AppError) return next(err);
      if (err.name === 'ZodError') return next(new AppError(err.errors.map((e) => e.message).join(', '), 400));
      next(err);
    }
  },

  importUsers: async (req, res, next) => {
    try {
      const parsed = importUsersSchema.parse({ body: req.body });
      const summary = await authService.importUsers(req.user, parsed.body.users, req);
      return successResponse(res, { message: 'Import completed', data: summary });
    } catch (err) {
      if (err instanceof AppError) return next(err);
      if (err.name === 'ZodError') return next(new AppError(err.errors.map((e) => e.message).join(', '), 400));
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

  updateNotificationPreferences: async (req, res, next) => {
    try {
      const parsed = notificationPreferencesSchema.parse({ body: req.body });
      const notificationPreferences = await authService.updateNotificationPreferences(req.user._id, parsed.body);
      return successResponse(res, { message: 'Notification preferences updated', data: notificationPreferences });
    } catch (err) {
      if (err instanceof AppError) return next(err);
      if (err.name === 'ZodError') return next(new AppError(err.errors.map((e) => e.message).join(', '), 400));
      next(err);
    }
  },
};
