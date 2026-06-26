import { v4 as uuidv4 } from 'uuid';
import WorkflowTemplate from '../models/WorkflowTemplate.js';
import { isSuperAdmin, isHod } from '../utils/roles.js';
import { departmentsMatch } from '../utils/requestScope.js';

function namesMatch(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

export class WorkflowEngine {
  async buildWorkflow(templateId, employee) {
    const template = await WorkflowTemplate.findOne({ templateId, active: true });
    if (!template) {
      throw new Error(`Workflow template not found: ${templateId}`);
    }

    return template.steps.map((step) => {
      const workflowStep = {
        id: `wf-${uuidv4().slice(0, 8)}`,
        name: step.name,
        type: step.type,
        status: 'pending',
      };

      switch (step.type) {
        case 'hod':
          workflowStep.assignee = employee.hod;
          break;
        case 'reporting_manager':
          workflowStep.assignee = employee.reportingManager;
          break;
        case 'specific_user':
          workflowStep.assignee = step.assignee;
          break;
        case 'specific_role':
        case 'department_processor':
          workflowStep.role = step.role || this.mapDepartmentToRole(step);
          break;
        case 'parallel':
          workflowStep.role = step.role;
          break;
        default:
          break;
      }

      return workflowStep;
    });
  }

  mapDepartmentToRole(step) {
    const roleMap = {
      IT: 'it_team',
      HR: 'hr_team',
      FINANCE: 'finance_team',
    };
    return step.role || roleMap[step.department] || 'processor';
  }

  getCurrentStep(request) {
    return request.workflow[request.currentStep - 1] || null;
  }

  canUserActOnStep(user, step, request) {
    if (!step || step.status !== 'pending') return false;
    if (isSuperAdmin(user.role)) return true;

    switch (step.type) {
      case 'hod':
        if (step.assigneeEmployeeId) {
          const userEmpId = String(user.employeeId || '').trim();
          if (userEmpId && userEmpId === String(step.assigneeEmployeeId).trim()) return true;
          return namesMatch(user.name, step.assignee);
        }
        return namesMatch(user.name, step.assignee)
          || (isHod(user.role) && departmentsMatch(user.department, request?.employee?.department));
      case 'reporting_manager':
      case 'specific_user':
        if (step.assigneeEmployeeId) {
          const userEmpId = String(user.employeeId || '').trim();
          if (userEmpId && userEmpId === String(step.assigneeEmployeeId).trim()) return true;
        }
        return namesMatch(user.name, step.assignee);
      case 'specific_role':
      case 'department_processor':
        if (request?.assignedToEmployeeId) {
          const empId = String(request.assignedToEmployeeId).trim();
          const userEmpId = String(user.employeeId || '').trim();
          if (empId && userEmpId && empId === userEmpId) return true;
          if (request.assignedToUserId && String(request.assignedToUserId) === String(user._id)) return true;
          const assignees = request.assignees || [];
          if (assignees.some((a) => String(a.employeeId) === userEmpId)) return true;
          return false;
        }
        if (!request?.receiverApprovedBy && step.type === 'department_processor') {
          if (isSuperAdmin(user.role)) return true;
          if (!isHod(user.role)) return false;
          return departmentsMatch(user.department, request?.department || request?.employee?.department);
        }
        return user.role === step.role || user.role === 'processor' || isHod(user.role);
      case 'parallel':
        return user.role === step.role;
      default:
        return false;
    }
  }

  async processApproval(request, action, { userName, userRole, remarks, forwardToEmployee }) {
    const stepIndex = request.currentStep - 1;
    const step = request.workflow[stepIndex];
    if (!step) throw new Error('No active workflow step');

    if (action === 'approve') {
      step.status = 'approved';
      step.completedAt = new Date();
      step.completedBy = userName;
      step.comment = remarks || '';

      const isLastStep = request.currentStep >= request.workflow.length;
      if (isLastStep) {
        const lastStep = request.workflow[request.workflow.length - 1];
        if (lastStep.type === 'department_processor') {
          request.status = 'processing';
          request.queueStatus = 'pending';
        } else {
          request.status = 'completed';
          request.completedAt = new Date();
        }
      } else {
        request.currentStep += 1;
        request.status = 'pending_approval';
      }
    } else if (action === 'reject') {
      step.status = 'rejected';
      step.completedAt = new Date();
      step.completedBy = userName;
      step.comment = remarks || '';
      request.status = 'rejected';
    } else if (action === 'forward') {
      if (!forwardToEmployee?.id) {
        throw new Error('Staff ID is required to forward');
      }
      step.comment = remarks || `Forwarded to ${forwardToEmployee.name} (${forwardToEmployee.id})`;
      step.assignee = forwardToEmployee.name;
      step.assigneeEmployeeId = String(forwardToEmployee.id);
      step.status = 'pending';
      request.status = 'pending_approval';
    } else if (action === 'request_info') {
      request.workflow.forEach((s) => {
        s.status = 'pending';
        s.completedAt = undefined;
        s.completedBy = undefined;
        s.comment = undefined;
        if (s.type === 'hod') {
          s.assigneeEmployeeId = undefined;
          s.assignee = request.employee?.hod;
        } else {
          s.assigneeEmployeeId = undefined;
        }
      });
      request.currentStep = 1;
      request.status = 'sent_back';
      request.receiverApprovedBy = undefined;
      request.receiverApprovedAt = undefined;
      request.assignedTo = undefined;
      request.assignedToEmployeeId = undefined;
      request.assignedToUserId = undefined;
      request.assignees = [];
      request.queueStatus = 'pending';
      request.comments.push({
        id: `c-${uuidv4().slice(0, 8)}`,
        by: userName,
        role: userRole,
        text: remarks || 'Sent back to employee for correction',
        timestamp: new Date(),
        type: 'action',
      });
    }

    return request;
  }

  async completeProcessing(request, { userName, remarks }) {
    const stepIndex = request.currentStep - 1;
    const step = request.workflow[stepIndex];
    if (step) {
      step.status = 'approved';
      step.completedAt = new Date();
      step.completedBy = userName;
      step.comment = remarks || 'Processing completed';
    }
    request.status = 'completed';
    request.queueStatus = 'completed';
    request.completedAt = new Date();
    return request;
  }
}

export default new WorkflowEngine();
