import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Wifi, Mail, Clock, CalendarOff, IndianRupee, Monitor,
  Search, ChevronRight, Sparkles, Tag,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { APP_NAME, DEFAULT_FORM_CATEGORY, getHrmsDepartmentTagStyle } from '../utils/branding';
import { DepartmentTag } from '../components/common/DepartmentTag';
import { cn } from '../components/ui/utils';
import { useApp } from '../context/AppContext';
import { hasAdminAccess } from '../utils/roleAccess';
import { StaffLoginModal } from '../components/auth/StaffLoginModal';
import type { FormSchema } from '../types';
import { useScreenRefresh } from '../hooks/useScreenRefresh';

const ICON_MAP: Record<string, React.ElementType> = {
  Wifi, Mail, Clock, CalendarOff, IndianRupee, Monitor,
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

function FormCard({ form, onClick }: { form: FormSchema; onClick: () => void }) {
  const Icon = ICON_MAP[form.icon] ?? Sparkles;
  const deptStyle = form.departmentId
    ? getHrmsDepartmentTagStyle(form.departmentId)
    : null;

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -2, boxShadow: '0 8px 24px -4px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="group cursor-pointer bg-card rounded-xl border border-border/60 p-5 flex flex-col gap-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between">
        <div className={cn('size-11 rounded-xl flex items-center justify-center bg-muted')}>
          <Icon className={cn('size-5 text-primary')} />
        </div>
        <div className="flex items-center gap-2">
          {form.departmentId ? (
            <DepartmentTag departmentId={form.departmentId} department={form.department} />
          ) : (
            <span className={cn('px-2.5 py-0.5 rounded-full border text-xs font-medium', deptStyle?.bg, deptStyle?.text, deptStyle?.border)}>
              {form.department}
            </span>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-foreground" style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.3 }}>{form.title}</h3>
        <p className="text-muted-foreground mt-1.5" style={{ fontSize: '12px', lineHeight: 1.5 }}>{form.description}</p>
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: '11px' }}>
            <Clock className="size-3" />
            <span>{form.estimatedTime}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: '11px' }}>
            <Tag className="size-3" />
            <span>v{form.version}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontSize: '12px', fontWeight: 500 }}>
          Apply <ChevronRight className="size-3.5" />
        </div>
      </div>
    </motion.div>
  );
}

export function ServiceCatalogPage() {
  const {
    navigate, setSelectedForm, forms, refreshForms, error, loading,
    isEmployeeSession, employeeLogin, isAuthenticated, currentUser,
  } = useApp();
  const routerNavigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeDepartment, setActiveDepartment] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingForm, setPendingForm] = useState<FormSchema | null>(null);

  useEffect(() => {
    if (forms.length === 0 && !loading) {
      setRefreshing(true);
      refreshForms().finally(() => setRefreshing(false));
    }
  }, [forms.length, loading, refreshForms]);

  useScreenRefresh(refreshForms);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;
    if (!window.location.pathname.startsWith('/admin') && hasAdminAccess(currentUser.role)) {
      routerNavigate('/admin', { replace: true });
    }
  }, [isAuthenticated, currentUser, routerNavigate]);

  const departments = ['All', ...Array.from(new Set(forms.map(f => f.department).filter(Boolean))).sort()];

  const filtered = forms.filter(f => {
    const matchSearch = !search || f.title.toLowerCase().includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase());
    const matchDept = !activeDepartment || activeDepartment === 'All' || f.department === activeDepartment;
    return matchSearch && matchDept && f.active;
  });

  const grouped = filtered.reduce<Record<string, FormSchema[]>>((acc, form) => {
    const group = form.department || DEFAULT_FORM_CATEGORY;
    if (!acc[group]) acc[group] = [];
    acc[group].push(form);
    return acc;
  }, {});

  const handleFormSelect = (form: FormSchema) => {
    setSelectedForm(form);
    if (window.location.pathname.startsWith('/admin')) {
      navigate('dynamic-form');
      return;
    }
    if (isEmployeeSession) {
      routerNavigate(`/forms/${form.id}`);
      return;
    }
    setPendingForm(form);
    setLoginOpen(true);
  };

  const handleStaffLogin = async (staffId: string, password: string) => {
    const user = await employeeLogin(staffId, password);
    setLoginOpen(false);
    if (hasAdminAccess(user.role)) {
      routerNavigate('/admin', { replace: true });
      setPendingForm(null);
      return;
    }
    if (pendingForm) {
      routerNavigate(`/forms/${pendingForm.id}`);
      setPendingForm(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6 w-full"
    >
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-foreground" style={{ fontSize: '20px', fontWeight: 600 }}>Forms</h1>
        <p className="text-muted-foreground" style={{ fontSize: '13px' }}>
          Browse {APP_NAME} forms. Select a form and sign in with your staff ID and password to continue.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search forms..."
            className="w-64 h-9 pl-9 pr-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            style={{ fontSize: '13px' }}
          />
        </div>

        <div className="flex items-center gap-2">
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => setActiveDepartment(dept === 'All' ? null : dept)}
              className={cn(
                'px-3 py-1.5 rounded-lg border transition-colors',
                (dept === 'All' && !activeDepartment) || dept === activeDepartment
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/40'
              )}
              style={{ fontSize: '12px', fontWeight: 500 }}
            >
              {dept}
            </button>
          ))}
        </div>

        <div className="ml-auto text-muted-foreground" style={{ fontSize: '12px' }}>
          {filtered.length} form{filtered.length !== 1 ? 's' : ''} available
        </div>
      </motion.div>

      {/* Forms by category */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
          <Sparkles className="size-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground" style={{ fontSize: '14px' }}>
            {refreshing || loading ? 'Loading forms...' : 'No forms found'}
          </p>
          <p className="text-muted-foreground" style={{ fontSize: '12px' }}>
            {error
              ? `Could not reach the API: ${error}`
              : 'Try adjusting your search or filter'}
          </p>
          {!loading && !refreshing && (
            <button
              onClick={() => { setRefreshing(true); refreshForms().finally(() => setRefreshing(false)); }}
              className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              style={{ fontSize: '13px', fontWeight: 500 }}
            >
              Retry
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([department, forms]) => (
            <motion.div key={department} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-foreground" style={{ fontSize: '15px', fontWeight: 600 }}>{department}</h2>
                <div className="h-px flex-1 bg-border" />
                <span className="text-muted-foreground" style={{ fontSize: '11px' }}>{forms.length} form{forms.length !== 1 ? 's' : ''}</span>
              </div>
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {forms.map(form => (
                  <FormCard key={form.id} form={form} onClick={() => handleFormSelect(form)} />
                ))}
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}
      <StaffLoginModal
        open={loginOpen}
        onOpenChange={(open) => {
          setLoginOpen(open);
          if (!open) setPendingForm(null);
        }}
        onSubmit={handleStaffLogin}
        formTitle={pendingForm?.title}
      />
    </motion.div>
  );
}
