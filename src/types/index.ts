export interface KPI {
    label: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    subtext?: string;
}

export interface BankDetails {
    accountName: string;
    bankName: string;
    accountNumber: string;
    branchName?: string;
    branchCode?: string;
    country?: string;
    currency?: string;
    notes?: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'manager' | 'developer' | 'leadership' | 'finance';
    isSuperAdmin?: boolean;
    hourlyRate?: number;
    department?: 'Frontend' | 'Backend' | 'Marketing' | 'Customer Success' | 'Management';
    dailyHoursTarget?: number;
    bankDetails?: BankDetails;
}

export interface Task {
    id: string;
    name: string;
    assignee: string;
    status: 'In Progress' | 'In Review' | 'Blocked' | 'Done';
    dueDate: string;
    priority?: 'High' | 'Medium' | 'Low';
}

export interface PipelineItem {
    id: string;
    title: string;
    requester?: string;
    estEffort?: string;
    priority?: 'High' | 'Medium' | 'Low';
    dateAdded?: string;
    type: 'Incoming' | 'Wishlist';
}

export interface Deliverable {
    text: string;
    status: 'done' | 'pending' | 'in-progress';
}

export interface RoadmapPhase {
    id: string;
    phase: string;
    date: string;
    title: string;
    description: string;
    status: 'completed' | 'current' | 'upcoming';
    health?: 'on-track' | 'at-risk' | 'delayed';
    deliverables: Deliverable[];
}

export interface FeatureStatus {
    id: string;
    name: string;
    status: 'operational' | 'degraded' | 'critical';
    publicNote: string;
    linkedTicket?: string | null;
}

export interface ChartDataPoint {
    name: string;
    completed: number;
    scope?: number;
}

export interface IncidentNote {
    id: string;
    note: string;
    author: string;
    createdAt: string;
}

export interface IncidentReport {
    id: string;
    featureId?: string;
    reporterName: string;
    impactLevel: 'high' | 'medium' | 'low';
    description: string;
    status: 'pending' | 'acknowledged' | 'addressed';
    createdAt: string;
    adminNotes: IncidentNote[];
}

export interface TimeLog {
    id: string;
    userId: string;
    userName: string;
    userRole: User['role'];
    date: string; // ISO Date (YYYY-MM-DD)
    hours: number;
    summary: string;
    jiraTickets: string[];
    workType: 'feature' | 'bug' | 'refactor' | 'testing' | 'documentation' | 'planning' | 'review' | 'meeting' | 'content' | 'campaign' | 'analytics' | 'other';
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    managerComment?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Timesheet {
    userId: string;
    userName: string;
    weekStarting: string;
    totalHours: number;
    logs: TimeLog[];
}
