import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Key, Plus, RefreshCw, Search, Upload, UserX,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { cn } from '../components/ui/utils';
import { api } from '../services/api';
import { getRoleLabel, MANAGEABLE_ROLES, isFixedSuperAdmin, isReadOnlyRole } from '../utils/roleAccess';
import type { Approver, UserRole } from '../types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { RippleButton } from '../components/animations/RippleButton';
import { PasswordInput } from '../components/ui/password-input';
import { UserAvatar } from '../components/ui/user-avatar';
import { useScreenRefresh } from '../hooks/useScreenRefresh';
import { useApp } from '../context/AppContext';

const IMPORT_EXAMPLE = `[
  { "staffId": "60467", "role": "employee" },
  { "staffId": "60100", "role": "hod" }
]`;

function ResetPasswordDialog({
  user,
  open,
  onOpenChange,
  onReset,
}: {
  user: Approver | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReset: (userId: string, newPassword: string, confirmPassword: string) => Promise<void>;
}) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onReset(user.id, newPassword, confirmPassword);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Set a new password for {user?.name}{user?.employeeId ? ` (Staff ID ${user.employeeId})` : ''}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setNewPassword('mapims');
              setConfirmPassword('mapims');
              setError('');
            }}
            className="w-full h-9 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
            style={{ fontSize: '12px' }}
          >
            Reset to default (mapims)
          </button>
          <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" required minLength={4} />
          <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" required minLength={4} />
          {error && <p className="text-destructive" style={{ fontSize: '12px' }}>{error}</p>}
          <RippleButton type="submit" disabled={loading} className="w-full h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center gap-2">
            <Key className="size-4" />
            {loading ? 'Resetting...' : 'Reset Password'}
          </RippleButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (user: Approver) => void;
}) {
  const [staffId, setStaffId] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setStaffId('');
      setRole('employee');
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.createUser(staffId.trim(), role);
      onCreated(res.data);
      onOpenChange(false);
      toast.success(`User added. Default password: mapims`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
          <DialogDescription>
            Enter a Staff ID from HRMS. Default password is mapims until they change it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>STAFF ID</label>
            <input
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder="e.g. 60467"
              required
              className="w-full h-10 px-3 rounded-lg border border-border bg-card outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontSize: '13px' }}
            />
          </div>
          <div>
            <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>ROLE</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-card outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontSize: '13px' }}
            >
              {MANAGEABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-destructive" style={{ fontSize: '12px' }}>{error}</p>}
          <RippleButton type="submit" disabled={loading || !staffId.trim()} className="w-full h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50">
            <Plus className="size-4" />
            {loading ? 'Adding...' : 'Add User'}
          </RippleButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ImportUsersDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const [jsonText, setJsonText] = useState(IMPORT_EXAMPLE);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setJsonText(String(reader.result || ''));
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const parsed = JSON.parse(jsonText);
      const users = Array.isArray(parsed) ? parsed : parsed.users;
      if (!Array.isArray(users)) throw new Error('JSON must be an array or { "users": [...] }');
      const res = await api.importUsers(users);
      const { created, updated, failed } = res.data;
      onImported();
      onOpenChange(false);
      toast.success(`Import done: ${created} created, ${updated} updated${failed.length ? `, ${failed.length} failed` : ''}`);
      if (failed.length) {
        console.warn('Import failures:', failed);
        toast.error(failed.map((f) => `${f.staffId || '?'}: ${f.error}`).join('; '));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Users (JSON)</DialogTitle>
          <DialogDescription>
            Add or update users by Staff ID. Existing users get their role updated. Default password for new users is mapims.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="file" accept=".json,application/json" onChange={handleFile} className="text-sm" />
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={10}
            className="w-full p-3 rounded-lg border border-border bg-card font-mono text-xs outline-none focus:ring-2 focus:ring-primary/30"
          />
          {error && <p className="text-destructive" style={{ fontSize: '12px' }}>{error}</p>}
          <RippleButton type="submit" disabled={loading} className="w-full h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center gap-2">
            <Upload className="size-4" />
            {loading ? 'Importing...' : 'Import JSON'}
          </RippleButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UserManagementPage() {
  const { currentUser } = useApp();
  const readOnly = isReadOnlyRole(currentUser?.role);
  const [users, setUsers] = useState<Approver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [resetUser, setResetUser] = useState<Approver | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [bulkRole, setBulkRole] = useState<UserRole>('employee');
  const [bulkLoading, setBulkLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      setUsers(res.data);
      setSelected(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useScreenRefresh(loadUsers);

  const departments = useMemo(
    () => ['all', ...Array.from(new Set(users.map((u) => u.department).filter(Boolean))).sort()],
    [users],
  );

  const filtered = useMemo(() => users.filter((u) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q
      || u.name.toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q)
      || String(u.employeeId || '').includes(q);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesDept = deptFilter === 'all' || u.department === deptFilter;
    return matchesSearch && matchesRole && matchesDept;
  }), [users, search, roleFilter, deptFilter]);

  const selectableFiltered = useMemo(
    () => filtered.filter((u) => !isFixedSuperAdmin(u)),
    [filtered],
  );

  const allFilteredSelected = selectableFiltered.length > 0 && selectableFiltered.every((u) => selected.has(u.id));

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        selectableFiltered.forEach((u) => next.delete(u.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        selectableFiltered.forEach((u) => next.add(u.id));
        return next;
      });
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRoleChange = async (user: Approver, role: UserRole) => {
    try {
      const res = await api.updateUser(user.id, { role });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data : u)));
      toast.success(`Role updated to ${getRoleLabel(role)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleToggleActive = async (user: Approver) => {
    try {
      const res = await api.updateUser(user.id, { active: !user.active });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data : u)));
      toast.success(res.data.active ? 'User enabled' : 'User disabled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleResetPassword = async (userId: string, newPassword: string, confirmPassword: string) => {
    await api.resetUserPassword(userId, newPassword, confirmPassword);
    toast.success('Password reset successfully');
  };

  const handleBulkRole = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    setBulkLoading(true);
    try {
      const res = await api.bulkUpdateUserRole(ids, bulkRole);
      const map = new Map(res.data.map((u) => [u.id, u]));
      setUsers((prev) => prev.map((u) => map.get(u.id) ?? u));
      toast.success(`Updated role for ${ids.length} user(s)`);
      setSelected(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk update failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkReset = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    setBulkLoading(true);
    try {
      await api.bulkResetUserPassword(ids);
      toast.success(`Reset ${ids.length} user(s) to default password (mapims)`);
      setSelected(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk reset failed');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 w-full space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-foreground" style={{ fontSize: '20px', fontWeight: 600 }}>User Management</h1>
          <p className="text-muted-foreground" style={{ fontSize: '13px' }}>
            {readOnly
              ? 'View all portal users and their roles (read-only).'
              : 'Add staff by ID, assign roles, import JSON, and manage passwords.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!readOnly && (
            <>
              <button onClick={() => setImportOpen(true)} className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors" style={{ fontSize: '13px' }}>
                <Upload className="size-4" />
                Import JSON
              </button>
              <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity" style={{ fontSize: '13px', fontWeight: 500 }}>
                <Plus className="size-4" />
                Add User
              </button>
            </>
          )}
          <button onClick={loadUsers} className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors" style={{ fontSize: '13px' }}>
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle style={{ fontSize: '15px' }}>All Users</CardTitle>
              <CardDescription>
                {filtered.length} shown · {users.length} total
                {selected.size > 0 ? ` · ${selected.size} selected` : ''}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, staff ID..."
                className="w-56 h-9 pl-9 pr-3 rounded-lg border border-border bg-card outline-none focus:ring-2 focus:ring-primary/30"
                style={{ fontSize: '13px' }}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-card outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontSize: '13px' }}
            >
              <option value="all">All roles</option>
              <option value="super_admin">Super Admin</option>
              {MANAGEABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-card outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontSize: '13px' }}
            >
              {departments.map((d) => (
                <option key={d} value={d}>{d === 'all' ? 'All departments' : d}</option>
              ))}
            </select>
          </div>

          {!readOnly && selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <span className="text-muted-foreground" style={{ fontSize: '12px' }}>Bulk actions:</span>
              <select
                value={bulkRole}
                onChange={(e) => setBulkRole(e.target.value as UserRole)}
                className="h-8 px-2 rounded-md border border-border bg-card"
                style={{ fontSize: '12px' }}
              >
                {MANAGEABLE_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <button
                disabled={bulkLoading}
                onClick={handleBulkRole}
                className="h-8 px-3 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                style={{ fontSize: '12px' }}
              >
                Set Role
              </button>
              <button
                disabled={bulkLoading}
                onClick={handleBulkReset}
                className="h-8 px-3 rounded-md border border-border hover:bg-muted disabled:opacity-50"
                style={{ fontSize: '12px' }}
              >
                Reset to mapims
              </button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-b border-border bg-muted/40 text-left">
                  <th className="px-4 py-3 w-10">
                    {!readOnly && (
                      <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} aria-label="Select all" />
                    )}
                  </th>
                  {(readOnly
                    ? ['Name', 'Staff ID', 'Email', 'Role', 'Department', 'Status']
                    : ['Name', 'Staff ID', 'Email', 'Role', 'Department', 'Status', 'Actions']
                  ).map((h) => (
                    <th key={h} className="px-4 py-3 text-muted-foreground font-medium" style={{ fontSize: '11px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const locked = isFixedSuperAdmin(user);
                  return (
                  <tr key={user.id} className={cn('border-b border-border/60 hover:bg-muted/20', selected.has(user.id) && 'bg-primary/5')}>
                    <td className="px-4 py-3">
                      {!readOnly && (
                        <input
                          type="checkbox"
                          checked={selected.has(user.id)}
                          onChange={() => toggleOne(user.id)}
                          disabled={locked}
                          aria-label={`Select ${user.name}`}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={user.name} initials={user.initials} employeeId={user.employeeId} avatar={user.avatar} className="size-8" />
                        <span className="text-foreground" style={{ fontSize: '13px', fontWeight: 500 }}>{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: '12px' }}>{user.employeeId || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: '12px' }}>{user.email}</td>
                    <td className="px-4 py-3">
                      {locked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary" style={{ fontSize: '11px' }}>
                          Super Admin (fixed)
                        </span>
                      ) : readOnly ? (
                        <span className="text-foreground" style={{ fontSize: '12px' }}>{getRoleLabel(user.role)}</span>
                      ) : (
                        <select
                          value={MANAGEABLE_ROLES.some((r) => r.value === user.role) ? user.role : 'employee'}
                          onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                          className="h-8 px-2 rounded-md border border-border bg-card text-foreground min-w-[120px]"
                          style={{ fontSize: '12px' }}
                        >
                          {MANAGEABLE_ROLES.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: '12px' }}>{user.department}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full',
                        user.active !== false ? 'bg-emerald-500/10 text-emerald-700' : 'bg-destructive/10 text-destructive',
                      )} style={{ fontSize: '11px' }}>
                        {user.active !== false ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    {!readOnly && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!locked && (
                          <>
                            <button onClick={() => setResetUser(user)} className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md border border-border hover:bg-muted transition-colors" style={{ fontSize: '11px' }}>
                              <Key className="size-3.5" />
                              Reset
                            </button>
                            <button onClick={() => handleToggleActive(user)} className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md border border-border hover:bg-muted transition-colors" style={{ fontSize: '11px' }}>
                              <UserX className="size-3.5" />
                              {user.active !== false ? 'Disable' : 'Enable'}
                            </button>
                          </>
                        )}
                        {locked && (
                          <span className="text-muted-foreground" style={{ fontSize: '11px' }}>Password via seed only</span>
                        )}
                      </div>
                    </td>
                    )}
                  </tr>
                  );
                })}
              </tbody>
            </table>
            {!loading && filtered.length === 0 && (
              <p className="p-8 text-center text-muted-foreground" style={{ fontSize: '13px' }}>No users match your filters.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <ResetPasswordDialog user={resetUser} open={Boolean(resetUser)} onOpenChange={(open) => { if (!open) setResetUser(null); }} onReset={handleResetPassword} />
      <AddUserDialog open={addOpen} onOpenChange={setAddOpen} onCreated={(u) => setUsers((prev) => [u, ...prev])} />
      <ImportUsersDialog open={importOpen} onOpenChange={setImportOpen} onImported={loadUsers} />
    </motion.div>
  );
}
