import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Layers, Clock, CheckCircle, XCircle, Loader2,
  User, Calendar, Play, Check, Search, Building2,
} from 'lucide-react';
import { cn } from '../components/ui/utils';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { useScreenRefresh } from '../hooks/useScreenRefresh';

type QueueStatus = 'pending' | 'in_progress' | 'pending_hod_review' | 'completed' | 'cancelled';

interface QueueItem {
  id: string;
  requestNumber: string;
  title: string;
  employee: string;
  department: string;
  assignedTo: string;
  queueStatus: QueueStatus;
  priority: string;
  dueDate: string;
  submittedAt: string;
}

const STATUS_CONFIG: Record<QueueStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
  in_progress: { label: 'In Progress', icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
  pending_hod_review: { label: 'Awaiting Confirmation', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
};

function KanbanColumn({ title, items, status, color, onStatusChange, updating }: {
  title: string; items: QueueItem[]; status: QueueStatus; color: string;
  onStatusChange: (id: string, newStatus: QueueStatus | 'finish') => void;
  updating: string | null;
}) {
  return (
    <div className="flex-1 min-w-[220px]">
      <div className={cn('flex items-center gap-2 mb-3 px-3 py-2 rounded-lg', color)}>
        <span className="text-foreground" style={{ fontSize: '13px', fontWeight: 600 }}>{title}</span>
        <span className="ml-auto size-5 rounded-full bg-card flex items-center justify-center text-foreground"
          style={{ fontSize: '11px', fontWeight: 700 }}>{items.length}</span>
      </div>
      <div className="space-y-3">
        {items.map(item => {
          const cfg = STATUS_CONFIG[item.queueStatus];
          const Icon = cfg.icon;
          const isUpdating = updating === item.id;
          return (
            <motion.div
              key={item.id}
              layout
              whileHover={{ y: -2 }}
              className="bg-card border border-border/60 rounded-xl p-4 shadow-sm cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-foreground" style={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.3 }}>{item.title}</p>
                <span className={cn('px-1.5 py-0.5 rounded shrink-0',
                  item.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
                  item.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                  'bg-gray-100 text-gray-600 dark:bg-gray-800'
                )} style={{ fontSize: '9px', fontWeight: 700 }}>
                  {item.priority.toUpperCase()}
                </span>
              </div>
              <p className="text-muted-foreground" style={{ fontSize: '11px' }}>{item.requestNumber}</p>
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: '10px' }}>
                  <User className="size-3" />{item.employee}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: '10px' }}>
                  <Calendar className="size-3" />Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-2">
                <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary" style={{ fontSize: '8px', fontWeight: 700 }}>{item.assignedTo.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <span className="text-muted-foreground flex-1 truncate" style={{ fontSize: '10px' }}>{item.assignedTo}</span>
                {item.queueStatus === 'pending' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => onStatusChange(item.id, 'in_progress')}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ fontSize: '10px' }}
                  >
                    <Play className="size-2.5" /> Start
                  </button>
                )}
                {item.queueStatus === 'in_progress' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => onStatusChange(item.id, 'finish')}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ fontSize: '10px' }}
                  >
                    <Check className="size-2.5" /> Finish
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
        {items.length === 0 && (
          <div className="py-8 text-center border-2 border-dashed border-border rounded-xl">
            <p className="text-muted-foreground" style={{ fontSize: '12px' }}>Empty</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function WorkQueuePage() {
  const { refreshRequests, currentUser } = useApp();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [queueDepartments, setQueueDepartments] = useState<Array<{ code: string; name: string }>>([]);
  const [selectedQueue, setSelectedQueue] = useState('IT');
  const [employeeDeptFilter, setEmployeeDeptFilter] = useState('all');

  const isSuperAdmin = currentUser?.role === 'super_admin';

  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    void api.getPortalDepartments()
      .then((res) => {
        if (cancelled) return;
        const depts = res.data.map((d) => ({ code: d.code, name: d.name }));
        setQueueDepartments(depts);
        if (depts.length > 0) {
          setSelectedQueue((current) => (depts.some((d) => d.code === current) ? current : depts[0].code));
        }
      })
      .catch(() => {
        if (!cancelled) setQueueDepartments([{ code: 'IT', name: 'Information Technology' }]);
      });
    return () => { cancelled = true; };
  }, [isSuperAdmin]);

  useEffect(() => {
    setEmployeeDeptFilter('all');
  }, [selectedQueue]);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const deptCode = isSuperAdmin ? selectedQueue : 'IT';
      const res = await api.getDepartmentQueue(deptCode);
      setItems(res.data as unknown as QueueItem[]);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, selectedQueue]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  useScreenRefresh(loadQueue);

  const handleStatusChange = async (id: string, newStatus: QueueStatus | 'finish') => {
    setUpdating(id);
    try {
      if (newStatus === 'finish') {
        const remarks = window.prompt('Describe what was done (required):');
        if (!remarks?.trim()) return;
        const res = await api.submitForReview(id, remarks.trim());
        const updated = res.data;
        setItems(prev => prev.map(item =>
          item.id === id
            ? { ...item, queueStatus: (updated.queueStatus as QueueStatus) || 'pending_hod_review' }
            : item
        ));
      } else {
        const res = await api.updateQueueStatus(id, { queueStatus: newStatus });
        const updated = res.data;
        setItems(prev => prev.map(item =>
          item.id === id
            ? {
                ...item,
                queueStatus: (updated.queueStatus as QueueStatus) || newStatus,
                assignedTo: updated.assignedTo || item.assignedTo,
              }
            : item
        ));
      }
      await refreshRequests();
    } catch {
      // keep UI unchanged on failure
    } finally {
      setUpdating(null);
    }
  };

  const employeeDepartments = Array.from(
    new Set(items.map((i) => i.department).filter(Boolean)),
  ).sort();

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    const matchesSearch = !q
      || i.title.toLowerCase().includes(q)
      || i.employee.toLowerCase().includes(q)
      || i.requestNumber.toLowerCase().includes(q);
    const matchesDept = !isSuperAdmin || employeeDeptFilter === 'all' || i.department === employeeDeptFilter;
    return matchesSearch && matchesDept;
  });

  const byStatus = (status: QueueStatus) => filtered.filter(i => i.queueStatus === status);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-foreground" style={{ fontSize: '20px', fontWeight: 600 }}>Work Queue</h1>
          <p className="text-muted-foreground" style={{ fontSize: '13px' }}>
            Processing queue for approved forms
            {isSuperAdmin && queueDepartments.length > 0 && (
              <> · {queueDepartments.find((d) => d.code === selectedQueue)?.name ?? selectedQueue}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isSuperAdmin && (
            <>
              <div className="flex items-center gap-1.5">
                <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                <select
                  value={selectedQueue}
                  onChange={(e) => setSelectedQueue(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-border bg-card text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  style={{ fontSize: '13px' }}
                >
                  {(queueDepartments.length > 0 ? queueDepartments : [{ code: 'IT', name: 'Information Technology' }]).map((dept) => (
                    <option key={dept.code} value={dept.code}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <select
                value={employeeDeptFilter}
                onChange={(e) => setEmployeeDeptFilter(e.target.value)}
                className="h-9 px-3 rounded-lg border border-border bg-card text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                style={{ fontSize: '13px' }}
              >
                <option value="all">All employee departments</option>
                {employeeDepartments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search queue..."
              className="w-48 h-9 pl-9 pr-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontSize: '13px' }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="size-6 animate-spin mr-2" />
          Loading queue...
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          <KanbanColumn
            title="Pending"
            items={byStatus('pending')}
            status="pending"
            color="bg-amber-50 dark:bg-amber-950/50"
            onStatusChange={handleStatusChange}
            updating={updating}
          />
          <KanbanColumn
            title="In Progress"
            items={byStatus('in_progress')}
            status="in_progress"
            color="bg-blue-50 dark:bg-blue-950/50"
            onStatusChange={handleStatusChange}
            updating={updating}
          />
          <KanbanColumn
            title="Awaiting Confirmation"
            items={byStatus('pending_hod_review')}
            status="pending_hod_review"
            color="bg-purple-50 dark:bg-purple-950/50"
            onStatusChange={handleStatusChange}
            updating={updating}
          />
          <KanbanColumn
            title="Completed"
            items={byStatus('completed')}
            status="completed"
            color="bg-emerald-50 dark:bg-emerald-950/50"
            onStatusChange={handleStatusChange}
            updating={updating}
          />
          <KanbanColumn
            title="Cancelled"
            items={byStatus('cancelled')}
            status="cancelled"
            color="bg-gray-100 dark:bg-gray-800/50"
            onStatusChange={handleStatusChange}
            updating={updating}
          />
        </div>
      )}
    </motion.div>
  );
}
