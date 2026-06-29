import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, CheckCircle, XCircle, RotateCcw, Forward, HelpCircle,
  Send, Download, Paperclip, MessageSquare, Clock, Calendar,
  User, Tag, ExternalLink, ChevronRight, Zap,
  AlertTriangle, CheckSquare, Play, Loader2, UserPlus, FileText,
} from 'lucide-react';
import { cn } from '../ui/utils';
import type { WFRequest, WFStep } from '../../data/workflowData';
import { PRIORITY_CONFIG } from '../../data/workflowData';
import { RippleButton } from '../animations/RippleButton';
import { UserAvatar } from '../ui/user-avatar';
import { fetchEmployeeTiered } from '../../utils/fetchEmployeeTiered';
import type { Approver, Employee } from '../../types';
import { hasAdminAccess } from '../../utils/roleAccess';
import { api } from '../../services/api';
import { formatRequestAnswers, getRequestSummaryRows, type FormattedAnswerRow } from '../../utils/formatRequestAnswers';

/* ── SLA badge ───────────────────────────────────────────────── */
function SLABadge({ dueAt, isOverdue }: { dueAt: string; isOverdue?: boolean }) {
  const diff = new Date(dueAt).getTime() - Date.now();
  const absDiff = Math.abs(diff);
  const h = Math.floor(absDiff / 3600000);
  const m = Math.floor((absDiff % 3600000) / 60000);
  const label = isOverdue || diff < 0
    ? `Overdue by ${h > 0 ? `${h}h ` : ''}${m}m`
    : h === 0 ? `Due in ${m}m`
    : `Due in ${h}h ${m}m`;
  const color = isOverdue || diff < 0 ? 'text-red-600 bg-red-50 dark:bg-red-950' :
    diff < 7200000 ? 'text-amber-600 bg-amber-50 dark:bg-amber-950' :
    'text-emerald-600 bg-emerald-50 dark:bg-emerald-950';
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md', color)} style={{ fontSize: '11px', fontWeight: 600 }}>
      <Clock className="size-3" />
      {label}
    </span>
  );
}

/* ── Timeline step ───────────────────────────────────────────── */
function TimelineStep({ step, isLast }: { step: WFStep; isLast: boolean }) {
  const iconColor = step.status === 'done' ? '#059669' : step.status === 'active' ? '#2563EB' : step.status === 'rejected' ? '#DC2626' : '#94A3B8';
  const bgColor = step.status === 'done' ? 'bg-emerald-500' : step.status === 'active' ? 'bg-primary' : step.status === 'rejected' ? 'bg-red-500' : 'bg-muted';
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <motion.div
          className={cn('size-6 rounded-full flex items-center justify-center shrink-0', bgColor)}
          initial={{ scale: 0.7 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          {step.status === 'done' && <CheckCircle className="size-3.5 text-white" />}
          {step.status === 'rejected' && <XCircle className="size-3.5 text-white" />}
          {step.status === 'active' && (
            <motion.div className="size-2 rounded-full bg-white"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          )}
          {step.status === 'pending' && <div className="size-2 rounded-full bg-muted-foreground/30" />}
        </motion.div>
        {!isLast && <div className={cn('w-px flex-1 mt-1', step.status === 'done' ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-border')} style={{ minHeight: 24 }} />}
      </div>
      <div className={cn('flex-1 pb-4', isLast && 'pb-0')}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-foreground" style={{ fontSize: '13px', fontWeight: 500 }}>{step.label}</span>
          {step.status === 'active' && (
            <motion.span
              className="px-1.5 py-0.5 rounded bg-primary/15 text-primary"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ fontSize: '9px', fontWeight: 700 }}
            >
              CURRENT
            </motion.span>
          )}
        </div>
        {step.role && <p className="text-muted-foreground" style={{ fontSize: '11px' }}>{step.actor ? `${step.actor} · ` : ''}{step.role}</p>}
        {step.completedAt && <p className="text-muted-foreground/60" style={{ fontSize: '10px' }}>
          {new Date(step.completedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>}
        {step.comment && (
          <div className="mt-1.5 px-2.5 py-1.5 rounded-lg bg-muted/60 border-l-2 border-primary/40">
            <p className="text-muted-foreground italic" style={{ fontSize: '11px' }}>"{step.comment}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Activity comment ────────────────────────────────────────── */
function CommentBubble({ c }: { c: { author: string; role: string; initials: string; color: string; text: string; timestamp: string; type: string } }) {
  const isSystem = c.type === 'system';
  return (
    <div className={cn('flex gap-2.5', isSystem && 'opacity-60')}>
      <div className="size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: c.color + '22', border: `1.5px solid ${c.color}44` }}>
        <span style={{ fontSize: '9px', fontWeight: 700, color: c.color }}>{c.initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-foreground" style={{ fontSize: '12px', fontWeight: 500 }}>{c.author}</span>
          <span className="text-muted-foreground" style={{ fontSize: '10px' }}>{c.role}</span>
          <span className="text-muted-foreground/50 ml-auto" style={{ fontSize: '10px' }}>
            {new Date(c.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-foreground/80 mt-0.5" style={{ fontSize: '12px', lineHeight: 1.5 }}>{c.text}</p>
      </div>
    </div>
  );
}

interface DetailPanelProps {
  request: WFRequest | null;
  onClose: () => void;
  currentUser?: Approver | null;
  onApprove?: (requestId: string, action: 'approve' | 'reject', remarks?: string) => Promise<void>;
  onAcceptProcessing?: (requestId: string, remarks?: string) => Promise<void>;
  onAssign?: (requestId: string, staffIds: string | string[]) => Promise<void>;
  onQueueUpdate?: (requestId: string, queueStatus: 'in_progress') => Promise<void>;
  onSubmitForReview?: (requestId: string, remarks: string) => Promise<void>;
  onConfirmCompletion?: (requestId: string, remarks?: string) => Promise<void>;
  onSendBackForRework?: (requestId: string, remarks: string) => Promise<void>;
}

function departmentsMatch(a?: string, b?: string) {
  if (!a || !b) return false;
  const na = a.toLowerCase().replace(/\s+/g, ' ').trim();
  const nb = b.toLowerCase().replace(/\s+/g, ' ').trim();
  return na === nb || na.includes(nb) || nb.includes(na);
}

function isReceiverDeptHod(user: Approver, request: WFRequest) {
  if (hasAdminAccess(user.role)) return true;
  if (user.role !== 'hod') return false;
  return departmentsMatch(user.department, request.department);
}

function staffInitials(name: string) {
  return name
    .replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '??';
}

function DetailFieldRow({ row }: { row: FormattedAnswerRow }) {
  if (row.fieldType === 'section') {
    return (
      <p className="text-muted-foreground pt-3 first:pt-0" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {row.label}
      </p>
    );
  }
  if (row.fieldType === 'divider') {
    return <div className="border-t border-border/60 my-2" />;
  }
  return (
    <div className="py-2.5 border-b border-border/40 last:border-0">
      <p className="text-muted-foreground mb-0.5" style={{ fontSize: '11px', fontWeight: 500 }}>{row.label}</p>
      <p className="text-foreground whitespace-pre-wrap break-words" style={{ fontSize: '13px', lineHeight: 1.5 }}>{row.value}</p>
    </div>
  );
}

function QueueStatusPill({ queueStatus }: { queueStatus?: string }) {
  if (!queueStatus) return null;
  const label = queueStatus.replace(/_/g, ' ');
  const color = queueStatus === 'in_progress'
    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
    : queueStatus === 'pending_hod_review'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
      : 'bg-muted text-muted-foreground';
  return (
    <span className={cn('px-2 py-0.5 rounded-md capitalize', color)} style={{ fontSize: '10px', fontWeight: 600 }}>
      {label}
    </span>
  );
}

export function DetailPanel({
  request,
  onClose,
  currentUser,
  onApprove,
  onAcceptProcessing,
  onAssign,
  onQueueUpdate,
  onSubmitForReview,
  onConfirmCompletion,
  onSendBackForRework,
}: DetailPanelProps) {
  const [comment, setComment] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'timeline' | 'activity'>('overview');
  const [formattedRows, setFormattedRows] = useState<FormattedAnswerRow[]>([]);
  const [summaryRows, setSummaryRows] = useState<FormattedAnswerRow[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [finishRemarks, setFinishRemarks] = useState('');
  const [showFinishForm, setShowFinishForm] = useState(false);
  const [actionError, setActionError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assignEmployee, setAssignEmployee] = useState<Employee | null>(null);
  const [pendingAssignees, setPendingAssignees] = useState<Employee[]>([]);
  const [assignVerifying, setAssignVerifying] = useState(false);
  const lastVerifiedAssignId = useRef('');

  useEffect(() => {
    setAssignStaffId('');
    setAssignEmployee(null);
    setPendingAssignees([]);
    setRemarks('');
    setFinishRemarks('');
    setShowFinishForm(false);
    setActionError('');
    setActiveAction(null);
    lastVerifiedAssignId.current = '';
  }, [request?.id]);

  useEffect(() => {
    if (!request?.formId) {
      setFormattedRows([]);
      setSummaryRows([]);
      return;
    }

    let cancelled = false;
    setDetailsLoading(true);

    void (async () => {
      try {
        const [formRes, deptRes] = await Promise.all([
          api.getForm(request.formId),
          api.getDepartments().catch(() => ({ data: [] as Array<{ id: number; name: string }> })),
        ]);
        if (cancelled) return;

        const fields = formRes.data.fields ?? [];

        const departments = (deptRes.data ?? []).map((d) => ({
          label: d.name,
          value: String(d.id),
        }));

        const deptId = String(
          request.answers['f6']
          ?? request.answers['department']
          ?? request.answers['hrms-department']
          ?? '',
        ).trim();

        let designations: Array<{ label: string; value: string }> = [];
        if (deptId) {
          try {
            const desRes = await api.getDesignations(deptId);
            if (!cancelled) {
              designations = (desRes.data ?? []).map((d) => ({
                label: d.name,
                value: String(d.id),
              }));
            }
          } catch {
            // designations optional
          }
        }

        const rows = formatRequestAnswers(fields, request.answers, { departments, designations });
        if (!cancelled) {
          setFormattedRows(rows);
          setSummaryRows(getRequestSummaryRows(rows));
        }
      } catch {
        if (!cancelled) {
          const rows = formatRequestAnswers([], request.answers);
          setFormattedRows(rows);
          setSummaryRows(getRequestSummaryRows(rows));
        }
      } finally {
        if (!cancelled) setDetailsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [request?.formId, request?.answers, request?.id]);

  useEffect(() => {
    const id = assignStaffId.trim();
    if (!id) {
      setAssignEmployee(null);
      lastVerifiedAssignId.current = '';
      return;
    }
    if (id === lastVerifiedAssignId.current) return;

    const timer = window.setTimeout(() => {
      setAssignVerifying(true);
      setAssignEmployee(null);
      void fetchEmployeeTiered(id, undefined, setAssignEmployee).then((emp) => {
        if (assignStaffId.trim() !== id) return;
        if (emp) lastVerifiedAssignId.current = id;
        else lastVerifiedAssignId.current = '';
        setAssignVerifying(false);
      });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [assignStaffId]);

  const priorityCfg = request ? PRIORITY_CONFIG[request.priority] : null;
  const activeStep = request ? request.steps[request.currentStep - 1] : null;
  const activeStepType = activeStep?.type;
  const requesterHodApproved = request?.steps[0]?.status === 'done';
  const isHodStep = activeStepType === 'hod' && request?.status === 'pending_approval';
  const isProcessorStep = activeStepType === 'department_processor'
    && ['pending_approval', 'processing'].includes(request?.status || '');
  const receiverAccepted = request?.receiverAcceptedBy || request?.receiverApprovedBy;
  const needsReceiverAccept = Boolean(
    isProcessorStep && !receiverAccepted && requesterHodApproved,
  );
  const canReceiverAccept = Boolean(
    needsReceiverAccept && currentUser && isReceiverDeptHod(currentUser, request),
  );
  const canConfirmCompletion = Boolean(
    isProcessorStep
    && request?.queueStatus === 'pending_hod_review'
    && currentUser
    && isReceiverDeptHod(currentUser, request),
  );
  const canAssign = Boolean(
    isProcessorStep
    && receiverAccepted
    && !['in_progress', 'pending_hod_review', 'completed'].includes(request?.queueStatus || '')
    && currentUser
    && isReceiverDeptHod(currentUser, request),
  );
  const isAssignee = Boolean(
    currentUser
    && (
      request?.assignees?.some((a) => String(a.employeeId) === String(currentUser.employeeId || ''))
      || String(request?.assignedToEmployeeId || '') === String(currentUser.employeeId || '')
      || request?.assignedTo === currentUser.name
    ),
  );

  const hasStaffActions = Boolean(
    request
    && request.status !== 'completed'
    && request.status !== 'rejected'
    && (
      (isHodStep && onApprove)
      || (canReceiverAccept && onAcceptProcessing)
      || (canAssign && onAssign)
      || canConfirmCompletion
      || (isProcessorStep && request.assignedToEmployeeId && !canAssign && !canReceiverAccept && !canConfirmCompletion)
    ),
  );

  const addPendingAssignee = () => {
    if (!assignEmployee || !request) return;
    const receiverDept = request.department;
    if (
      receiverDept
      && assignEmployee.department
      && !departmentsMatch(assignEmployee.department, receiverDept)
    ) {
      setActionError(
        `${assignEmployee.name} is in ${assignEmployee.department}. Assign only staff from ${receiverDept}.`,
      );
      return;
    }
    if (pendingAssignees.some((e) => e.id === assignEmployee.id)) return;
    if (request.assignees?.some((a) => String(a.employeeId) === assignEmployee.id)) return;
    setActionError('');
    setPendingAssignees((prev) => [...prev, assignEmployee]);
    setAssignStaffId('');
    setAssignEmployee(null);
    lastVerifiedAssignId.current = '';
  };

  const removePendingAssignee = (id: string) => {
    setPendingAssignees((prev) => prev.filter((e) => e.id !== id));
  };

  const handleApprove = async (action: 'approve' | 'reject') => {
    if (!request || !onApprove) return;
    setSubmitting(true);
    setActionError('');
    try {
      await onApprove(request.id, action, remarks);
      setRemarks('');
      setActiveAction(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async () => {
    if (!request || !onAcceptProcessing) return;
    setSubmitting(true);
    setActionError('');
    try {
      await onAcceptProcessing(request.id, remarks);
      setRemarks('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Accept failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async () => {
    if (!request || !onAssign) return;
    const receiverDept = request.department;
    const candidates = [
      ...pendingAssignees,
      ...(assignEmployee && !pendingAssignees.some((e) => e.id === assignEmployee.id) ? [assignEmployee] : []),
    ];
    const wrongDept = candidates.find(
      (e) => receiverDept && e.department && !departmentsMatch(e.department, receiverDept),
    );
    if (wrongDept) {
      setActionError(
        `${wrongDept.name} is in ${wrongDept.department}. Assign only staff from ${receiverDept}.`,
      );
      return;
    }
    const ids = candidates.map((e) => e.id);
    if (!ids.length) return;
    setSubmitting(true);
    setActionError('');
    try {
      await onAssign(request.id, ids.length === 1 ? ids[0] : ids);
      setAssignStaffId('');
      setAssignEmployee(null);
      setPendingAssignees([]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQueueUpdate = async (queueStatus: 'in_progress') => {
    if (!request || !onQueueUpdate) return;
    setSubmitting(true);
    setActionError('');
    try {
      await onQueueUpdate(request.id, queueStatus);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = async () => {
    if (!request || !onSubmitForReview) return;
    if (!finishRemarks.trim()) {
      setActionError('Remarks are required when finishing work');
      return;
    }
    setSubmitting(true);
    setActionError('');
    try {
      await onSubmitForReview(request.id, finishRemarks.trim());
      setFinishRemarks('');
      setShowFinishForm(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to submit for review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCompletion = async () => {
    if (!request || !onConfirmCompletion) return;
    setSubmitting(true);
    setActionError('');
    try {
      await onConfirmCompletion(request.id, remarks || undefined);
      setRemarks('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Confirmation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendBackRework = async () => {
    if (!request || !onSendBackForRework) return;
    if (!remarks.trim()) {
      setActionError('Remarks are required when sending back for rework');
      return;
    }
    setSubmitting(true);
    setActionError('');
    try {
      await onSendBackForRework(request.id, remarks.trim());
      setRemarks('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Send back failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {request && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-[2px] lg:hidden"
          />

          {/* Panel */}
          <motion.aside
            key="panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[440px] z-50 flex flex-col bg-card border-l border-border shadow-2xl"
          >
            {/* Sticky top: close + tabs */}
            <div className="shrink-0 sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
              <div className="flex items-center gap-2 px-4 py-2.5">
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-foreground truncate" style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace' }}>
                      {request.requestNumber}
                    </span>
                    {priorityCfg && (
                    <span className={cn('px-1.5 py-0.5 rounded shrink-0', priorityCfg.bg, priorityCfg.text)}
                        style={{ fontSize: '9px', fontWeight: 700 }}>
                        {request.priority.toUpperCase()}
                      </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    title="Open full page"
                    className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    title="Close"
                    className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <div className="flex px-4 overflow-x-auto scrollbar-none">
                {([
                  ['overview', 'Overview'],
                  ['details', 'Details'],
                  ['timeline', 'Workflow'],
                  ['activity', `Activity${request.commentsCount > 0 ? ` (${request.commentsCount})` : ''}`],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={cn(
                      'relative py-2.5 mr-5 whitespace-nowrap transition-colors shrink-0',
                      activeTab === id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                    style={{ fontSize: '12px', fontWeight: 500 }}
                  >
                    {label}
                    {activeTab === id && (
                      <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Body: scrollable content + sticky bottom actions */}
            <div className="flex flex-col flex-1 min-h-0">
            <div className={cn('flex-1 min-h-0 overflow-y-auto', hasStaffActions && 'pb-2')}>
              {/* Request header — scrolls with content */}
              <div className="px-5 pt-4 pb-3 border-b border-border/50 bg-muted/10">
                <div className="flex items-start gap-2 flex-wrap">
                    {request.isOverdue && (
                      <motion.span
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="flex items-center gap-0.5 text-red-600"
                        style={{ fontSize: '9px', fontWeight: 700 }}
                      >
                        <AlertTriangle className="size-2.5" /> SLA BREACHED
                      </motion.span>
                    )}
                  </div>
                  <p className="text-foreground mt-0.5" style={{ fontSize: '15px', fontWeight: 600 }}>{request.formTitle}</p>
                  <p className="text-muted-foreground" style={{ fontSize: '11px' }}>{request.category}</p>
              <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                <SLABadge dueAt={request.dueAt} isOverdue={request.isOverdue} />
                <span className="text-muted-foreground flex items-center gap-1" style={{ fontSize: '11px' }}>
                  <Calendar className="size-3" />
                  {new Date(request.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
                {request.watchers.length > 0 && (
                  <span className="text-muted-foreground" style={{ fontSize: '11px' }}>
                    {request.watchers.length} watcher{request.watchers.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-5 space-y-4"
                  >
                    {/* Compact employee */}
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                      <div className="size-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: request.employeeColor + '22', border: `1.5px solid ${request.employeeColor}44` }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: request.employeeColor }}>{request.employeeInitials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                        <p className="text-foreground truncate" style={{ fontSize: '13px', fontWeight: 600 }}>{request.employeeName}</p>
                        <p className="text-muted-foreground truncate" style={{ fontSize: '11px' }}>
                          Staff ID {request.employeeId} · {request.employeeDept}
                        </p>
                      </div>
                    </div>

                    {/* Assignee — primary focus */}
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-foreground" style={{ fontSize: '12px', fontWeight: 600 }}>Assignment</p>
                        <QueueStatusPill queueStatus={request.queueStatus} />
                      </div>

                      {(request.assignees?.length || request.assignedTo) ? (
                      <div className="space-y-2">
                          {(request.assignees?.length ? request.assignees : [{ employeeId: request.assignedToEmployeeId || '', name: request.assignedTo || '' }]).map((a) => (
                            <div key={a.employeeId || a.name} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-card border border-border/60">
                              <UserAvatar
                                name={a.name}
                                initials={staffInitials(a.name)}
                                employeeId={a.employeeId}
                                className="size-8"
                              />
                              <div className="min-w-0">
                                <span className="text-foreground block truncate" style={{ fontSize: '13px', fontWeight: 500 }}>{a.name}</span>
                                {a.employeeId && (
                                  <span className="text-muted-foreground" style={{ fontSize: '10px' }}>Staff ID: {a.employeeId}</span>
                                )}
                              </div>
                          </div>
                        ))}
                      </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground py-1">
                          <User className="size-4 shrink-0" />
                          <span style={{ fontSize: '12px' }}>Not assigned yet</span>
                        </div>
                      )}

                      {(request.receiverAcceptedBy || request.receiverApprovedBy) && (
                        <p className="text-muted-foreground flex items-center gap-1.5" style={{ fontSize: '11px' }}>
                          <CheckCircle className="size-3.5 text-emerald-600 shrink-0" />
                          Accepted by {request.receiverAcceptedBy || request.receiverApprovedBy}
                        </p>
                      )}
                      {request.staffFinishedBy && (
                        <p className="text-muted-foreground" style={{ fontSize: '11px' }}>
                          Finished by {request.staffFinishedBy}
                          {request.staffFinishRemarks ? ` — ${request.staffFinishRemarks}` : ''}
                        </p>
                      )}
                    </div>

                    {/* Short request summary */}
                    {summaryRows.length > 0 ? (
                      <div>
                        <p className="text-muted-foreground mb-2" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Request Summary</p>
                        <div className="rounded-xl border border-border/60 bg-card p-3 space-y-1">
                          {summaryRows.slice(0, 4).map((row) => (
                            <div key={row.id}>
                              <p className="text-muted-foreground" style={{ fontSize: '10px' }}>{row.label}</p>
                              <p className="text-foreground line-clamp-2" style={{ fontSize: '12px' }}>{row.value}</p>
                            </div>
                          ))}
                          {summaryRows.length > 4 && (
                            <button
                              type="button"
                              onClick={() => setActiveTab('details')}
                              className="text-primary hover:underline pt-1"
                              style={{ fontSize: '11px', fontWeight: 500 }}
                            >
                              View all {summaryRows.length} fields in Details
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveTab('details')}
                        className="w-full py-2.5 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                        style={{ fontSize: '12px' }}
                      >
                        View full form details
                      </button>
                    )}

                    {request.attachmentsCount > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-2" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Attachments ({request.attachmentsCount})
                        </p>
                        {Array.from({ length: request.attachmentsCount }).map((_, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                            <Paperclip className="size-3.5 text-muted-foreground" />
                            <span className="text-foreground flex-1 truncate" style={{ fontSize: '12px' }}>
                              {['travel_itinerary.pdf', 'medical_certificate.pdf', 'booking_confirmation.pdf'][i] ?? `attachment_${i + 1}.pdf`}
                            </span>
                            <Download className="size-3.5 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'details' && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-5"
                  >
                    {detailsLoading ? (
                      <div className="py-12 flex flex-col items-center gap-2">
                        <Loader2 className="size-6 text-primary animate-spin" />
                        <p className="text-muted-foreground" style={{ fontSize: '12px' }}>Loading form details...</p>
                      </div>
                    ) : formattedRows.length === 0 ? (
                      <div className="py-12 text-center">
                        <FileText className="size-8 text-muted-foreground/25 mx-auto mb-3" />
                        <p className="text-muted-foreground" style={{ fontSize: '13px' }}>No form details available</p>
                      </div>
                    ) : (
                      <div className="space-y-0">
                        {formattedRows.map((row) => (
                          <DetailFieldRow key={row.id} row={row} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'timeline' && (
                  <motion.div
                    key="timeline"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-5"
                  >
                    <div className="space-y-0">
                      {request.steps.map((step, i) => (
                        <TimelineStep key={step.id} step={step} isLast={i === request.steps.length - 1} />
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'activity' && (
                  <motion.div
                    key="activity"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-5 space-y-4"
                  >
                    {request.comments.length === 0 ? (
                      <div className="py-12 text-center">
                        <MessageSquare className="size-8 text-muted-foreground/25 mx-auto mb-3" />
                        <p className="text-muted-foreground" style={{ fontSize: '13px' }}>No activity yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {request.comments.map(c => <CommentBubble key={c.id} c={c} />)}
                      </div>
                    )}

                    {/* Comment box */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex gap-2">
                        <textarea
                          value={comment}
                          onChange={e => setComment(e.target.value)}
                          placeholder="Add a comment..."
                          rows={2}
                          className="flex-1 px-3 py-2 rounded-xl border border-border bg-input-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                          style={{ fontSize: '12px' }}
                        />
                      </div>
                      <div className="flex justify-end mt-2">
                        <RippleButton size="sm" variant="primary" icon={<Send className="size-3.5" />} disabled={!comment.trim()}>
                          Post
                        </RippleButton>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sticky bottom action bar */}
            {hasStaffActions && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="sticky bottom-0 z-30 shrink-0 border-t border-border bg-card shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.45)]"
              >
                <div className="p-4 space-y-3 max-h-[min(50vh,420px)] overflow-y-auto">
                {actionError && (
                  <p className="text-destructive flex items-center gap-1.5" style={{ fontSize: '12px' }}>
                    <AlertTriangle className="size-3.5 shrink-0" />
                    {actionError}
                  </p>
                )}

                {isHodStep && onApprove && (
                  <div className="space-y-2">
                    <textarea
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="Add remarks (optional for approve)..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      style={{ fontSize: '12px' }}
                    />
                <div className="flex gap-2">
                      <RippleButton
                        variant="success"
                        className="flex-1 justify-center"
                        icon={<CheckCircle className="size-4" />}
                        disabled={submitting}
                        onClick={() => void handleApprove('approve')}
                      >
                        {submitting ? 'Saving...' : 'Approve'}
                  </RippleButton>
                      <RippleButton
                        variant="destructive"
                        className="flex-1 justify-center"
                        icon={<XCircle className="size-4" />}
                        disabled={submitting}
                        onClick={() => void handleApprove('reject')}
                      >
                    Reject
                  </RippleButton>
                    </div>
                  </div>
                )}

                {canReceiverAccept && onAcceptProcessing && (
                  <div className="space-y-2">
                    <p className="text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>
                      RECEIVING DEPARTMENT — ACCEPT FOR PROCESSING
                    </p>
                    <textarea
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="Add remarks (optional)..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      style={{ fontSize: '12px' }}
                    />
                    <RippleButton
                      variant="success"
                      className="w-full justify-center"
                      icon={<CheckCircle className="size-4" />}
                      disabled={submitting}
                      onClick={() => void handleAccept()}
                    >
                      {submitting ? 'Accepting...' : 'Accept for Processing'}
                    </RippleButton>
                  </div>
                )}

                {canAssign && onAssign && (
                  <div className="space-y-2">
                    <p className="text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>
                      ASSIGN TO STAFF (ONE OR MORE BY STAFF ID)
                    </p>
                    {pendingAssignees.map((emp) => (
                      <div key={emp.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/30">
                        <UserAvatar
                          name={emp.name}
                          initials={staffInitials(emp.name)}
                          employeeId={emp.id}
                          className="size-8 rounded-lg"
                          fallbackClassName="rounded-lg"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground truncate" style={{ fontSize: '12px', fontWeight: 600 }}>{emp.name}</p>
                          <p className="text-muted-foreground truncate" style={{ fontSize: '10px' }}>Staff ID: {emp.id}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePendingAssignee(emp.id)}
                          className="text-muted-foreground hover:text-destructive p-1"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                    {assignEmployee && (
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-primary/40 bg-primary/5">
                        <UserAvatar
                          name={assignEmployee.name}
                          initials={staffInitials(assignEmployee.name)}
                          employeeId={assignEmployee.id}
                          className="size-10 rounded-lg"
                          fallbackClassName="rounded-lg"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground truncate" style={{ fontSize: '13px', fontWeight: 600 }}>{assignEmployee.name}</p>
                          <p className="text-muted-foreground truncate" style={{ fontSize: '11px' }}>{assignEmployee.department}</p>
                        </div>
                        <RippleButton size="sm" variant="secondary" onClick={addPendingAssignee}>
                          Add
                        </RippleButton>
                      </div>
                    )}
                    <div className="relative">
                      <input
                        value={assignStaffId}
                        onChange={e => setAssignStaffId(e.target.value)}
                        placeholder="Enter Staff ID to assign work"
                        className="w-full h-10 px-3 pr-10 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        style={{ fontSize: '13px' }}
                      />
                      {assignVerifying && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
                      )}
                    </div>
                    <RippleButton
                      variant="primary"
                      className="w-full justify-center"
                      icon={<UserPlus className="size-4" />}
                      disabled={submitting || (pendingAssignees.length === 0 && !assignEmployee)}
                      onClick={() => void handleAssign()}
                    >
                      {submitting ? 'Assigning...' : 'Assign & Send to Work Queue'}
                    </RippleButton>
                  </div>
                )}

                {canConfirmCompletion && (
                  <div className="space-y-2">
                    <p className="text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>
                      CONFIRM COMPLETION
                    </p>
                    {request.staffFinishRemarks && (
                      <p className="text-foreground p-2 rounded-lg bg-muted/40" style={{ fontSize: '12px' }}>
                        <strong>{request.staffFinishedBy}:</strong> {request.staffFinishRemarks}
                      </p>
                    )}
                    <textarea
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="Optional note for confirmation..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      style={{ fontSize: '12px' }}
                    />
                    <RippleButton
                      variant="success"
                      className="w-full justify-center"
                      icon={<CheckCircle className="size-4" />}
                      disabled={submitting}
                      onClick={() => void handleConfirmCompletion()}
                    >
                      {submitting ? 'Confirming...' : 'Confirm Completion'}
                    </RippleButton>
                    <RippleButton
                      variant="destructive"
                      className="w-full justify-center"
                      icon={<RotateCcw className="size-4" />}
                      disabled={submitting}
                      onClick={() => void handleSendBackRework()}
                    >
                      Send Back for Rework
                    </RippleButton>
                  </div>
                )}

                {isProcessorStep && request.assignedToEmployeeId && !canAssign && !canReceiverAccept && !canConfirmCompletion && (
                  <div className="space-y-2">
                    <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
                      Assigned to <strong>{request.assignedTo}</strong>
                      {request.queueStatus && (
                        <> · <span className="capitalize">{request.queueStatus.replace(/_/g, ' ')}</span></>
                      )}
                    </p>
                    {isAssignee && onQueueUpdate && request.queueStatus === 'pending' && (
                      <RippleButton
                        variant="primary"
                        className="w-full justify-center"
                        icon={<Play className="size-4" />}
                        disabled={submitting}
                        onClick={() => void handleQueueUpdate('in_progress')}
                      >
                        Start
                      </RippleButton>
                    )}
                    {isAssignee && onSubmitForReview && request.queueStatus === 'in_progress' && !showFinishForm && (
                      <RippleButton
                        variant="success"
                        className="w-full justify-center"
                        icon={<CheckCircle className="size-4" />}
                        disabled={submitting}
                        onClick={() => setShowFinishForm(true)}
                      >
                        Finish
                      </RippleButton>
                    )}
                    {isAssignee && onSubmitForReview && request.queueStatus === 'in_progress' && showFinishForm && (
                      <div className="space-y-2">
                        <textarea
                          value={finishRemarks}
                          onChange={e => { setFinishRemarks(e.target.value); setActionError(''); }}
                          placeholder="Describe what was done (required)..."
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                          style={{ fontSize: '12px' }}
                        />
                        <div className="flex gap-2">
                          <RippleButton variant="ghost" className="flex-1" onClick={() => { setShowFinishForm(false); setFinishRemarks(''); }}>
                            Cancel
                          </RippleButton>
                          <RippleButton
                            variant="success"
                            className="flex-1 justify-center"
                            disabled={submitting}
                            onClick={() => void handleFinish()}
                          >
                            {submitting ? 'Submitting...' : 'Submit for Review'}
                          </RippleButton>
                        </div>
                      </div>
                    )}
                    {request.queueStatus === 'pending_hod_review' && isAssignee && (
                      <p className="text-muted-foreground text-center" style={{ fontSize: '11px' }}>
                        Submitted for HOD confirmation.
                      </p>
                    )}
                    {!isAssignee && request.queueStatus !== 'pending_hod_review' && (
                      <p className="text-muted-foreground text-center" style={{ fontSize: '11px' }}>
                        Waiting for assigned staff to start and finish the work.
                      </p>
                    )}
                    {!isAssignee && request.queueStatus === 'pending_hod_review' && (
                      <p className="text-muted-foreground text-center" style={{ fontSize: '11px' }}>
                        Staff finished — awaiting your confirmation.
                      </p>
                    )}
                  </div>
                )}
                </div>
              </motion.div>
            )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
