import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import {
  Search, Filter, LayoutGrid, List, BarChart2, ChevronDown,
  Clock, CheckCircle, XCircle, Loader2, Send, CheckSquare,
  AlertTriangle, TrendingUp, Users, Zap, SlidersHorizontal,
  RefreshCw, Download, ArrowUpRight, Paperclip, MessageSquare,
  User, Building2, Calendar, ChevronRight, Wifi, Mail,
  CalendarOff, IndianRupee, Monitor, Plus,
} from 'lucide-react';
import { cn } from '../components/ui/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

import { AnimatedCounter } from '../components/animations/AnimatedCounter';
import { TiltCard } from '../components/animations/TiltCard';
import { RippleButton } from '../components/animations/RippleButton';
import { AnimatedProgress } from '../components/animations/AnimatedProgress';
import { SkeletonCard, SkeletonRow } from '../components/animations/Skeleton';
import { DetailPanel } from '../components/workflow/DetailPanel';
import { stagger, fadeUp, scaleIn } from '../lib/animations';

import {
  COLUMNS, PRIORITY_CONFIG,
  type WFRequest, type WFStatus, type ColumnConfig,
} from '../data/workflowData';
import { useApp } from '../context/AppContext';
import { requestsToWorkflow } from '../utils/mapRequestToWorkflow';

/* ── Icon map ────────────────────────────────────────────────── */
const ICON_MAP: Record<string, React.ElementType> = {
  Send, CheckCircle, XCircle, Loader2, CheckSquare, Clock,
  Wifi, Mail, CalendarOff, IndianRupee, Monitor,
};

/* ── Helpers ─────────────────────────────────────────────────── */
function slaMs(req: WFRequest) { return new Date(req.dueAt).getTime() - Date.now(); }
function slaLabel(req: WFRequest) {
  const ms = slaMs(req);
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  if (ms < 0) return { label: `Overdue ${h}h ${m}m`, critical: true };
  if (ms < 3600000) return { label: `${m}m left`, critical: true };
  if (ms < 7200000) return { label: `${h}h ${m}m`, warn: true };
  return { label: `${h}h ${m}m`, ok: true };
}

/* ── SLA Chip ────────────────────────────────────────────────── */
function SLAChip({ req }: { req: WFRequest }) {
  const { label, critical, warn } = slaLabel(req);
  return (
    <motion.span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded',
        critical ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' :
        warn ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400' :
        'bg-muted text-muted-foreground'
      )}
      animate={critical ? { opacity: [1, 0.5, 1] } : {}}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ fontSize: '10px', fontWeight: 600 }}
    >
      <Clock className="size-2.5" />
      {label}
    </motion.span>
  );
}

/* ── Step dots ───────────────────────────────────────────────── */
function StepDots({ steps, current }: { steps: WFRequest['steps']; current: number }) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={s.id}
          className={cn(
            'rounded-full transition-all',
            s.status === 'done' ? 'bg-emerald-500' :
            s.status === 'active' ? 'bg-primary' :
            s.status === 'rejected' ? 'bg-red-500' :
            'bg-muted-foreground/20'
          )}
          style={{ width: s.status === 'active' ? 14 : 6, height: 6 }}
        />
      ))}
      <span className="text-muted-foreground ml-1" style={{ fontSize: '9px' }}>
        {current}/{steps.length}
      </span>
    </div>
  );
}

/* ── Pipeline Card ───────────────────────────────────────────── */
function PipelineCard({
  req,
  accent,
  onClick,
  index,
}: {
  req: WFRequest;
  accent: string;
  onClick: () => void;
  index: number;
}) {
  const priorityCfg = PRIORITY_CONFIG[req.priority];
  const CatIcon = ICON_MAP[req.categoryIcon] ?? Send;

  return (
    <motion.div
      variants={fadeUp}
      layout
      layoutId={req.id}
      whileHover={{ y: -3, boxShadow: `0 12px 32px -8px rgba(0,0,0,0.12), 0 0 0 1px ${accent}22` }}
      onClick={onClick}
      className={cn(
        'group relative bg-card rounded-xl border border-border/70 cursor-pointer overflow-hidden',
        'border-l-[3px] transition-shadow',
        priorityCfg.border
      )}
    >
      {/* NEW badge */}
      {req.isNew && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 z-10"
        >
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground"
            style={{ fontSize: '8px', fontWeight: 800 }}
          >
            NEW
          </motion.span>
        </motion.div>
      )}

      {/* Hover glow accent line */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, ${accent}00, ${accent}, ${accent}00)` }}
      />

      <div className="p-3.5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: accent + '18' }}>
              <CatIcon className="size-3.5" style={{ color: accent }} />
            </div>
            <div className="min-w-0">
              <p className="text-foreground leading-tight" style={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.25 }}>
                {req.formTitle}
              </p>
              <p className="text-muted-foreground" style={{ fontSize: '10px', fontFamily: 'monospace' }}>
                {req.requestNumber}
              </p>
            </div>
          </div>

          <span className={cn('px-1.5 py-0.5 rounded shrink-0', priorityCfg.bg, priorityCfg.text)}
            style={{ fontSize: '8px', fontWeight: 800 }}>
            {req.priority.toUpperCase()}
          </span>
        </div>

        {/* Employee */}
        <div className="flex items-center gap-2 mb-2.5">
          <div className="size-6 rounded-full flex items-center justify-center shrink-0"
            style={{ background: req.employeeColor + '22', border: `1px solid ${req.employeeColor}44` }}>
            <span style={{ fontSize: '8px', fontWeight: 700, color: req.employeeColor }}>{req.employeeInitials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-foreground truncate" style={{ fontSize: '11px', fontWeight: 500 }}>{req.employeeName}</p>
            <p className="text-muted-foreground truncate" style={{ fontSize: '10px' }}>{req.employeeDept}</p>
          </div>
          {req.assignedTo && (
            <div className="ml-auto size-5 rounded-full bg-muted flex items-center justify-center shrink-0"
              title={`Assigned to ${req.assignedTo}`}>
              <span className="text-muted-foreground" style={{ fontSize: '7px', fontWeight: 700 }}>{req.assignedInitials}</span>
            </div>
          )}
        </div>

        {/* Step dots */}
        <StepDots steps={req.steps} current={req.currentStep} />

        {/* Footer */}
        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-border/50">
          <SLAChip req={req} />
          <div className="flex items-center gap-2 text-muted-foreground">
            {req.commentsCount > 0 && (
              <span className="flex items-center gap-0.5" style={{ fontSize: '10px' }}>
                <MessageSquare className="size-2.5" />{req.commentsCount}
              </span>
            )}
            {req.attachmentsCount > 0 && (
              <span className="flex items-center gap-0.5" style={{ fontSize: '10px' }}>
                <Paperclip className="size-2.5" />{req.attachmentsCount}
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {req.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {req.tags.slice(0, 2).map(t => (
              <span key={t} className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground" style={{ fontSize: '9px' }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Pipeline Column ─────────────────────────────────────────── */
function PipelineColumn({
  col,
  requests,
  onCardClick,
  isCollapsed,
  onToggle,
}: {
  col: ColumnConfig;
  requests: WFRequest[];
  onCardClick: (req: WFRequest) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  const ColIcon = ICON_MAP[col.iconName] ?? Send;
  const overdueCount = requests.filter(r => r.isOverdue).length;

  return (
    <motion.div
      layout
      animate={{ width: isCollapsed ? 48 : 280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col rounded-2xl border border-border/60 overflow-hidden shrink-0"
      style={{ minWidth: isCollapsed ? 48 : 280, maxWidth: isCollapsed ? 48 : 280 }}
    >
      {/* Column header */}
      <div
        className={cn('px-3 py-3 border-b border-border/50 cursor-pointer', col.headerBg)}
        onClick={onToggle}
        style={{ borderTop: `3px solid ${col.accent}` }}
      >
        <div className={cn('flex items-center gap-2', isCollapsed && 'flex-col')}>
          <div className="flex items-center justify-center size-6 rounded-md shrink-0"
            style={{ background: col.accent + '22' }}>
            <ColIcon className="size-3.5" style={{ color: col.accent }} />
          </div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <div className="flex items-center gap-2">
                  <span className="text-foreground truncate" style={{ fontSize: '12px', fontWeight: 600 }}>{col.label}</span>
                  <span className={cn('px-1.5 py-0.5 rounded-full shrink-0', col.badgeBg, col.badgeText)}
                    style={{ fontSize: '10px', fontWeight: 700 }}>
                    {requests.length}
                  </span>
                  {overdueCount > 0 && (
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="flex items-center gap-0.5 text-red-600"
                      style={{ fontSize: '9px', fontWeight: 700 }}
                    >
                      <AlertTriangle className="size-2.5" />{overdueCount}
                    </motion.span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isCollapsed && (
            <span className={cn('px-1 py-0.5 rounded text-center', col.badgeBg, col.badgeText)} style={{ fontSize: '9px', fontWeight: 700 }}>
              {requests.length}
            </span>
          )}
        </div>
      </div>

      {/* Cards */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn('flex-1 overflow-y-auto p-3 space-y-3', col.trackBg)}
            style={{ minHeight: 200, maxHeight: 'calc(100vh - 280px)' }}
          >
            {requests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-10 text-center"
              >
                <div className="size-10 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: col.accent + '15' }}>
                  <ColIcon className="size-5" style={{ color: col.accent + '80' }} />
                </div>
                <p className="text-muted-foreground" style={{ fontSize: '12px', fontWeight: 500 }}>No requests</p>
                <p className="text-muted-foreground/60" style={{ fontSize: '10px' }}>All clear here</p>
              </motion.div>
            ) : (
              <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="space-y-3">
                {requests.map((req, i) => (
                  <PipelineCard key={req.id} req={req} accent={col.accent} onClick={() => onCardClick(req)} index={i} />
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Stat strip ──────────────────────────────────────────────── */
function StatStrip({ requests }: { requests: WFRequest[] }) {
  const total = requests.length;
  const overdue = requests.filter(r => r.isOverdue).length;
  const pending = requests.filter(r => r.status === 'pending_approval').length;
  const completed = requests.filter(r => r.status === 'completed').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <motion.div
      variants={stagger(0.06)}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 md:grid-cols-4 gap-3"
    >
      {[
        { label: 'Total Requests', value: total, icon: LayoutGrid, color: 'text-primary', iconBg: 'bg-primary/10', change: '+4 today' },
        { label: 'Pending Approval', value: pending, icon: Clock, color: 'text-amber-600', iconBg: 'bg-amber-50 dark:bg-amber-950', change: 'Needs action' },
        { label: 'SLA Breached', value: overdue, icon: AlertTriangle, color: 'text-red-600', iconBg: 'bg-red-50 dark:bg-red-950', change: 'Critical' },
        { label: 'Completion Rate', value: completionRate, icon: TrendingUp, color: 'text-emerald-600', iconBg: 'bg-emerald-50 dark:bg-emerald-950', change: '+8% this week', suffix: '%' },
      ].map(({ label, value, icon: Icon, color, iconBg, change, suffix }, i) => (
        <TiltCard key={label} maxTilt={4} glare>
          <motion.div variants={fadeUp}>
            <Card className="border-border/60 shadow-sm">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground" style={{ fontSize: '11px', fontWeight: 500 }}>{label}</p>
                    <AnimatedCounter
                      target={value}
                      suffix={suffix}
                      duration={900 + i * 80}
                      className={cn('block mt-0.5', color)}
                      style={{ fontSize: '26px', fontWeight: 700, lineHeight: 1 } as React.CSSProperties}
                    />
                    <p className="text-muted-foreground mt-1" style={{ fontSize: '10px' }}>{change}</p>
                  </div>
                  <motion.div className={cn('size-9 rounded-xl flex items-center justify-center', iconBg)}
                    whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.4 } }}>
                    <Icon className={cn('size-4', color)} />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TiltCard>
      ))}
    </motion.div>
  );
}

/* ── Timeline view ───────────────────────────────────────────── */
function TimelineView({ requests, onSelect }: { requests: WFRequest[]; onSelect: (r: WFRequest) => void }) {
  const sorted = [...requests].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  const grouped: Record<string, WFRequest[]> = {};
  sorted.forEach(r => {
    const key = new Date(r.submittedAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  return (
    <div className="w-full py-2 space-y-8">
      {Object.entries(grouped).map(([date, reqs]) => (
        <motion.div key={date} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-muted-foreground px-3 py-1 rounded-full border border-border bg-card"
              style={{ fontSize: '11px', fontWeight: 600 }}>{date}</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-2">
            {reqs.map((req) => {
              const col = COLUMNS.find(c => c.status === req.status)!;
              const CatIcon = ICON_MAP[req.categoryIcon] ?? Send;
              const ColIcon = ICON_MAP[col.iconName] ?? Send;
              const pcfg = PRIORITY_CONFIG[req.priority];
              return (
                <motion.div
                  key={req.id}
                  whileHover={{ x: 4 }}
                  onClick={() => onSelect(req)}
                  className="flex items-center gap-4 p-3.5 rounded-xl border border-border/60 bg-card cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  {/* Time */}
                  <span className="text-muted-foreground shrink-0 w-10 text-right" style={{ fontSize: '10px', fontFamily: 'monospace' }}>
                    {new Date(req.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {/* Status dot */}
                  <div className="size-2 rounded-full shrink-0" style={{ background: col.accent }} />

                  {/* Category icon */}
                  <div className="size-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: col.accent + '18' }}>
                    <CatIcon className="size-4" style={{ color: col.accent }} />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-foreground font-medium truncate" style={{ fontSize: '13px' }}>{req.formTitle}</p>
                      <span className={cn('px-1.5 py-0.5 rounded text-xs shrink-0', pcfg.bg, pcfg.text)}
                        style={{ fontSize: '9px', fontWeight: 700 }}>{req.priority.toUpperCase()}</span>
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: '11px' }}>
                      {req.employeeName} · {req.employeeDept}
                    </p>
                  </div>

                  {/* Status chip */}
                  <div className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full shrink-0', col.badgeBg, col.badgeText)}
                    style={{ fontSize: '10px', fontWeight: 600 }}>
                    <ColIcon className="size-3" />
                    {col.label}
                  </div>

                  <SLAChip req={req} />
                  <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Analytics view ──────────────────────────────────────────── */
const TOOLTIP_STYLE = { borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: '11px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' };

function AnalyticsView({
  requests,
  weeklyChart,
}: {
  requests: WFRequest[];
  weeklyChart: Array<{ day: string; submitted: number; approved: number; rejected: number; completed: number }>;
}) {
  const byCategory = requests.reduce<Record<string, number>>((a, r) => ({ ...a, [r.category]: (a[r.category] ?? 0) + 1 }), {});
  const byDept = requests.reduce<Record<string, number>>((a, r) => ({ ...a, [r.employeeDept]: (a[r.employeeDept] ?? 0) + 1 }), {});

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Volume chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Weekly Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={weeklyChart} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    {[['sub', '#2563EB'], ['app', '#059669']].map(([id, color]) => (
                      <linearGradient key={id} id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="submitted" name="Submitted" stroke="#2563EB" strokeWidth={2.5} fill="url(#g-sub)" dot={false} />
                  <Area type="monotone" dataKey="approved" name="Approved" stroke="#059669" strokeWidth={2.5} fill="url(#g-app)" dot={false} />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#f59e0b" strokeWidth={2} fill="none" strokeDasharray="4 3" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* By category */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>By Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(byCategory).length === 0 ? (
                <p className="text-muted-foreground text-center py-6" style={{ fontSize: '12px' }}>No requests yet</p>
              ) : (
                Object.entries(byCategory).map(([cat, count], i) => (
                  <div key={cat}>
                    <div className="flex justify-between mb-1">
                      <span className="text-foreground" style={{ fontSize: '12px' }}>{cat}</span>
                      <span className="text-muted-foreground" style={{ fontSize: '11px' }}>{count} req</span>
                    </div>
                    <AnimatedProgress value={(count / requests.length) * 100} height={5} delay={i * 0.1}
                      color={['#2563eb', '#7c3aed', '#10b981'][i % 3]} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Department breakdown */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Department Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(byDept).map(([dept, count], i) => (
                <motion.div key={dept} whileHover={{ y: -2 }}
                  className="p-3 rounded-xl border border-border bg-muted/20 text-center">
                  <p className="text-foreground" style={{ fontSize: '22px', fontWeight: 700 }}>{count}</p>
                  <p className="text-muted-foreground truncate" style={{ fontSize: '11px' }}>{dept}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/* ── Filter bar ──────────────────────────────────────────────── */
type FilterKey = 'all' | 'my_queue' | 'overdue' | 'high_priority' | 'pending';

const FILTERS: { id: FilterKey; label: string; dot?: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending', dot: '#D97706' },
  { id: 'my_queue', label: 'My Queue', dot: '#2563EB' },
  { id: 'overdue', label: 'Overdue', dot: '#DC2626' },
  { id: 'high_priority', label: 'High Priority', dot: '#7C3AED' },
];

/* ── Main page ───────────────────────────────────────────────── */
export function WorkflowPipelinePage() {
  const { requests, loading: appLoading, currentUser, chartData } = useApp();
  const workflowRequests = useMemo(() => requestsToWorkflow(requests), [requests]);
  const [view, setView] = useState<'pipeline' | 'timeline' | 'analytics'>('pipeline');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [selectedReq, setSelectedReq] = useState<WFRequest | null>(null);
  const [collapsed, setCollapsed] = useState<Set<WFStatus>>(new Set(['rejected']));
  const [showSearch, setShowSearch] = useState(false);

  const isLoading = appLoading;

  /* apply filters */
  const filtered = useMemo(() => {
    let reqs = workflowRequests;
    if (filter === 'overdue') reqs = reqs.filter(r => r.isOverdue);
    if (filter === 'high_priority') reqs = reqs.filter(r => r.priority === 'high' || r.priority === 'critical');
    if (filter === 'pending') reqs = reqs.filter(r => r.status === 'pending_approval');
    if (filter === 'my_queue') reqs = reqs.filter(r =>
      currentUser && (r.assignedTo === currentUser.name || r.assignedInitials === currentUser.initials)
    );
    if (search) {
      const q = search.toLowerCase();
      reqs = reqs.filter(r =>
        r.formTitle.toLowerCase().includes(q) ||
        r.employeeName.toLowerCase().includes(q) ||
        r.requestNumber.toLowerCase().includes(q) ||
        r.employeeDept.toLowerCase().includes(q)
      );
    }
    return reqs;
  }, [filter, search, workflowRequests, currentUser]);

  const reqsByStatus = (status: WFStatus) => filtered.filter(r => r.status === status);
  const toggleCollapse = (status: WFStatus) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full overflow-hidden"
    >
      {/* ── Sticky page header ─────────────────────────────────── */}
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-foreground flex items-center gap-2"
              style={{ fontSize: '20px', fontWeight: 700 }}
            >
              Workflow Pipeline
              <motion.span
                className="size-2 rounded-full bg-emerald-500"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="text-muted-foreground" style={{ fontSize: '12px' }}>
              {filtered.length} active requests · {workflowRequests.filter(r => r.isOverdue).length} SLA breach{workflowRequests.filter(r => r.isOverdue).length !== 1 ? 'es' : ''}
            </motion.p>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search */}
            <AnimatePresence mode="wait">
              {showSearch ? (
                <motion.div key="input" initial={{ width: 0, opacity: 0 }} animate={{ width: 220, opacity: 1 }} exit={{ width: 0, opacity: 0 }}>
                  <div className="flex items-center gap-2 h-8 px-3 rounded-lg border border-border bg-card">
                    <Search className="size-3.5 text-muted-foreground shrink-0" />
                    <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                      onBlur={() => { if (!search) setShowSearch(false); }}
                      placeholder="Search requests..."
                      className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
                      style={{ fontSize: '12px' }} />
                  </div>
                </motion.div>
              ) : (
                <motion.button key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSearch(true)}
                  className="size-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Search className="size-4" />
                </motion.button>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setIsLoading(true); setTimeout(() => setIsLoading(false), 700); }}
              className="size-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <RefreshCw className="size-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="size-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Download className="size-4" />
            </motion.button>

            <RippleButton size="sm" icon={<Plus className="size-4" />}>
              New Request
            </RippleButton>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* View toggle */}
          <div className="flex items-center gap-0.5 p-1 rounded-xl bg-muted">
            {([['pipeline', 'Pipeline', LayoutGrid], ['timeline', 'Timeline', List], ['analytics', 'Analytics', BarChart2]] as const).map(([id, label, Icon]) => (
              <motion.button
                key={id}
                onClick={() => setView(id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all',
                  view === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
                whileHover={view !== id ? { scale: 1.02 } : {}}
                whileTap={{ scale: 0.98 }}
                style={{ fontSize: '12px', fontWeight: view === id ? 500 : 400 }}
              >
                <Icon className="size-3.5" />
                {label}
              </motion.button>
            ))}
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-1.5">
            {FILTERS.map(({ id, label, dot }) => (
              <motion.button
                key={id}
                onClick={() => setFilter(id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all',
                  filter === id
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/40'
                )}
                style={{ fontSize: '11px', fontWeight: 500 }}
              >
                {dot && filter !== id && (
                  <span className="size-1.5 rounded-full shrink-0" style={{ background: dot }} />
                )}
                {label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className={cn('flex-1 overflow-auto', view === 'pipeline' ? 'overflow-x-auto' : '')}>
        <div className={cn(view === 'pipeline' ? 'p-5' : 'p-6')}>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
                <div className="flex gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="w-[280px] shrink-0 space-y-3">
                      <div className="h-10 rounded-xl bg-muted animate-pulse" />
                      {Array.from({ length: 3 }).map((_, j) => <SkeletonRow key={j} />)}
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : view === 'pipeline' ? (
              <motion.div key="pipeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                <StatStrip requests={filtered} />
                <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
                  {COLUMNS.map(col => (
                    <PipelineColumn
                      key={col.status}
                      col={col}
                      requests={reqsByStatus(col.status)}
                      onCardClick={setSelectedReq}
                      isCollapsed={collapsed.has(col.status)}
                      onToggle={() => toggleCollapse(col.status)}
                    />
                  ))}
                </div>
              </motion.div>
            ) : view === 'timeline' ? (
              <motion.div key="timeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <StatStrip requests={filtered} />
                <div className="mt-5">
                  <TimelineView requests={filtered} onSelect={setSelectedReq} />
                </div>
              </motion.div>
            ) : (
              <motion.div key="analytics" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <AnalyticsView requests={filtered} weeklyChart={chartData.weekly} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Detail Panel ───────────────────────────────────────── */}
      <DetailPanel request={selectedReq} onClose={() => setSelectedReq(null)} />
    </motion.div>
  );
}
