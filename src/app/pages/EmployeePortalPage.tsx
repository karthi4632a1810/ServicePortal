import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, User, ChevronRight, FileText, Clock, CheckCircle, XCircle, Loader2,
  AlertCircle, Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../components/ui/utils';
import { useApp } from '../context/AppContext';
import { getAccessTier } from '../utils/roleAccess';
import { api } from '../services/api';
import type { Employee, Request } from '../types';
import { getEmployeeProfileFields } from '../utils/employeeProfileFields';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  submitted: { label: 'Submitted', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
  pending_approval: { label: 'Pending Approval', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950' },
  processing: { label: 'Processing', icon: Loader2, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
  sent_back: { label: 'Sent Back', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950' },
};

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="size-4 text-primary" />
      </div>
      <div>
        <p className="text-muted-foreground" style={{ fontSize: '11px' }}>{label}</p>
        <p className="text-foreground" style={{ fontSize: '13px', fontWeight: 500 }}>{value}</p>
      </div>
    </div>
  );
}

function RequestStatusCard({ req }: { req: Request }) {
  const cfg = STATUS_CONFIG[req.status];
  const Icon = cfg?.icon ?? FileText;
  const progress = (req.currentStep / Math.max(req.workflow.length, 1)) * 100;

  return (
    <div className="p-4 rounded-xl border border-border hover:border-primary/30 transition-colors bg-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-foreground" style={{ fontSize: '13px', fontWeight: 500 }}>{req.formTitle}</span>
            <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-md shrink-0', cfg?.bg, cfg?.color)}
              style={{ fontSize: '10px', fontWeight: 600 }}>
              <Icon className="size-3" />
              {cfg?.label}
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5" style={{ fontSize: '11px' }}>
            {req.requestNumber} · Submitted {new Date(req.submittedAt).toLocaleDateString('en-IN')}
          </p>
        </div>
        <span className={cn('text-sm px-2 py-0.5 rounded shrink-0',
          req.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
          req.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        )} style={{ fontSize: '10px', fontWeight: 600 }}>
          {req.priority.toUpperCase()}
        </span>
      </div>

      {/* Workflow progress */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-muted-foreground" style={{ fontSize: '10px' }}>
            Step {req.currentStep} of {req.workflow.length}
          </span>
          <span className="text-muted-foreground" style={{ fontSize: '10px' }}>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn('h-full rounded-full', req.status === 'rejected' ? 'bg-red-500' : 'bg-primary')}
          />
        </div>
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {req.workflow.map((step, i) => (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0 border',
                step.status === 'approved' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800' :
                step.status === 'rejected' ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' :
                i + 1 === req.currentStep ? 'bg-primary/10 border-primary/30' :
                'bg-muted border-border'
              )}
              style={{ fontSize: '10px' }}
            >
              {step.status === 'approved' ? (
                <CheckCircle className="size-2.5 text-emerald-600" />
              ) : step.status === 'rejected' ? (
                <XCircle className="size-2.5 text-red-600" />
              ) : (
                <span className={cn(
                  'size-2.5 rounded-full',
                  i + 1 === req.currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                )} />
              )}
              <span className={cn(
                step.status === 'approved' ? 'text-emerald-700 dark:text-emerald-400' :
                step.status === 'rejected' ? 'text-red-700 dark:text-red-400' :
                i + 1 === req.currentStep ? 'text-primary' : 'text-muted-foreground'
              )}>{step.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function departmentsMatch(a: string | undefined, b: string | undefined) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

export function EmployeePortalPage() {
  const { navigate, fetchEmployee, currentUser, requests } = useApp();
  const accessTier = currentUser ? getAccessTier(currentUser.role) : null;
  const isEmployeeView = accessTier === 'employee' && Boolean(currentUser?.employeeId);

  const portalSubtitle = (() => {
    if (accessTier === 'super_admin') {
      return 'Look up any staff ID to view and track their form requests across all departments.';
    }
    if (accessTier === 'hod') {
      return `Look up staff in ${currentUser?.department || 'your department'} to view and track their form requests.`;
    }
    if (accessTier === 'employee') {
      return 'View and track your form requests.';
    }
    return 'Enter a Staff ID to view and track form requests.';
  })();
  const [employeeId, setEmployeeId] = useState('');
  const [foundEmployee, setFoundEmployee] = useState<Employee | null>(null);
  const [employeeRequests, setEmployeeRequests] = useState<Request[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSelf, setIsLoadingSelf] = useState(false);
  const [error, setError] = useState('');

  const loadEmployeeData = useCallback(async (id: string) => {
    const emp = await fetchEmployee(id);
    if (!emp) return null;
    const res = await api.getEmployeeRequests(id);
    return { emp, reqs: res.data };
  }, [fetchEmployee]);

  const loadSelf = useCallback(async () => {
    if (!currentUser?.employeeId) return;
    setIsLoadingSelf(true);
    setError('');
    try {
      const result = await loadEmployeeData(currentUser.employeeId);
      if (!result) return;
      setFoundEmployee(result.emp);
      setEmployeeRequests(result.reqs);
    } catch (err) {
      setFoundEmployee(null);
      setEmployeeRequests([]);
      setError(err instanceof Error ? err.message : 'Failed to load your requests.');
    } finally {
      setIsLoadingSelf(false);
    }
  }, [currentUser?.employeeId, loadEmployeeData]);

  useEffect(() => {
    if (!isEmployeeView) return;
    void loadSelf();
  }, [isEmployeeView, loadSelf]);

  useEffect(() => {
    if (isEmployeeView && requests.length > 0) {
      setEmployeeRequests(requests);
    }
  }, [isEmployeeView, requests]);

  const handleSearch = async () => {
    const id = employeeId.trim();
    if (!id) {
      setError('Please enter your Employee ID');
      return;
    }
    if (currentUser?.role === 'employee' && currentUser.employeeId && id !== currentUser.employeeId) {
      setError('You can only view your own records.');
      return;
    }
    setIsSearching(true);
    setError('');
    try {
      const result = await loadEmployeeData(id);
      if (!result) return;
      if (currentUser?.role === 'hod' && !departmentsMatch(currentUser.department, result.emp.department)) {
        setFoundEmployee(null);
        setEmployeeRequests([]);
        setError('You can only track staff in your department.');
        return;
      }
      setFoundEmployee(result.emp);
      setEmployeeRequests(result.reqs);
    } catch (err) {
      setFoundEmployee(null);
      setEmployeeRequests([]);
      const message = err instanceof Error ? err.message : '';
      setError(
        message.includes('department')
          ? 'You can only track staff in your department.'
          : message || 'Employee ID not found. Please check and try again.',
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 w-full space-y-6"
    >
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
            <User className="size-4 text-primary-foreground" />
          </div>
          <h1 className="text-foreground" style={{ fontSize: '20px', fontWeight: 600 }}>Employee Portal</h1>
        </div>
        <p className="text-muted-foreground ml-11" style={{ fontSize: '13px' }}>
          {portalSubtitle}
        </p>
      </motion.div>

      {/* Staff lookup — admins/HOD only */}
      {!isEmployeeView && (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  value={employeeId}
                  onChange={e => { setEmployeeId(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder={
                    accessTier === 'hod'
                      ? `Enter Staff ID (${currentUser?.department || 'your department'})`
                      : 'Enter Staff ID (e.g., 60464)'
                  }
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  style={{ fontSize: '14px' }}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSearch}
                disabled={isSearching}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center gap-2"
                style={{ fontSize: '13px', fontWeight: 500 }}
              >
                {isSearching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                {isSearching ? 'Searching...' : 'Look Up'}
              </motion.button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mt-3 text-destructive"
                style={{ fontSize: '12px' }}
              >
                <AlertCircle className="size-3.5" />
                {error}
              </motion.div>
            )}

            <p className="text-muted-foreground mt-3" style={{ fontSize: '11px' }}>
              <Shield className="size-3 inline mr-1" />
              {accessTier === 'hod'
                ? 'Only staff belonging to your department can be tracked.'
                : accessTier === 'super_admin'
                  ? 'Super admin can track requests from all departments.'
                  : 'Use your registered Staff ID (e.g. 60464)'}
            </p>
          </CardContent>
        </Card>
      </motion.div>
      )}

      {isEmployeeView && isLoadingSelf && !foundEmployee && (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="py-16 flex flex-col items-center gap-3">
            <Loader2 className="size-8 text-primary animate-spin" />
            <p className="text-muted-foreground" style={{ fontSize: '13px' }}>Loading your requests...</p>
          </CardContent>
        </Card>
      )}

      {isEmployeeView && error && !foundEmployee && (
        <Card className="border-destructive/30 shadow-sm">
          <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-destructive" style={{ fontSize: '13px' }}>{error}</p>
            <button
              onClick={() => void loadSelf()}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
              style={{ fontSize: '12px', fontWeight: 500 }}
            >
              Retry
            </button>
          </CardContent>
        </Card>
      )}

      {/* Employee Profile */}
      <AnimatePresence>
        {foundEmployee && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Profile Card */}
            <Card className="border-primary/30 shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="size-14 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                    <span className="text-primary-foreground font-bold" style={{ fontSize: '20px' }}>
                      {foundEmployee.avatar}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-foreground" style={{ fontSize: '18px', fontWeight: 600 }}>{foundEmployee.name}</h2>
                      <span className={cn(
                        'px-2.5 py-0.5 rounded-full',
                        foundEmployee.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                      )}
                        style={{ fontSize: '11px', fontWeight: 600 }}>
                        {foundEmployee.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: '13px' }}>{foundEmployee.designation}</p>
                    <p className="text-primary" style={{ fontSize: '12px' }}>Staff ID: {foundEmployee.id}</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {getEmployeeProfileFields(foundEmployee).map((field) => (
                    <InfoRow key={field.label} icon={field.icon} label={field.label} value={field.value} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('service-catalog')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                style={{ fontSize: '13px', fontWeight: 500 }}
              >
                <FileText className="size-4" />
                Submit New Request
                <ChevronRight className="size-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('my-requests')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors"
                style={{ fontSize: '13px', fontWeight: 500 }}
              >
                <Clock className="size-4" />
                Track All Requests
              </motion.button>
            </div>

            {/* Employee's Requests */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>
                  {accessTier === 'employee' ? 'Your Request History' : 'Request History'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {employeeRequests.length > 0 ? (
                  <div className="space-y-3">
                    {employeeRequests.map((req) => (
                      <RequestStatusCard key={req.id} req={req} />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <FileText className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground" style={{ fontSize: '14px' }}>No requests found</p>
                    <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
                      Submit your first form to get started
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
