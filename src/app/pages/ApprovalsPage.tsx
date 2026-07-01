import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle, XCircle, Clock, RotateCcw, Forward, FileText,
  User, Building2, Calendar, Search, Eye, AlertTriangle, Loader2,
} from 'lucide-react';
import { cn } from '../components/ui/utils';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { fetchEmployeeTiered } from '../utils/fetchEmployeeTiered';
import type { Request, Approver, Employee } from '../types';
import { useScreenRefresh } from '../hooks/useScreenRefresh';
import { canReceiverHodAcceptNow, isMdApprovalPending, findMdApprovalStep } from '../utils/workflowHelpers';
import { isMdRole } from '../utils/roleAccess';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const PRIORITY_COLORS = {
  high: 'text-red-600 bg-red-50 dark:bg-red-950',
  medium: 'text-amber-600 bg-amber-50 dark:bg-amber-950',
  low: 'text-gray-600 bg-gray-100 dark:bg-gray-800',
};

const ACTION_STYLES: Record<string, { active: string; idle: string }> = {
  approve: {
    active: 'bg-emerald-600 text-white ring-2 ring-emerald-300',
    idle: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  reject: {
    active: 'bg-red-600 text-white ring-2 ring-red-300',
    idle: 'bg-red-600 hover:bg-red-700 text-white',
  },
  'request-info': {
    active: 'bg-orange-100 text-orange-800 ring-2 ring-orange-300 dark:bg-orange-950 dark:text-orange-300',
    idle: 'border border-orange-300 text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-700 dark:hover:bg-orange-950',
  },
  forward: {
    active: 'bg-muted text-foreground ring-2 ring-primary/30',
    idle: 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted',
  },
  'confirm-completion': {
    active: 'bg-emerald-600 text-white ring-2 ring-emerald-300',
    idle: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  'send-back-rework': {
    active: 'bg-orange-600 text-white ring-2 ring-orange-300',
    idle: 'bg-orange-600 hover:bg-orange-700 text-white',
  },
};

function actionStyle(id: string, active: boolean) {
  const styles = ACTION_STYLES[id] ?? ACTION_STYLES.approve;
  return active ? styles.active : styles.idle;
}

type ApprovalTab = 'pending' | 'approved' | 'rejected' | 'all';
type ActionMode = 'pending' | 'sendback' | 'none';
type ApprovalsVariant = 'approval' | 'accept';

const APPROVAL_STEP_TYPES = new Set(['hod', 'reporting_manager', 'specific_user', 'specific_role', 'parallel']);

function matchesVariant(
  req: Request,
  variant: ApprovalsVariant,
  tab: ApprovalTab,
  currentUser: Approver | null,
): boolean {
  const step = req.workflow[req.currentStep - 1];
  const receiverAccepted = req.receiverAcceptedBy || req.receiverApprovedBy;
  const userName = currentUser?.name;

  const isPendingApprovalStep = Boolean(
    step && APPROVAL_STEP_TYPES.has(step.type) && step.status === 'pending' && req.status === 'pending_approval',
  );
  const isPendingAcceptStep = Boolean(
    canReceiverHodAcceptNow(req),
  );
  const userAccepted = Boolean(userName && receiverAccepted === userName);
  const userApprovedStep = req.workflow.some(
    (s) => APPROVAL_STEP_TYPES.has(s.type) && s.completedBy === userName && s.status === 'approved',
  );
  const userRejected = req.workflow.some(
    (s) => s.completedBy === userName && s.status === 'rejected',
  );

  if (variant === 'approval') {
    if (currentUser?.role === 'md') {
      if (tab === 'pending') return isMdApprovalPending(req);
      if (tab === 'approved') {
        return req.workflow.some(
          (s) => s.type === 'specific_role' && s.role === 'md' && s.completedBy === userName && s.status === 'approved',
        );
      }
      if (tab === 'rejected') {
        return req.workflow.some(
          (s) => s.type === 'specific_role' && s.role === 'md' && s.completedBy === userName && s.status === 'rejected',
        );
      }
      return Boolean(findMdApprovalStep(req.workflow));
    }
    if (tab === 'pending') return isPendingApprovalStep;
    if (tab === 'approved') return userApprovedStep;
    if (tab === 'rejected') return userRejected;
    return req.workflow.some((s) => APPROVAL_STEP_TYPES.has(s.type));
  }

  if (tab === 'pending') return isPendingAcceptStep;
  if (tab === 'approved') return userAccepted;
  if (tab === 'rejected') return false;
  return req.workflow.some((s) => s.type === 'department_processor');
}

function ApprovalCard({ req, tab, actionMode, onView, onAction, canAct }: {
  req: Request;
  tab: ApprovalTab;
  actionMode: ActionMode;
  onView: () => void;
  onAction: (action: 'approve' | 'reject' | 'forward' | 'request-info' | 'confirm-completion' | 'send-back-rework', remarks: string, staffId?: string) => Promise<void>;
  canAct: boolean;
}) {
  const [remarks, setRemarks] = useState('');
  const [forwardStaffId, setForwardStaffId] = useState('');
  const [forwardEmployee, setForwardEmployee] = useState<Employee | null>(null);
  const [forwardVerifying, setForwardVerifying] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [remarksOpen, setRemarksOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const lastVerifiedForwardId = useRef('');

  const currentStep = req.workflow[req.currentStep - 1];
  const receiverAccepted = req.receiverAcceptedBy || req.receiverApprovedBy;
  const isReceiverAccept = currentStep?.type === 'department_processor' && !receiverAccepted;
  const isConfirmCompletion = currentStep?.type === 'department_processor' && req.queueStatus === 'pending_hod_review';
  const submittedDaysAgo = Math.floor((Date.now() - new Date(req.submittedAt).getTime()) / 86400000);

  useEffect(() => {
    const id = forwardStaffId.trim();
    if (!id || activeAction !== 'forward') {
      setForwardEmployee(null);
      lastVerifiedForwardId.current = '';
      return;
    }
    if (id === lastVerifiedForwardId.current) return;

    const timer = window.setTimeout(() => {
      setForwardVerifying(true);
      setForwardEmployee(null);
      void fetchEmployeeTiered(id, undefined, setForwardEmployee).then((emp) => {
        if (forwardStaffId.trim() !== id) return;
        if (emp) lastVerifiedForwardId.current = id;
        else lastVerifiedForwardId.current = '';
        setForwardVerifying(false);
      });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [forwardStaffId, activeAction]);

  const selectAction = (action: string) => {
    setActionError('');
    setActionSuccess('');
    setActiveAction(action);
    setRemarksOpen(true);
    if (action !== 'forward') {
      setForwardStaffId('');
      setForwardEmployee(null);
    }
  };

  const handleConfirm = async () => {
    if (!activeAction) return;
    const actionMap: Record<string, 'approve' | 'reject' | 'forward' | 'request-info' | 'confirm-completion' | 'send-back-rework'> = {
      approve: 'approve',
      reject: 'reject',
      forward: 'forward',
      'request-info': 'request-info',
      'confirm-completion': 'confirm-completion',
      'send-back-rework': 'send-back-rework',
    };
    const action = actionMap[activeAction];
    if (!action) return;

    if ((action === 'reject' || action === 'request-info' || action === 'send-back-rework') && !remarks.trim()) {
      setActionError('Please add remarks before confirming.');
      return;
    }

    if (action === 'forward' && !forwardEmployee) {
      setActionError('Enter a valid Staff ID in the same department to forward.');
      return;
    }

    setSubmitting(true);
    setActionError('');
    setActionSuccess('');
    try {
      await onAction(action, remarks, forwardEmployee?.id);
      setActionSuccess(
        action === 'approve'
          ? (isReceiverAccept ? 'Request accepted for processing.' : 'Request approved successfully.')
          : action === 'confirm-completion' ? 'Completion confirmed — requester will see Completed.'
            : action === 'send-back-rework' ? 'Sent back to staff for rework.'
              : action === 'reject' ? 'Request rejected.'
                : action === 'request-info' ? 'Request sent back to employee — moved to pending for correction.'
                  : `Request forwarded to ${forwardEmployee?.name}.`,
      );
      setRemarksOpen(false);
      setRemarks('');
      setForwardStaffId('');
      setForwardEmployee(null);
      setActiveAction(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingActions = isConfirmCompletion
    ? [
      { id: 'confirm-completion', label: 'Confirm Completion', icon: CheckCircle },
      { id: 'send-back-rework', label: 'Send Back for Rework', icon: RotateCcw },
    ]
    : [
      { id: 'approve', label: isReceiverAccept ? 'Accept for Processing' : 'Approve', icon: CheckCircle },
      ...(isReceiverAccept ? [] : [
        { id: 'reject', label: 'Reject', icon: XCircle },
        { id: 'forward', label: 'Forward', icon: Forward },
      ]),
    ];

  const sendBackActions = [
    { id: 'request-info', label: 'Send Back to Employee', icon: RotateCcw },
  ];

  const actions = actionMode === 'sendback' ? sendBackActions : actionMode === 'pending' ? pendingActions : [];

  return (
    <motion.div
      variants={fadeUp}
      layout
      className="bg-card border border-border/60 rounded-xl overflow-hidden hover:border-primary/30 transition-colors shadow-sm"
    >
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="size-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-foreground" style={{ fontSize: '14px', fontWeight: 600 }}>{req.formTitle}</span>
                <span className={cn('px-2 py-0.5 rounded', PRIORITY_COLORS[req.priority])}
                  style={{ fontSize: '10px', fontWeight: 700 }}>
                  {req.priority.toUpperCase()}
                </span>
              </div>
              <p className="text-muted-foreground" style={{ fontSize: '11px' }}>{req.requestNumber}</p>
            </div>
          </div>
          {submittedDaysAgo >= 1 && tab === 'pending' && (
            <div className="flex items-center gap-1 text-amber-600 shrink-0" style={{ fontSize: '11px' }}>
              <AlertTriangle className="size-3" />
              {submittedDaysAgo}d waiting
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-3 bg-muted/20 flex flex-wrap gap-4">
        {[
          { icon: User, value: req.employee.name },
          { icon: Building2, value: req.employee.department },
          { icon: Calendar, value: new Date(req.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) },
        ].map(({ icon: Icon, value }) => (
          <div key={value} className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: '12px' }}>
            <Icon className="size-3.5" />
            <span>{value}</span>
          </div>
        ))}
        {currentStep && tab === 'pending' && (
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="size-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Clock className="size-2.5 text-primary" />
            </div>
            <span className="text-primary" style={{ fontSize: '11px', fontWeight: 500 }}>
              Awaiting: {currentStep.name}
              {currentStep.assigneeEmployeeId && (
                <> · Staff ID {currentStep.assigneeEmployeeId}</>
              )}
            </span>
          </div>
        )}
        {req.status === 'sent_back' && (
          <div className="flex items-center gap-1.5 ml-auto text-orange-600" style={{ fontSize: '11px', fontWeight: 500 }}>
            <RotateCcw className="size-3" />
            Sent back — awaiting employee correction
          </div>
        )}
      </div>

      <div className="px-5 py-3">
        {isConfirmCompletion && req.staffFinishRemarks && (
          <p className="mb-3 p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-foreground" style={{ fontSize: '12px' }}>
            <strong>{req.staffFinishedBy}:</strong> {req.staffFinishRemarks}
          </p>
        )}
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {Object.entries(req.answers ?? {}).slice(0, 4).map(([k, v]) => (
            <div key={k}>
              <span className="text-muted-foreground" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {k.replace(/_/g, ' ')}
              </span>
              <span className="text-foreground ml-2" style={{ fontSize: '12px' }}>{String(v)}</span>
            </div>
          ))}
        </div>
      </div>

      {actionSuccess && (
        <div className="px-5 pb-2">
          <p className="text-emerald-600 flex items-center gap-1.5" style={{ fontSize: '12px' }}>
            <CheckCircle className="size-3.5" />
            {actionSuccess}
          </p>
        </div>
      )}

      {remarksOpen && canAct && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-5 pb-3 overflow-hidden space-y-2"
        >
          {activeAction === 'forward' && (
            <>
              <p className="text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>
                FORWARD TO STAFF (SAME DEPARTMENT — HOD OR STAFF)
              </p>
              {forwardEmployee && (
                <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/30">
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate" style={{ fontSize: '12px', fontWeight: 600 }}>{forwardEmployee.name}</p>
                    <p className="text-muted-foreground truncate" style={{ fontSize: '10px' }}>{forwardEmployee.designation} · {forwardEmployee.department}</p>
                  </div>
                </div>
              )}
              <div className="relative">
                <input
                  value={forwardStaffId}
                  onChange={e => { setForwardStaffId(e.target.value); setActionError(''); }}
                  placeholder="Enter Staff ID to forward"
                  className="w-full h-9 px-3 pr-10 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  style={{ fontSize: '12px' }}
                />
                {forwardVerifying && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
                )}
              </div>
            </>
          )}
          <textarea
            value={remarks}
            onChange={e => { setRemarks(e.target.value); setActionError(''); }}
            placeholder={
              activeAction === 'forward'
                ? 'Add remarks for forward (optional)...'
                : activeAction === 'request-info'
                  ? 'Explain what the employee must fix (required)...'
                  : `Add remarks for ${activeAction?.replace('-', ' ')}...`
            }
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            style={{ fontSize: '12px' }}
          />
          {actionError && (
            <p className="text-destructive flex items-center gap-1.5" style={{ fontSize: '12px' }}>
              <AlertTriangle className="size-3.5 shrink-0" />
              {actionError}
            </p>
          )}
        </motion.div>
      )}

      <div className="px-5 py-3 border-t border-border/50 flex items-center justify-between gap-2 flex-wrap">
        {canAct && actions.length > 0 ? (
          <div className="flex gap-2 flex-wrap">
            {actions.map(({ id, label, icon: Icon }) => (
              <motion.button
                key={id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectAction(id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors',
                  actionStyle(id, activeAction === id),
                )}
                style={{ fontSize: '12px', fontWeight: 500 }}
              >
                <Icon className="size-3.5" />
                {label}
              </motion.button>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
            {tab === 'approved'
              ? 'You approved this request. Use Send Back if the employee must correct it.'
              : tab === 'rejected'
                ? 'You rejected this request. Use Send Back to return it to the employee instead.'
                : req.status === 'processing' && req.queueStatus === 'pending_hod_review'
                  ? 'Staff finished — confirm completion in My Tasks.'
                  : req.status === 'processing'
                  ? 'In department processing — assign and track from Workflow Pipeline.'
                  : 'No action required on this step.'}
          </p>
        )}
        <div className="flex items-center gap-2">
          {remarksOpen && activeAction && canAct && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={submitting}
              onClick={() => void handleConfirm()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ fontSize: '12px', fontWeight: 500 }}
            >
              {submitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {submitting ? 'Saving...' : 'Confirm'}
            </motion.button>
          )}
          <button
            onClick={onView}
            className="flex items-center gap-1.5 text-primary hover:underline"
            style={{ fontSize: '12px' }}
          >
            <Eye className="size-3.5" />
            Full Details
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function canActPending(req: Request, currentUser: Approver | null, variant: ApprovalsVariant) {
  const step = req.workflow[req.currentStep - 1];
  if (!step || step.status !== 'pending') return false;

  if (variant === 'approval') {
    if (isMdRole(currentUser?.role)) {
      return isMdApprovalPending(req);
    }
    if (APPROVAL_STEP_TYPES.has(step.type)) return req.status === 'pending_approval';
    return false;
  }

  if (isMdRole(currentUser?.role)) return false;

  if (step.type === 'department_processor' && !req.receiverApprovedBy && !req.receiverAcceptedBy) {
    return canReceiverHodAcceptNow(req);
  }
  return false;
}

function canSendBack(req: Request, currentUser: Approver | null) {
  if (!currentUser || ['sent_back', 'completed', 'cancelled'].includes(req.status)) return false;
  const userApproved = req.workflow.some((s) => s.completedBy === currentUser.name && s.status === 'approved');
  const userRejected = req.workflow.some((s) => s.completedBy === currentUser.name && s.status === 'rejected');
  return userApproved || userRejected;
}

export function ApprovalsPage({ variant = 'approval' }: { variant?: ApprovalsVariant }) {
  const { navigate, setSelectedRequest, performApprovalAction, refreshRequests, currentUser } = useApp();
  const [tab, setTab] = useState<ApprovalTab>('pending');
  const [search, setSearch] = useState('');
  const [approvalRequests, setApprovalRequests] = useState<Request[]>([]);
  const [tabCounts, setTabCounts] = useState({ pending: 0, approved: 0, rejected: 0, all: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const tabCacheRef = useRef<Partial<Record<ApprovalTab, Request[]>>>({});

  const filterForVariant = useCallback((requests: Request[], activeTab: ApprovalTab) => (
    requests.filter((r) => matchesVariant(r, variant, activeTab, currentUser))
  ), [variant, currentUser]);

  const hydrateFromSummary = useCallback((buckets: {
    pending: Request[];
    approved: Request[];
    rejected: Request[];
    all: Request[];
  }) => {
    tabCacheRef.current = {
      pending: filterForVariant(buckets.pending, 'pending'),
      approved: filterForVariant(buckets.approved, 'approved'),
      rejected: filterForVariant(buckets.rejected, 'rejected'),
      all: filterForVariant(buckets.all, 'all'),
    };
    setTabCounts({
      pending: tabCacheRef.current.pending?.length ?? 0,
      approved: tabCacheRef.current.approved?.length ?? 0,
      rejected: tabCacheRef.current.rejected?.length ?? 0,
      all: tabCacheRef.current.all?.length ?? 0,
    });
  }, [filterForVariant]);

  const loadAllTabs = useCallback(async () => {
    const res = await api.getApprovalSummary();
    hydrateFromSummary(res.data);
  }, [hydrateFromSummary]);

  const loadApprovals = useCallback(async (activeTab: ApprovalTab = tab) => {
    setLoadError('');
    const cached = tabCacheRef.current[activeTab];
    if (cached) {
      setApprovalRequests(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await loadAllTabs();
      setApprovalRequests(tabCacheRef.current[activeTab] ?? []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load approvals');
      setApprovalRequests([]);
    } finally {
      setLoading(false);
    }
  }, [tab, loadAllTabs]);

  const invalidateAndReload = useCallback(async (activeTab: ApprovalTab = tab) => {
    tabCacheRef.current = {};
    await loadApprovals(activeTab);
  }, [tab, loadApprovals]);

  useEffect(() => {
    tabCacheRef.current = {};
    setTab('pending');
  }, [variant]);

  useEffect(() => {
    void loadApprovals(tab);
  }, [tab, loadApprovals, variant]);

  useScreenRefresh(() => invalidateAndReload(tab));

  const filtered = approvalRequests.filter(r => {
    const q = search.toLowerCase();
    return !q || r.formTitle.toLowerCase().includes(q) || r.employee.name.toLowerCase().includes(q) || r.requestNumber.toLowerCase().includes(q);
  });

  const handleView = (req: Request) => {
    setSelectedRequest(req);
    navigate('request-detail');
  };

  const handleAction = async (
    req: Request,
    action: 'approve' | 'reject' | 'forward' | 'request-info' | 'confirm-completion' | 'send-back-rework',
    remarks: string,
    staffId?: string,
  ) => {
    const step = req.workflow[req.currentStep - 1];
    const receiverAccepted = req.receiverAcceptedBy || req.receiverApprovedBy;
    if (action === 'approve' && step?.type === 'department_processor' && !receiverAccepted) {
      await api.acceptProcessing(req.id, remarks);
      await Promise.all([invalidateAndReload(tab), refreshRequests()]);
      return;
    }
    if (action === 'confirm-completion') {
      await api.confirmCompletion(req.id, remarks || undefined);
      await Promise.all([invalidateAndReload(tab), refreshRequests()]);
      return;
    }
    if (action === 'send-back-rework') {
      await api.sendBackForRework(req.id, remarks);
      await Promise.all([invalidateAndReload(tab), refreshRequests()]);
      return;
    }
    await performApprovalAction(req.id, action, remarks, staffId);
    await Promise.all([invalidateAndReload(tab), refreshRequests()]);
  };

  const getActionMode = (req: Request): ActionMode => {
    if (tab === 'pending' && canActPending(req, currentUser, variant)) return 'pending';
    if (variant === 'approval' && (tab === 'approved' || tab === 'rejected') && canSendBack(req, currentUser)) return 'sendback';
    return 'none';
  };

  const pageTitle = variant === 'accept' ? 'Accept' : 'Approvals';
  const pageSubtitle = variant === 'accept'
    ? 'Accept incoming requests for department processing'
    : 'Review and approve pending form requests';

  const visibleTabs = variant === 'accept'
    ? ([
      { id: 'pending', label: 'Pending', count: tabCounts.pending },
      { id: 'approved', label: 'Accepted', count: tabCounts.approved },
      { id: 'all', label: 'All', count: tabCounts.all },
    ] as const)
    : ([
      { id: 'pending', label: 'Pending', count: tabCounts.pending },
      { id: 'approved', label: 'Handled', count: tabCounts.approved },
      { id: 'rejected', label: 'Rejected', count: tabCounts.rejected },
      { id: 'all', label: 'All', count: tabCounts.all },
    ] as const);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-5 w-full">
      <div>
        <h1 className="text-foreground" style={{ fontSize: '20px', fontWeight: 600 }}>{pageTitle}</h1>
        <p className="text-muted-foreground" style={{ fontSize: '13px' }}>{pageSubtitle}</p>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl bg-muted w-fit">
        {visibleTabs.map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all',
              tab === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
            style={{ fontSize: '12px', fontWeight: 500 }}
          >
            {label}
            <span className={cn(
              'size-5 rounded-full flex items-center justify-center',
              tab === id ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground',
            )} style={{ fontSize: '10px', fontWeight: 700 }}>{count}</span>
          </button>
        ))}
      </div>

      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={variant === 'accept' ? 'Search accept queue...' : 'Search approvals...'}
          className="w-full h-9 pl-9 pr-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          style={{ fontSize: '13px' }}
        />
      </div>

      {loadError && (
        <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive" style={{ fontSize: '13px' }}>
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center gap-3">
          <Loader2 className="size-8 text-primary animate-spin" />
          <p className="text-muted-foreground" style={{ fontSize: '13px' }}>Loading {variant === 'accept' ? 'accept queue' : 'approvals'}...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <CheckCircle className="size-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground" style={{ fontSize: '14px' }}>No requests to show</p>
          <p className="text-muted-foreground" style={{ fontSize: '12px' }}>You're all caught up!</p>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
          {filtered.map(req => {
            const actionMode = getActionMode(req);
            return (
              <ApprovalCard
                key={req.id}
                req={req}
                tab={tab}
                actionMode={actionMode}
                canAct={actionMode !== 'none'}
                onView={() => handleView(req)}
                onAction={(action, remarks, staffId) => handleAction(req, action, remarks, staffId)}
              />
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
