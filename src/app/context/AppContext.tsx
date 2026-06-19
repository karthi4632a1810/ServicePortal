import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Page, Approver, Request, FormSchema } from '../types';
import { MOCK_APPROVERS, MOCK_REQUESTS } from '../data/mockData';

interface AppContextValue {
  currentPage: Page;
  navigate: (page: Page, params?: Record<string, unknown>) => void;
  pageParams: Record<string, unknown>;
  currentUser: Approver | null;
  isAuthenticated: boolean;
  login: (user: Approver) => void;
  logout: () => void;
  isDark: boolean;
  toggleDark: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  requests: Request[];
  setRequests: React.Dispatch<React.SetStateAction<Request[]>>;
  selectedForm: FormSchema | null;
  setSelectedForm: (form: FormSchema | null) => void;
  selectedRequest: Request | null;
  setSelectedRequest: (request: Request | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [pageParams, setPageParams] = useState<Record<string, unknown>>({});
  const [currentUser, setCurrentUser] = useState<Approver | null>(MOCK_APPROVERS[0]);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [requests, setRequests] = useState<Request[]>(MOCK_REQUESTS);
  const [selectedForm, setSelectedForm] = useState<FormSchema | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useCallback((page: Page, params?: Record<string, unknown>) => {
    setCurrentPage(page);
    setPageParams(params ?? {});
  }, []);

  const login = useCallback((user: Approver) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentPage('employee-portal');
  }, []);

  const toggleDark = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

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
      toggleDark,
      isSidebarCollapsed,
      toggleSidebar,
      requests,
      setRequests,
      selectedForm,
      setSelectedForm,
      selectedRequest,
      setSelectedRequest,
      searchQuery,
      setSearchQuery,
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
