import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import {
  LayoutDashboard, User, LayoutGrid, FileText, CheckSquare,
  Layers, Wrench, Shield, Settings, ChevronLeft, ChevronRight,
  ClipboardList, LogOut, GitBranch,
} from 'lucide-react';
import { cn } from '../ui/utils';
import { useApp } from '../../context/AppContext';
import { APP_NAME, APP_TAGLINE } from '../../utils/branding';
import { canAccessPage } from '../../utils/roleAccess';
import type { Page } from '../../types';

interface NavItem {
  id: Page;
  label: string;
  icon: React.ElementType;
  dividerBefore?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'employee-portal', label: 'Employee Portal', icon: User, dividerBefore: true },
  { id: 'service-catalog', label: 'Form Catalog', icon: LayoutGrid },
  { id: 'my-requests', label: 'My Requests', icon: FileText },
  { id: 'approvals', label: 'Approvals', icon: CheckSquare },
  { id: 'workflow-pipeline', label: 'Workflow Pipeline', icon: GitBranch },
  { id: 'work-queue', label: 'Work Queue', icon: Layers },
  { id: 'form-builder', label: 'Form Builder', icon: Wrench, dividerBefore: true },
  { id: 'audit-log', label: 'Audit Log', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function useNavBadges(requests: import('../../types').Request[]): Partial<Record<Page, number>> {
  return {
    approvals: requests.filter(r => r.status === 'pending_approval').length,
    'workflow-pipeline': requests.filter(r => !['completed', 'rejected', 'cancelled'].includes(r.status)).length,
    'work-queue': requests.filter(r => ['approved', 'processing'].includes(r.status)).length,
  };
}

export function AppSidebar() {
  const { currentPage, navigate, isSidebarCollapsed, toggleSidebar, currentUser, logout, requests } = useApp();
  const routerNavigate = useNavigate();
  const badges = useNavBadges(requests);
  const visibleItems = NAV_ITEMS.filter(item =>
    currentUser ? canAccessPage(currentUser.role, item.id) : false
  );

  return (
    <motion.aside
      animate={{ width: isSidebarCollapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0 overflow-hidden shrink-0 z-40"
    >
      <div className="flex items-center h-14 px-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <ClipboardList className="size-4 text-sidebar-primary-foreground" />
          </div>
          <AnimatePresence>
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col min-w-0"
              >
                <span className="text-sidebar-foreground font-semibold truncate" style={{ fontSize: '13px', lineHeight: '1.2' }}>{APP_NAME}</span>
                <span className="text-sidebar-foreground/50 truncate" style={{ fontSize: '10px', lineHeight: '1.2' }}>{APP_TAGLINE}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={toggleSidebar}
          className="ml-auto size-6 flex items-center justify-center rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors shrink-0"
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;
          return (
            <React.Fragment key={item.id}>
              {item.dividerBefore && (
                <div className="my-2 border-t border-sidebar-border" />
              )}
              <button
                onClick={() => navigate(item.id)}
                className={cn(
                  'relative w-full flex items-center gap-3 rounded-lg transition-all duration-150 group',
                  isSidebarCollapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-foreground'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-lg bg-sidebar-accent"
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3 w-full">
                  <Icon className={cn('shrink-0', isSidebarCollapsed ? 'size-4' : 'size-4')} />
                  <AnimatePresence>
                    {!isSidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 text-left truncate"
                        style={{ fontSize: '13px' }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!isSidebarCollapsed && badges[item.id] != null && badges[item.id]! > 0 && (
                    <span className="ml-auto shrink-0 size-5 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center"
                      style={{ fontSize: '10px', fontWeight: 600 }}>
                      {badges[item.id]}
                    </span>
                  )}
                </span>
                {isSidebarCollapsed && badges[item.id] != null && badges[item.id]! > 0 && (
                  <span className="absolute top-1 right-1 size-2 rounded-full bg-sidebar-primary" />
                )}
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {currentUser && (
        <div className="border-t border-sidebar-border p-2 shrink-0">
          <div className={cn(
            'flex items-center rounded-lg transition-colors',
            isSidebarCollapsed ? 'p-2 justify-center' : 'px-3 py-2 gap-3'
          )}>
            <div className="size-7 rounded-full bg-sidebar-primary flex items-center justify-center shrink-0">
              <span className="text-sidebar-primary-foreground font-semibold" style={{ fontSize: '10px' }}>
                {currentUser.initials}
              </span>
            </div>
            <AnimatePresence>
              {!isSidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sidebar-foreground truncate" style={{ fontSize: '12px', fontWeight: 500 }}>{currentUser.name}</p>
                  <p className="text-sidebar-foreground/50 truncate capitalize" style={{ fontSize: '10px' }}>{currentUser.role.replace(/_/g, ' ')}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {!isSidebarCollapsed && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => { logout(); routerNavigate('/'); }}
                  className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors ml-auto"
                  title="Logout"
                >
                  <LogOut className="size-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
