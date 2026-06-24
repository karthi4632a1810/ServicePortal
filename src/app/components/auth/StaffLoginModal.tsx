import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { RippleButton } from '../animations/RippleButton';
import { PasswordInput } from '../ui/password-input';
import { UserAvatar } from '../ui/user-avatar';
import { api } from '../../services/api';
import type { Employee } from '../../types';

function staffInitials(name: string) {
  return name
    .replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '??';
}

interface StaffLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (staffId: string, password: string) => Promise<void>;
  formTitle?: string;
}

export function StaffLoginModal({ open, onOpenChange, onSubmit, formTitle }: StaffLoginModalProps) {
  const [staffId, setStaffId] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [password, setPassword] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const lastVerifiedId = useRef('');

  const reset = useCallback(() => {
    setStaffId('');
    setEmployee(null);
    setPassword('');
    setVerifyError('');
    setLoginError('');
    setVerifying(false);
    setLoggingIn(false);
    lastVerifiedId.current = '';
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  useEffect(() => {
    const id = staffId.trim();
    if (!id) {
      setEmployee(null);
      setVerifyError('');
      setPassword('');
      lastVerifiedId.current = '';
      return;
    }

    if (id === lastVerifiedId.current && employee?.id === id) return;

    const timer = window.setTimeout(async () => {
      setVerifying(true);
      setVerifyError('');
      setLoginError('');
      setEmployee(null);
      setPassword('');

      try {
        const res = await api.getEmployee(id);
        setEmployee(res.data);
        lastVerifiedId.current = id;
      } catch (err) {
        setEmployee(null);
        lastVerifiedId.current = '';
        setVerifyError(err instanceof Error ? err.message : 'Staff ID not found');
      } finally {
        setVerifying(false);
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [staffId]);

  const handleStaffIdChange = (value: string) => {
    setStaffId(value);
    if (value.trim() !== lastVerifiedId.current) {
      setEmployee(null);
      setPassword('');
      setVerifyError('');
      setLoginError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !password) return;

    setLoginError('');
    setLoggingIn(true);
    try {
      await onSubmit(employee.id, password);
      reset();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const passwordEnabled = Boolean(employee) && !verifying;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Staff Login</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {employee && (
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30">
              <UserAvatar
                name={employee.name}
                initials={staffInitials(employee.name)}
                employeeId={employee.id}
                className="size-16 rounded-xl"
                fallbackClassName="rounded-xl text-base"
              />
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate" style={{ fontSize: '14px', fontWeight: 600 }}>
                  {employee.name}
                </p>
                <p className="text-muted-foreground truncate" style={{ fontSize: '12px' }}>
                  {employee.department}
                </p>
                <p className="text-muted-foreground truncate" style={{ fontSize: '12px' }}>
                  {employee.designation}
                </p>
              </div>
            </div>
          )}

          {formTitle && (
            <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
              Opening: {formTitle}
            </p>
          )}

          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>
              Staff ID
            </label>
            <div className="relative">
              <input
                value={staffId}
                onChange={(e) => handleStaffIdChange(e.target.value)}
                placeholder="e.g. 60464"
                autoFocus
                required
                className="w-full h-10 px-3 pr-10 rounded-lg border border-border bg-card text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                style={{ fontSize: '13px' }}
              />
              {verifying && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
              )}
            </div>
            {verifyError && (
              <p className="text-destructive mt-1.5" style={{ fontSize: '12px' }}>{verifyError}</p>
            )}
          </div>

          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>
              Password
            </label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={passwordEnabled ? 'Enter your password' : 'Enter Staff ID first'}
              disabled={!passwordEnabled}
              required
            />
          </div>

          {loginError && (
            <p className="text-destructive" style={{ fontSize: '12px' }}>{loginError}</p>
          )}

          <RippleButton
            type="submit"
            disabled={loggingIn || !passwordEnabled || !password}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="size-4" />
            {loggingIn ? 'Signing in...' : 'Sign In'}
          </RippleButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
