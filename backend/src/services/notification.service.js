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

function prefEnabled(user, key) {
  return user?.notificationPreferences?.[key] !== false;
}

function wantsInApp(user) {
  return user?.notificationPreferences?.inAppRealtime !== false;
}

async function findEmployeeUser(request) {
  const email = request.employee?.email?.toLowerCase();
  if (!email) return null;
  return User.findOne({ email, active: true });
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
    return notification;
  }

  async createIfEnabled(user, payload) {
    if (!user || !wantsInApp(user)) return null;
    return this.create({ userId: user._id, ...payload });
  }

  async notifyApprovalRequired(request) {
    const step = request.workflow[0];
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
      });

      const wantsEmail = prefEnabled(user, 'emailSubmitted') || prefEnabled(user, 'emailApproval');
      if (wantsEmail) {
        const sent = await sendEmail(
          user.email,
          `Approval Required: ${request.requestNumber}`,
          `${request.employee.name} submitted ${request.formTitle}. Please review and approve.`
        );
        if (sent) {
          await Notification.updateOne(
            { userId: user._id, requestNumber: request.requestNumber },
            { emailSent: true }
          );
        }
      }
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
    });

    if (!employeeUser || prefEnabled(employeeUser, 'emailApproved')) {
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
    });

    if (!employeeUser || prefEnabled(employeeUser, 'emailRejected')) {
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
    });

    if (!employeeUser || prefEnabled(employeeUser, 'emailCompleted')) {
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
      });

      if (prefEnabled(user, 'emailApproval')) {
        await sendEmail(
          user.email,
          `Confirm Completion: ${request.requestNumber}`,
          `${staffUser.name} finished work on "${request.formTitle}". Please confirm completion.`
        );
      }
    }
  }

  async getForUser(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Notification.find({ userId }).sort('-createdAt').skip(skip).limit(limit),
      Notification.countDocuments({ userId }),
    ]);
    return { items, total, page, limit };
  }
}

export default new NotificationService();
