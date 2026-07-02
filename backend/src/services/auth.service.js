import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { getInitials } from '../utils/helpers.js';
import { getStaffPhotoUrl } from '../utils/staffPhoto.js';
import { AppError } from '../utils/response.js';
import { createAuditLog, getClientMeta } from '../middleware/audit.js';
import config from '../config/index.js';
import hrmsService from './hrms.service.js';
import { isHrmsDbConfigured } from '../config/hrmsDb.js';
import {
  isSuperAdminAccount,
  SUPER_ADMIN_STAFF_ID,
  SUPER_ADMIN_NAME,
  SUPER_ADMIN_DEPARTMENT,
} from '../seeds/superadmin.js';

export const MANAGEABLE_ROLES = ['employee', 'hod', 'md'];

export class AuthService {
  async login(email, password, req) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.active) {
      throw new AppError('Invalid credentials', 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError('Invalid credentials', 401);

    return this.completeLogin(user, req, 'Email login successful');
  }

  async loginWithIdentifier(identifier, password, req) {
    const id = String(identifier || '').trim();
    if (!id) throw new AppError('Email or Staff ID is required', 400);
    if (!password) throw new AppError('Password is required', 400);

    if (id.includes('@')) {
      return this.login(id, password, req);
    }
    return this.employeeLogin(id, password, req);
  }

  async completeLogin(user, req, details = 'Login successful') {
    const token = signToken(user._id);
    const meta = getClientMeta(req);

    createAuditLog({
      action: 'LOGIN',
      entity: 'Session',
      entityId: user._id.toString(),
      user: user.name,
      userId: user._id,
      department: user.department,
      ip: meta.ip,
      browser: meta.browser,
      details,
      severity: 'info',
    }).catch((err) => console.error('Login audit failed:', err.message));

    return {
      token,
      user: this.formatUser(user),
    };
  }

  formatPreferences(user) {
    const prefs = user.preferences || {};
    return {
      theme: prefs.theme || 'light',
      accentColor: prefs.accentColor || '#2563EB',
      compactMode: prefs.compactMode ?? false,
      animations: prefs.animations ?? true,
    };
  }

  formatNotificationPreferences(user) {
    const n = user.notificationPreferences || {};
    return {
      inAppRealtime: n.inAppRealtime ?? true,
      inAppNewTask: n.inAppNewTask ?? true,
      inAppSubmitted: n.inAppSubmitted ?? true,
      inAppApprovalRequired: n.inAppApprovalRequired ?? true,
      inAppRequestApproved: n.inAppRequestApproved ?? true,
      inAppRequestRejected: n.inAppRequestRejected ?? true,
      inAppRequestCompleted: n.inAppRequestCompleted ?? true,
      inAppSlaReminder: n.inAppSlaReminder ?? true,
    };
  }

  formatUser(user, extras = {}) {
    const employeeId = user.employeeId || null;
    const photoUrl = getStaffPhotoUrl(employeeId);
    return {
      id: user._id.toString(),
      name: user.name,
      role: user.role,
      department: user.department,
      designation: extras.designation || user.designation || null,
      email: user.email,
      initials: user.initials || getInitials(user.name),
      avatar: photoUrl || user.avatar || getInitials(user.name),
      employeeId,
      active: user.active !== false,
      preferences: this.formatPreferences(user),
      notificationPreferences: this.formatNotificationPreferences(user),
    };
  }

  async updateNotificationPreferences(userId, patch) {
    const allowed = [
      'inAppRealtime',
      'inAppNewTask',
      'inAppSubmitted',
      'inAppApprovalRequired',
      'inAppRequestApproved',
      'inAppRequestRejected',
      'inAppRequestCompleted',
      'inAppSlaReminder',
    ];
    const update = {};
    for (const key of allowed) {
      if (patch[key] !== undefined) update[`notificationPreferences.${key}`] = patch[key];
    }
    if (!Object.keys(update).length) {
      throw new AppError('No valid notification preferences provided', 400);
    }

    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true });
    if (!user) throw new AppError('User not found', 404);
    return this.formatNotificationPreferences(user);
  }

  async updatePreferences(userId, patch) {
    const allowed = ['theme', 'accentColor', 'compactMode', 'animations'];
    const update = {};
    for (const key of allowed) {
      if (patch[key] !== undefined) update[`preferences.${key}`] = patch[key];
    }
    if (!Object.keys(update).length) {
      throw new AppError('No valid preferences provided', 400);
    }

    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true });
    if (!user) throw new AppError('User not found', 404);
    return this.formatPreferences(user);
  }

  async enrichFromHrms(user) {
    if (!user?.employeeId || !isHrmsDbConfigured()) return {};
    try {
      const emp = await hrmsService.getEmployee(user.employeeId);
      return {
        designation: emp.designation || null,
        department: emp.department || user.department,
        name: emp.name || user.name,
      };
    } catch {
      return {};
    }
  }

  async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return this.formatUser(user);
  }

  async listUsers({ includeInactive = true } = {}) {
    const filter = includeInactive ? {} : { active: true };
    const users = await User.find(filter).sort({ createdAt: -1 });
    return users.map((u) => this.formatUser(u));
  }

  isDefaultEmployeePassword(password) {
    return String(password || '').trim().toLowerCase() === config.defaultEmployeePassword.toLowerCase();
  }

  async findPortalUserByStaffId(staffId) {
    const id = String(staffId || '').trim();
    if (!id) return null;
    return User.findOne({
      $or: [
        { employeeId: id },
        { email: `${id.toLowerCase()}@portal.local` },
      ],
    }).select('+password');
  }

  async isStaffPortalPasswordValid(user, password) {
    if (await bcrypt.compare(password, user.password)) return true;
    return this.isDefaultEmployeePassword(password) && !user.portalPasswordChangedAt;
  }

  async employeeLogin(staffId, password, req) {
    const id = String(staffId || '').trim();
    if (!id) throw new AppError('Staff ID is required', 400);
    if (!password) throw new AppError('Password is required', 400);

    if (id === SUPER_ADMIN_STAFF_ID) {
      const user = await this.findPortalUserByStaffId(id);
      if (!user || !user.active) throw new AppError('Invalid staff ID or password', 401);
      const valid = await this.isStaffPortalPasswordValid(user, password);
      if (!valid) throw new AppError('Invalid staff ID or password', 401);
      return this.completeStaffLogin(user, id, req);
    }

    let user = await this.findPortalUserByStaffId(id);

    if (user) {
      if (!user.active) throw new AppError('Account is disabled. Contact administrator.', 403);
      const valid = await this.isStaffPortalPasswordValid(user, password);
      if (!valid) throw new AppError('Invalid staff ID or password', 401);

      if (
        user.role === 'employee'
        && !user.portalPasswordChangedAt
        && this.isDefaultEmployeePassword(password)
        && !(await bcrypt.compare(config.defaultEmployeePassword, user.password))
      ) {
        user.password = await bcrypt.hash(config.defaultEmployeePassword, 10);
        if (!user.employeeId) user.employeeId = id;
        await user.save();
      }

      return this.completeStaffLogin(user, id, req);
    }

    let employeeName = id;
    let department = 'General';
    let designation = null;

    if (isHrmsDbConfigured()) {
      try {
        const emp = await hrmsService.getEmployee(id);
        employeeName = emp.name || id;
        department = emp.department || department;
        designation = emp.designation || null;
      } catch (err) {
        if (err instanceof AppError && err.statusCode === 404) {
          throw new AppError('Invalid staff ID or password', 401);
        }
        throw err;
      }
    }

    if (!this.isDefaultEmployeePassword(password)) {
      throw new AppError('Invalid staff ID or password', 401);
    }

    const hashed = await bcrypt.hash(config.defaultEmployeePassword, 10);
    try {
      user = await User.create({
        name: employeeName,
        email: `${id.toLowerCase()}@portal.local`,
        password: hashed,
        role: 'employee',
        department,
        employeeId: id,
        initials: getInitials(employeeName),
        active: true,
        portalPasswordChangedAt: null,
      });
    } catch (err) {
      if (err.code === 11000) {
        user = await this.findPortalUserByStaffId(id);
        if (!user) throw new AppError('Invalid staff ID or password', 401);
        const valid = await this.isStaffPortalPasswordValid(user, password);
        if (!valid) throw new AppError('Invalid staff ID or password', 401);
      } else {
        throw err;
      }
    }

    return this.completeStaffLogin(user, id, req, { designation });
  }

  async completeStaffLogin(user, staffId, req, extras = {}) {
    const token = signToken(user._id);
    const meta = getClientMeta(req);

    createAuditLog({
      action: 'LOGIN',
      entity: 'Session',
      entityId: user._id.toString(),
      user: user.name,
      userId: user._id,
      department: user.department,
      ip: meta.ip,
      browser: meta.browser,
      details: `Staff login: ${staffId}`,
      severity: 'info',
    }).catch((err) => console.error('Login audit failed:', err.message));

    return {
      token,
      user: this.formatUser(user, extras),
    };
  }

  async changePassword(userId, oldPassword, newPassword) {
    if (!newPassword || newPassword.length < 4) {
      throw new AppError('New password must be at least 4 characters', 400);
    }

    const user = await User.findById(userId).select('+password');
    if (!user) throw new AppError('User not found', 404);
    if (isSuperAdminAccount(user)) {
      throw new AppError('Super admin password can only be changed via seed:superadmin', 403);
    }

    const valid = await this.isStaffPortalPasswordValid(user, oldPassword);
    if (!valid) throw new AppError('Current password is incorrect', 401);

    user.password = await bcrypt.hash(newPassword, 10);
    user.portalPasswordChangedAt = new Date();
    await user.save();
  }

  async resetUserPassword(actor, targetUserId, newPassword, req) {
    if (!newPassword || newPassword.length < 4) {
      throw new AppError('New password must be at least 4 characters', 400);
    }

    const user = await User.findById(targetUserId).select('+password');
    if (!user) throw new AppError('User not found', 404);
    if (isSuperAdminAccount(user)) {
      throw new AppError('Super admin password cannot be reset here. Use seed:superadmin', 403);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.portalPasswordChangedAt = this.isDefaultEmployeePassword(newPassword) ? null : new Date();
    await user.save();

    const meta = getClientMeta(req);
    await createAuditLog({
      action: 'UPDATE',
      entity: 'User',
      entityId: user._id.toString(),
      user: actor.name,
      userId: actor._id,
      department: actor.department,
      ip: meta.ip,
      browser: meta.browser,
      details: `Password reset for ${user.name} (${user.employeeId || user.email})`,
      severity: 'warning',
    });

    return this.formatUser(user);
  }

  async updateUser(actor, targetUserId, patch, req) {
    const user = await User.findById(targetUserId);
    if (!user) throw new AppError('User not found', 404);

    const allowed = ['name', 'department', 'role', 'active'];
    const update = {};
    for (const key of allowed) {
      if (patch[key] !== undefined) update[key] = patch[key];
    }

    if (!Object.keys(update).length) {
      throw new AppError('No valid fields to update', 400);
    }

    if (update.role && actor.role !== 'super_admin') {
      throw new AppError('Only super admin can change roles', 403);
    }

    if (update.role && !MANAGEABLE_ROLES.includes(update.role)) {
      throw new AppError('Role must be employee or hod', 400);
    }

    if (isSuperAdminAccount(user)) {
      throw new AppError('Super admin account cannot be modified', 403);
    }

    Object.assign(user, update);
    await user.save();

    const meta = getClientMeta(req);
    await createAuditLog({
      action: 'UPDATE',
      entity: 'User',
      entityId: user._id.toString(),
      user: actor.name,
      userId: actor._id,
      department: actor.department,
      ip: meta.ip,
      browser: meta.browser,
      details: `Updated user ${user.name}`,
      severity: 'info',
    });

    return this.formatUser(user);
  }

  async resolveStaffFromHrms(staffId) {
    const id = String(staffId || '').trim();
    if (!id) throw new AppError('Staff ID is required', 400);

    let employeeName = id;
    let department = 'General';

    if (isHrmsDbConfigured()) {
      const emp = await hrmsService.getEmployee(id);
      employeeName = emp.name || id;
      department = emp.department || department;
    }

    return { id, employeeName, department };
  }

  async createUserFromStaffId(actor, staffId, role = 'employee', req) {
    if (String(staffId).trim() === SUPER_ADMIN_STAFF_ID) {
      throw new AppError('Super admin account is fixed and cannot be created via Staff ID', 403);
    }
    if (!MANAGEABLE_ROLES.includes(role)) {
      throw new AppError('Role must be employee or hod', 400);
    }

    const { id, employeeName, department } = await this.resolveStaffFromHrms(staffId);

    const existing = await this.findPortalUserByStaffId(id);
    if (existing) {
      throw new AppError(`User already exists for Staff ID ${id}`, 409);
    }

    const hashed = await bcrypt.hash(config.defaultEmployeePassword, 10);
    const user = await User.create({
      name: employeeName,
      email: `${id.toLowerCase()}@portal.local`,
      password: hashed,
      role,
      department,
      employeeId: id,
      initials: getInitials(employeeName),
      avatar: getInitials(employeeName),
      active: true,
      portalPasswordChangedAt: null,
    });

    const meta = getClientMeta(req);
    await createAuditLog({
      action: 'CREATE',
      entity: 'User',
      entityId: user._id.toString(),
      user: actor.name,
      userId: actor._id,
      department: actor.department,
      ip: meta.ip,
      browser: meta.browser,
      details: `Created portal user ${employeeName} (${id}) as ${role}`,
      severity: 'info',
    });

    const extras = await this.enrichFromHrms(user);
    return this.formatUser(user, extras);
  }

  async bulkUpdateRole(actor, userIds, role, req) {
    if (!MANAGEABLE_ROLES.includes(role)) {
      throw new AppError('Role must be employee or hod', 400);
    }
    const updated = [];
    for (const userId of userIds) {
      const user = await User.findById(userId);
      if (isSuperAdminAccount(user)) continue;
      updated.push(await this.updateUser(actor, userId, { role }, req));
    }
    return updated;
  }

  async bulkResetPassword(actor, userIds, newPassword, req) {
    const password = newPassword || config.defaultEmployeePassword;
    const updated = [];
    for (const userId of userIds) {
      const user = await User.findById(userId);
      if (isSuperAdminAccount(user)) continue;
      updated.push(await this.resetUserPassword(actor, userId, password, req));
    }
    return updated;
  }

  async importUsers(actor, entries, req) {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new AppError('Import list must be a non-empty array', 400);
    }

    const summary = { created: 0, updated: 0, failed: [] };

    for (const entry of entries) {
      const staffId = String(entry?.staffId ?? entry?.staff_id ?? entry?.employeeId ?? '').trim();
      if (!staffId) {
        summary.failed.push({ staffId: '', error: 'Missing staffId' });
        continue;
      }
      if (staffId === SUPER_ADMIN_STAFF_ID) {
        summary.failed.push({ staffId, error: 'Super admin account is fixed' });
        continue;
      }
      if (entry?.role === 'super_admin') {
        summary.failed.push({ staffId, error: 'Cannot assign super_admin via import' });
        continue;
      }

      const role = MANAGEABLE_ROLES.includes(entry?.role) ? entry.role : 'employee';

      try {
        const existing = await this.findPortalUserByStaffId(staffId);
        if (existing) {
          await this.updateUser(actor, existing._id.toString(), { role, active: true }, req);
          summary.updated += 1;
        } else {
          await this.createUserFromStaffId(actor, staffId, role, req);
          summary.created += 1;
        }
      } catch (err) {
        summary.failed.push({
          staffId,
          error: err instanceof AppError ? err.message : 'Import failed',
        });
      }
    }

    return summary;
  }
}

export default new AuthService();
