import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

import type { Page, Approver, Request, FormSchema, AuditLog, DashboardStats, Employee, AppNotification } from '../types';

import { api } from '../services/api';
import { fetchEmployeeTiered } from '../utils/fetchEmployeeTiered';
import { getDefaultPage, DEMO_ACCOUNTS, hasAdminAccess, isEmployeeSession as isEmployeeRole } from '../utils/roleAccess';
import {
  DEFAULT_PREFERENCES,
  applyUserPreferences,
  type UserPreferences,
  type ThemePreference,
} from '../utils/userPreferences';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from '../utils/notificationPreferences';
import { getPageForNotification, getParamsForNotification } from '../utils/notificationNavigation';

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

  isEmployeeSession: boolean;

  hasAdminAccess: boolean;

  login: (identifier: string, password: string) => Promise<void>;

  employeeLogin: (staffId: string, password: string) => Promise<import('../types').Approver>;

  changePassword: (oldPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;

  logout: () => void;

  isDark: boolean;

  preferences: UserPreferences;

  updatePreferences: (patch: Partial<UserPreferences>) => Promise<void>;

  updateNotificationPreferences: (patch: Partial<NotificationPreferences>) => Promise<void>;

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

  refreshApprovals: (status?: string) => Promise<Request[]>;

  refreshForms: () => Promise<void>;

  fetchEmployee: (employeeId: string, phone?: string, onUpdate?: (employee: Employee) => void) => Promise<Employee | null>;

  submitRequest: (data: { employeeId: string; formId: string; answers: Record<string, unknown>; priority?: string; attachments?: import('../types').Attachment[] }) => Promise<import('../types').Request>;

  performApprovalAction: (id: string, action: 'approve' | 'reject' | 'forward' | 'request-info', remarks?: string, staffId?: string) => Promise<Request>;

  updateRequest: (updated: Request) => void;

  apiLoginUsers: Approver[];

  screenRefreshing: boolean;

  refreshScreen: () => Promise<void>;

  registerScreenRefresh: (handler: (() => void | Promise<void>) | null) => void;

  loadDashboard: () => Promise<void>;

  loadAuditLogs: () => Promise<void>;

  notifications: AppNotification[];

  unreadNotificationCount: number;

  refreshNotifications: () => Promise<void>;

  openNotification: (notification: AppNotification) => Promise<void>;

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

  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const screenRefreshRef = useRef<(() => void | Promise<void>) | null>(null);
  const [screenRefreshing, setScreenRefreshing] = useState(false);

  const registerScreenRefresh = useCallback((handler: (() => void | Promise<void>) | null) => {
    screenRefreshRef.current = handler;
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!api.getToken()) return;
    try {
      const res = await api.getNotifications();
      setNotifications(res.data);
      setUnreadNotificationCount(res.pagination?.unread ?? res.data.filter((n) => !n.read).length);
    } catch {
      setNotifications([]);
      setUnreadNotificationCount(0);
    }
  }, []);

  const refreshScreen = useCallback(async () => {
    const handler = screenRefreshRef.current;
    if (!handler) return;
    setScreenRefreshing(true);
    try {
      await handler();
    } finally {
      setScreenRefreshing(false);
    }
  }, []);

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
    const res = await api.getRequests({ limit: '100' });
    setRequests(res.data);
  }, []);



  const refreshApprovals = useCallback(async (status = 'pending') => {
    const res = await api.getApprovals(status);
    return res.data;
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

  const openNotification = useCallback(async (notification: AppNotification) => {
    try {
      if (!notification.read) {
        await api.markNotificationRead(notification.id);
        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
        setUnreadNotificationCount((count) => Math.max(0, count - 1));
      }
    } catch {
      // continue navigation even if mark-read fails
    }

    if (notification.requestId) {
      try {
        const res = await api.getRequest(notification.requestId);
        setSelectedRequest(res.data);
        updateRequest(res.data);
      } catch {
        // navigate without preloaded request
      }
    }

    const page = getPageForNotification(notification, currentUserRef.current?.role);
    const params = getParamsForNotification(notification, page);
    setCurrentPage(page);
    setPageParams(params);
  }, [updateRequest]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadNotificationCount(0);
      return;
    }

    void refreshNotifications();
    const intervalId = window.setInterval(() => {
      void refreshNotifications();
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, [isAuthenticated, refreshNotifications]);



  const performApprovalAction = useCallback(async (
    id: string,
    action: 'approve' | 'reject' | 'forward' | 'request-info',
    remarks?: string,
    staffId?: string,
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
        if (!staffId?.trim()) throw new Error('Staff ID is required to forward');
        res = await api.forwardRequest(id, staffId.trim(), remarks);
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
        const token = api.getToken();
        if (token) {
          try {
            const me = await api.getMe();
            if (!active) return;

            setCurrentUser(me.data);
            setIsAuthenticated(true);
            setCurrentPage(getDefaultPage(me.data.role));
            applyPreferences(me.data.preferences ?? DEFAULT_PREFERENCES);

            void refreshForms().catch((err) => {
              console.warn('Forms load failed:', err);
            });

            if (me.data.role === 'employee' && me.data.employeeId) {
              void refreshRequests(me.data);
            } else {
              void Promise.allSettled([
                refreshRequests(me.data),
                loadDashboard(),
                loadAuditLogs(),
              ]);
            }
          } catch {
            api.setToken(null);
            await refreshForms();
          }
        } else {
          await refreshForms();
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

  const updateNotificationPreferences = useCallback(async (patch: Partial<NotificationPreferences>) => {
    if (!currentUser) return;

    const previous = currentUser.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES;
    const optimistic = { ...previous, ...patch };
    setCurrentUser({ ...currentUser, notificationPreferences: optimistic });

    if (isAuthenticated) {
      try {
        const res = await api.updateNotificationPreferences(patch);
        setCurrentUser((user) => (user ? { ...user, notificationPreferences: res.data } : user));
      } catch {
        setCurrentUser((user) => (user ? { ...user, notificationPreferences: previous } : user));
        throw new Error('Failed to save notification preferences');
      }
    }
  }, [currentUser, isAuthenticated]);

  const setTheme = useCallback(async (theme: ThemePreference) => {
    await updatePreferences({ theme });
  }, [updatePreferences]);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await api.login(identifier, password);
    api.setToken(res.data.token);
    const user = res.data.user;
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentPage(getDefaultPage(user.role));
    applyPreferences(user.preferences ?? DEFAULT_PREFERENCES);

    void refreshForms();
    if (user.role === 'employee' && user.employeeId) {
      void api.getEmployeeRequests(user.employeeId).then((empReqs) => {
        setRequests(empReqs.data);
      }).catch(() => {});
    } else {
      void Promise.allSettled([refreshRequests(user), loadDashboard(), loadAuditLogs()]);
    }
  }, [refreshRequests, loadDashboard, loadAuditLogs, refreshForms, applyPreferences]);

  const employeeLogin = useCallback(async (staffId: string, password: string) => {
    const res = await api.employeeLogin(staffId, password);
    api.setToken(res.data.token);
    const user = res.data.user;
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentPage(getDefaultPage(user.role));
    applyPreferences(user.preferences ?? DEFAULT_PREFERENCES);

    void refreshForms();
    if (user.role === 'employee' && user.employeeId) {
      void api.getEmployeeRequests(user.employeeId).then((empReqs) => {
        setRequests(empReqs.data);
      }).catch(() => {});
    } else if (hasAdminAccess(user.role) || user.role !== 'employee') {
      void Promise.allSettled([refreshRequests(user), loadDashboard(), loadAuditLogs()]);
    }
    return user;
  }, [applyPreferences, refreshForms, refreshRequests, loadDashboard, loadAuditLogs]);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string, confirmPassword: string) => {
    await api.changePassword(oldPassword, newPassword, confirmPassword);
  }, []);



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



  const fetchEmployee = useCallback(async (
    employeeId: string,
    phone?: string,
    onUpdate?: (employee: Employee) => void,
  ) => fetchEmployeeTiered(employeeId, phone, onUpdate), []);



  const submitRequest = useCallback(async (data: { employeeId: string; formId: string; answers: Record<string, unknown>; priority?: string; attachments?: import('../types').Attachment[] }) => {

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

      isEmployeeSession: isAuthenticated && isEmployeeRole(currentUser?.role),

      hasAdminAccess: isAuthenticated && hasAdminAccess(currentUser?.role),

      login,

      employeeLogin,

      changePassword,

      logout,

      isDark,

      preferences,

      updatePreferences,

      updateNotificationPreferences,

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

      refreshApprovals,

      refreshForms,

      fetchEmployee,

      submitRequest,

      performApprovalAction,

      updateRequest,

      apiLoginUsers: DEMO_LOGIN_USERS,

      screenRefreshing,

      refreshScreen,

      registerScreenRefresh,

      loadDashboard,

      loadAuditLogs,

      notifications,

      unreadNotificationCount,

      refreshNotifications,

      openNotification,
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

