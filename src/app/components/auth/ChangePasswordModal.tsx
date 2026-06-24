import React, { useState } from 'react';
import { Key } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { RippleButton } from '../animations/RippleButton';
import { PasswordInput } from '../ui/password-input';

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (oldPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
}

export function ChangePasswordModal({ open, onOpenChange, onSubmit }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(oldPassword, newPassword, confirmPassword);
      setSuccess(true);
      setTimeout(() => handleOpenChange(false), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new one.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>
              Old Password
            </label>
            <PasswordInput
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>
              New Password
            </label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={4}
            />
          </div>

          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>
              Confirm Password
            </label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={4}
            />
          </div>

          {error && <p className="text-destructive" style={{ fontSize: '12px' }}>{error}</p>}
          {success && <p className="text-emerald-600" style={{ fontSize: '12px' }}>Password changed successfully.</p>}

          <RippleButton
            type="submit"
            disabled={loading || !oldPassword || !newPassword || !confirmPassword}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Key className="size-4" />
            {loading ? 'Saving...' : 'Update Password'}
          </RippleButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
