import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { ClipboardList, LogIn, ArrowLeft, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { APP_NAME, APP_TAGLINE } from '../utils/branding';
import { PasswordInput } from '../components/ui/password-input';
import { UserAvatar } from '../components/ui/user-avatar';
import { api } from '../services/api';
import type { Employee } from '../types';

function staffInitials(name: string) {
  return name
    .replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '??';
}

function isStaffIdInput(value: string) {
  const id = value.trim();
  return id.length > 0 && !id.includes('@');
}

export function LoginPage() {
  const { login, isAuthenticated, loading: authLoading } = useApp();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const lastVerifiedId = useRef('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const id = identifier.trim();
    if (!isStaffIdInput(id)) {
      setEmployee(null);
      setProfileError('');
      lastVerifiedId.current = '';
      return;
    }

    if (id === lastVerifiedId.current && employee?.id === id) return;

    const timer = window.setTimeout(async () => {
      setVerifying(true);
      setProfileError('');
      setEmployee(null);

      try {
        const res = await api.getEmployee(id);
        setEmployee(res.data);
        lastVerifiedId.current = id;
      } catch {
        setEmployee(null);
        lastVerifiedId.current = '';
        setProfileError('Staff ID not found');
      } finally {
        setVerifying(false);
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [identifier]);

  const handleIdentifierChange = (value: string) => {
    setIdentifier(value);
    setError('');
    if (value.trim() !== lastVerifiedId.current) {
      setEmployee(null);
      setProfileError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = identifier.trim();
    if (!id) {
      setError('Please enter your email or Staff ID');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(id, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const showStaffProfile = Boolean(employee);
  const staffMode = isStaffIdInput(identifier);

  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          style={{ fontSize: '13px' }}
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm max-w-md mx-auto">
          <motion.div
            layout
            className="flex items-center gap-3 mb-6"
          >
            {showStaffProfile ? (
              <>
                <UserAvatar
                  name={employee!.name}
                  initials={staffInitials(employee!.name)}
                  employeeId={employee!.id}
                  className="size-12 rounded-xl"
                  fallbackClassName="rounded-xl text-sm"
                />
                <div className="min-w-0 flex-1">
                  <h1 className="text-foreground truncate" style={{ fontSize: '18px', fontWeight: 700 }}>
                    {employee!.name}
                  </h1>
                  <p className="text-muted-foreground truncate" style={{ fontSize: '12px' }}>
                    {employee!.department}
                  </p>
                  <p className="text-muted-foreground truncate" style={{ fontSize: '12px' }}>
                    {employee!.designation}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="size-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <ClipboardList className="size-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-foreground" style={{ fontSize: '20px', fontWeight: 700 }}>{APP_NAME}</h1>
                  <p className="text-muted-foreground" style={{ fontSize: '12px' }}>{APP_TAGLINE}</p>
                </div>
              </>
            )}
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>
                EMAIL OR STAFF ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={e => handleIdentifierChange(e.target.value)}
                  placeholder="e.g. superadmin@mapims.edu.in or 60464"
                  autoComplete="username"
                  className="w-full h-10 px-3 pr-10 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  style={{ fontSize: '13px' }}
                  required
                />
                {verifying && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
                )}
              </div>
              {profileError && staffMode && (
                <p className="text-destructive mt-1.5" style={{ fontSize: '12px' }}>{profileError}</p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>PASSWORD</label>
              <PasswordInput
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={staffMode && !employee ? 'Enter Staff ID first' : 'Enter your password'}
                disabled={staffMode && !employee}
                inputClassName="bg-input-background"
                required
              />
            </div>
            {error && <p className="text-destructive" style={{ fontSize: '12px' }}>{error}</p>}
            <p className="text-muted-foreground" style={{ fontSize: '11px' }}>
              Admins and HODs can sign in with email. Employees can sign in with Staff ID and portal password.
            </p>
            <button
              type="submit"
              disabled={loading || (staffMode && !employee)}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ fontSize: '13px', fontWeight: 600 }}
            >
              <LogIn className="size-4" />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
