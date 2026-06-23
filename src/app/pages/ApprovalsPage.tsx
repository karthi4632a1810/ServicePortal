import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle, XCircle, Clock, RotateCcw, Forward, FileText,
  User, Building2, Calendar, Filter, Search, Eye, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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

function ApprovalCard({ req, onView, onAction }: {
  req: Request;
  onView: () => void;
  onAction: (action: 'approve' | 'reject' | 'forward' | 'request-info', remarks: string) => Promise<void>;
}) {
  const [remarksOpen, setRemarksOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentStep = req.workflow[req.currentStep - 1];
  const submittedDaysAgo = Math.floor((Date.now() - new Date(req.submittedAt).getTime()) / 86400000);

  return (
    <motion.div
      variants={fadeUp}
      layout
      className="bg-card border border-border/60 rounded-xl overflow-hidden hover:border-primary/30 transition-colors shadow-sm"
    >
      {/* Card Header */}
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

      {/* Employee Info */}
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

      {/* Content preview */}
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

      {/* Remarks field */}
      {remarksOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-5 pb-3 overflow-hidden"
        >
          <textarea
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            placeholder={`Add remarks for ${activeAction}...`}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            style={{ fontSize: '12px' }}
          />
        </motion.div>
      )}

      {/* Action Bar */}
      <div className="px-5 py-3 border-t border-border/50 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setActiveAction('approve'); setRemarksOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            style={{ fontSize: '12px', fontWeight: 500 }}
          >
            <CheckCircle className="size-3.5" />
            Approve
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setActiveAction('reject'); setRemarksOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
            style={{ fontSize: '12px', fontWeight: 500 }}
          >
            <XCircle className="size-3.5" />
            Reject
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setActiveAction('request-info'); setRemarksOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-700 dark:hover:bg-orange-950 transition-colors"
            style={{ fontSize: '12px', fontWeight: 500 }}
          >
            <RotateCcw className="size-3.5" />
            Send Back
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setActiveAction('forward'); setRemarksOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            style={{ fontSize: '12px' }}
          >
            <Forward className="size-3.5" />
            Forward
          </motion.button>
        </div>
        <div className="flex items-center gap-2">
          {remarksOpen && activeAction && (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true);
                try {
                  const actionMap: Record<string, 'approve' | 'reject' | 'forward' | 'request-info'> = {
                    approve: 'approve',
                    reject: 'reject',
                    forward: 'forward',
                    'request-info': 'request-info',
                  };
                  const action = actionMap[activeAction];
                  if (action) await onAction(action, remarks);
                  setRemarksOpen(false);
                  setRemarks('');
                  setActiveAction(null);
                } finally {
                  setSubmitting(false);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ fontSize: '12px', fontWeight: 500 }}
            >
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

export function ApprovalsPage() {
  const { navigate, setSelectedRequest, requests, performApprovalAction } = useApp();
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [search, setSearch] = useState('');

  const pending = requests.filter(r => r.status === 'pending_approval');
  const approved = requests.filter(r => r.status === 'approved' || r.status === 'completed');
  const rejected = requests.filter(r => r.status === 'rejected');

  const tabRequests = tab === 'pending' ? pending : tab === 'approved' ? approved : tab === 'rejected' ? rejected : requests;

  const filtered = tabRequests.filter(r => {
    const q = search.toLowerCase();
    return !q || r.formTitle.toLowerCase().includes(q) || r.employee.name.toLowerCase().includes(q) || r.requestNumber.toLowerCase().includes(q);
  });

  const handleView = (req: Request) => {
    setSelectedRequest(req);
    navigate('request-detail');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-5 w-full">
      {/* Header */}
      <div>
        <h1 className="text-foreground" style={{ fontSize: '20px', fontWeight: 600 }}>Approvals</h1>
        <p className="text-muted-foreground" style={{ fontSize: '13px' }}>Review and action pending forms</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-muted w-fit">
        {[
          { id: 'pending', label: 'Pending', count: pending.length },
          { id: 'approved', label: 'Approved', count: approved.length },
          { id: 'rejected', label: 'Rejected', count: rejected.length },
          { id: 'all', label: 'All', count: requests.length },
        ].map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setTab(id as never)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all',
              tab === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
            style={{ fontSize: '12px', fontWeight: 500 }}
          >
            {label}
            <span className={cn(
              'size-5 rounded-full flex items-center justify-center',
              tab === id ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'
            )} style={{ fontSize: '10px', fontWeight: 700 }}>{count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
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

      {/* Cards */}
      {filtered.length === 0 ? (
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
              onView={() => handleView(req)}
              onAction={(action, remarks) => performApprovalAction(req.id, action, remarks)}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
