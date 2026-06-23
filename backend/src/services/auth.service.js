import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { getInitials } from '../utils/helpers.js';
import { AppError } from '../utils/response.js';
import { createAuditLog, getClientMeta } from '../middleware/audit.js';

export class AuthService {
  async login(email, password, req) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.active) {
      throw new AppError('Invalid credentials', 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError('Invalid credentials', 401);

    const token = signToken(user._id);
    const meta = getClientMeta(req);

    await createAuditLog({
      action: 'LOGIN',
      entity: 'Session',
      entityId: user._id.toString(),
      user: user.name,
      userId: user._id,
      department: user.department,
      ip: meta.ip,
      browser: meta.browser,
      details: 'Admin login successful',
      severity: 'info',
    });

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

  formatUser(user) {
    return {
      id: user._id.toString(),
      name: user.name,
      role: user.role,
      department: user.department,
      email: user.email,
      initials: user.initials || getInitials(user.name),
      avatar: user.avatar || user.initials || getInitials(user.name),
      employeeId: user.employeeId || null,
      preferences: this.formatPreferences(user),
    };
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

  async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return this.formatUser(user);
  }

  async listUsers() {
    const users = await User.find({ active: true }).select('-password');
    return users.map((u) => this.formatUser(u));
  }
}

export default new AuthService();
