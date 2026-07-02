import React, { useState } from 'react';
import { Play, CheckCircle, AlertCircle } from 'lucide-react';
import { RippleButton } from '../animations/RippleButton';
import type { MyTask } from '../../types';

type TaskQueueStatus = 'pending' | 'in_progress' | 'pending_hod_review';

export function TaskWorkActions({
  task,
  onStart,
  onFinish,
  busy,
  compact = false,
}: {
  task: MyTask;
  onStart: (id: string) => Promise<void>;
  onFinish: (id: string, remarks: string) => Promise<void>;
  busy: string | null;
  compact?: boolean;
}) {
  const [showFinish, setShowFinish] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const qs = (task.queueStatus || 'pending') as TaskQueueStatus;
  const isBusy = busy === task.id;

  const handleFinish = async () => {
    if (!remarks.trim()) {
      setError('Remarks are required when finishing work');
      return;
    }
    setError('');
    await onFinish(task.id, remarks.trim());
    setShowFinish(false);
    setRemarks('');
  };

  if (task.taskType === 'confirm_completion') return null;

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {qs === 'pending' && (
        <RippleButton
          variant="primary"
          className="w-full justify-center"
          icon={<Play className="size-4" />}
          disabled={isBusy}
          onClick={() => void onStart(task.id)}
        >
          {isBusy ? 'Starting...' : 'Start Task'}
        </RippleButton>
      )}

      {qs === 'in_progress' && !showFinish && (
        <RippleButton
          variant="success"
          className="w-full justify-center"
          icon={<CheckCircle className="size-4" />}
          disabled={isBusy}
          onClick={() => setShowFinish(true)}
        >
          Finish & Submit for Review
        </RippleButton>
      )}

      {qs === 'in_progress' && showFinish && (
        <div className="space-y-2">
          <textarea
            value={remarks}
            onChange={(e) => { setRemarks(e.target.value); setError(''); }}
            placeholder="Describe what was done (required)..."
            rows={compact ? 3 : 4}
            className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none"
          />
          {error && (
            <p className="text-destructive flex items-center gap-1" style={{ fontSize: '11px' }}>
              <AlertCircle className="size-3" /> {error}
            </p>
          )}
          <div className="flex gap-2">
            <RippleButton variant="ghost" className="flex-1" onClick={() => { setShowFinish(false); setRemarks(''); setError(''); }}>Cancel</RippleButton>
            <RippleButton variant="success" className="flex-1 justify-center" disabled={isBusy} onClick={() => void handleFinish()}>
              {isBusy ? 'Submitting...' : 'Submit for Review'}
            </RippleButton>
          </div>
        </div>
      )}

      {qs === 'pending_hod_review' && (
        <p className="text-muted-foreground text-center py-2" style={{ fontSize: '12px' }}>
          Submitted for HOD confirmation.
        </p>
      )}
    </div>
  );
}
