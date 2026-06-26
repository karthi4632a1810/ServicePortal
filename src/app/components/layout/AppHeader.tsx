import React, { useState } from 'react';
import { Search, Bell, Sun, Moon, ChevronRight, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../ui/utils';
import { UserAvatar } from '../ui/user-avatar';
import { useApp } from '../../context/AppContext';

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

export function AppHeader() {
  const { currentPage, navigate, isDark, toggleDark, searchQuery, setSearchQuery, currentUser, refreshScreen, screenRefreshing } = useApp();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const parents = BREADCRUMB_PARENTS[currentPage] ?? [];
  const pageTitle = PAGE_LABELS[currentPage] ?? currentPage;

  return (
    <header className="h-14 bg-card border-b border-border flex items-center px-6 gap-4 sticky top-0 z-30">
      {/* Breadcrumb */}
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

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search */}
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
                  onChange={e => setSearchQuery(e.target.value)}
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

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
            title="Notifications"
          >
            <Bell className="size-4" />
          </button>
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span style={{ fontSize: '13px', fontWeight: 500 }} className="text-foreground">Notifications</span>
                </div>
                <div className="px-4 py-8 text-center">
                  <p className="text-muted-foreground" style={{ fontSize: '12px' }}>No notifications</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dark mode */}
        <button
          onClick={toggleDark}
          className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Toggle theme"
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        {/* Avatar */}
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
