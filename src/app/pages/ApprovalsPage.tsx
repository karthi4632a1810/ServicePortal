import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle, XCircle, Clock, RotateCcw, Forward, FileText,
  User, Building2, Calendar, Search, Eye, AlertTriangle, Loader2,
} from 'lucide-react';
import { cn } from '../components/ui/utils';
import { useApp } from '../context/AppContext';
import type { Request } from '../types';

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
};

function ApprovalCard({ req, onView, onAction, canAct }: {
  req: Request;
  onView: () => void;
  onAction: (action: 'approve' | 'reject' | 'forward' | 'request-info', remarks: string) => Promise<void>;
  canAct: boolean;
}) {
  const [remarksOpen, setRemarksOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const currentStep = req.workflow[req.currentStep - 1];
  const submittedDaysAgo = Math.floor((Date.now() - new Date(req.submittedAt).getTime()) / 86400000);

  const selectAction = (action: string) => {
    setActionError('');
    setActionSuccess('');
    setActiveAction(action);
    setRemarksOpen(true);
  };

  const handleConfirm = async () => {
    if (!activeAction) return;
    const actionMap: Record<string, 'approve' | 'reject' | 'forward' | 'request-info'> = {
      approve: 'approve',
      reject: 'reject',
      forward: 'forward',
      'request-info': 'request-info',
    };
    const action = actionMap[activeAction];
    if (!action) return;

    if ((action === 'reject' || action === 'request-info') && !remarks.trim()) {
      setActionError('Please add remarks before confirming.');
      return;
    }

    setSubmitting(true);
    setActionError('');
    setActionSuccess('');
    try {
      await onAction(action, remarks);
      setActionSuccess(
        action === 'approve' ? 'Request approved successfully.'
          : action === 'reject' ? 'Request rejected.'
            : action === 'request-info' ? 'Request sent back to employee.'
              : 'Request forwarded.',
      );
      setRemarksOpen(false);
      setRemarks('');
      setActiveAction(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
          {submittedDaysAgo >= 1 && (
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
        {currentStep && (
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="size-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Clock className="size-2.5 text-primary" />
            </div>
            <span className="text-primary" style={{ fontSize: '11px', fontWeight: 500 }}>
              Awaiting: {currentStep.name}
            </span>
          </div>
        )}
      </div>

      <div className="px-5 py-3">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {Object.entries(req.answers).slice(0, 4).map(([k, v]) => (
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
          className="px-5 pb-3 overflow-hidden"
        >
          <textarea
            value={remarks}
            onChange={e => { setRemarks(e.target.value); setActionError(''); }}
            placeholder={`Add remarks for ${activeAction?.replace('-', ' ')}...`}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            style={{ fontSize: '12px' }}
          />
          {actionError && (
            <p className="text-destructive mt-2 flex items-center gap-1.5" style={{ fontSize: '12px' }}>
              <AlertTriangle className="size-3.5 shrink-0" />
              {actionError}
            </p>
          )}
        </motion.div>
      )}

      <div className="px-5 py-3 border-t border-border/50 flex items-center justify-between gap-2 flex-wrap">
        {canAct ? (
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'approve', label: 'Approve', icon: CheckCircle },
              { id: 'reject', label: 'Reject', icon: XCircle },
              { id: 'request-info', label: 'Send Back', icon: RotateCcw },
              { id: 'forward', label: 'Forward', icon: Forward },
            ].map(({ id, label, icon: Icon }) => (
              <motion.button
                key={id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectAction(id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors',
                  activeAction === id ? ACTION_STYLES[id].active : ACTION_STYLES[id].idle,
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
            {req.status === 'pending_approval' ? 'Awaiting another approver' : 'No action required'}
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

type ApprovalTab = 'pending' | 'approved' | 'rejected' | 'all';

export function ApprovalsPage() {
  const { navigate, setSelectedRequest, performApprovalAction, refreshApprovals } = useApp();
  const [tab, setTab] = useState<ApprovalTab>('pending');
  const [search, setSearch] = useState('');
  const [approvalRequests, setApprovalRequests] = useState<Request[]>([]);
  const [tabCounts, setTabCounts] = useState({ pending: 0, approved: 0, rejected: 0, all: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadApprovals = useCallback(async (activeTab: ApprovalTab = tab) => {
    setLoading(true);
    setLoadError('');
    try {
      const [pendingRes, approvedRes, rejectedRes, allRes] = await Promise.all([
        refreshApprovals('pending'),
        refreshApprovals('approved'),
        refreshApprovals('rejected'),
        refreshApprovals('all'),
      ]);
      setTabCounts({
        pending: pendingRes.length,
        approved: approvedRes.length,
        rejected: rejectedRes.length,
        all: allRes.length,
      });
      const tabData = { pending: pendingRes, approved: approvedRes, rejected: rejectedRes, all: allRes };
      setApprovalRequests(tabData[activeTab]);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load approvals');
      setApprovalRequests([]);
    } finally {
      setLoading(false);
    }
  }, [tab, refreshApprovals]);

  useEffect(() => {
    void loadApprovals(tab);
  }, [tab, loadApprovals]);

  const filtered = approvalRequests.filter(r => {
    const q = search.toLowerCase();
    return !q || r.formTitle.toLowerCase().includes(q) || r.employee.name.toLowerCase().includes(q) || r.requestNumber.toLowerCase().includes(q);
  });

  const handleView = (req: Request) => {
    setSelectedRequest(req);
    navigate('request-detail');
  };

  const handleAction = async (req: Request, action: 'approve' | 'reject' | 'forward' | 'request-info', remarks: string) => {
    await performApprovalAction(req.id, action, remarks);
    await loadApprovals(tab);
  };

  const canActOnRequest = (req: Request) => {
    const step = req.workflow[req.currentStep - 1];
    return req.status === 'pending_approval' && step?.status === 'pending' && tab === 'pending';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-5 w-full">
      <div>
        <h1 className="text-foreground" style={{ fontSize: '20px', fontWeight: 600 }}>Approvals</h1>
        <p className="text-muted-foreground" style={{ fontSize: '13px' }}>Review and action pending forms</p>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl bg-muted w-fit">
        {([
          { id: 'pending', label: 'Pending', count: tabCounts.pending },
          { id: 'approved', label: 'Approved', count: tabCounts.approved },
          { id: 'rejected', label: 'Rejected', count: tabCounts.rejected },
          { id: 'all', label: 'All', count: tabCounts.all },
        ] as const).map(({ id, label, count }) => (
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
          placeholder="Search approvals..."
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
          <p className="text-muted-foreground" style={{ fontSize: '13px' }}>Loading approvals...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <CheckCircle className="size-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground" style={{ fontSize: '14px' }}>No requests to show</p>
          <p className="text-muted-foreground" style={{ fontSize: '12px' }}>You're all caught up!</p>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
          {filtered.map(req => (
            <ApprovalCard
              key={req.id}
              req={req}
              canAct={canActOnRequest(req)}
              onView={() => handleView(req)}
              onAction={(action, remarks) => handleAction(req, action, remarks)}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
