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
