import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

import type { Page, Approver, Request, FormSchema, AuditLog, DashboardStats, Employee } from '../types';

import { api } from '../services/api';
import { getDefaultPage, DEMO_ACCOUNTS } from '../utils/roleAccess';
import {
  DEFAULT_PREFERENCES,
  applyUserPreferences,
  type UserPreferences,
  type ThemePreference,
} from '../utils/userPreferences';

const EMPTY_DASHBOARD: DashboardStats = {

  totalToday: 0,

  pending: 0,

  approved: 0,

  rejected: 0,

  completed: 0,

  processing: 0,

  avgProcessingHours: 0,

  slaBreached: 0,

};



export const DEMO_LOGIN_USERS: Approver[] = DEMO_ACCOUNTS.map((a, i) => ({
  id: `demo-${i}`,
  name: a.email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  email: a.email,
  role: a.role,
  department: a.group,
  initials: a.email.slice(0, 2).toUpperCase(),
}));



interface AppContextValue {

  currentPage: Page;

  navigate: (page: Page, params?: Record<string, unknown>) => void;

  pageParams: Record<string, unknown>;

  currentUser: Approver | null;

  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;

  logout: () => void;

  isDark: boolean;

  preferences: UserPreferences;

  updatePreferences: (patch: Partial<UserPreferences>) => Promise<void>;

  setTheme: (theme: ThemePreference) => Promise<void>;

  toggleDark: () => void;

  isSidebarCollapsed: boolean;

  toggleSidebar: () => void;

  requests: Request[];

  setRequests: React.Dispatch<React.SetStateAction<Request[]>>;

  forms: FormSchema[];

  auditLogs: AuditLog[];

  dashboardStats: DashboardStats;

  chartData: {

    weekly: Array<{ day: string; submitted: number; approved: number; rejected: number; completed: number }>;

    status: Array<{ name: string; value: number; color: string }>;

    department: Array<{ dept: string; requests: number }>;

  };

  selectedForm: FormSchema | null;

  setSelectedForm: (form: FormSchema | null) => void;

  selectedRequest: Request | null;

  setSelectedRequest: (request: Request | null) => void;

  searchQuery: string;

  setSearchQuery: (q: string) => void;

  loading: boolean;

  error: string | null;

  refreshRequests: () => Promise<void>;

  refreshForms: () => Promise<void>;

  fetchEmployee: (employeeId: string, phone?: string) => Promise<Employee | null>;

  submitRequest: (data: { employeeId: string; formId: string; answers: Record<string, unknown>; priority?: string }) => Promise<Request>;

  performApprovalAction: (id: string, action: 'approve' | 'reject' | 'forward' | 'request-info', remarks?: string) => Promise<Request>;

  updateRequest: (updated: Request) => void;

  apiLoginUsers: Approver[];

}



const AppContext = createContext<AppContextValue | null>(null);



export function AppProvider({ children }: { children: React.ReactNode }) {

  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const [pageParams, setPageParams] = useState<Record<string, unknown>>({});

  const [currentUser, setCurrentUser] = useState<Approver | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [isDark, setIsDark] = useState(false);

  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [requests, setRequests] = useState<Request[]>([]);

  const [forms, setForms] = useState<FormSchema[]>([]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(EMPTY_DASHBOARD);

  const [chartData, setChartData] = useState({

    weekly: [] as AppContextValue['chartData']['weekly'],

    status: [] as AppContextValue['chartData']['status'],

    department: [] as AppContextValue['chartData']['department'],

  });

  const [selectedForm, setSelectedForm] = useState<FormSchema | null>(null);

  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const refreshForms = useCallback(async () => {

    const res = await api.getForms();

    setForms(res.data);

  }, []);



  const refreshRequests = useCallback(async (user?: Approver | null) => {
    const activeUser = user ?? currentUserRef.current;
    if (activeUser?.role === 'employee' && activeUser.employeeId) {
      const res = await api.getEmployeeRequests(activeUser.employeeId);
      setRequests(res.data);
      return;
    }
    const res = await api.getRequests();
    setRequests(res.data);
  }, []);



  const loadDashboard = useCallback(async () => {

    const [stats, weekly, status, dept] = await Promise.all([

      api.getDashboardStats(),

      api.getWeeklyChart(),

      api.getStatusChart(),

      api.getDepartmentChart(),

    ]);

    setDashboardStats(stats.data);

    setChartData({ weekly: weekly.data, status: status.data, department: dept.data });

  }, []);



  const loadAuditLogs = useCallback(async () => {

    const res = await api.getAuditLogs();

    setAuditLogs(res.data);

  }, []);



  const updateRequest = useCallback((updated: Request) => {

    setRequests(prev => prev.map(r => (r.id === updated.id ? updated : r)));

    setSelectedRequest(prev => (prev?.id === updated.id ? updated : prev));

  }, []);



  const performApprovalAction = useCallback(async (

    id: string,

    action: 'approve' | 'reject' | 'forward' | 'request-info',

    remarks?: string,

  ) => {

    let res;

    switch (action) {

      case 'approve':

        res = await api.approveRequest(id, remarks);

        break;

      case 'reject':

        res = await api.rejectRequest(id, remarks);

        break;

      case 'forward':

        res = await api.forwardRequest(id, remarks);

        break;

      case 'request-info':

        res = await api.requestInfo(id, remarks);

        break;

    }

    updateRequest(res.data);

    await loadDashboard();

    return res.data;

  }, [updateRequest, loadDashboard]);



  const applyPreferences = useCallback((prefs: UserPreferences) => {
    const effective = applyUserPreferences(prefs);
    setPreferences(prefs);
    setIsDark(effective === 'dark');
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      setLoading(true);
      setError(null);
      const errors: string[] = [];

      try {
        await refreshForms();
      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Failed to load service catalog');
      }

      try {
        const token = api.getToken();
        if (token) {
          try {
            const me = await api.getMe();
            if (!active) return;

            setCurrentUser(me.data);
            setIsAuthenticated(true);
            setCurrentPage(getDefaultPage(me.data.role));
            applyPreferences(me.data.preferences ?? DEFAULT_PREFERENCES);

            if (me.data.role === 'employee' && me.data.employeeId) {
              await refreshRequests(me.data);
            } else {
              const results = await Promise.allSettled([
                refreshRequests(me.data),
                loadDashboard(),
                loadAuditLogs(),
              ]);
              for (const result of results) {
                if (result.status === 'rejected') {
                  errors.push(result.reason instanceof Error ? result.reason.message : 'API request failed');
                }
              }
            }
          } catch {
            api.setToken(null);
          }
        }
      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Failed to connect to API');
      }

      if (!active) return;
      if (errors.length) setError(errors[0]);
      setLoading(false);
    }

    bootstrap();
    return () => { active = false; };
  }, [refreshForms, refreshRequests, loadDashboard, loadAuditLogs, applyPreferences]);



  const navigate = useCallback((page: Page, params?: Record<string, unknown>) => {

    setCurrentPage(page);

    setPageParams(params ?? {});

  }, []);



  const updatePreferences = useCallback(async (patch: Partial<UserPreferences>) => {
    const previous = preferences;
    const next = { ...preferences, ...patch };
    applyPreferences(next);

    if (isAuthenticated) {
      try {
        const res = await api.updatePreferences(patch);
        setPreferences(res.data);
        applyPreferences(res.data);
      } catch {
        applyPreferences(previous);
        throw new Error('Failed to save preferences');
      }
    }
  }, [preferences, applyPreferences, isAuthenticated]);

  const setTheme = useCallback(async (theme: ThemePreference) => {
    await updatePreferences({ theme });
  }, [updatePreferences]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    api.setToken(res.data.token);
    const user = res.data.user;
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentPage(getDefaultPage(user.role));
    applyPreferences(user.preferences ?? DEFAULT_PREFERENCES);

    await refreshForms();
    if (user.role === 'employee' && user.employeeId) {
      const empReqs = await api.getEmployeeRequests(user.employeeId);
      setRequests(empReqs.data);
    } else {
      await Promise.allSettled([refreshRequests(user), loadDashboard(), loadAuditLogs()]);
    }
  }, [refreshRequests, loadDashboard, loadAuditLogs, refreshForms, applyPreferences]);



  const logout = useCallback(() => {
    api.setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setRequests([]);
    setAuditLogs([]);
    setDashboardStats(EMPTY_DASHBOARD);
    setCurrentPage('dashboard');
    applyPreferences(DEFAULT_PREFERENCES);
  }, [applyPreferences]);



  const fetchEmployee = useCallback(async (employeeId: string, phone?: string) => {

    const res = await api.getEmployee(employeeId, phone);

    return res.data;

  }, []);



  const submitRequest = useCallback(async (data: { employeeId: string; formId: string; answers: Record<string, unknown>; priority?: string }) => {

    const res = await api.createRequest(data);

    setRequests(prev => [res.data, ...prev]);

    return res.data;

  }, []);



  const toggleDark = useCallback(() => {
    const nextTheme: ThemePreference = isDark ? 'light' : 'dark';
    void updatePreferences({ theme: nextTheme });
  }, [isDark, updatePreferences]);

  useEffect(() => {
    if (preferences.theme !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyPreferences(preferences);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [preferences, applyPreferences]);



  const toggleSidebar = useCallback(() => {

    setIsSidebarCollapsed(prev => !prev);

  }, []);



  return (

    <AppContext.Provider value={{

      currentPage,

      navigate,

      pageParams,

      currentUser,

      isAuthenticated,

      login,

      logout,

      isDark,

      preferences,

      updatePreferences,

      setTheme,

      toggleDark,

      isSidebarCollapsed,

      toggleSidebar,

      requests,

      setRequests,

      forms,

      auditLogs,

      dashboardStats,

      chartData,

      selectedForm,

      setSelectedForm,

      selectedRequest,

      setSelectedRequest,

      searchQuery,

      setSearchQuery,

      loading,

      error,

      refreshRequests,

      refreshForms,

      fetchEmployee,

      submitRequest,

      performApprovalAction,

      updateRequest,

      apiLoginUsers: DEMO_LOGIN_USERS,

    }}>

      {children}

    </AppContext.Provider>

  );

}



export function useApp() {

  const ctx = useContext(AppContext);

  if (!ctx) throw new Error('useApp must be used within AppProvider');

  return ctx;

}

