import Request from '../models/Request.js';
import AuditLog from '../models/AuditLog.js';

export class DashboardService {
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalToday,
      pending,
      approved,
      rejected,
      completed,
      processing,
      slaBreached,
      avgResult,
    ] = await Promise.all([
      Request.countDocuments({ submittedAt: { $gte: today } }),
      Request.countDocuments({ status: 'pending_approval' }),
      Request.countDocuments({ status: 'approved' }),
      Request.countDocuments({ status: 'rejected' }),
      Request.countDocuments({ status: 'completed' }),
      Request.countDocuments({ status: 'processing' }),
      Request.countDocuments({ slaBreached: true }),
      Request.aggregate([
        { $match: { status: 'completed', completedAt: { $exists: true } } },
        {
          $project: {
            hours: {
              $divide: [{ $subtract: ['$completedAt', '$submittedAt'] }, 3600000],
            },
          },
        },
        { $group: { _id: null, avg: { $avg: '$hours' } } },
      ]),
    ]);

    return {
      totalToday,
      pending,
      approved,
      rejected,
      completed,
      processing,
      avgProcessingHours: Math.round((avgResult[0]?.avg || 0) * 10) / 10,
      slaBreached,
    };
  }

  async getWeeklyChart() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [submitted, approved, rejected, completed] = await Promise.all([
        Request.countDocuments({ submittedAt: { $gte: date, $lt: nextDate } }),
        Request.countDocuments({ updatedAt: { $gte: date, $lt: nextDate }, status: 'approved' }),
        Request.countDocuments({ updatedAt: { $gte: date, $lt: nextDate }, status: 'rejected' }),
        Request.countDocuments({ completedAt: { $gte: date, $lt: nextDate } }),
      ]);

      result.push({ day: days[date.getDay()], submitted, approved, rejected, completed });
    }

    return result;
  }

  async getStatusChart() {
    const statuses = ['completed', 'pending_approval', 'processing', 'rejected'];
    const colors = { completed: '#10b981', pending_approval: '#f59e0b', processing: '#3b82f6', rejected: '#ef4444' };
    const labels = { completed: 'Completed', pending_approval: 'Pending', processing: 'Processing', rejected: 'Rejected' };

    const data = await Promise.all(
      statuses.map(async (status) => ({
        name: labels[status],
        value: await Request.countDocuments({ status }),
        color: colors[status],
      }))
    );

    return data.filter((d) => d.value > 0);
  }

  async getDepartmentChart() {
    const data = await Request.aggregate([
      { $group: { _id: '$category', requests: { $sum: 1 } } },
      { $sort: { requests: -1 } },
      { $limit: 10 },
      { $project: { dept: '$_id', requests: 1, _id: 0 } },
    ]);
    return data;
  }

  async getRecentRequests(limit = 5) {
    const requests = await Request.find().sort('-submittedAt').limit(limit);
    return requests.map((r) => ({
      id: r._id.toString(),
      requestNumber: r.requestNumber,
      formTitle: r.formTitle,
      employee: r.employee,
      status: r.status,
      submittedAt: r.submittedAt?.toISOString?.(),
      priority: r.priority,
      currentStep: r.currentStep,
      workflow: r.workflow,
    }));
  }
}

export class SearchService {
  async search({ q, employeeId, employeeName, department, requestNumber, status, formId, dateFrom, dateTo, page = 1, limit = 20 }) {
    const filter = {};

    if (q) {
      filter.$or = [
        { requestNumber: new RegExp(q, 'i') },
        { formTitle: new RegExp(q, 'i') },
        { 'employee.name': new RegExp(q, 'i') },
        { 'employee.id': new RegExp(q, 'i') },
        { department: new RegExp(q, 'i') },
      ];
    }
    if (employeeId) filter['employee.id'] = employeeId.toUpperCase();
    if (employeeName) filter['employee.name'] = new RegExp(employeeName, 'i');
    if (department) filter.department = new RegExp(department, 'i');
    if (requestNumber) filter.requestNumber = new RegExp(requestNumber, 'i');
    if (status) filter.status = status;
    if (formId) filter.formId = formId;
    if (dateFrom || dateTo) {
      filter.submittedAt = {};
      if (dateFrom) filter.submittedAt.$gte = new Date(dateFrom);
      if (dateTo) filter.submittedAt.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Request.find(filter).sort('-submittedAt').skip(skip).limit(limit),
      Request.countDocuments(filter),
    ]);

    return {
      results: items.map((r) => ({
        id: r._id.toString(),
        requestNumber: r.requestNumber,
        formTitle: r.formTitle,
        employee: r.employee,
        department: r.department,
        status: r.status,
        submittedAt: r.submittedAt?.toISOString?.(),
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }
}

export class AuditService {
  async list({ action, severity, search, page = 1, limit = 50 } = {}) {
    const filter = {};
    if (action) filter.action = new RegExp(action, 'i');
    if (severity) filter.severity = severity;
    if (search) {
      filter.$or = [
        { user: new RegExp(search, 'i') },
        { entityId: new RegExp(search, 'i') },
        { details: new RegExp(search, 'i') },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      AuditLog.find(filter).sort('-createdAt').skip(skip).limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    return {
      logs: items.map((l) => ({
        id: l._id.toString(),
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        user: l.user,
        department: l.department,
        ip: l.ip,
        browser: l.browser,
        timestamp: l.createdAt?.toISOString?.(),
        details: l.details,
        severity: l.severity,
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }
}

export const dashboardService = new DashboardService();
export const searchService = new SearchService();
export const auditService = new AuditService();
