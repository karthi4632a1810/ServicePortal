import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { hasAdminAccess } from '../utils/roleAccess';
import { StaffLoginModal } from '../components/auth/StaffLoginModal';
import { MyRequestsPage } from './MyRequestsPage';
import { RequestDetailPage } from './RequestDetailPage';

export function TrackPage() {
  const routerNavigate = useNavigate();
  const { isEmployeeSession, employeeLogin, currentUser } = useApp();
  const [loginOpen, setLoginOpen] = useState(false);
  const [view, setView] = useState<'list' | 'detail'>('list');

  useEffect(() => {
    if (currentUser && hasAdminAccess(currentUser.role)) {
      routerNavigate('/admin', { replace: true });
    }
  }, [currentUser, routerNavigate]);

  useEffect(() => {
    if (!isEmployeeSession) {
      setLoginOpen(true);
    }
  }, [isEmployeeSession]);

  const handleStaffLogin = async (staffId: string, password: string) => {
    const user = await employeeLogin(staffId, password);
    setLoginOpen(false);
    if (hasAdminAccess(user.role)) {
      routerNavigate('/admin', { replace: true });
    }
  };

  if (!isEmployeeSession) {
    return (
      <>
        <div className="p-4 sm:p-6 flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
          <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <FileText className="size-7 text-primary" />
          </div>
          <h1 className="text-foreground mb-2" style={{ fontSize: '20px', fontWeight: 600 }}>
            Track Your Requests
          </h1>
          <p className="text-muted-foreground max-w-md mb-6" style={{ fontSize: '13px' }}>
            Sign in with your staff ID and password to view the status of your submitted forms.
          </p>
          <button
            onClick={() => setLoginOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            style={{ fontSize: '13px', fontWeight: 600 }}
          >
            Sign In to Track
          </button>
        </div>
        <StaffLoginModal
          open={loginOpen}
          onOpenChange={setLoginOpen}
          onSubmit={handleStaffLogin}
        />
      </>
    );
  }

  if (view === 'detail') {
    return (
      <RequestDetailPage
        publicMode
        onBack={() => setView('list')}
      />
    );
  }

  return (
    <MyRequestsPage
      publicMode
      onViewDetail={() => setView('detail')}
    />
  );
}
