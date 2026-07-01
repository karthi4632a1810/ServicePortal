import { v4 as uuidv4 } from 'uuid';

/** True when every workflow step before the current step is approved. */
export function allPriorStepsApproved(request) {
  const idx = (request?.currentStep ?? 1) - 1;
  const workflow = request?.workflow || [];
  for (let i = 0; i < idx; i++) {
    if (workflow[i]?.status !== 'approved') return false;
  }
  return true;
}

export function findMdApprovalStep(workflow = []) {
  return workflow.find((s) => s.type === 'specific_role' && s.role === 'md');
}

export function isMdApprovalPending(request) {
  const step = request?.workflow?.[(request?.currentStep ?? 1) - 1];
  return step?.type === 'specific_role'
    && step?.role === 'md'
    && step?.status === 'pending'
    && request?.status === 'pending_approval';
}

export function isMdApprovalComplete(request) {
  const mdStep = findMdApprovalStep(request?.workflow);
  return !mdStep || mdStep.status === 'approved';
}

/** HOD department accept is allowed only after MD step (if any) is approved. */
export function canReceiverHodAcceptNow(request) {
  const step = request?.workflow?.[(request?.currentStep ?? 1) - 1];
  if (!step || step.type !== 'department_processor') return false;
  if (request?.receiverApprovedBy) return false;
  if (!allPriorStepsApproved(request)) return false;
  const mdStep = findMdApprovalStep(request.workflow);
  if (mdStep && mdStep.status !== 'approved') return false;
  return true;
}

/** True when dept accept is blocked because MD step exists but is not yet approved. */
export function isAwaitingMdBeforeAccept(request) {
  const mdStep = findMdApprovalStep(request?.workflow);
  if (!mdStep || mdStep.status === 'approved') return false;
  const step = request?.workflow?.[(request?.currentStep ?? 1) - 1];
  if (step?.type !== 'department_processor') return false;
  return !request?.receiverApprovedBy;
}

/**
 * Insert missing MD approval step for forms with md_approve and rewind in-flight requests.
 * Returns true when the request document was mutated.
 */
export function repairMdWorkflowIfNeeded(request, mdApprove) {
  if (!mdApprove || !request?.workflow?.length) return false;
  if (findMdApprovalStep(request.workflow)) return false;

  const hodIndex = request.workflow.findIndex((s) => s.type === 'hod');
  if (hodIndex < 0) return false;

  const deptIndexBefore = request.workflow.findIndex((s) => s.type === 'department_processor');
  const hodApproved = request.workflow[hodIndex]?.status === 'approved';
  const currentIdx = (request.currentStep ?? 1) - 1;
  const onDeptStep = deptIndexBefore >= 0 && currentIdx === deptIndexBefore;

  const insertAt = hodIndex + 1;
  request.workflow.splice(insertAt, 0, {
    id: `wf-${uuidv4().slice(0, 8)}`,
    name: 'MD Approval',
    type: 'specific_role',
    role: 'md',
    status: 'pending',
  });

  if (hodApproved && onDeptStep) {
    request.currentStep = insertAt + 1;
    request.status = 'pending_approval';
    request.receiverApprovedBy = undefined;
    request.receiverApprovedAt = undefined;
    request.queueStatus = 'pending';
  }

  request.mdApprove = true;
  request.markModified('workflow');
  return true;
}
