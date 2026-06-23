import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { ClipboardList, LogIn, Shield, User, Users, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { APP_NAME, APP_TAGLINE } from '../utils/branding';
import { DEMO_ACCOUNTS, getDefaultPage, getRoleLabel } from '../utils/roleAccess';
import type { UserRole } from '../types';

const GROUP_ICONS: Record<string, React.ElementType> = {
  'Super Admin': Shield,
  'Department HOD': Users,
  Employee: User,
};

export function LoginPage() {
  const { login, isAuthenticated, loading: authLoading } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState(DEMO_ACCOUNTS[0].email);
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (accountEmail: string) => {
    setEmail(accountEmail);
    setError('');
  };

  const selected = DEMO_ACCOUNTS.find(a => a.email === email);

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center">
              <ClipboardList className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-foreground" style={{ fontSize: '20px', fontWeight: 700 }}>{APP_NAME}</h1>
              <p className="text-muted-foreground" style={{ fontSize: '12px' }}>{APP_TAGLINE}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                style={{ fontSize: '13px' }}
                required
              />
            </div>
            <div>
              <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                style={{ fontSize: '13px' }}
                required
              />
            </div>
            {selected && (
              <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
                Role: <span className="text-foreground font-medium">{getRoleLabel(selected.role)}</span>
                {' · '}Landing: {getDefaultPage(selected.role).replace(/-/g, ' ')}
              </p>
            )}
            {error && <p className="text-destructive" style={{ fontSize: '12px' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ fontSize: '13px', fontWeight: 600 }}
            >
              <LogIn className="size-4" />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h2 className="text-foreground mb-2" style={{ fontSize: '16px', fontWeight: 600 }}>Demo accounts</h2>
          <p className="text-muted-foreground mb-5" style={{ fontSize: '12px' }}>
            Default password for all: <code className="text-foreground">Password@123</code>
          </p>
          <div className="space-y-3">
            {DEMO_ACCOUNTS.map(account => {
              const Icon = GROUP_ICONS[account.group] ?? User;
              const active = email === account.email;
              return (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => quickLogin(account.email)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-foreground truncate" style={{ fontSize: '13px', fontWeight: 500 }}>{account.email}</p>
                      <p className="text-muted-foreground" style={{ fontSize: '11px' }}>{account.group} · {getRoleLabel(account.role as UserRole)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        </div>
      </motion.div>
    </div>
  );
}
