import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import {
  Settings, User, Bell, Shield, Mail, Palette, Building2,
  Globe, Key, Save, ChevronRight, Check, Smartphone,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { cn } from '../components/ui/utils';
import { useApp, DEMO_LOGIN_USERS } from '../context/AppContext';
import { ACCENT_COLORS } from '../utils/userPreferences';

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

export function SettingsPage() {
  const { currentUser, preferences, setTheme, updatePreferences, isAuthenticated, login, logout, apiLoginUsers } = useApp();
  const routerNavigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [loginEmail, setLoginEmail] = useState(DEMO_LOGIN_USERS[0].email);
  const [loginPassword, setLoginPassword] = useState('Password@123');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const user = currentUser ?? apiLoginUsers[0];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
                  <CardDescription>Update your personal details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="size-16 rounded-2xl bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-bold" style={{ fontSize: '22px' }}>{user.initials}</span>
                    </div>
                    <div>
                      <button className="px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                        style={{ fontSize: '12px' }}>
                        Change Photo
                      </button>
                      <p className="text-muted-foreground mt-1" style={{ fontSize: '11px' }}>JPG, PNG or GIF. Max 2MB</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Full Name', value: user.name, type: 'text' },
                      { label: 'Email Address', value: user.email, type: 'email' },
                      { label: 'Department', value: user.department, type: 'text' },
                      { label: 'Role', value: user.role.replace(/_/g, ' '), type: 'text' },
                    ].map(({ label, value, type }) => (
                      <div key={label}>
                        <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>
                          {label.toUpperCase()}
                        </label>
                        <input
                          type={type}
                          defaultValue={value}
                          className="w-full h-9 px-3 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
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
                  <div className="mb-4">
                    <p className="text-muted-foreground mb-3" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Notifications</p>
                    <ToggleSetting label="Request Submitted" desc="When a new request is submitted to your queue" checked={true} onChange={() => {}} />
                    <ToggleSetting label="Approval Required" desc="When your approval is needed on a request" checked={true} onChange={() => {}} />
                    <ToggleSetting label="Request Approved" desc="When your request gets approved" checked={true} onChange={() => {}} />
                    <ToggleSetting label="Request Rejected" desc="When your request is rejected" checked={true} onChange={() => {}} />
                    <ToggleSetting label="Request Completed" desc="When a request is fully processed" checked={false} onChange={() => {}} />
                    <ToggleSetting label="SLA Reminder" desc="Reminder when requests approach SLA deadline" checked={true} onChange={() => {}} />
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-3" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>In-App Notifications</p>
                    <ToggleSetting label="Real-time Updates" desc="Instant notifications for all activity" checked={true} onChange={() => {}} />
                    <ToggleSetting label="Daily Digest" desc="Daily summary email of pending items" checked={false} onChange={() => {}} />
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
                        <input
                          type="password"
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                          style={{ fontSize: '13px' }}
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
                  <CardDescription>Update your account password regularly for security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {['Current Password', 'New Password', 'Confirm New Password'].map(label => (
                    <div key={label}>
                      <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>{label.toUpperCase()}</label>
                      <input type="password" className="w-full h-9 px-3 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" style={{ fontSize: '13px' }} />
                    </div>
                  ))}
                  <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    style={{ fontSize: '13px', fontWeight: 500 }}>
                    Update Password
                  </button>
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
                    <p className="text-muted-foreground mb-3" style={{ fontSize: '11px', fontWeight: 600 }}>ACCENT COLOR</p>
                    <div className="flex gap-3">
                      {ACCENT_COLORS.map(({ color, label }) => (
                        <button
                          key={color}
                          title={label}
                          onClick={() => void updatePreferences({ accentColor: color })}
                          className={cn(
                            'size-8 rounded-full border-2 shadow-sm hover:scale-110 transition-transform',
                            preferences.accentColor === color ? 'border-foreground scale-110' : 'border-white',
                          )}
                          style={{ background: color }}
                        />
                      ))}
                    </div>
                  </div>

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
                  {[
                    { label: 'Company Name', value: 'Acme Corporation Ltd.' },
                    { label: 'Company Domain', value: 'acmecorp.com' },
                    { label: 'Default SLA (hours)', value: '24' },
                    { label: 'Admin Email', value: 'admin@acmecorp.com' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <label className="block mb-1.5 text-muted-foreground" style={{ fontSize: '11px', fontWeight: 600 }}>{label.toUpperCase()}</label>
                      <input defaultValue={value} className="w-full h-9 px-3 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-primary/30" style={{ fontSize: '13px' }} />
                    </div>
                  ))}
                  <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    style={{ fontSize: '13px', fontWeight: 500 }}>
                    Save Organization Settings
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeSection === 'integrations' && (
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              {[
                { name: 'HRMS System', desc: 'Employee data source — SQL Server integration', status: 'Connected', icon: '🏢' },
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
