import nodemailer from 'nodemailer';
import config from '../config/index.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

let transporter = null;

function getTransporter() {
  if (!config.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
  }
  return transporter;
}

async function sendEmail(to, subject, text) {
  const transport = getTransporter();
  if (!transport || !to) {
    console.log(`[Email mock] To: ${to}, Subject: ${subject}`);
    return false;
  }
  await transport.sendMail({ from: config.smtp.from, to, subject, text });
  return true;
}

function wantsInApp(user, ...prefKeys) {
  if (!user) return false;
  const prefs = user.notificationPreferences || {};
  if (prefs.inAppRealtime === false) return false;
  if (!prefKeys.length) return true;
  return prefKeys.some((key) => prefs[key] !== false);
}

async function findEmployeeUser(request) {
  const email = request.employee?.email?.toLowerCase();
  if (!email) return null;
  return User.findOne({ email, active: true });
}

function mapNotification(doc) {
  const n = doc.toObject ? doc.toObject() : doc;
  return {
    id: n._id.toString(),
    type: n.type,
    title: n.title,
    message: n.message,
    requestId: n.requestId?.toString?.() || n.requestId,
    requestNumber: n.requestNumber,
    read: n.read === true,
    createdAt: n.createdAt?.toISOString?.() || n.createdAt,
  };
}

export class NotificationService {
  async create({ userId, type, title, message, requestId, requestNumber }) {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      requestId,
      requestNumber,
    });
    return mapNotification(notification);
  }

  async createIfEnabled(user, payload, ...prefKeys) {
    if (!wantsInApp(user, ...prefKeys)) return null;
    return this.create({ userId: user._id, ...payload });
  }

  async notifyApprovalRequired(request) {
    const step = request.workflow[(request.currentStep ?? 1) - 1];
    let users = [];

    if (step?.assignee) {
      users = await User.find({ name: step.assignee, active: true });
    } else if (step?.role) {
      users = await User.find({ role: step.role, active: true });
    }

    for (const user of users) {
      await this.createIfEnabled(user, {
        type: 'approval_required',
        title: 'Approval Required',
        message: `${request.formTitle} (${request.requestNumber}) requires your approval`,
        requestId: request._id,
        requestNumber: request.requestNumber,
      }, 'inAppApprovalRequired', 'inAppSubmitted');
    }
  }

  async notifyNewTask(request, assigneeUsers = []) {
    for (const user of assigneeUsers) {
      if (!user?._id) continue;
      const fullUser = user.notificationPreferences ? user : await User.findById(user._id);
      if (!fullUser) continue;
      await this.createIfEnabled(fullUser, {
        type: 'new_task',
        title: 'New Task Assigned',
        message: `You were assigned: ${request.formTitle} (${request.requestNumber})`,
        requestId: request._id,
        requestNumber: request.requestNumber,
      }, 'inAppNewTask');
    }
  }

  async notifyApproved(request, approver) {
    const employeeUser = await findEmployeeUser(request);

    await this.createIfEnabled(employeeUser, {
      type: 'request_approved',
      title: 'Request Approved',
      message: `Your request "${request.formTitle}" (${request.requestNumber}) was approved by ${approver.name}`,
      requestId: request._id,
      requestNumber: request.requestNumber,
    }, 'inAppRequestApproved');

    if (employeeUser?.notificationPreferences?.emailApproved === true) {
      await sendEmail(
        request.employee.email,
        `Request Approved: ${request.requestNumber}`,
        `Your request "${request.formTitle}" was approved by ${approver.name}.`
      );
    }
  }

  async notifyRejected(request, approver) {
    const employeeUser = await findEmployeeUser(request);

    await this.createIfEnabled(employeeUser, {
      type: 'request_rejected',
      title: 'Request Rejected',
      message: `Your request "${request.formTitle}" (${request.requestNumber}) was rejected by ${approver.name}`,
      requestId: request._id,
      requestNumber: request.requestNumber,
    }, 'inAppRequestRejected');

    if (employeeUser?.notificationPreferences?.emailRejected === true) {
      await sendEmail(
        request.employee.email,
        `Request Rejected: ${request.requestNumber}`,
        `Your request "${request.formTitle}" was rejected by ${approver.name}.`
      );
    }
  }

  async notifyCompleted(request) {
    const employeeUser = await findEmployeeUser(request);

    await this.createIfEnabled(employeeUser, {
      type: 'request_completed',
      title: 'Request Completed',
      message: `Your request "${request.formTitle}" (${request.requestNumber}) has been completed`,
      requestId: request._id,
      requestNumber: request.requestNumber,
    }, 'inAppRequestCompleted');

    if (employeeUser?.notificationPreferences?.emailCompleted === true) {
      await sendEmail(
        request.employee.email,
        `Request Completed: ${request.requestNumber}`,
        `Your request "${request.formTitle}" has been completed.`
      );
    }
  }

  async notifyCompletionReviewRequired(request, staffUser) {
    const dept = request.department || request.employee?.department;
    const hods = await User.find({ role: 'hod', department: dept, active: true });
    const targets = hods.length
      ? hods
      : await User.find({ role: { $in: ['hod', 'admin', 'super_admin'] }, active: true }).limit(5);

    for (const user of targets) {
      await this.createIfEnabled(user, {
        type: 'approval_required',
        title: 'Confirm Completion',
        message: `${request.formTitle} (${request.requestNumber}) — ${staffUser.name} finished work and awaits your confirmation`,
        requestId: request._id,
        requestNumber: request.requestNumber,
      }, 'inAppApprovalRequired');

      if (user.notificationPreferences?.emailApproval === true) {
        await sendEmail(
          user.email,
          `Confirm Completion: ${request.requestNumber}`,
          `${staffUser.name} finished work on "${request.formTitle}". Please confirm completion.`
        );
      }
    }
  }

  async getForUser(userId, { page = 1, limit = 30 } = {}) {
    const skip = (page - 1) * limit;
    const [items, total, unread] = await Promise.all([
      Notification.find({ userId }).sort('-createdAt').skip(skip).limit(limit),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, read: false }),
    ]);
    return {
      items: items.map(mapNotification),
      total,
      unread,
      page,
      limit,
    };
  }

  async markRead(userId, notificationId) {
    await Notification.updateOne({ _id: notificationId, userId }, { $set: { read: true } });
  }

  async markAllRead(userId) {
    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
  }
}

export default new NotificationService();
