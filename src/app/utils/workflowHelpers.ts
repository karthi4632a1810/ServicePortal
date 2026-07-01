import type { Request } from '../types';

export function allPriorStepsApproved(req: Request): boolean {
  const idx = req.currentStep - 1;
  for (let i = 0; i < idx; i++) {
    if (req.workflow[i]?.status !== 'approved') return false;
  }
  return true;
}

export function findMdApprovalStep(workflow: Request['workflow'] = []) {
  return workflow.find((s) => s.type === 'specific_role' && s.role === 'md');
}

export function isMdApprovalPending(req: Request): boolean {
  const step = req.workflow[req.currentStep - 1];
  return step?.type === 'specific_role'
    && step?.role === 'md'
    && step?.status === 'pending'
    && req.status === 'pending_approval';
}

export function canReceiverHodAcceptNow(req: Request): boolean {
  const step = req.workflow[req.currentStep - 1];
  if (step?.type !== 'department_processor') return false;
  if (req.receiverAcceptedBy || req.receiverApprovedBy) return false;
  if (!allPriorStepsApproved(req)) return false;
  const mdStep = findMdApprovalStep(req.workflow);
  if (mdStep && mdStep.status !== 'approved') return false;
  return req.status === 'pending_approval' || req.status === 'processing';
}

/** Dept accept is visible but blocked until MD approves (e.g. before workflow repair loads). */
export function isAwaitingMdBeforeAccept(req: Request): boolean {
  const mdStep = findMdApprovalStep(req.workflow);
  if (!mdStep || mdStep.status === 'approved') return false;
  const step = req.workflow[req.currentStep - 1];
  if (step?.type !== 'department_processor') return false;
  return !req.receiverAcceptedBy && !req.receiverApprovedBy;
}
