import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, CheckCircle, XCircle, RotateCcw, Forward, HelpCircle,
  Send, Download, Paperclip, MessageSquare, Clock, Calendar,
  Building2, User, Tag, ExternalLink, ChevronRight, Zap,
  AlertTriangle, CheckSquare,
} from 'lucide-react';
import { cn } from '../ui/utils';
import type { WFRequest, WFStep } from '../../data/workflowData';
import { PRIORITY_CONFIG } from '../../data/workflowData';
import { RippleButton } from '../animations/RippleButton';

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
}

const QUICK_ACTIONS = [
  { id: 'approve', label: 'Approve', icon: CheckCircle, variant: 'success' as const, color: 'text-emerald-600' },
  { id: 'reject', label: 'Reject', icon: XCircle, variant: 'destructive' as const, color: 'text-red-600' },
  { id: 'sendback', label: 'Send Back', icon: RotateCcw, variant: 'ghost' as const, color: 'text-orange-600' },
  { id: 'forward', label: 'Forward', icon: Forward, variant: 'ghost' as const, color: 'text-blue-600' },
  { id: 'request_info', label: 'Request Info', icon: HelpCircle, variant: 'ghost' as const, color: 'text-purple-600' },
];

export function DetailPanel({ request, onClose }: DetailPanelProps) {
  const [comment, setComment] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'activity'>('overview');

  const priorityCfg = request ? PRIORITY_CONFIG[request.priority] : null;

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
            {/* Panel Header */}
            <div className="shrink-0 px-5 pt-4 pb-3 border-b border-border">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-foreground" style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>
                      {request.requestNumber}
                    </span>
                    {priorityCfg && (
                      <span className={cn('px-1.5 py-0.5 rounded', priorityCfg.bg, priorityCfg.text)}
                        style={{ fontSize: '9px', fontWeight: 700 }}>
                        {request.priority.toUpperCase()}
                      </span>
                    )}
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
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button title="Open full page"
                    className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <ExternalLink className="size-3.5" />
                  </button>
                  <button onClick={onClose}
                    className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              {/* SLA + meta strip */}
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

            {/* Tabs */}
            <div className="shrink-0 flex border-b border-border px-5">
              {([['overview', 'Overview'], ['timeline', 'Workflow'], ['activity', `Activity${request.commentsCount > 0 ? ` (${request.commentsCount})` : ''}`]] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'relative py-2.5 mr-5 transition-colors',
                    activeTab === id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
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

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-5 space-y-5"
                  >
                    {/* Employee */}
                    <div>
                      <p className="text-muted-foreground mb-2" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Employee</p>
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                        <div className="size-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: request.employeeColor + '22', border: `1.5px solid ${request.employeeColor}44` }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: request.employeeColor }}>{request.employeeInitials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground" style={{ fontSize: '13px', fontWeight: 500 }}>{request.employeeName}</p>
                          <p className="text-muted-foreground truncate" style={{ fontSize: '11px' }}>{request.employeeDesignation}</p>
                          <div className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: '10px' }}>
                            <Building2 className="size-2.5" />{request.employeeDept}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-muted-foreground" style={{ fontSize: '10px' }}>{request.employeeId}</p>
                          <p className="text-muted-foreground" style={{ fontSize: '10px' }}>{request.branch}</p>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div>
                      <p className="text-muted-foreground mb-2" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Request Details</p>
                      <div className="space-y-2">
                        {Object.entries(request.answers).map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-4 py-1.5 border-b border-border/40 last:border-0">
                            <span className="text-muted-foreground capitalize shrink-0" style={{ fontSize: '12px' }}>
                              {k.replace(/_/g, ' ')}
                            </span>
                            <span className="text-foreground text-right" style={{ fontSize: '12px', fontWeight: 500 }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Assignee + Tags */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-muted-foreground mb-1.5" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Assignee</p>
                        {request.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="size-6 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-primary-foreground" style={{ fontSize: '9px', fontWeight: 700 }}>{request.assignedInitials}</span>
                            </div>
                            <span className="text-foreground" style={{ fontSize: '12px' }}>{request.assignedTo}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground" style={{ fontSize: '12px' }}>Unassigned</span>
                        )}
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1.5" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {request.tags.map(t => (
                            <span key={t} className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground" style={{ fontSize: '10px' }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Attachments */}
                    {request.attachmentsCount > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-2" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Attachments</p>
                        {Array.from({ length: request.attachmentsCount }).map((_, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                            <Paperclip className="size-3.5 text-muted-foreground" />
                            <span className="text-foreground flex-1" style={{ fontSize: '12px' }}>
                              {['travel_itinerary.pdf', 'medical_certificate.pdf', 'booking_confirmation.pdf'][i] ?? `attachment_${i + 1}.pdf`}
                            </span>
                            <Download className="size-3.5 text-muted-foreground" />
                          </div>
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

                    {/* Current step action */}
                    {request.status !== 'completed' && request.status !== 'rejected' && (
                      <div className="mt-5 pt-5 border-t border-border">
                        <p className="text-muted-foreground mb-3" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick Action</p>
                        <div className="flex flex-wrap gap-2">
                          {QUICK_ACTIONS.map(({ id, label, icon: Icon, variant, color }) => (
                            <motion.button
                              key={id}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setActiveAction(activeAction === id ? null : id)}
                              className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all',
                                activeAction === id
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
                              )}
                              style={{ fontSize: '12px', fontWeight: 500 }}
                            >
                              <Icon className={cn('size-3.5', activeAction !== id && color)} />
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
                              className="overflow-hidden mt-3"
                            >
                              <textarea
                                placeholder={`Add remarks for ${QUICK_ACTIONS.find(a => a.id === activeAction)?.label ?? ''}...`}
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                                style={{ fontSize: '12px' }}
                              />
                              <div className="flex gap-2 justify-end mt-2">
                                <button onClick={() => setActiveAction(null)}
                                  className="px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                                  style={{ fontSize: '12px' }}>Cancel</button>
                                <RippleButton variant="primary" size="sm">Confirm</RippleButton>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
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

            {/* Bottom action bar */}
            {(request.status === 'pending_approval' || request.status === 'submitted') && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="shrink-0 border-t border-border p-4 bg-card/90 backdrop-blur-sm"
              >
                <div className="flex gap-2">
                  <RippleButton variant="success" className="flex-1 justify-center" icon={<CheckCircle className="size-4" />}>
                    Approve
                  </RippleButton>
                  <RippleButton variant="destructive" className="flex-1 justify-center" icon={<XCircle className="size-4" />}>
                    Reject
                  </RippleButton>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="size-10 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <RotateCcw className="size-4" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
