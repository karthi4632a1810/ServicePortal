import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Search, Filter, FileText, Clock, CheckCircle, XCircle,
  Loader2, ChevronDown, Eye, Download, MoreHorizontal,
  AlertCircle, SlidersHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../components/ui/utils';
import { useApp } from '../context/AppContext';
import type { Request, RequestStatus } from '../types';

const STATUS_CONFIG: Record<RequestStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  submitted: { label: 'Submitted', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
  pending_approval: { label: 'Pending Approval', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950' },
  processing: { label: 'Processing', icon: Loader2, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
  sent_back: { label: 'Sent Back', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950' },
};

const PRIORITY_CONFIG = {
  high: { label: 'High', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950' },
  medium: { label: 'Med', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950' },
  low: { label: 'Low', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800' },
};

function RequestRow({ req, onClick }: { req: Request; onClick: () => void }) {
  const statusCfg = STATUS_CONFIG[req.status];
  const priorityCfg = PRIORITY_CONFIG[req.priority];
  const StatusIcon = statusCfg.icon;
  const progress = (req.currentStep / Math.max(req.workflow.length, 1)) * 100;

  return (
    <motion.tr
      whileHover={{ backgroundColor: 'var(--muted)' }}
      onClick={onClick}
      className="cursor-pointer border-b border-border/50 transition-colors"
    >
      <td className="px-4 py-3">
        <div>
          <p className="text-foreground" style={{ fontSize: '13px', fontWeight: 500 }}>{req.requestNumber}</p>
          <p className="text-muted-foreground" style={{ fontSize: '11px' }}>{req.formTitle}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="text-foreground" style={{ fontSize: '13px' }}>{req.employee.name}</p>
          <p className="text-muted-foreground" style={{ fontSize: '11px' }}>{req.employee.department}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md', statusCfg.bg, statusCfg.color)}
          style={{ fontSize: '11px', fontWeight: 600 }}>
          <StatusIcon className="size-3" />
          {statusCfg.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={cn('px-2 py-0.5 rounded', priorityCfg.bg, priorityCfg.color)}
          style={{ fontSize: '10px', fontWeight: 700 }}>
          {priorityCfg.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="w-24">
          <div className="flex items-center justify-between mb-1">
            <span className="text-muted-foreground" style={{ fontSize: '10px' }}>
              {req.currentStep}/{req.workflow.length}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', req.status === 'rejected' ? 'bg-red-500' : 'bg-primary')}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-muted-foreground" style={{ fontSize: '11px' }}>
          {new Date(req.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
        </p>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="View"
          >
            <Eye className="size-3.5" />
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Download"
          >
            <Download className="size-3.5" />
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="More"
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

const ALL_STATUSES: Array<{ value: string; label: string }> = [
  { value: '', label: 'All Status' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
];

export function MyRequestsPage() {
  const { requests, navigate, setSelectedRequest } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const filtered = requests.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.requestNumber.toLowerCase().includes(q) ||
      r.formTitle.toLowerCase().includes(q) ||
      r.employee.name.toLowerCase().includes(q) ||
      r.employee.id.toLowerCase().includes(q);
    const matchStatus = !statusFilter || r.status === statusFilter;
    const matchPriority = !priorityFilter || r.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const handleView = (req: Request) => {
    setSelectedRequest(req);
    navigate('request-detail');
  };

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending_approval').length,
    processing: requests.filter(r => r.status === 'processing').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground" style={{ fontSize: '20px', fontWeight: 600 }}>My Requests</h1>
          <p className="text-muted-foreground" style={{ fontSize: '13px' }}>Track and manage all service requests</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => navigate('service-catalog')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          style={{ fontSize: '13px', fontWeight: 500 }}
        >
          <FileText className="size-4" />
          New Request
        </motion.button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', count: counts.all, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Pending', count: counts.pending, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
          { label: 'Processing', count: counts.processing, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
          { label: 'Completed', count: counts.completed, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/60 bg-card">
            <div className={cn('size-8 rounded-lg flex items-center justify-center shrink-0', bg)}>
              <span className={cn('font-bold', color)} style={{ fontSize: '14px' }}>{count}</span>
            </div>
            <span className="text-muted-foreground" style={{ fontSize: '12px' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search requests..."
            className="w-56 h-9 pl-9 pr-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            style={{ fontSize: '13px' }}
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-9 pl-3 pr-8 rounded-lg border border-border bg-card text-foreground outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer"
            style={{ fontSize: '12px' }}
          >
            {ALL_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="h-9 pl-3 pr-8 rounded-lg border border-border bg-card text-foreground outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer"
            style={{ fontSize: '12px' }}
          >
            <option value="">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        </div>

        <div className="ml-auto text-muted-foreground" style={{ fontSize: '12px' }}>
          {filtered.length} of {requests.length} request{requests.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Request', 'Employee', 'Status', 'Priority', 'Progress', 'Submitted', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <FileText className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground" style={{ fontSize: '14px' }}>No requests found</p>
                    <p className="text-muted-foreground" style={{ fontSize: '12px' }}>Adjust your filters or submit a new request</p>
                  </td>
                </tr>
              ) : (
                filtered.map(req => (
                  <RequestRow key={req.id} req={req} onClick={() => handleView(req)} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
