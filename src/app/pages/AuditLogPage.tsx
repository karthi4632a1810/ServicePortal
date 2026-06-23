import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Shield, Search, Filter, ChevronDown, AlertTriangle,
  CheckCircle, Info, XCircle, Download, Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../components/ui/utils';
import { useApp } from '../context/AppContext';
import type { AuditLog } from '../types';

const SEVERITY_CONFIG = {
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
  success: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-200 dark:border-red-800', dot: 'bg-red-500' },
};

const ACTION_LABELS: Record<string, string> = {
  REQUEST_SUBMITTED: 'Request Submitted',
  REQUEST_APPROVED: 'Request Approved',
  REQUEST_REJECTED: 'Request Rejected',
  REQUEST_COMPLETED: 'Request Completed',
  REQUEST_FORWARDED: 'Request Forwarded',
  FORM_VIEWED: 'Form Viewed',
  FORM_PUBLISHED: 'Form Published',
  COMMENT_ADDED: 'Comment Added',
  LOGIN: 'User Login',
  LOGOUT: 'User Logout',
  SLA_BREACHED: 'SLA Breached',
};

function AuditRow({ log }: { log: AuditLog }) {
  const cfg = SEVERITY_CONFIG[log.severity];
  const Icon = cfg.icon;

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ backgroundColor: 'var(--muted)' }}
      className="border-b border-border/40 transition-colors"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={cn('size-2 rounded-full shrink-0', cfg.dot)} />
          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border', cfg.bg, cfg.color, cfg.border)}
            style={{ fontSize: '10px', fontWeight: 600 }}>
            <Icon className="size-3" />
            {ACTION_LABELS[log.action] ?? log.action}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-foreground" style={{ fontSize: '13px' }}>{log.user}</p>
        <p className="text-muted-foreground" style={{ fontSize: '11px' }}>{log.department}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-foreground" style={{ fontSize: '13px' }}>{log.entity}</p>
        <p className="text-muted-foreground" style={{ fontSize: '11px' }}>{log.entityId}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-foreground" style={{ fontSize: '12px' }}>{log.details}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-muted-foreground" style={{ fontSize: '11px' }}>{log.ip}</p>
        <p className="text-muted-foreground" style={{ fontSize: '10px' }}>{log.browser}</p>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <p className="text-muted-foreground" style={{ fontSize: '11px' }}>
          {new Date(log.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
        </p>
        <p className="text-muted-foreground" style={{ fontSize: '10px' }}>
          {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </td>
    </motion.tr>
  );
}

export function AuditLogPage() {
  const { auditLogs } = useApp();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const filtered = auditLogs.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.user.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.entityId.toLowerCase().includes(q);
    const matchSeverity = !severityFilter || l.severity === severityFilter;
    const matchAction = !actionFilter || l.action === actionFilter;
    return matchSearch && matchSeverity && matchAction;
  });

  const counts = {
    info: auditLogs.filter(l => l.severity === 'info').length,
    success: auditLogs.filter(l => l.severity === 'success').length,
    warning: auditLogs.filter(l => l.severity === 'warning').length,
    error: auditLogs.filter(l => l.severity === 'error').length,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Shield className="size-5 text-primary" />
            <h1 className="text-foreground" style={{ fontSize: '20px', fontWeight: 600 }}>Audit Log</h1>
          </div>
          <p className="text-muted-foreground" style={{ fontSize: '13px' }}>
            Complete trail of all actions across the system
          </p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          style={{ fontSize: '12px' }}>
          <Download className="size-4" />
          Export CSV
        </button>
      </div>

      {/* Severity Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(SEVERITY_CONFIG).map(([severity, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button
              key={severity}
              onClick={() => setSeverityFilter(severityFilter === severity ? '' : severity)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left',
                severityFilter === severity
                  ? cn(cfg.bg, cfg.border, 'ring-2 ring-offset-0')
                  : 'bg-card border-border hover:border-primary/30'
              )}
            >
              <div className={cn('size-8 rounded-lg flex items-center justify-center shrink-0', cfg.bg)}>
                <Icon className={cn('size-4', cfg.color)} />
              </div>
              <div>
                <p className="text-foreground" style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1 }}>
                  {counts[severity as keyof typeof counts]}
                </p>
                <p className="text-muted-foreground capitalize" style={{ fontSize: '11px' }}>{severity}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search user, action, entity..."
            className="w-60 h-9 pl-9 pr-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            style={{ fontSize: '13px' }}
          />
        </div>

        <div className="relative">
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="h-9 pl-3 pr-8 rounded-lg border border-border bg-card text-foreground outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer"
            style={{ fontSize: '12px' }}
          >
            <option value="">All Actions</option>
            {Object.entries(ACTION_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        </div>

        <div className="ml-auto text-muted-foreground" style={{ fontSize: '12px' }}>
          {filtered.length} of {auditLogs.length} entries
        </div>
      </div>

      {/* Table */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Action', 'User', 'Entity', 'Details', 'IP / Browser', 'Timestamp'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Shield className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground" style={{ fontSize: '14px' }}>No audit entries found</p>
                  </td>
                </tr>
              ) : (
                filtered.map(log => <AuditRow key={log.id} log={log} />)
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
