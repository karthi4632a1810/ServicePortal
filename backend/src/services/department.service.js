import Department from '../models/Department.js';
import Request from '../models/Request.js';

export class DepartmentService {
  async list() {
    return Department.find({ active: true }).sort('name');
  }

  async getQueue(departmentCode, { status, page = 1, limit = 50 } = {}) {
    const deptMap = {
      IT: ['IT Forms', 'IT Services', 'Information Technology', 'IT'],
      HR: ['HR Forms', 'HR Services', 'Human Resources', 'HR'],
      FINANCE: ['Finance Forms', 'Finance Services', 'Finance'],
      OPERATIONS: ['Operations'],
      MAINTENANCE: ['Maintenance'],
      ADMIN: ['Administration', 'Admin'],
    };

    const categories = deptMap[departmentCode.toUpperCase()] || [departmentCode];
    const filter = {
      status: { $in: ['approved', 'processing'] },
      $or: [
        { category: { $in: categories } },
        { 'workflow.role': departmentCode.toLowerCase() + '_team' },
      ],
    };

    if (status) filter.queueStatus = status;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Request.find(filter).sort('-submittedAt').skip(skip).limit(limit),
      Request.countDocuments(filter),
    ]);

    return {
      items: items.map((r) => ({
        id: r._id.toString(),
        requestNumber: r.requestNumber,
        title: r.formTitle,
        employee: r.employee.name,
        department: r.employee.department,
        assignedTo: r.assignedTo || 'Unassigned',
        queueStatus: r.queueStatus || 'pending',
        priority: r.priority,
        dueDate: r.dueDate?.toISOString?.()?.split('T')[0] || '',
        submittedAt: r.submittedAt?.toISOString?.()?.split('T')[0] || '',
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }
}

export default new DepartmentService();
