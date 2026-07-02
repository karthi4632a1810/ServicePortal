import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import {
  Settings, User, Bell, Shield, Mail, Palette, Building2,
  Globe, Key, Save, ChevronRight, Check, Smartphone,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { cn } from '../components/ui/utils';
import { useApp, DEMO_LOGIN_USERS } from '../context/AppContext';
import { isFixedSuperAdmin, getRoleLabel } from '../utils/roleAccess';
import { ACCENT_COLORS, BACKGROUND_COLORS, SIDEBAR_COLORS } from '../utils/userPreferences';
import { PaperZeroLogo } from '../components/branding/PaperZeroLogo';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../utils/notificationPreferences';
import type { NotificationPreferences } from '../utils/notificationPreferences';
import { PasswordInput } from '../components/ui/password-input';
import { UserAvatar } from '../components/ui/user-avatar';
import { api } from '../services/api';
import type { OrganizationSettings } from '../types';

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'integrations', label: 'Integrations', icon: Globe },
];

function ToggleSetting({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div>
        <p className="text-foreground" style={{ fontSize: '13px', fontWeight: 500 }}>{label}</p>
        <p className="text-muted-foreground" style={{ fontSize: '12px' }}>{desc}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-10 h-5.5 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted-foreground/30'
        )}
        style={{ width: 40, height: 22 }}
      >
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="absolute top-1 size-4 rounded-full bg-white shadow-sm"
        />
      </button>
    </div>
  );
}

function ColorPickerRow({
  label,
  desc,
  value,
  presets,
  onChange,
  onReset,
}: {
  label: string;
  desc: string;
  value: string | null;
  presets: ReadonlyArray<{ color: string; label: string }>;
  onChange: (color: string) => void;
  onReset: () => void;
}) {
  const presetColors = presets.map((p) => p.color);
  const pickerValue = value && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : presets[0].color;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1">
        <p className="text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>{label}</p>
        {value && (
          <button
            type="button"
            onClick={onReset}
            className="text-primary hover:text-primary/80 transition-colors"
            style={{ fontSize: '11px', fontWeight: 600 }}
          >
            Use default
          </button>
        )}
      </div>
      <p className="text-muted-foreground mb-3" style={{ fontSize: '11px' }}>{desc}</p>
      <div className="flex gap-3 items-center flex-wrap">
        {presets.map(({ color, label: presetLabel }) => (
          <button
            key={color}
            type="button"
            title={presetLabel}
            onClick={() => onChange(color)}
            className={cn(
              'size-8 rounded-full border-2 shadow-sm hover:scale-110 transition-transform',
              value === color ? 'border-foreground scale-110' : 'border-white',
            )}
            style={{ background: color }}
          />
        ))}
        <label
          title="Custom color"
          className={cn(
            'relative size-8 rounded-full border-2 shadow-sm hover:scale-110 transition-transform overflow-hidden cursor-pointer',
            value && !presetColors.includes(value) ? 'border-foreground scale-110' : 'border-border',
          )}
          style={{
            background: `conic-gradient(from 0deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444)`,
          }}
        >
          <input
            type="color"
            value={pickerValue}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            aria-label={`${label} custom color`}
          />
        </label>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const {
    currentUser, preferences, setTheme, updatePreferences, updateNotificationPreferences, isAuthenticated,
    login, logout, changePassword, apiLoginUsers,
  } = useApp();
  const routerNavigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [loginEmail, setLoginEmail] = useState(DEMO_LOGIN_USERS[0].email);
  const [loginPassword, setLoginPassword] = useState('superadmin');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings>({
    companyName: '',
    companyDomain: '',
    defaultSlaHours: 24,
    adminEmail: '',
  });
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgError, setOrgError] = useState('');
  const [orgSaved, setOrgSaved] = useState(false);
  const [notifError, setNotifError] = useState('');

  const user = currentUser ?? apiLoginUsers[0];
  const notificationPrefs = currentUser?.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES;

  const handleNotificationChange = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!isAuthenticated) return;
    setNotifError('');
    try {
      await updateNotificationPreferences({ [key]: value });
    } catch (err) {
      setNotifError(err instanceof Error ? err.message : 'Failed to save notification preferences');
    }
  };
  const superAdminLocked = isFixedSuperAdmin(user);
  const canEditOrganization = user.role === 'super_admin' || user.role === 'admin';

  useEffect(() => {
    if (activeSection !== 'organization' || !isAuthenticated) return;
    let cancelled = false;
    setOrgLoading(true);
    setOrgError('');
    void api.getOrganizationSettings()
      .then((res) => {
        if (!cancelled) setOrgSettings(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setOrgError(err instanceof Error ? err.message : 'Failed to load organization settings');
        }
      })
      .finally(() => {
        if (!cancelled) setOrgLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeSection, isAuthenticated]);

  const handleSaveOrganization = async () => {
    setOrgSaving(true);
    setOrgError('');
    setOrgSaved(false);
    try {
      const res = await api.updateOrganizationSettings(orgSettings);
      setOrgSettings(res.data);
      setOrgSaved(true);
      setTimeout(() => setOrgSaved(false), 2000);
    } catch (err) {
      setOrgError(err instanceof Error ? err.message : 'Failed to save organization settings');
    } finally {
      setOrgSaving(false);
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(oldPassword, newPassword, confirmPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 w-full">
      <div className="mb-6">
        <h1 className="text-foreground" style={{ fontSize: '20px', fontWeight: 600 }}>Settings</h1>
        <p className="text-muted-foreground" style={{ fontSize: '13px' }}>Manage your account and system preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <div className="space-y-1">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left',
                activeSection === id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              style={{ fontSize: '13px', fontWeight: activeSection === id ? 500 : 400 }}
            >
              <Icon className="size-4 shrink-0" />
              {label}
              {activeSection === id && <ChevronRight className="size-3.5 ml-auto" />}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="md:col-span-3 space-y-5">
          {activeSection === 'profile' && (
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your contact details. Department and designation are synced from HRMS and cannot be changed here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      name={user.name}
                      initials={user.initials}
                      employeeId={user.employeeId}
                      avatar={user.avatar}
                      className="size-16 rounded-2xl"
                      fallbackClassName="rounded-2xl text-lg"
                    />
                    <div>
                      <p className="text-foreground" style={{ fontSize: '14px', fontWeight: 600 }}>{user.name}</p>
                      <p className="text-muted-foreground" style={{ fontSize: '12px' }}>{user.department}</p>
                      {user.designation && (
                        <p className="text-muted-foreground" style={{ fontSize: '12px' }}>{user.designation}</p>
                      )}
                      {user.employeeId && (
                        <p className="text-muted-foreground" style={{ fontSize: '11px' }}>Staff ID: {user.employeeId}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Full Name', value: user.name, type: 'text', readOnly: false },
                      { label: 'Email Address', value: user.email, type: 'email', readOnly: false },
                      { label: 'Department', value: user.department, type: 'text', readOnly: true },
                      {
                        label: 'Designation',
                        value: user.designation || getRoleLabel(user.role),
                        type: 'text',
                        readOnly: true,
                      },
                    ].map(({ label, value, type, readOnly }) => (
                      <div key={label}>
                        <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>
                          {label.toUpperCase()}
                        </label>
                        <input
                          type={type}
                          defaultValue={value}
                          readOnly={readOnly}
                          disabled={readOnly}
                          tabIndex={readOnly ? -1 : undefined}
                          className={cn(
                            'w-full h-9 px-3 rounded-lg border border-border text-foreground outline-none transition-all',
                            readOnly
                              ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-80'
                              : 'bg-input-background focus:ring-2 focus:ring-primary/30 focus:border-primary',
                          )}
                          style={{ fontSize: '13px' }}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                    saved ? 'bg-emerald-600 text-white' : 'bg-primary text-primary-foreground hover:opacity-90'
                  )}
                  style={{ fontSize: '13px', fontWeight: 500 }}
                >
                  {saved ? <Check className="size-4" /> : <Save className="size-4" />}
                  {saved ? 'Changes Saved!' : 'Save Changes'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeSection === 'notifications' && (
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose how and when you want to be notified</CardDescription>
                </CardHeader>
                <CardContent>
                  {!isAuthenticated && (
                    <p className="text-muted-foreground mb-4" style={{ fontSize: '13px' }}>
                      Sign in to save your notification preferences.
                    </p>
                  )}
                  {notifError && (
                    <p className="text-destructive mb-4" style={{ fontSize: '13px' }}>{notifError}</p>
                  )}
                  <div>
                    <p className="text-muted-foreground mb-3" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Bell Notifications (in-app only)
                    </p>
                    <p className="text-muted-foreground mb-4" style={{ fontSize: '12px' }}>
                      Control which alerts appear in the top notification bell. These settings do not send emails.
                    </p>
                    <ToggleSetting label="Real-time Updates" desc="Master switch for all bell notifications" checked={notificationPrefs.inAppRealtime} onChange={(v) => void handleNotificationChange('inAppRealtime', v)} />
                    <ToggleSetting label="New Task" desc="When you are assigned a new task" checked={notificationPrefs.inAppNewTask} onChange={(v) => void handleNotificationChange('inAppNewTask', v)} />
                    <ToggleSetting label="Request Submitted" desc="When a new request is submitted to your queue" checked={notificationPrefs.inAppSubmitted} onChange={(v) => void handleNotificationChange('inAppSubmitted', v)} />
                    <ToggleSetting label="Approval Required" desc="When your approval or confirmation is needed" checked={notificationPrefs.inAppApprovalRequired} onChange={(v) => void handleNotificationChange('inAppApprovalRequired', v)} />
                    <ToggleSetting label="Request Approved" desc="When your request gets approved" checked={notificationPrefs.inAppRequestApproved} onChange={(v) => void handleNotificationChange('inAppRequestApproved', v)} />
                    <ToggleSetting label="Request Rejected" desc="When your request is rejected" checked={notificationPrefs.inAppRequestRejected} onChange={(v) => void handleNotificationChange('inAppRequestRejected', v)} />
                    <ToggleSetting label="Request Completed" desc="When a request is fully processed" checked={notificationPrefs.inAppRequestCompleted} onChange={(v) => void handleNotificationChange('inAppRequestCompleted', v)} />
                    <ToggleSetting label="SLA Reminder" desc="Reminder when requests approach SLA deadline" checked={notificationPrefs.inAppSlaReminder} onChange={(v) => void handleNotificationChange('inAppSlaReminder', v)} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeSection === 'security' && (
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Account Login</CardTitle>
                  <CardDescription>Sign in to access dashboard, approvals, and admin features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isAuthenticated ? (
                    <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
                      <div>
                        <p className="text-foreground" style={{ fontSize: '13px', fontWeight: 500 }}>Signed in as {currentUser?.name}</p>
                        <p className="text-muted-foreground" style={{ fontSize: '12px' }}>{currentUser?.email}</p>
                      </div>
                      <button
                        onClick={() => { logout(); routerNavigate('/'); }}
                        className="px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                        style={{ fontSize: '12px' }}
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>ACCOUNT</label>
                        <select
                          value={loginEmail}
                          onChange={e => setLoginEmail(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                          style={{ fontSize: '13px' }}
                        >
                          {apiLoginUsers.map(u => (
                            <option key={u.email} value={u.email}>{u.name} ({u.role})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>PASSWORD</label>
                        <PasswordInput
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          inputClassName="h-9 bg-input-background"
                        />
                      </div>
                      {loginError && (
                        <p className="text-destructive" style={{ fontSize: '12px' }}>{loginError}</p>
                      )}
                      <button
                        disabled={loggingIn}
                        onClick={async () => {
                          setLoggingIn(true);
                          setLoginError('');
                          try {
                            await login(loginEmail, loginPassword);
                          } catch (err) {
                            setLoginError(err instanceof Error ? err.message : 'Login failed');
                          } finally {
                            setLoggingIn(false);
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                        style={{ fontSize: '13px', fontWeight: 500 }}
                      >
                        {loggingIn ? 'Signing in...' : 'Sign In'}
                      </button>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    {superAdminLocked
                      ? 'Super admin password is managed via seed:superadmin only.'
                      : 'Update your account password regularly for security'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {superAdminLocked ? (
                    <p className="text-muted-foreground" style={{ fontSize: '13px' }}>
                      Run <code className="px-1.5 py-0.5 rounded bg-muted">pnpm seed:superadmin</code> on the server to update the super admin password.
                    </p>
                  ) : (
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>CURRENT PASSWORD</label>
                      <PasswordInput
                        value={oldPassword}
                        onChange={e => setOldPassword(e.target.value)}
                        inputClassName="h-9 bg-input-background"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>NEW PASSWORD</label>
                      <PasswordInput
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        inputClassName="h-9 bg-input-background"
                        required
                        minLength={4}
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>CONFIRM NEW PASSWORD</label>
                      <PasswordInput
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        inputClassName="h-9 bg-input-background"
                        required
                        minLength={4}
                      />
                    </div>
                    {passwordError && (
                      <p className="text-destructive" style={{ fontSize: '12px' }}>{passwordError}</p>
                    )}
                    {passwordSuccess && (
                      <p className="text-emerald-600" style={{ fontSize: '12px' }}>Password changed successfully.</p>
                    )}
                    <button
                      type="submit"
                      disabled={changingPassword || !oldPassword || !newPassword || !confirmPassword}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                      style={{ fontSize: '13px', fontWeight: 500 }}
                    >
                      <Key className="size-4" />
                      {changingPassword ? 'Saving...' : 'Update Password'}
                    </button>
                  </form>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Add an extra layer of security to your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Smartphone className="size-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground" style={{ fontSize: '13px', fontWeight: 500 }}>Authenticator App</p>
                      <p className="text-muted-foreground" style={{ fontSize: '12px' }}>Not configured</p>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                      style={{ fontSize: '12px' }}>
                      Setup 2FA
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeSection === 'appearance' && (
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize how the portal looks for you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-muted-foreground mb-3" style={{ fontSize: '11px', fontWeight: 600 }}>THEME</p>
                    <div className="flex gap-3">
                      {[
                        { id: 'light', label: 'Light', preview: 'bg-white border-2' },
                        { id: 'dark', label: 'Dark', preview: 'bg-gray-900 border-2' },
                        { id: 'system', label: 'System', preview: 'bg-gradient-to-br from-white to-gray-900 border-2' },
                      ].map(({ id, label, preview }) => (
                        <button
                          key={id}
                          onClick={() => void setTheme(id as 'light' | 'dark' | 'system')}
                          className={cn(
                            'flex flex-col items-center gap-2',
                          )}
                        >
                          <div className={cn(
                            'w-20 h-14 rounded-lg', preview,
                            preferences.theme === id
                              ? 'border-primary shadow-md' : 'border-border'
                          )} />
                          <span className="text-foreground" style={{ fontSize: '12px' }}>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-muted-foreground mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>ACCENT COLOR</p>
                    <p className="text-muted-foreground mb-3" style={{ fontSize: '11px' }}>
                      Buttons, links, logo background, and favicon
                    </p>
                    <div className="flex gap-3 items-center flex-wrap">
                      {ACCENT_COLORS.map(({ color, label }) => (
                        <button
                          key={color}
                          type="button"
                          title={label}
                          onClick={() => void updatePreferences({ accentColor: color })}
                          className={cn(
                            'size-8 rounded-full border-2 shadow-sm hover:scale-110 transition-transform',
                            preferences.accentColor === color ? 'border-foreground scale-110' : 'border-white',
                          )}
                          style={{ background: color }}
                        />
                      ))}
                      <label
                        title="Custom accent color"
                        className={cn(
                          'relative size-8 rounded-full border-2 shadow-sm hover:scale-110 transition-transform overflow-hidden cursor-pointer',
                          !ACCENT_COLORS.some((p) => p.color === preferences.accentColor)
                            ? 'border-foreground scale-110'
                            : 'border-border',
                        )}
                        style={{
                          background: `conic-gradient(from 0deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444)`,
                        }}
                      >
                        <input
                          type="color"
                          value={preferences.accentColor}
                          onChange={(e) => void updatePreferences({ accentColor: e.target.value })}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          aria-label="Custom accent color"
                        />
                      </label>
                      <div className="ml-2 pl-3 border-l border-border flex items-center gap-2">
                        <PaperZeroLogo size={36} rounded="lg" />
                        <span className="text-muted-foreground" style={{ fontSize: '11px' }}>Logo preview</span>
                      </div>
                    </div>
                  </div>

                  <ColorPickerRow
                    label="SIDE MENU COLOR"
                    desc="Left navigation panel background"
                    value={preferences.sidebarColor}
                    presets={SIDEBAR_COLORS}
                    onChange={(sidebarColor) => void updatePreferences({ sidebarColor })}
                    onReset={() => void updatePreferences({ sidebarColor: null })}
                  />

                  <ColorPickerRow
                    label="BACKGROUND COLOR"
                    desc="Main page background behind content"
                    value={preferences.backgroundColor}
                    presets={BACKGROUND_COLORS}
                    onChange={(backgroundColor) => void updatePreferences({ backgroundColor })}
                    onReset={() => void updatePreferences({ backgroundColor: null })}
                  />

                  <ToggleSetting
                    label="Compact Mode"
                    desc="Reduce spacing for more content on screen"
                    checked={preferences.compactMode}
                    onChange={(compactMode) => void updatePreferences({ compactMode })}
                  />
                  <ToggleSetting
                    label="Animations"
                    desc="Enable motion animations and transitions"
                    checked={preferences.animations}
                    onChange={(animations) => void updatePreferences({ animations })}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeSection === 'organization' && (
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Organization Settings</CardTitle>
                  <CardDescription>Configure company-wide settings for the portal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orgLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    </div>
                  ) : (
                    <>
                      {[
                        { key: 'companyName' as const, label: 'Company Name', type: 'text' },
                        { key: 'companyDomain' as const, label: 'Company Domain', type: 'text' },
                        { key: 'defaultSlaHours' as const, label: 'Default SLA (hours)', type: 'number' },
                        { key: 'adminEmail' as const, label: 'Admin Email', type: 'email' },
                      ].map(({ key, label, type }) => (
                        <div key={key}>
                          <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>
                            {label.toUpperCase()}
                          </label>
                          <input
                            type={type}
                            value={orgSettings[key]}
                            onChange={(e) => setOrgSettings((prev) => ({
                              ...prev,
                              [key]: type === 'number' ? Number(e.target.value) : e.target.value,
                            }))}
                            readOnly={!canEditOrganization}
                            disabled={!canEditOrganization}
                            min={type === 'number' ? 1 : undefined}
                            max={type === 'number' ? 720 : undefined}
                            className={cn(
                              'w-full h-9 px-3 rounded-lg border border-border text-foreground placeholder:text-muted-foreground outline-none transition-all',
                              canEditOrganization
                                ? 'bg-input-background focus:ring-2 focus:ring-primary/30'
                                : 'bg-muted text-muted-foreground cursor-not-allowed',
                            )}
                            style={{ fontSize: '13px' }}
                          />
                        </div>
                      ))}
                      {orgError && (
                        <p className="text-destructive" style={{ fontSize: '12px' }}>{orgError}</p>
                      )}
                      {!canEditOrganization && (
                        <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
                          Only Super Admin or Admin can edit organization settings.
                        </p>
                      )}
                      {canEditOrganization && (
                        <button
                          type="button"
                          disabled={orgSaving}
                          onClick={() => void handleSaveOrganization()}
                          className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg transition-opacity disabled:opacity-50',
                            orgSaved ? 'bg-emerald-600 text-white' : 'bg-primary text-primary-foreground hover:opacity-90',
                          )}
                          style={{ fontSize: '13px', fontWeight: 500 }}
                        >
                          {orgSaved ? <Check className="size-4" /> : <Save className="size-4" />}
                          {orgSaving ? 'Saving...' : orgSaved ? 'Saved!' : 'Save Organization Settings'}
                        </button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeSection === 'integrations' && (
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              {[
                { name: 'Employee Directory', desc: 'Employee data source — database integration', status: 'Connected', icon: '🏢' },
                { name: 'Email Server (SMTP)', desc: 'Nodemailer configuration for notifications', status: 'Connected', icon: '📧' },
                { name: 'Active Directory', desc: 'LDAP authentication for SSO login', status: 'Not Configured', icon: '🔐' },
                { name: 'WhatsApp Business', desc: 'WhatsApp notifications via Cloud API', status: 'Not Configured', icon: '💬' },
              ].map(({ name, desc, status, icon }) => (
                <Card key={name} className="border-border/60 shadow-sm">
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-xl">{icon}</div>
                        <div>
                          <p className="text-foreground" style={{ fontSize: '13px', fontWeight: 500 }}>{name}</p>
                          <p className="text-muted-foreground" style={{ fontSize: '12px' }}>{desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'px-2.5 py-1 rounded-md',
                          status === 'Connected' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                        )} style={{ fontSize: '11px', fontWeight: 600 }}>
                          {status}
                        </span>
                        <button className="px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                          style={{ fontSize: '12px' }}>
                          Configure
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
