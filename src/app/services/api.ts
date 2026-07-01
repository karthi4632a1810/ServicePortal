const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('sp_token', token);
    else localStorage.removeItem('sp_token');
  }

  getToken() {
    if (!this.token) this.token = localStorage.getItem('sp_token');
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const text = await res.text();

    let json: ApiResponse<T> & { message?: string; success?: boolean };
    try {
      json = text ? JSON.parse(text) : { success: false, message: 'Empty response', data: null as T };
    } catch {
      const fallback = res.status === 429
        ? 'Too many requests. Please wait a moment and try again.'
        : text?.slice(0, 200) || `Request failed (${res.status})`;
      throw new Error(fallback);
    }

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Request failed');
    }

    return json;
  }

  // Auth
  login(emailOrStaffId: string, password: string) {
    return this.request<{ token: string; user: import('../types').Approver }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: emailOrStaffId.trim(), password }),
    });
  }

  getMe() {
    return this.request<import('../types').Approver>('/auth/me');
  }

  updatePreferences(data: Partial<import('../utils/userPreferences').UserPreferences>) {
    return this.request<import('../utils/userPreferences').UserPreferences>('/auth/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  updateNotificationPreferences(data: Partial<import('../utils/notificationPreferences').NotificationPreferences>) {
    return this.request<import('../utils/notificationPreferences').NotificationPreferences>(
      '/auth/me/notification-preferences',
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    );
  }

  logout() {
    return this.request<null>('/auth/logout', { method: 'POST' });
  }

  employeeLogin(staffId: string, password: string) {
    return this.request<{ token: string; user: import('../types').Approver }>('/auth/employee-login', {
      method: 'POST',
      body: JSON.stringify({ staffId, password }),
    });
  }

  changePassword(oldPassword: string, newPassword: string, confirmPassword: string) {
    return this.request<null>('/auth/me/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
    });
  }

  getUsers() {
    return this.request<import('../types').Approver[]>('/auth/users');
  }

  updateUser(id: string, data: Partial<Pick<import('../types').Approver, 'name' | 'department' | 'role' | 'active'>>) {
    return this.request<import('../types').Approver>(`/auth/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  resetUserPassword(id: string, newPassword: string, confirmPassword: string) {
    return this.request<import('../types').Approver>(`/auth/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword, confirmPassword }),
    });
  }

  createUser(staffId: string, role: import('../types').UserRole = 'employee') {
    return this.request<import('../types').Approver>('/auth/users', {
      method: 'POST',
      body: JSON.stringify({ staffId, role }),
    });
  }

  bulkUpdateUserRole(userIds: string[], role: import('../types').UserRole) {
    return this.request<import('../types').Approver[]>('/auth/users/bulk/role', {
      method: 'POST',
      body: JSON.stringify({ userIds, role }),
    });
  }

  bulkResetUserPassword(userIds: string[], newPassword = 'mapims', confirmPassword = 'mapims') {
    return this.request<import('../types').Approver[]>('/auth/users/bulk/reset-password', {
      method: 'POST',
      body: JSON.stringify({ userIds, newPassword, confirmPassword }),
    });
  }

  importUsers(users: Array<{ staffId?: string; staff_id?: string; employeeId?: string; role?: import('../types').UserRole }>) {
    return this.request<{ created: number; updated: number; failed: Array<{ staffId: string; error: string }> }>(
      '/auth/users/import',
      { method: 'POST', body: JSON.stringify({ users }) },
    );
  }

  // HRMS
  getEmployee(employeeId: string, phone?: string) {
    const qs = phone ? `?phone=${encodeURIComponent(phone)}` : '';
    return this.request<import('../types').Employee>(`/hrms/employee/${employeeId}${qs}`);
  }

  getEmployeeFast(employeeId: string) {
    return this.request<import('../types').Employee>(`/hrms/employee/${employeeId}?fast=1`);
  }

  getEmployeeLive(employeeId: string, phone?: string) {
    const params = new URLSearchParams({ live: '1' });
    if (phone) params.set('phone', phone);
    return this.request<import('../types').Employee>(`/hrms/employee/${employeeId}?${params}`);
  }

  getDepartments() {
    return this.request<Array<{ id: number; name: string }>>('/hrms/departments');
  }

  getDesignations(departmentId: string) {
    return this.request<Array<{ id: number; departmentId: number; name: string; shortName?: string }>>(
      `/hrms/designations?departmentId=${encodeURIComponent(departmentId)}`,
    );
  }

  // Forms
  getForms(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<import('../types').FormSchema[]>(`/forms${qs}`);
  }

  getForm(id: string) {
    return this.request<import('../types').FormSchema>(`/forms/${id}`);
  }

  saveForm(data: Record<string, unknown>) {
    return this.request<{ form: unknown; schema: import('../types').FormSchema }>('/form-builder', { method: 'POST', body: JSON.stringify(data) });
  }

  listBuilderForms() {
    return this.request<Array<{ formId: string; title: string; department: string; currentVersion: number; category?: string; slaHours?: number }>>('/form-builder');
  }

  getBuilderForm(id: string) {
    return this.request<{ metadata: Record<string, unknown>; schema: import('../types').FormSchema }>(`/form-builder/${id}`);
  }

  listFormVersions(formId: string) {
    return this.request<{
      formId: string;
      currentVersion: number;
      versions: Array<{ version: number; filename: string; publishedAt?: string; changelog?: string; isCurrent: boolean }>;
    }>(`/form-builder/${formId}/versions`);
  }

  getFormVersion(formId: string, version: number) {
    return this.request<{ metadata: Record<string, unknown>; version: number; isCurrent: boolean; schema: import('../types').FormSchema }>(
      `/form-builder/${formId}/versions/${version}`
    );
  }

  // Requests
  getRequests(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<import('../types').Request[]>(`/requests${qs}`);
  }

  getRequest(id: string) {
    return this.request<import('../types').Request>(`/requests/${id}`);
  }

  getEmployeeRequests(employeeId: string) {
    return this.request<import('../types').Request[]>(`/requests/employee/${employeeId}`);
  }

  createRequest(data: { employeeId: string; formId: string; answers: Record<string, unknown>; priority?: string; attachments?: import('../types').Attachment[] }) {
    return this.request<import('../types').Request>('/requests', { method: 'POST', body: JSON.stringify(data) });
  }

  updateQueueStatus(id: string, data: { queueStatus: string; assignedTo?: string; assignedToUserId?: string }) {
    return this.request<import('../types').Request>(`/requests/${id}/queue`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  assignRequest(id: string, staffIds: string | string[]) {
    const body = Array.isArray(staffIds) ? { staffIds } : { staffId: staffIds };
    return this.request<import('../types').Request>(`/requests/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  acceptProcessing(id: string, remarks?: string) {
    return this.request<import('../types').Request>(`/requests/${id}/accept-processing`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    });
  }

  getAssignedTasks() {
    return this.request<import('../types').MyTask[]>('/requests/assigned-to-me');
  }

  submitForReview(id: string, remarks: string) {
    return this.request<import('../types').Request>(`/requests/${id}/submit-for-review`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    });
  }

  confirmCompletion(id: string, remarks?: string) {
    return this.request<import('../types').Request>(`/requests/${id}/confirm-completion`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    });
  }

  sendBackForRework(id: string, remarks: string) {
    return this.request<import('../types').Request>(`/requests/${id}/send-back-rework`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    });
  }

  // Approvals
  getApprovals(status = 'pending') {
    return this.request<import('../types').Request[]>(`/approvals?status=${status}`);
  }

  getApprovalSummary() {
    return this.request<{
      pending: import('../types').Request[];
      approved: import('../types').Request[];
      rejected: import('../types').Request[];
      all: import('../types').Request[];
    }>('/approvals/summary');
  }

  approveRequest(id: string, remarks?: string) {
    return this.request<import('../types').Request>(`/approvals/${id}/approve`, { method: 'POST', body: JSON.stringify({ remarks }) });
  }

  rejectRequest(id: string, remarks?: string) {
    return this.request<import('../types').Request>(`/approvals/${id}/reject`, { method: 'POST', body: JSON.stringify({ remarks }) });
  }

  forwardRequest(id: string, staffId: string, remarks?: string) {
    return this.request<import('../types').Request>(`/approvals/${id}/forward`, {
      method: 'POST',
      body: JSON.stringify({ staffId, remarks }),
    });
  }

  requestInfo(id: string, remarks?: string) {
    return this.request<import('../types').Request>(`/approvals/${id}/request-info`, { method: 'POST', body: JSON.stringify({ remarks }) });
  }

  // Dashboard
  getDashboardStats() {
    return this.request<import('../types').DashboardStats>('/dashboard/stats');
  }

  getWeeklyChart() {
    return this.request<Array<{ day: string; submitted: number; approved: number; rejected: number; completed: number }>>('/dashboard/charts/weekly');
  }

  getStatusChart() {
    return this.request<Array<{ name: string; value: number; color: string }>>('/dashboard/charts/status');
  }

  getDepartmentChart() {
    return this.request<Array<{ dept: string; requests: number }>>('/dashboard/charts/department');
  }

  getRecentRequests(limit = 5) {
    return this.request<import('../types').Request[]>(`/dashboard/recent?limit=${limit}`);
  }

  // Search
  search(params: Record<string, string>) {
    const qs = new URLSearchParams(params).toString();
    return this.request<import('../types').Request[]>(`/search?${qs}`);
  }

  // Audit
  getAuditLogs(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<import('../types').AuditLog[]>(`/audit-logs${qs}`);
  }

  // Departments
  getPortalDepartments() {
    return this.request<Array<{ code: string; name: string; queueName?: string; icon?: string }>>('/departments');
  }

  getDepartmentQueue(code: string, status?: string) {
    const qs = status ? `?status=${status}` : '';
    return this.request<Array<Record<string, string>>>(`/departments/${code}/queue${qs}`);
  }

  // Notifications
  getNotifications() {
    return this.request<Array<Record<string, unknown>>>('/notifications');
  }

  // Settings
  getOrganizationSettings() {
    return this.request<import('../types').OrganizationSettings>('/settings/organization');
  }

  updateOrganizationSettings(data: import('../types').OrganizationSettings) {
    return this.request<import('../types').OrganizationSettings>('/settings/organization', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Upload
  async uploadFile(
    file: File,
    params: { formId: string; staffId: string; batchKey: string; fieldId?: string },
  ) {
    const formData = new FormData();
    formData.append('file', file);
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const query = new URLSearchParams({
      formId: params.formId,
      staffId: params.staffId,
      batchKey: params.batchKey,
    });
    if (params.fieldId) query.set('fieldId', params.fieldId);

    const res = await fetch(`${API_BASE}/upload?${query.toString()}`, {
      method: 'POST',
      body: formData,
      headers,
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Upload failed');
    return json;
  }
}

export const api = new ApiClient();
