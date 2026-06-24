import React, { useState } from 'react';
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  FileText, Clock, CheckCircle, XCircle, Loader2, TrendingUp,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Activity, Users,
  Zap, RefreshCw, BarChart2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { cn } from '../components/ui/utils';
import { useApp } from '../context/AppContext';
import type { Request } from '../types';

/* ── Animation imports ───────────────────────────────────────── */
import { AnimatedCounter } from '../components/animations/AnimatedCounter';
import { TiltCard } from '../components/animations/TiltCard';
import { FloatingOrbs } from '../components/animations/FloatingOrbs';
import { RippleButton } from '../components/animations/RippleButton';
import { AnimatedProgress, CircularProgress } from '../components/animations/AnimatedProgress';
import { ScrollReveal } from '../components/animations/StaggerList';
import { SkeletonDashboard } from '../components/animations/Skeleton';
import { stagger, fadeUp, fadeLeft, fadeRight, scaleIn, hoverLift } from '../lib/animations';

/* ── Status config ───────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  submitted: { label: 'Submitted', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
  pending_approval: { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
  approved: { label: 'Approved', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  rejected: { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950' },
  processing: { label: 'Processing', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
  completed: { label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  cancelled: { label: 'Cancelled', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
  sent_back: { label: 'Sent Back', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950' },
};

const TOOLTIP_STYLE = {
  borderRadius: '10px',
  border: '1px solid var(--border)',
  background: 'var(--card)',
  color: 'var(--foreground)',
  fontSize: '12px',
  boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)',
};

/* ── Stat card with animated counter ────────────────────────── */
interface StatCardProps {
  title: string;
  value: number;
  change?: string;
  positive?: boolean;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  suffix?: string;
  index: number;
}

function AnimatedStatCard({ title, value, change, positive, icon: Icon, iconColor, iconBg, suffix, index }: StatCardProps) {
  return (
    <TiltCard maxTilt={5} glare className="h-full">
      <motion.div
        variants={fadeUp}
        whileHover={hoverLift}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="h-full"
      >
        <Card className="border-border/60 h-full overflow-hidden relative">
          {/* Background shimmer on hover */}
          <motion.div
            className="absolute inset-0 opacity-0 pointer-events-none"
            whileHover={{ opacity: 1 }}
            style={{
              background: 'linear-gradient(135deg, rgba(37,99,235,0.03) 0%, transparent 60%)',
            }}
          />
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground" style={{ fontSize: '12px', fontWeight: 500 }}>{title}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <AnimatedCounter
                    target={value}
                    duration={1000 + index * 100}
                    suffix={suffix}
                    className="text-foreground"
                    style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1 } as React.CSSProperties}
                  />
                </div>
                {change && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className={cn('flex items-center gap-1 mt-1.5', positive ? 'text-emerald-600' : 'text-red-500')}
                    style={{ fontSize: '11px' }}
                  >
                    {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                    <span>{change}</span>
                  </motion.div>
                )}
              </div>
              <motion.div
                className={cn('size-11 rounded-xl flex items-center justify-center', iconBg)}
                whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.4 } }}
              >
                <Icon className={cn('size-5', iconColor)} />
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </TiltCard>
  );
}

/* ── Animated badge dot ──────────────────────────────────────── */
function PulseDot({ color }: { color: string }) {
  return (
    <span className="relative flex size-2">
      <motion.span
        className="absolute inline-flex h-full w-full rounded-full opacity-60"
        style={{ background: color }}
        animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="relative inline-flex size-2 rounded-full" style={{ background: color }} />
    </span>
  );
}

/* ── Animated request row ────────────────────────────────────── */
function RequestRow({ req, i, onClick }: { req: Request; i: number; onClick: () => void }) {
  const cfg = STATUS_CONFIG[req.status];
  return (
    <motion.div
      variants={fadeUp}
      custom={i}
      whileHover={{ x: 3, backgroundColor: 'var(--muted)' }}
      onClick={onClick}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer border border-transparent hover:border-border/50 transition-colors"
    >
      <motion.div
        className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"
        whileHover={{ rotate: 5, scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <FileText className="size-4 text-primary" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground truncate" style={{ fontSize: '13px', fontWeight: 500 }}>{req.formTitle}</p>
        <p className="text-muted-foreground truncate" style={{ fontSize: '11px' }}>
          {req.requestNumber} · {req.employee.name}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <span className={cn('px-2 py-0.5 rounded-md', cfg?.bg, cfg?.color)}
          style={{ fontSize: '10px', fontWeight: 600 }}>
          {cfg?.label}
        </span>
        <PulseDot color={req.status === 'completed' ? '#10b981' : req.status === 'rejected' ? '#ef4444' : '#f59e0b'} />
      </div>
    </motion.div>
  );
}

/* ── SLA Gauge ───────────────────────────────────────────────── */
function SLAGauge({ total, slaBreached }: { total: number; slaBreached: number }) {
  const slaScore = total === 0 ? 100 : Math.max(0, Math.round(((total - slaBreached) / total) * 100));
  return (
    <div className="flex flex-col items-center gap-3">
      <CircularProgress value={slaScore} size={100} strokeWidth={7} color="#10b981" trackColor="var(--muted)">
        <div className="text-center">
          <p className="text-foreground" style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1 }}>{slaScore}%</p>
          <p className="text-muted-foreground" style={{ fontSize: '9px' }}>SLA</p>
        </div>
      </CircularProgress>
      <p className="text-muted-foreground text-center" style={{ fontSize: '11px' }}>
        {total === 0 ? 'No requests yet' : 'Compliance Rate'}
      </p>
    </div>
  );
}

/* ── Top forms list ──────────────────────────────────────────── */
function TopFormsList({ requests }: { requests: Request[] }) {
  const topForms = React.useMemo(() => {
    const counts = requests.reduce<Record<string, number>>((acc, r) => {
      acc[r.formTitle] = (acc[r.formTitle] ?? 0) + 1;
      return acc;
    }, {});
    const total = requests.length || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }));
  }, [requests]);

  if (topForms.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-6" style={{ fontSize: '12px' }}>
        No requests yet
      </p>
    );
  }

  return (
    <div className="space-y-3.5">
      {topForms.map((f, i) => (
        <ScrollReveal key={f.name} animation="fadeUp">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-foreground" style={{ fontSize: '12px', fontWeight: 500 }}>{f.name}</span>
              <span className="text-muted-foreground" style={{ fontSize: '11px' }}>{f.count}</span>
            </div>
            <AnimatedProgress
              value={f.pct}
              height={5}
              delay={i * 0.12}
              color={i === 0 ? '#2563eb' : i === 1 ? '#7c3aed' : i === 2 ? '#10b981' : i === 3 ? '#f59e0b' : '#ec4899'}
            />
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}

/* ── Main dashboard ──────────────────────────────────────────── */
export function DashboardPage() {
  const { navigate, requests, dashboardStats: stats, chartData, refreshRequests } = useApp();
  const recent = requests.slice(0, 6);
  const { weekly: CHART_DATA_WEEKLY, status: CHART_DATA_STATUS, department: CHART_DATA_DEPARTMENT } = chartData;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setShowSkeleton(false), 800);
    return () => clearTimeout(t);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setShowSkeleton(true);
    await refreshRequests();
    setIsRefreshing(false);
    setShowSkeleton(false);
  };

  if (showSkeleton) return <SkeletonDashboard cards={4} rows={5} />;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={stagger(0.05)}
      className="p-6 space-y-6 w-full relative"
    >
      {/* Page header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <motion.h1
            className="text-foreground"
            style={{ fontSize: '20px', fontWeight: 600 }}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            Overview
          </motion.h1>
          <motion.p
            className="text-muted-foreground"
            style={{ fontSize: '13px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </motion.p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="size-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <motion.div animate={isRefreshing ? { rotate: 360 } : {}} transition={{ duration: 0.8, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}>
              <RefreshCw className="size-4" />
            </motion.div>
          </motion.button>
          <RippleButton
            variant="primary"
            size="md"
            icon={<Zap className="size-3.5" />}
            onClick={() => navigate('service-catalog')}
          >
            New Request
          </RippleButton>
        </div>
      </motion.div>

      {/* Primary stat cards */}
      <motion.div variants={stagger(0.07)} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: "Today's Requests", value: stats.totalToday, icon: FileText, iconColor: 'text-blue-600', iconBg: 'bg-blue-50 dark:bg-blue-950' },
          { title: 'Pending Approval', value: stats.pending, icon: Clock, iconColor: 'text-amber-600', iconBg: 'bg-amber-50 dark:bg-amber-950' },
          { title: 'Completed Today', value: stats.completed, icon: CheckCircle, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50 dark:bg-emerald-950' },
          { title: 'SLA Breached', value: stats.slaBreached, icon: AlertTriangle, iconColor: 'text-red-600', iconBg: 'bg-red-50 dark:bg-red-950' },
        ].map((card, i) => (
          <AnimatedStatCard key={card.title} {...card} index={i} />
        ))}
      </motion.div>

      {/* Secondary stat row */}
      <motion.div variants={stagger(0.06)} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Rejected', value: stats.rejected, icon: XCircle, iconColor: 'text-red-500', iconBg: 'bg-red-50 dark:bg-red-950' },
          { title: 'Processing', value: stats.processing, icon: Loader2, iconColor: 'text-purple-600', iconBg: 'bg-purple-50 dark:bg-purple-950' },
          { title: 'Avg Process Time', value: stats.avgProcessingHours, suffix: 'h', icon: TrendingUp, iconColor: 'text-primary', iconBg: 'bg-primary/10' },
          { title: 'Total Requests', value: requests.length, icon: Users, iconColor: 'text-indigo-600', iconBg: 'bg-indigo-50 dark:bg-indigo-950' },
        ].map((card, i) => (
          <AnimatedStatCard key={card.title} {...card} index={i + 4} />
        ))}
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Area Chart */}
        <motion.div variants={fadeLeft} className="lg:col-span-2">
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Request Volume</CardTitle>
                  <CardDescription>7-day overview of requests across stages</CardDescription>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="size-8 rounded-lg bg-muted flex items-center justify-center cursor-pointer"
                >
                  <BarChart2 className="size-4 text-muted-foreground" />
                </motion.div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={CHART_DATA_WEEKLY} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    {[{ id: 'grad-sub', color: '#2563eb' }, { id: 'grad-app', color: '#10b981' }].map(({ id, color }) => (
                      <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="submitted" name="Submitted" stroke="#2563eb" strokeWidth={2.5} fill="url(#grad-sub)" dot={false} activeDot={{ r: 5, fill: '#2563eb' }} />
                  <Area type="monotone" dataKey="approved" name="Approved" stroke="#10b981" strokeWidth={2.5} fill="url(#grad-app)" dot={false} activeDot={{ r: 5, fill: '#10b981' }} />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#f59e0b" strokeWidth={2} fill="none" strokeDasharray="5 3" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Pie + SLA */}
        <motion.div variants={fadeRight} className="space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Status Split</CardTitle>
              <CardDescription>Current distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={CHART_DATA_STATUS} cx="50%" cy="50%" innerRadius={44} outerRadius={64} paddingAngle={3} dataKey="value">
                    {CHART_DATA_STATUS.map((entry) => (
                      <Cell key={`pie-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {CHART_DATA_STATUS.map(item => (
                  <motion.div key={item.name} whileHover={{ x: 2 }} className="flex items-center gap-2 cursor-default">
                    <div className="size-2 rounded-full shrink-0" style={{ background: item.color }} />
                    <span className="text-muted-foreground truncate" style={{ fontSize: '10px' }}>{item.name}</span>
                    <span className="text-foreground ml-auto" style={{ fontSize: '11px', fontWeight: 600 }}>{item.value}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SLA Gauge */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="pt-5">
              <SLAGauge total={requests.length} slaBreached={stats.slaBreached} />
              <div className="mt-3 space-y-2">
                <AnimatedProgress
                  value={requests.length === 0 ? 0 : Math.max(0, Math.round(((requests.length - stats.slaBreached) / requests.length) * 100))}
                  height={4}
                  color="#10b981"
                  delay={0.3}
                />
                <div className="flex justify-between">
                  <span className="text-muted-foreground" style={{ fontSize: '10px' }}>On-time</span>
                  <span className="text-muted-foreground" style={{ fontSize: '10px' }}>Breached: {stats.slaBreached}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Department chart */}
        <motion.div variants={scaleIn}>
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>By Department</CardTitle>
              <CardDescription>Total requests per team</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={CHART_DATA_DEPARTMENT} margin={{ top: 0, right: 0, left: -28, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="dept" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={56} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="requests" radius={[0, 5, 5, 0]}>
                    {CHART_DATA_DEPARTMENT.map((entry, i) => (
                      <Cell key={`bar-${entry.dept}`} fill={['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ec4899'][i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top forms */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Most Requested</CardTitle>
              <CardDescription>Top service forms this month</CardDescription>
            </CardHeader>
            <CardContent>
              <TopFormsList requests={requests} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent requests */}
        <motion.div variants={fadeLeft}>
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest requests</CardDescription>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('my-requests')}
                  className="text-primary hover:underline"
                  style={{ fontSize: '12px' }}
                >
                  View all
                </motion.button>
              </div>
            </CardHeader>
            <CardContent>
              <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="space-y-1">
                {recent.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8" style={{ fontSize: '12px' }}>No recent requests</p>
                ) : (
                  recent.map((req, i) => (
                    <RequestRow key={req.id} req={req} i={i} onClick={() => navigate('request-detail')} />
                  ))
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
