import React, { useState } from 'react';
import { Link } from 'react-router';
import { ClipboardList, Key, LayoutDashboard, LogOut } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '../../utils/branding';
import { useApp } from '../../context/AppContext';
import { isFixedSuperAdmin } from '../../utils/roleAccess';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { UserAvatar } from '../ui/user-avatar';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const {
    isAuthenticated,
    isEmployeeSession,
    hasAdminAccess,
    currentUser,
    logout,
    changePassword,
  } = useApp();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <header className="h-14 bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto w-full h-full flex items-center px-6 gap-4">
          <Link to="/" className="flex items-center gap-3 min-w-0 hover:opacity-90 transition-opacity">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <ClipboardList className="size-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <span className="text-foreground font-semibold block" style={{ fontSize: '14px', lineHeight: 1.2 }}>
                {APP_NAME}
              </span>
              <span className="text-muted-foreground block" style={{ fontSize: '10px', lineHeight: 1.2 }}>
                {APP_TAGLINE}
              </span>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {isEmployeeSession && currentUser && (
              <>
                <UserAvatar
                  name={currentUser.name}
                  initials={currentUser.initials}
                  employeeId={currentUser.employeeId}
                  avatar={currentUser.avatar}
                  className="size-8"
                />
                <span className="hidden sm:inline text-muted-foreground" style={{ fontSize: '12px' }}>
                  {currentUser.name}
                  {currentUser.employeeId ? ` (${currentUser.employeeId})` : ''}
                </span>
                {!isFixedSuperAdmin(currentUser) && (
                <button
                  onClick={() => setChangePasswordOpen(true)}
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
                  style={{ fontSize: '13px', fontWeight: 500 }}
                >
                  <Key className="size-4" />
                  Change Password
                </button>
                )}
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
                  style={{ fontSize: '13px' }}
                >
                  <LogOut className="size-4" />
                  Logout
                </button>
              </>
            )}

            {hasAdminAccess && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                style={{ fontSize: '13px', fontWeight: 600 }}
              >
                <LayoutDashboard className="size-4" />
                Admin Panel
              </Link>
            )}

            {!isAuthenticated && (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-muted-foreground"
                style={{ fontSize: '12px' }}
              >
                Admin Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="max-w-[1200px] mx-auto w-full">
          {children}
        </div>
      </main>

      <ChangePasswordModal
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
        onSubmit={changePassword}
      />
    </div>
  );
}
