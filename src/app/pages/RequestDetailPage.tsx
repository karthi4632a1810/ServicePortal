import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, CheckCircle, XCircle, Clock, FileText, User,
  Building2, MessageSquare, Paperclip, Send, RotateCcw,
  Forward, HelpCircle, Download, AlertCircle, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../components/ui/utils';
import { useApp } from '../context/AppContext';
import type { RequestStatus } from '../types';

const STATUS_CONFIG: Record<RequestStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  submitted: { label: 'Submitted', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-200 dark:border-blue-800' },
  pending_approval: { label: 'Pending Approval', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950', border: 'border-amber-200 dark:border-amber-800' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950', border: 'border-emerald-200 dark:border-emerald-800' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-200 dark:border-red-800' },
  processing: { label: 'Processing', icon: Loader2, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950', border: 'border-purple-200 dark:border-purple-800' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-50 dark:bg-emerald-950', border: 'border-emerald-200 dark:border-emerald-800' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700' },
  sent_back: { label: 'Sent Back', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950', border: 'border-orange-200 dark:border-orange-800' },
};

function TimelineEvent({ by, role, text, timestamp, type, isLast }: {
  by: string; role: string; text: string; timestamp: string; type: string; isLast?: boolean;
}) {
  const isSystem = type === 'system';
  const isAction = type === 'action';

  const dotColor = isSystem ? 'bg-muted-foreground' : isAction ? 'bg-primary' : 'bg-emerald-500';

  return (
    <div className={cn('flex gap-3', !isLast && 'pb-5 border-l border-border ml-[11px]')}>
      <div className={cn('size-5.5 rounded-full border-2 border-background shrink-0 mt-0.5 -ml-[11px]', dotColor)} style={{ width: 22, height: 22 }} />
      <div className="flex-1 min-w-0 -mt-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-foreground" style={{ fontSize: '13px', fontWeight: 500 }}>{by}</span>
          <span className="text-muted-foreground" style={{ fontSize: '11px' }}>· {role}</span>
        </div>
        <p className="text-muted-foreground mt-0.5" style={{ fontSize: '13px' }}>{text}</p>
        <p className="text-muted-foreground/60 mt-1" style={{ fontSize: '10px' }}>
          {new Date(timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

export function RequestDetailPage() {
  const { selectedRequest, navigate, performApprovalAction, currentUser } = useApp();
  const [comment, setComment] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const req = selectedRequest;
  if (!req) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground" style={{ fontSize: '14px' }}>No request selected</p>
        <button
          onClick={() => navigate('approvals')}
          className="mt-4 text-primary hover:underline"
          style={{ fontSize: '13px' }}
        >
          Back to Approvals
        </button>
      </div>
    );
  }
  const statusCfg = STATUS_CONFIG[req.status];
  const StatusIcon = statusCfg.icon;

  const handleAction = (action: string) => {
    setActiveAction(action === activeAction ? null : action);
  };

  const handleConfirmAction = async () => {
    if (!activeAction || !req) return;
    const actionMap: Record<string, 'approve' | 'reject' | 'forward' | 'request-info'> = {
      approve: 'approve',
      reject: 'reject',
      forward: 'forward',
      info: 'request-info',
      sendback: 'request-info',
    };
    const action = actionMap[activeAction];
    if (!action) return;
    setSubmitting(true);
    setActionError('');
    try {
      await performApprovalAction(req.id, action, comment);
      setActiveAction(null);
      setComment('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-6 w-full space-y-5">
      {/* Back + Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('my-requests')}
            className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-foreground" style={{ fontSize: '17px', fontWeight: 600 }}>{req.requestNumber}</h1>
              <span className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold', statusCfg.bg, statusCfg.color, statusCfg.border)}>
                <StatusIcon className="size-3" />
                {statusCfg.label}
              </span>
            </div>
            <p className="text-muted-foreground" style={{ fontSize: '12px' }}>{req.formTitle}</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          style={{ fontSize: '12px' }}>
          <Download className="size-3.5" />
          Download PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Employee Card */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Employee Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <span className="text-primary-foreground font-bold" style={{ fontSize: '16px' }}>{req.employee.avatar ?? req.employee.name.substring(0, 2)}</span>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Name', value: req.employee.name },
                    { label: 'Employee ID', value: req.employee.id },
                    { label: 'Department', value: req.employee.department },
                    { label: 'Designation', value: req.employee.designation },
                    { label: 'Branch', value: req.employee.branch },
                    { label: 'HOD', value: req.employee.hod },
                    { label: 'Email', value: req.employee.email },
                    { label: 'Mobile', value: req.employee.mobile },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-muted-foreground" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                      <p className="text-foreground" style={{ fontSize: '13px' }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(req.answers).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-muted-foreground" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="text-foreground" style={{ fontSize: '13px' }}>
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {req.attachments.length > 0 && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {req.attachments.map(att => (
                    <div key={att.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                      <Paperclip className="size-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground truncate" style={{ fontSize: '13px' }}>{att.name}</p>
                        <p className="text-muted-foreground" style={{ fontSize: '11px' }}>{att.size}</p>
                      </div>
                      <Download className="size-4 text-muted-foreground hover:text-primary transition-colors" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Approval Actions */}
          {currentUser?.role !== 'employee' && (
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'approve', label: 'Approve', icon: CheckCircle, color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
                  { id: 'reject', label: 'Reject', icon: XCircle, color: 'bg-red-600 hover:bg-red-700 text-white' },
                  { id: 'sendback', label: 'Send Back', icon: RotateCcw, color: 'border border-orange-300 text-orange-700 hover:bg-orange-50 dark:text-orange-400' },
                  { id: 'forward', label: 'Forward', icon: Forward, color: 'border border-border text-foreground hover:bg-muted' },
                  { id: 'info', label: 'Request Info', icon: HelpCircle, color: 'border border-border text-foreground hover:bg-muted' },
                ].map(({ id, label, icon: Icon, color }) => (
                  <motion.button
                    key={id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction(id)}
                    className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors', color,
                      activeAction === id ? 'ring-2 ring-primary' : '')}
                    style={{ fontSize: '12px', fontWeight: 500 }}
                  >
                    <Icon className="size-3.5" />
                    {label}
                  </motion.button>
                ))}
              </div>

              <AnimatePresence>
                {activeAction && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 space-y-3">
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder={`Add a remark for "${activeAction}" action...`}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                        style={{ fontSize: '13px' }}
                      />
                      {actionError && (
                        <p className="text-destructive flex items-center gap-1.5" style={{ fontSize: '12px' }}>
                          <AlertCircle className="size-3.5 shrink-0" />
                          {actionError}
                        </p>
                      )}
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setActiveAction(null); setComment(''); }}
                          className="px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                          style={{ fontSize: '12px' }}
                        >
                          Cancel
                        </button>
                        <motion.button
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          disabled={submitting}
                          onClick={handleConfirmAction}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                          style={{ fontSize: '12px', fontWeight: 500 }}
                        >
                          <Send className="size-3" />
                          {submitting ? 'Processing...' : 'Confirm'}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
          )}
        </div>

        {/* Right: Workflow + Timeline */}
        <div className="space-y-5">
          {/* Workflow Progress */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Approval Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {req.workflow.map((step, i) => (
                  <div key={step.id} className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border',
                    step.status === 'approved' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800' :
                    step.status === 'rejected' ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' :
                    i + 1 === req.currentStep ? 'bg-primary/5 border-primary/30' :
                    'bg-muted/30 border-border'
                  )}>
                    <div className={cn(
                      'size-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                      step.status === 'approved' ? 'bg-emerald-500' :
                      step.status === 'rejected' ? 'bg-red-500' :
                      i + 1 === req.currentStep ? 'bg-primary' : 'bg-muted'
                    )}>
                      {step.status === 'approved' ? (
                        <CheckCircle className="size-3.5 text-white" />
                      ) : step.status === 'rejected' ? (
                        <XCircle className="size-3.5 text-white" />
                      ) : (
                        <span className="text-white" style={{ fontSize: '10px', fontWeight: 700 }}>{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground" style={{ fontSize: '12px', fontWeight: 500 }}>{step.name}</p>
                      {step.assignee && (
                        <p className="text-muted-foreground" style={{ fontSize: '11px' }}>{step.assignee}</p>
                      )}
                      {step.role && !step.assignee && (
                        <p className="text-muted-foreground" style={{ fontSize: '11px' }}>{step.role}</p>
                      )}
                      {step.completedAt && (
                        <p className="text-muted-foreground" style={{ fontSize: '10px' }}>
                          {new Date(step.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} by {step.completedBy}
                        </p>
                      )}
                      {step.comment && (
                        <p className="mt-1 text-muted-foreground italic" style={{ fontSize: '11px' }}>"{step.comment}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="ml-2.5">
                {req.comments.map((c, i) => (
                  <TimelineEvent
                    key={c.id}
                    by={c.by}
                    role={c.role}
                    text={c.text}
                    timestamp={c.timestamp}
                    type={c.type}
                    isLast={i === req.comments.length - 1}
                  />
                ))}
              </div>

              {/* Add comment */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    placeholder="Add a comment..."
                    className="flex-1 h-9 px-3 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    style={{ fontSize: '13px' }}
                  />
                  <button className="size-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                    <Send className="size-3.5" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meta */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="pt-5">
              <div className="space-y-3">
                {[
                  { label: 'Submitted', value: new Date(req.submittedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) },
                  { label: 'Last Updated', value: new Date(req.updatedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) },
                  { label: 'Priority', value: req.priority.toUpperCase() },
                  { label: 'Category', value: req.category },
                  { label: 'Department', value: req.department },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-muted-foreground" style={{ fontSize: '12px' }}>{label}</span>
                    <span className="text-foreground" style={{ fontSize: '12px', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
