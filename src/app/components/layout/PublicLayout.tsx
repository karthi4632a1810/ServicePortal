import React, { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { ClipboardList, Key, LayoutDashboard, LogOut, Route } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '../../utils/branding';
import { useApp } from '../../context/AppContext';
import { isFixedSuperAdmin } from '../../utils/roleAccess';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { UserAvatar } from '../ui/user-avatar';
import { cn } from '../ui/utils';

const iconBtn =
  'inline-flex items-center justify-center gap-2 h-9 min-w-9 px-2.5 sm:px-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors shrink-0';

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
  const location = useLocation();
  const onTrackPage = location.pathname.startsWith('/track');

  return (
    <div className="min-h-screen w-full bg-background flex flex-col overflow-x-hidden">
      <header className="min-h-14 bg-card border-b border-border sticky top-0 z-30 safe-top">
        <div className="max-w-[1200px] mx-auto w-full min-h-14 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 py-2">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0 hover:opacity-90 transition-opacity shrink">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <ClipboardList className="size-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <span className="text-foreground font-semibold block truncate" style={{ fontSize: '14px', lineHeight: 1.2 }}>
                {APP_NAME}
              </span>
              <span className="text-muted-foreground hidden sm:block truncate" style={{ fontSize: '10px', lineHeight: 1.2 }}>
                {APP_TAGLINE}
              </span>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Link
              to="/track"
              className={cn(
                iconBtn,
                onTrackPage
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'text-foreground',
              )}
              style={{ fontSize: '13px', fontWeight: 500 }}
              title="Track requests"
            >
              <Route className="size-4 shrink-0" />
              <span className="hidden sm:inline">Track</span>
            </Link>

            {isEmployeeSession && currentUser && (
              <>
                <UserAvatar
                  name={currentUser.name}
                  initials={currentUser.initials}
                  employeeId={currentUser.employeeId}
                  avatar={currentUser.avatar}
                  className="size-8 shrink-0"
                />
                <span className="hidden md:inline text-muted-foreground truncate max-w-[140px]" style={{ fontSize: '12px' }}>
                  {currentUser.name}
                  {currentUser.employeeId ? ` (${currentUser.employeeId})` : ''}
                </span>
                {!isFixedSuperAdmin(currentUser) && (
                  <button
                    type="button"
                    onClick={() => setChangePasswordOpen(true)}
                    className={iconBtn}
                    style={{ fontSize: '13px', fontWeight: 500 }}
                    title="Change password"
                  >
                    <Key className="size-4 shrink-0" />
                    <span className="hidden lg:inline">Change Password</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className={iconBtn}
                  style={{ fontSize: '13px' }}
                  title="Logout"
                >
                  <LogOut className="size-4 shrink-0" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}

            {hasAdminAccess && (
              <Link
                to="/admin"
                className="inline-flex items-center justify-center gap-2 h-9 min-w-9 px-2.5 sm:px-4 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity shrink-0"
                style={{ fontSize: '13px', fontWeight: 600 }}
                title="Admin panel"
              >
                <LayoutDashboard className="size-4 shrink-0" />
                <span className="hidden sm:inline">Admin Panel</span>
              </Link>
            )}

            {!isAuthenticated && (
              <Link
                to="/login"
                className={cn(iconBtn, 'text-muted-foreground')}
                style={{ fontSize: '12px' }}
                title="Admin login"
              >
                <span className="sm:hidden">Login</span>
                <span className="hidden sm:inline">Admin Login</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden overflow-y-auto">
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
