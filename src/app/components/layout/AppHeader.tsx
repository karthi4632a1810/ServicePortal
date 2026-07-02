import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Sun, Moon, ChevronRight, X, RefreshCw, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../ui/utils';
import { UserAvatar } from '../ui/user-avatar';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import type { AppNotification } from '../../types';

const PAGE_LABELS: Record<string, string> = {
  'dashboard': 'Dashboard',
  'employee-portal': 'Employee Portal',
  'service-catalog': 'Form Catalog',
  'dynamic-form': 'Submit Request',
  'my-requests': 'My Requests',
  'my-tasks': 'My Tasks',
  'request-detail': 'Request Details',
  'approvals': 'Approvals',
  'accept': 'Accept',
  'workflow-pipeline': 'Workflow Pipeline',
  'work-queue': 'Work Queue',
  'form-builder': 'Form Builder',
  'user-management': 'User Management',
  'audit-log': 'Audit Log',
  'settings': 'Settings',
};

const BREADCRUMB_PARENTS: Record<string, string[]> = {
  'dynamic-form': ['service-catalog'],
  'request-detail': ['my-requests'],
};

function formatNotificationTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function AppHeader() {
  const {
    currentPage,
    navigate,
    isDark,
    toggleDark,
    searchQuery,
    setSearchQuery,
    currentUser,
    refreshScreen,
    screenRefreshing,
    pageParams,
    notifications,
    unreadNotificationCount,
    refreshNotifications,
    openNotification,
    isAuthenticated,
  } = useApp();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const returnTo = pageParams.returnTo as string | undefined;
  const parents = currentPage === 'request-detail' && returnTo
    ? [returnTo]
    : (BREADCRUMB_PARENTS[currentPage] ?? []);
  const pageTitle = PAGE_LABELS[currentPage] ?? currentPage;

  useEffect(() => {
    if (!showNotifications) return;
    const onDocClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showNotifications]);

  const handleOpenNotification = async (notification: AppNotification) => {
    setShowNotifications(false);
    await openNotification(notification);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      await refreshNotifications();
    } catch {
      // ignore
    }
  };

  return (
    <header className="h-14 bg-card border-b border-border flex items-center px-6 gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {parents.map((parent) => (
          <React.Fragment key={parent}>
            <button
              onClick={() => navigate(parent as never)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontSize: '13px' }}
            >
              {PAGE_LABELS[parent]}
            </button>
            <ChevronRight className="size-3.5 text-muted-foreground" />
          </React.Fragment>
        ))}
        <h1 className="text-foreground" style={{ fontSize: '14px', fontWeight: 500 }}>{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <AnimatePresence mode="wait">
          {showSearch ? (
            <motion.div
              key="search-input"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 h-8 px-3 rounded-lg bg-muted border border-border">
                <Search className="size-3.5 text-muted-foreground shrink-0" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search requests, employees..."
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
                  style={{ fontSize: '13px' }}
                />
                <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
                  <X className="size-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="search-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSearch(true)}
              className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Search"
            >
              <Search className="size-4" />
            </motion.button>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => void refreshScreen()}
          disabled={screenRefreshing}
          className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          title="Refresh this page"
        >
          <RefreshCw className={cn('size-4', screenRefreshing && 'animate-spin')} />
        </button>

        {isAuthenticated && (
          <div className="relative" ref={panelRef}>
            <button
              onClick={() => {
                setShowNotifications((open) => {
                  const next = !open;
                  if (next) void refreshNotifications();
                  return next;
                });
              }}
              className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
              title="Notifications"
            >
              <Bell className="size-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground flex items-center justify-center" style={{ fontSize: '9px', fontWeight: 700 }}>
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
                    <span style={{ fontSize: '13px', fontWeight: 500 }} className="text-foreground">Notifications</span>
                    {unreadNotificationCount > 0 && (
                      <button
                        type="button"
                        onClick={() => void handleMarkAllRead()}
                        className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                        style={{ fontSize: '11px', fontWeight: 600 }}
                      >
                        <CheckCheck className="size-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-muted-foreground" style={{ fontSize: '12px' }}>No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => void handleOpenNotification(notification)}
                          className={cn(
                            'w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors',
                            !notification.read && 'bg-primary/5',
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {!notification.read && <span className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                            <div className="min-w-0 flex-1">
                              <p className="text-foreground truncate" style={{ fontSize: '12px', fontWeight: 600 }}>
                                {notification.title}
                              </p>
                              <p className="text-muted-foreground mt-0.5 line-clamp-2" style={{ fontSize: '11px' }}>
                                {notification.message}
                              </p>
                              <p className="text-muted-foreground/70 mt-1" style={{ fontSize: '10px' }}>
                                {formatNotificationTime(notification.createdAt)}
                                {notification.requestNumber ? ` · ${notification.requestNumber}` : ''}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <button
          onClick={toggleDark}
          className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Toggle theme"
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        {currentUser && (
          <div title={currentUser.name}>
            <UserAvatar
              name={currentUser.name}
              initials={currentUser.initials}
              employeeId={currentUser.employeeId}
              avatar={currentUser.avatar}
              className="size-8 cursor-pointer hover:opacity-90 transition-opacity"
            />
          </div>
        )}
      </div>
    </header>
  );
}
