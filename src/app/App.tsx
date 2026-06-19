import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Toaster } from 'sonner';
import { AppProvider, useApp } from './context/AppContext';
import { AppSidebar } from './components/layout/AppSidebar';
import { AppHeader } from './components/layout/AppHeader';
import { LoadingScreen } from './components/animations/LoadingScreen';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeePortalPage } from './pages/EmployeePortalPage';
import { ServiceCatalogPage } from './pages/ServiceCatalogPage';
import { DynamicFormPage } from './pages/DynamicFormPage';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { RequestDetailPage } from './pages/RequestDetailPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { WorkflowPipelinePage } from './pages/WorkflowPipelinePage';
import { WorkQueuePage } from './pages/WorkQueuePage';
import { FormBuilderPage } from './pages/FormBuilderPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';

/* ── Page transition config ──────────────────────────────────── */
const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 16, filter: 'blur(3px)' },
  animate: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0, y: -10, filter: 'blur(2px)',
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  },
};

/* ── Page router ─────────────────────────────────────────────── */
function PageRouter() {
  const { currentPage } = useApp();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':       return <DashboardPage />;
      case 'employee-portal': return <EmployeePortalPage />;
      case 'service-catalog': return <ServiceCatalogPage />;
      case 'dynamic-form':    return <DynamicFormPage />;
      case 'my-requests':     return <MyRequestsPage />;
      case 'request-detail':  return <RequestDetailPage />;
      case 'approvals':            return <ApprovalsPage />;
      case 'workflow-pipeline':    return <WorkflowPipelinePage />;
      case 'work-queue':           return <WorkQueuePage />;
      case 'form-builder':    return <FormBuilderPage />;
      case 'audit-log':       return <AuditLogPage />;
      case 'settings':        return <SettingsPage />;
      default:                return <DashboardPage />;
    }
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={currentPage}
        variants={PAGE_VARIANTS}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex-1"
        style={{ willChange: 'opacity, transform, filter' }}
      >
        {renderPage()}
      </motion.div>
    </AnimatePresence>
  );
}

/* ── App shell ───────────────────────────────────────────────── */
function AppShell() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex h-screen overflow-hidden bg-background"
    >
      <AppSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-auto">
          <PageRouter />
        </main>
      </div>
    </motion.div>
  );
}

/* ── Root with loading screen ────────────────────────────────── */
export default function App() {
  const [ready, setReady] = useState(false);

  return (
    <AppProvider>
      <AnimatePresence mode="wait">
        {!ready ? (
          <LoadingScreen key="loading" onComplete={() => setReady(true)} duration={2600} />
        ) : (
          <motion.div
            key="app"
            className="h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            <AppShell />
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--card)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            fontSize: '13px',
            boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)',
          },
        }}
      />
    </AppProvider>
  );
}
