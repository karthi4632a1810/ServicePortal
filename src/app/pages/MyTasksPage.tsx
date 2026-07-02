import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardList, CheckCircle, Clock, Loader2, AlertCircle, Search, RotateCcw,
  ChevronDown, Eye, ExternalLink,
} from 'lucide-react';
import { cn } from '../components/ui/utils';
import { RippleButton } from '../components/animations/RippleButton';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { MyTask } from '../types';
import { useScreenRefresh } from '../hooks/useScreenRefresh';
import { RequestDetailSections } from '../components/requests/RequestDetailSections';
import { TaskWorkActions } from '../components/tasks/TaskWorkActions';

type TaskQueueStatus = 'pending' | 'in_progress' | 'pending_hod_review';

const QUEUE_LABELS: Record<TaskQueueStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Assigned', color: 'text-amber-700', bg: 'bg-amber-50 dark:bg-amber-950' },
  in_progress: { label: 'In Progress', color: 'text-blue-700', bg: 'bg-blue-50 dark:bg-blue-950' },
  pending_hod_review: { label: 'Submitted for Review', color: 'text-purple-700', bg: 'bg-purple-50 dark:bg-purple-950' },
};

function WorkTaskCard({
  task,
  onStart,
  onFinish,
  onViewFull,
  busy,
  forms,
}: {
  task: MyTask;
  onStart: (id: string) => Promise<void>;
  onFinish: (id: string, remarks: string) => Promise<void>;
  onViewFull: (task: MyTask) => void;
  busy: string | null;
  forms: import('../types').FormSchema[];
}) {
  const [expanded, setExpanded] = useState(false);
  const qs = (task.queueStatus || 'pending') as TaskQueueStatus;
  const cfg = QUEUE_LABELS[qs] || QUEUE_LABELS.pending;

  return (
    <motion.div layout className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <p className="text-foreground truncate" style={{ fontSize: '14px', fontWeight: 600 }}>{task.formTitle}</p>
            <p className="text-muted-foreground" style={{ fontSize: '11px' }}>{task.requestNumber}</p>
          </div>
          <span className={cn('px-2 py-0.5 rounded-md shrink-0', cfg.bg, cfg.color)} style={{ fontSize: '10px', fontWeight: 600 }}>
            {cfg.label}
          </span>
        </div>

        <p className="text-muted-foreground mb-3" style={{ fontSize: '12px' }}>
          Requested by <strong className="text-foreground">{task.employee.name}</strong> · {task.employee.department}
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors',
              expanded
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40',
            )}
            style={{ fontSize: '12px', fontWeight: 500 }}
          >
            <Eye className="size-3.5" />
            Task info
            <ChevronDown className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} />
          </button>
          <button
            type="button"
            onClick={() => onViewFull(task)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
            style={{ fontSize: '12px', fontWeight: 500 }}
          >
            <ExternalLink className="size-3.5" />
            Full details
          </button>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-1 pb-3 border-t border-border/60">
                <RequestDetailSections request={task} forms={forms} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <TaskWorkActions task={task} onStart={onStart} onFinish={onFinish} busy={busy} />
      </div>
    </motion.div>
  );
}

function ConfirmCompletionCard({
  task,
  onConfirm,
  onSendBack,
  onViewFull,
  busy,
  forms,
}: {
  task: MyTask;
  onConfirm: (id: string, remarks?: string) => Promise<void>;
  onSendBack: (id: string, remarks: string) => Promise<void>;
  onViewFull: (task: MyTask) => void;
  busy: string | null;
  forms: import('../types').FormSchema[];
}) {
  const [remarks, setRemarks] = useState('');
  const [mode, setMode] = useState<'idle' | 'sendback'>('idle');
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const isBusy = busy === task.id;

  return (
    <motion.div layout className="bg-card border border-purple-200/60 dark:border-purple-900/60 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <p className="text-foreground truncate" style={{ fontSize: '14px', fontWeight: 600 }}>{task.formTitle}</p>
            <p className="text-muted-foreground" style={{ fontSize: '11px' }}>{task.requestNumber}</p>
          </div>
          <span className="px-2 py-0.5 rounded-md shrink-0 bg-purple-50 dark:bg-purple-950 text-purple-700" style={{ fontSize: '10px', fontWeight: 600 }}>
            Confirm Completion
          </span>
        </div>

        <p className="text-muted-foreground mb-2" style={{ fontSize: '12px' }}>
          Requested by <strong className="text-foreground">{task.employee.name}</strong> · {task.employee.department}
        </p>

        {task.staffFinishRemarks && (
          <p className="mb-3 p-2.5 rounded-lg bg-purple-50/80 dark:bg-purple-950/40 text-foreground" style={{ fontSize: '12px' }}>
            <strong>{task.staffFinishedBy}:</strong> {task.staffFinishRemarks}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors',
              expanded ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground',
            )}
            style={{ fontSize: '12px', fontWeight: 500 }}
          >
            <Eye className="size-3.5" />
            Task info
            <ChevronDown className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} />
          </button>
          <button
            type="button"
            onClick={() => onViewFull(task)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary transition-colors"
            style={{ fontSize: '12px', fontWeight: 500 }}
          >
            <ExternalLink className="size-3.5" />
            Full details
          </button>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-1 pb-3 border-t border-border/60">
                <RequestDetailSections request={task} forms={forms} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {task.assignedTo && (
          <p className="text-muted-foreground mb-3" style={{ fontSize: '11px' }}>
            Completed by <strong className="text-foreground">{task.assignedTo}</strong>
          </p>
        )}

        {mode === 'sendback' && (
          <textarea
            value={remarks}
            onChange={(e) => { setRemarks(e.target.value); setError(''); }}
            placeholder="Explain what needs to be reworked (required)..."
            rows={3}
            className="w-full mb-2 px-3 py-2 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none"
          />
        )}

        {error && (
          <p className="text-destructive flex items-center gap-1 mb-2" style={{ fontSize: '11px' }}>
            <AlertCircle className="size-3" /> {error}
          </p>
        )}

        <div className="flex gap-2">
          {mode === 'idle' ? (
            <>
              <RippleButton
                variant="success"
                className="flex-1 justify-center"
                icon={<CheckCircle className="size-4" />}
                disabled={isBusy}
                onClick={() => void onConfirm(task.id, remarks || undefined)}
              >
                {isBusy ? 'Confirming...' : 'Confirm Completion'}
              </RippleButton>
              <RippleButton
                variant="ghost"
                className="flex-1 justify-center border border-orange-300 text-orange-700 dark:text-orange-400"
                icon={<RotateCcw className="size-4" />}
                disabled={isBusy}
                onClick={() => setMode('sendback')}
              >
                Send Back
              </RippleButton>
            </>
          ) : (
            <>
              <RippleButton variant="ghost" className="flex-1" onClick={() => { setMode('idle'); setRemarks(''); setError(''); }}>Cancel</RippleButton>
              <RippleButton
                variant="primary"
                className="flex-1 justify-center"
                disabled={isBusy}
                onClick={async () => {
                  if (!remarks.trim()) {
                    setError('Remarks are required when sending back for rework');
                    return;
                  }
                  await onSendBack(task.id, remarks.trim());
                  setMode('idle');
                  setRemarks('');
                }}
              >
                {isBusy ? 'Sending...' : 'Send Back for Rework'}
              </RippleButton>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function MyTasksPage() {
  const { currentUser, refreshRequests, navigate, setSelectedRequest, forms } = useApp();
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAssignedTasks();
      setTasks(res.data);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadTasks(); }, [loadTasks]);
  useScreenRefresh(loadTasks);

  const handleViewFull = (task: MyTask) => {
    setSelectedRequest(task);
    navigate('request-detail', { returnTo: 'my-tasks', taskMode: true });
  };

  const handleStart = async (id: string) => {
    setBusy(id);
    try {
      await api.updateQueueStatus(id, { queueStatus: 'in_progress' });
      await loadTasks();
      void refreshRequests();
    } finally {
      setBusy(null);
    }
  };

  const handleFinish = async (id: string, remarks: string) => {
    setBusy(id);
    try {
      await api.submitForReview(id, remarks);
      await loadTasks();
      void refreshRequests();
    } finally {
      setBusy(null);
    }
  };

  const handleConfirm = async (id: string, remarks?: string) => {
    setBusy(id);
    try {
      await api.confirmCompletion(id, remarks);
      await loadTasks();
      void refreshRequests();
    } finally {
      setBusy(null);
    }
  };

  const handleSendBack = async (id: string, remarks: string) => {
    setBusy(id);
    try {
      await api.sendBackForRework(id, remarks);
      await loadTasks();
      void refreshRequests();
    } finally {
      setBusy(null);
    }
  };

  const filtered = tasks.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return t.formTitle.toLowerCase().includes(q)
      || t.requestNumber.toLowerCase().includes(q)
      || t.employee.name.toLowerCase().includes(q);
  });

  const confirmTasks = filtered.filter((t) => t.taskType === 'confirm_completion');
  const workTasks = filtered.filter((t) => t.taskType !== 'confirm_completion');

  const counts = {
    toConfirm: tasks.filter((t) => t.taskType === 'confirm_completion').length,
    assigned: tasks.filter((t) => t.taskType === 'work' && t.queueStatus === 'pending').length,
    inProgress: tasks.filter((t) => t.taskType === 'work' && t.queueStatus === 'in_progress').length,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-foreground flex items-center gap-2" style={{ fontSize: '20px', fontWeight: 700 }}>
          <ClipboardList className="size-5 text-primary" />
          My Tasks
        </h1>
        <p className="text-muted-foreground mt-1" style={{ fontSize: '13px' }}>
          Open <strong>Task info</strong> to read the full request before you start work.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'To Confirm', count: counts.toConfirm, icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
          { label: 'Assigned', count: counts.assigned, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
          { label: 'In Progress', count: counts.inProgress, icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
        ].map((s) => (
          <div key={s.label} className={cn('rounded-xl p-4 border border-border/60', s.bg)}>
            <s.icon className={cn('size-4 mb-2', s.color)} />
            <p className={cn(s.color)} style={{ fontSize: '20px', fontWeight: 700 }}>{s.count}</p>
            <p className="text-muted-foreground" style={{ fontSize: '11px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
          style={{ fontSize: '13px' }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 text-muted-foreground animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground" style={{ fontSize: '13px' }}>
          No tasks for you right now.
        </div>
      ) : (
        <div className="space-y-6">
          {confirmTasks.length > 0 && (
            <section>
              <h2 className="text-foreground mb-3" style={{ fontSize: '13px', fontWeight: 600 }}>Confirm Completion</h2>
              <div className="space-y-3">
                {confirmTasks.map((task) => (
                  <ConfirmCompletionCard
                    key={task.id}
                    task={task}
                    onConfirm={handleConfirm}
                    onSendBack={handleSendBack}
                    onViewFull={handleViewFull}
                    busy={busy}
                    forms={forms}
                  />
                ))}
              </div>
            </section>
          )}
          {workTasks.length > 0 && (
            <section>
              {confirmTasks.length > 0 && (
                <h2 className="text-foreground mb-3" style={{ fontSize: '13px', fontWeight: 600 }}>Assigned Work</h2>
              )}
              <div className="space-y-3">
                {workTasks.map((task) => (
                  <WorkTaskCard
                    key={task.id}
                    task={task}
                    onStart={handleStart}
                    onFinish={handleFinish}
                    onViewFull={handleViewFull}
                    busy={busy}
                    forms={forms}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
