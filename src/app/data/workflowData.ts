export type WFStatus =
  | 'submitted'
  | 'pending_approval'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'rejected';

export type WFPriority = 'critical' | 'high' | 'medium' | 'low';

export interface WFStep {
  id: string;
  label: string;
  status: 'done' | 'active' | 'pending' | 'rejected';
  actor?: string;
  role?: string;
  completedAt?: string;
  comment?: string;
}

export interface WFComment {
  id: string;
  author: string;
  role: string;
  initials: string;
  color: string;
  text: string;
  timestamp: string;
  type: 'comment' | 'action' | 'system';
}

export interface WFRequest {
  id: string;
  requestNumber: string;
  formTitle: string;
  category: string;
  categoryIcon: string;
  employeeName: string;
  employeeId: string;
  employeeDept: string;
  employeeDesignation: string;
  employeeInitials: string;
  employeeColor: string;
  status: WFStatus;
  priority: WFPriority;
  submittedAt: string;
  dueAt: string;
  slaHours: number;
  steps: WFStep[];
  currentStep: number;
  commentsCount: number;
  attachmentsCount: number;
  assignedTo?: string;
  assignedInitials?: string;
  watchers: string[];
  tags: string[];
  branch: string;
  comments: WFComment[];
  answers: Record<string, string>;
  isNew?: boolean;
  isOverdue?: boolean;
}

const NOW = new Date();
const ago = (h: number) => new Date(NOW.getTime() - h * 3600000).toISOString();
const from = (h: number) => new Date(NOW.getTime() + h * 3600000).toISOString();

export const WORKFLOW_REQUESTS: WFRequest[] = [
  /* ── SUBMITTED ─────────────────────────────────────────────── */
  {
    id: 'wf-s1',
    requestNumber: 'REQ-2026-0041',
    formTitle: 'IT Asset Request',
    category: 'IT Services',
    categoryIcon: 'Monitor',
    employeeName: 'Kavya Menon',
    employeeId: 'EMP019',
    employeeDept: 'Radiology',
    employeeDesignation: 'Radiologist',
    employeeInitials: 'KM',
    employeeColor: '#7C3AED',
    status: 'submitted',
    priority: 'high',
    submittedAt: ago(0.5),
    dueAt: from(23.5),
    slaHours: 24,
    currentStep: 1,
    commentsCount: 0,
    attachmentsCount: 0,
    assignedTo: undefined,
    assignedInitials: undefined,
    watchers: ['Rajesh Kumar'],
    tags: ['hardware', 'workstation'],
    branch: 'Main Hospital',
    isNew: true,
    answers: { assets_required: 'Laptop, Monitor', justification: 'New workstation for PACS system access' },
    steps: [
      { id: 's1', label: 'HOD Approval', status: 'active', role: 'HOD – Radiology' },
      { id: 's2', label: 'IT Procurement', status: 'pending', role: 'IT Team' },
      { id: 's3', label: 'Asset Tagging', status: 'pending', role: 'IT Team' },
    ],
    comments: [
      { id: 'c1', author: 'System', role: 'Automated', initials: 'SY', color: '#64748B', text: 'Request submitted and routed to HOD for approval.', timestamp: ago(0.5), type: 'system' },
    ],
  },
  {
    id: 'wf-s2',
    requestNumber: 'REQ-2026-0042',
    formTitle: 'Official Email ID Request',
    category: 'IT Services',
    categoryIcon: 'Mail',
    employeeName: 'Dr. Priya Nambiar',
    employeeId: 'EMP022',
    employeeDept: 'Cardiology',
    employeeDesignation: 'Consultant Cardiologist',
    employeeInitials: 'PN',
    employeeColor: '#0891B2',
    status: 'submitted',
    priority: 'medium',
    submittedAt: ago(2),
    dueAt: from(22),
    slaHours: 24,
    currentStep: 1,
    commentsCount: 1,
    attachmentsCount: 0,
    watchers: [],
    tags: ['email', 'new-joiner'],
    branch: 'Main Hospital',
    isNew: true,
    answers: { email_prefix: 'priya.nambiar', group: 'Cardiology Team', quota: '50gb' },
    steps: [
      { id: 's1', label: 'HOD Approval', status: 'active', role: 'HOD – Cardiology' },
      { id: 's2', label: 'IT Setup', status: 'pending', role: 'IT Team' },
    ],
    comments: [
      { id: 'c1', author: 'System', role: 'Automated', initials: 'SY', color: '#64748B', text: 'Routed to Dr. Sunil HOD – Cardiology.', timestamp: ago(2), type: 'system' },
      { id: 'c2', author: 'HR Team', role: 'HR', initials: 'HR', color: '#7C3AED', text: 'New joiner onboarding — please expedite.', timestamp: ago(1.5), type: 'comment' },
    ],
  },

  /* ── PENDING APPROVAL ───────────────────────────────────────── */
  {
    id: 'wf-p1',
    requestNumber: 'REQ-2026-0037',
    formTitle: 'Leave Application',
    category: 'HR Services',
    categoryIcon: 'CalendarOff',
    employeeName: 'Arjun Sharma',
    employeeId: 'EMP001',
    employeeDept: 'Information Technology',
    employeeDesignation: 'Senior Software Engineer',
    employeeInitials: 'AS',
    employeeColor: '#2563EB',
    status: 'pending_approval',
    priority: 'medium',
    submittedAt: ago(18),
    dueAt: from(6),
    slaHours: 24,
    currentStep: 1,
    commentsCount: 2,
    attachmentsCount: 0,
    assignedTo: 'Rajesh Kumar',
    assignedInitials: 'RK',
    watchers: ['Priya Patel'],
    tags: ['casual-leave', '2 days'],
    branch: 'Head Office',
    answers: { leave_type: 'Casual Leave', from_date: '2026-06-24', to_date: '2026-06-25', reason: 'Personal work at home town — family function' },
    steps: [
      { id: 's1', label: 'HOD Approval', status: 'active', actor: 'Rajesh Kumar', role: 'HOD – IT' },
      { id: 's2', label: 'HR Processing', status: 'pending', role: 'HR Team' },
    ],
    comments: [
      { id: 'c1', author: 'System', role: 'Automated', initials: 'SY', color: '#64748B', text: 'Routed to Rajesh Kumar (HOD – IT).', timestamp: ago(18), type: 'system' },
      { id: 'c2', author: 'Rajesh Kumar', role: 'HOD – IT', initials: 'RK', color: '#2563EB', text: 'Reviewing — will respond by EOD.', timestamp: ago(4), type: 'comment' },
    ],
  },
  {
    id: 'wf-p2',
    requestNumber: 'REQ-2026-0038',
    formTitle: 'WiFi / Network Access',
    category: 'IT Services',
    categoryIcon: 'Wifi',
    employeeName: 'Rahul Gupta',
    employeeId: 'EMP003',
    employeeDept: 'Finance',
    employeeDesignation: 'Finance Analyst',
    employeeInitials: 'RG',
    employeeColor: '#059669',
    status: 'pending_approval',
    priority: 'low',
    submittedAt: ago(6),
    dueAt: from(42),
    slaHours: 48,
    currentStep: 1,
    commentsCount: 0,
    attachmentsCount: 1,
    assignedTo: 'Suresh Mehta',
    assignedInitials: 'SM',
    watchers: [],
    tags: ['vpn', 'remote-work'],
    branch: 'Pune Office',
    answers: { access_type: 'VPN Access', device_type: 'Company Laptop', reason: 'Work from home — permanent basis' },
    steps: [
      { id: 's1', label: 'HOD Approval', status: 'active', actor: 'Suresh Mehta', role: 'HOD – Finance' },
      { id: 's2', label: 'IT Processing', status: 'pending', role: 'IT Team' },
    ],
    comments: [],
  },
  {
    id: 'wf-p3',
    requestNumber: 'REQ-2026-0036',
    formTitle: 'Salary / Travel Advance',
    category: 'Finance Services',
    categoryIcon: 'IndianRupee',
    employeeName: 'Dr. Sneha Reddy',
    employeeId: 'EMP004',
    employeeDept: 'Operations',
    employeeDesignation: 'Operations Manager',
    employeeInitials: 'SR',
    employeeColor: '#DC2626',
    status: 'pending_approval',
    priority: 'high',
    submittedAt: ago(26),
    dueAt: ago(2),
    slaHours: 24,
    currentStep: 2,
    commentsCount: 3,
    attachmentsCount: 2,
    assignedTo: 'Vikram Singh',
    assignedInitials: 'VS',
    watchers: ['Finance Team'],
    tags: ['₹25,000', 'travel'],
    branch: 'Hyderabad Office',
    isOverdue: true,
    answers: { advance_type: 'Travel Advance', amount: '25000', repayment: '2 months', purpose: 'Client meeting in Bangalore' },
    steps: [
      { id: 's1', label: 'HOD Approval', status: 'done', actor: 'Vikram Singh', role: 'HOD – Ops', completedAt: ago(20) },
      { id: 's2', label: 'Finance Approval', status: 'active', role: 'Finance Team' },
      { id: 's3', label: 'Disbursement', status: 'pending', role: 'Finance Team' },
    ],
    comments: [
      { id: 'c1', author: 'System', role: 'Automated', initials: 'SY', color: '#64748B', text: 'Routed for approval.', timestamp: ago(26), type: 'system' },
      { id: 'c2', author: 'Vikram Singh', role: 'HOD – Ops', initials: 'VS', color: '#DC2626', text: 'Approved. Travel is for official client engagement.', timestamp: ago(20), type: 'action' },
      { id: 'c3', author: 'Finance Team', role: 'Reviewer', initials: 'FT', color: '#059669', text: 'Amount under review — checking travel policy limits.', timestamp: ago(6), type: 'comment' },
    ],
  },
  {
    id: 'wf-p4',
    requestNumber: 'REQ-2026-0039',
    formTitle: 'Miss Punch Correction',
    category: 'HR Services',
    categoryIcon: 'Clock',
    employeeName: 'Mohit Jain',
    employeeId: 'EMP005',
    employeeDept: 'Marketing',
    employeeDesignation: 'Marketing Specialist',
    employeeInitials: 'MJ',
    employeeColor: '#D97706',
    status: 'pending_approval',
    priority: 'low',
    submittedAt: ago(8),
    dueAt: from(0.5),
    slaHours: 8,
    currentStep: 1,
    commentsCount: 1,
    attachmentsCount: 0,
    assignedTo: 'Kavita Nair',
    assignedInitials: 'KN',
    watchers: [],
    tags: ['punch-out', '2026-06-18'],
    branch: 'Delhi Office',
    isOverdue: true,
    answers: { date: '2026-06-18', punch_type: 'Punch Out', actual_time: '19:30', reason: 'Device malfunction at gate' },
    steps: [
      { id: 's1', label: 'Manager Approval', status: 'active', actor: 'Kavita Nair', role: 'Marketing Manager' },
    ],
    comments: [
      { id: 'c1', author: 'Mohit Jain', role: 'Employee', initials: 'MJ', color: '#D97706', text: 'CCTV footage confirms exit at 19:30. Please check recording.', timestamp: ago(7), type: 'comment' },
    ],
  },

  /* ── APPROVED ───────────────────────────────────────────────── */
  {
    id: 'wf-a1',
    requestNumber: 'REQ-2026-0033',
    formTitle: 'WiFi / Network Access',
    category: 'IT Services',
    categoryIcon: 'Wifi',
    employeeName: 'Priya Patel',
    employeeId: 'EMP002',
    employeeDept: 'Human Resources',
    employeeDesignation: 'HR Manager',
    employeeInitials: 'PP',
    employeeColor: '#7C3AED',
    status: 'approved',
    priority: 'medium',
    submittedAt: ago(30),
    dueAt: from(18),
    slaHours: 48,
    currentStep: 2,
    commentsCount: 2,
    attachmentsCount: 0,
    assignedTo: 'Deepak Nair',
    assignedInitials: 'DN',
    watchers: [],
    tags: ['office-wifi'],
    branch: 'Head Office',
    answers: { access_type: 'Office WiFi', device_type: 'Personal Laptop', reason: 'Secondary device for HR portal access' },
    steps: [
      { id: 's1', label: 'HOD Approval', status: 'done', actor: 'Anita Verma', role: 'HOD – HR', completedAt: ago(24), comment: 'Approved for secondary device.' },
      { id: 's2', label: 'IT Processing', status: 'active', role: 'IT Team', actor: 'Deepak Nair' },
    ],
    comments: [
      { id: 'c1', author: 'Anita Verma', role: 'HOD – HR', initials: 'AV', color: '#7C3AED', text: 'Approved. Standard access policy applies.', timestamp: ago(24), type: 'action' },
    ],
  },
  {
    id: 'wf-a2',
    requestNumber: 'REQ-2026-0034',
    formTitle: 'Leave Application',
    category: 'HR Services',
    categoryIcon: 'CalendarOff',
    employeeName: 'Dr. Arun Krishnan',
    employeeId: 'EMP011',
    employeeDept: 'Neurology',
    employeeDesignation: 'Senior Neurologist',
    employeeInitials: 'AK',
    employeeColor: '#0891B2',
    status: 'approved',
    priority: 'high',
    submittedAt: ago(20),
    dueAt: from(4),
    slaHours: 24,
    currentStep: 2,
    commentsCount: 1,
    attachmentsCount: 1,
    assignedTo: 'HR Team',
    assignedInitials: 'HR',
    watchers: [],
    tags: ['sick-leave', '3 days'],
    branch: 'Main Hospital',
    answers: { leave_type: 'Sick Leave', from_date: '2026-06-20', to_date: '2026-06-22', reason: 'Acute vertigo — doctor\'s certificate attached' },
    steps: [
      { id: 's1', label: 'HOD Approval', status: 'done', actor: 'Dr. Meena Iyer', role: 'HOD – Neurology', completedAt: ago(16), comment: 'Approved with well-wishes.' },
      { id: 's2', label: 'HR Processing', status: 'active', role: 'HR Team' },
    ],
    comments: [
      { id: 'c1', author: 'Dr. Meena Iyer', role: 'HOD – Neurology', initials: 'MI', color: '#0891B2', text: 'Approved. Hope for a speedy recovery.', timestamp: ago(16), type: 'action' },
    ],
  },

  /* ── PROCESSING ─────────────────────────────────────────────── */
  {
    id: 'wf-pr1',
    requestNumber: 'REQ-2026-0029',
    formTitle: 'Official Email ID Request',
    category: 'IT Services',
    categoryIcon: 'Mail',
    employeeName: 'Sonal Shah',
    employeeId: 'EMP009',
    employeeDept: 'Pharmacy',
    employeeDesignation: 'Chief Pharmacist',
    employeeInitials: 'SS',
    employeeColor: '#059669',
    status: 'processing',
    priority: 'critical',
    submittedAt: ago(36),
    dueAt: ago(12),
    slaHours: 24,
    currentStep: 2,
    commentsCount: 4,
    attachmentsCount: 1,
    assignedTo: 'Deepak Nair',
    assignedInitials: 'DN',
    watchers: ['Rajesh Kumar', 'HR Team'],
    tags: ['critical', 'head-of-dept'],
    branch: 'Main Hospital',
    isOverdue: true,
    answers: { email_prefix: 'sonal.shah', role: 'Chief Pharmacist', quota: '100gb', group: 'Medical Leadership' },
    steps: [
      { id: 's1', label: 'HOD Approval', status: 'done', actor: 'Admin', role: 'Admin', completedAt: ago(34) },
      { id: 's2', label: 'IT Setup', status: 'active', actor: 'Deepak Nair', role: 'IT Team' },
      { id: 's3', label: 'Account Activation', status: 'pending', role: 'IT Team' },
    ],
    comments: [
      { id: 'c1', author: 'Deepak Nair', role: 'IT Team', initials: 'DN', color: '#2563EB', text: 'Mail server config in progress. ETA 2 hours.', timestamp: ago(3), type: 'comment' },
    ],
  },
  {
    id: 'wf-pr2',
    requestNumber: 'REQ-2026-0031',
    formTitle: 'IT Asset Request',
    category: 'IT Services',
    categoryIcon: 'Monitor',
    employeeName: 'Kiran Reddy',
    employeeId: 'EMP007',
    employeeDept: 'Cardiology',
    employeeDesignation: 'Cardiac Technologist',
    employeeInitials: 'KR',
    employeeColor: '#DC2626',
    status: 'processing',
    priority: 'high',
    submittedAt: ago(48),
    dueAt: ago(24),
    slaHours: 24,
    currentStep: 2,
    commentsCount: 2,
    attachmentsCount: 2,
    assignedTo: 'Deepak Nair',
    assignedInitials: 'DN',
    watchers: [],
    tags: ['ecg-workstation', 'urgent'],
    branch: 'Main Hospital',
    isOverdue: true,
    answers: { assets: 'ECG Workstation, Printer', justification: 'ECG dept expansion — 2 new cardiologists joining' },
    steps: [
      { id: 's1', label: 'HOD Approval', status: 'done', actor: 'Dr. Sunil', role: 'HOD – Cardiology', completedAt: ago(46) },
      { id: 's2', label: 'Procurement', status: 'active', actor: 'Deepak Nair', role: 'IT Team' },
      { id: 's3', label: 'Installation', status: 'pending', role: 'IT Team' },
    ],
    comments: [
      { id: 'c1', author: 'Deepak Nair', role: 'IT', initials: 'DN', color: '#2563EB', text: 'Asset procurement order placed. Delivery in 3 days.', timestamp: ago(20), type: 'comment' },
    ],
  },

  /* ── COMPLETED ──────────────────────────────────────────────── */
  {
    id: 'wf-c1',
    requestNumber: 'REQ-2026-0025',
    formTitle: 'Salary / Travel Advance',
    category: 'Finance Services',
    categoryIcon: 'IndianRupee',
    employeeName: 'Dr. Sneha Reddy',
    employeeId: 'EMP004',
    employeeDept: 'Operations',
    employeeDesignation: 'Operations Manager',
    employeeInitials: 'SR',
    employeeColor: '#DC2626',
    status: 'completed',
    priority: 'high',
    submittedAt: ago(96),
    dueAt: ago(24),
    slaHours: 72,
    currentStep: 3,
    commentsCount: 4,
    attachmentsCount: 3,
    assignedTo: 'Kiran Reddy',
    assignedInitials: 'KR',
    watchers: [],
    tags: ['₹30,000', 'disbursed'],
    branch: 'Hyderabad Office',
    answers: { advance_type: 'Travel Advance', amount: '30000', purpose: 'Medical conference — Mumbai' },
    steps: [
      { id: 's1', label: 'HOD Approval', status: 'done', actor: 'Vikram Singh', completedAt: ago(90) },
      { id: 's2', label: 'Finance Approval', status: 'done', actor: 'Finance Team', completedAt: ago(60) },
      { id: 's3', label: 'Disbursement', status: 'done', actor: 'Kiran Reddy', completedAt: ago(36), comment: '₹30,000 credited to account ending 7821.' },
    ],
    comments: [
      { id: 'c1', author: 'Kiran Reddy', role: 'Finance', initials: 'KR', color: '#059669', text: 'Amount of ₹30,000 credited successfully.', timestamp: ago(36), type: 'action' },
    ],
  },
  {
    id: 'wf-c2',
    requestNumber: 'REQ-2026-0026',
    formTitle: 'Leave Application',
    category: 'HR Services',
    categoryIcon: 'CalendarOff',
    employeeName: 'Mohit Jain',
    employeeId: 'EMP005',
    employeeDept: 'Marketing',
    employeeDesignation: 'Marketing Specialist',
    employeeInitials: 'MJ',
    employeeColor: '#D97706',
    status: 'completed',
    priority: 'low',
    submittedAt: ago(72),
    dueAt: ago(48),
    slaHours: 24,
    currentStep: 2,
    commentsCount: 2,
    attachmentsCount: 0,
    watchers: [],
    tags: ['earned-leave', '5 days'],
    branch: 'Delhi Office',
    answers: { leave_type: 'Earned Leave', from_date: '2026-06-10', to_date: '2026-06-14', reason: 'Annual family vacation' },
    steps: [
      { id: 's1', label: 'Manager Approval', status: 'done', actor: 'Kavita Nair', completedAt: ago(68) },
      { id: 's2', label: 'HR Processing', status: 'done', actor: 'HR Team', completedAt: ago(64) },
    ],
    comments: [],
  },

  /* ── REJECTED ───────────────────────────────────────────────── */
  {
    id: 'wf-r1',
    requestNumber: 'REQ-2026-0035',
    formTitle: 'Miss Punch Correction',
    category: 'HR Services',
    categoryIcon: 'Clock',
    employeeName: 'Rahul Gupta',
    employeeId: 'EMP003',
    employeeDept: 'Finance',
    employeeDesignation: 'Finance Analyst',
    employeeInitials: 'RG',
    employeeColor: '#059669',
    status: 'rejected',
    priority: 'low',
    submittedAt: ago(40),
    dueAt: ago(16),
    slaHours: 24,
    currentStep: 1,
    commentsCount: 2,
    attachmentsCount: 0,
    watchers: [],
    tags: ['punch-in', 'rejected'],
    branch: 'Pune Office',
    answers: { date: '2026-06-16', punch_type: 'Punch In', reason: 'Forgot to swipe in' },
    steps: [
      { id: 's1', label: 'Manager Approval', status: 'rejected', actor: 'Suresh Mehta', role: 'HOD – Finance', completedAt: ago(36), comment: 'Third consecutive miss punch request — please follow process.' },
    ],
    comments: [
      { id: 'c1', author: 'Suresh Mehta', role: 'HOD – Finance', initials: 'SM', color: '#DC2626', text: 'Third consecutive miss punch. Please ensure compliance going forward.', timestamp: ago(36), type: 'action' },
    ],
  },
];

/* ── Column metadata ─────────────────────────────────────────── */
export interface ColumnConfig {
  status: WFStatus;
  label: string;
  accent: string;
  trackBg: string;
  headerBg: string;
  badgeBg: string;
  badgeText: string;
  iconName: string;
}

export const COLUMNS: ColumnConfig[] = [
  {
    status: 'submitted',
    label: 'Submitted',
    accent: '#2563EB',
    trackBg: 'bg-blue-50/80 dark:bg-blue-950/30',
    headerBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeBg: 'bg-blue-100 dark:bg-blue-900',
    badgeText: 'text-blue-700 dark:text-blue-300',
    iconName: 'Send',
  },
  {
    status: 'pending_approval',
    label: 'Pending Approval',
    accent: '#D97706',
    trackBg: 'bg-amber-50/80 dark:bg-amber-950/30',
    headerBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeBg: 'bg-amber-100 dark:bg-amber-900',
    badgeText: 'text-amber-700 dark:text-amber-300',
    iconName: 'Clock',
  },
  {
    status: 'approved',
    label: 'Approved',
    accent: '#059669',
    trackBg: 'bg-emerald-50/80 dark:bg-emerald-950/30',
    headerBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    iconName: 'CheckCircle',
  },
  {
    status: 'processing',
    label: 'Processing',
    accent: '#7C3AED',
    trackBg: 'bg-purple-50/80 dark:bg-purple-950/30',
    headerBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeBg: 'bg-purple-100 dark:bg-purple-900',
    badgeText: 'text-purple-700 dark:text-purple-300',
    iconName: 'Loader2',
  },
  {
    status: 'completed',
    label: 'Completed',
    accent: '#0D9488',
    trackBg: 'bg-teal-50/80 dark:bg-teal-950/30',
    headerBg: 'bg-teal-50 dark:bg-teal-950/40',
    badgeBg: 'bg-teal-100 dark:bg-teal-900',
    badgeText: 'text-teal-700 dark:text-teal-300',
    iconName: 'CheckSquare',
  },
  {
    status: 'rejected',
    label: 'Rejected',
    accent: '#DC2626',
    trackBg: 'bg-red-50/80 dark:bg-red-950/30',
    headerBg: 'bg-red-50 dark:bg-red-950/40',
    badgeBg: 'bg-red-100 dark:bg-red-900',
    badgeText: 'text-red-700 dark:text-red-300',
    iconName: 'XCircle',
  },
];

export const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: '#DC2626', bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-700 dark:text-red-400', border: 'border-l-red-500' },
  high:     { label: 'High',     color: '#D97706', bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-400', border: 'border-l-amber-500' },
  medium:   { label: 'Medium',   color: '#2563EB', bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-400', border: 'border-l-blue-400' },
  low:      { label: 'Low',      color: '#94A3B8', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-l-slate-300' },
};
