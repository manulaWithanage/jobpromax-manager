export interface KPI {
    label: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    subtext?: string;
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

export const kpiData: KPI[] = [
    {
        label: 'Overall Completion',
        value: '65%',
        trend: 'up',
        subtext: 'vs 60% last week',
    },
    {
        label: 'Current Sprint',
        value: 'Sprint 4',
        subtext: '3 Days Left',
    },
    {
        label: 'Velocity',
        value: '14 pts',
        change: '+12%',
        trend: 'up',
        subtext: 'Avg: 12.5 pts',
    },
];

export const tasks: Task[] = [
    {
        id: '1',
        name: 'Integrate Stripe Payments',
        assignee: 'Alice M.',
        status: 'In Progress',
        dueDate: '2024-10-25',
        priority: 'High',
    },
    {
        id: '2',
        name: 'User Profile Redesign',
        assignee: 'Bob D.',
        status: 'In Review',
        dueDate: '2024-10-24',
        priority: 'Medium',
    },
    {
        id: '3',
        name: 'Fix Mobile Navigation Bug',
        assignee: 'Charlie',
        status: 'Blocked',
        dueDate: '2024-10-22',
        priority: 'High',
    },
    {
        id: '4',
        name: 'Opt-in Email Flow',
        assignee: 'Dana S.',
        status: 'In Progress',
        dueDate: '2024-10-26',
        priority: 'Low',
    },
    {
        id: '5',
        name: 'Update API Documentation',
        assignee: 'Eve L.',
        status: 'Blocked',
        dueDate: '2024-10-21',
        priority: 'Medium',
    },
];

export const pipelineItems: PipelineItem[] = [
    {
        id: '101',
        title: 'Dark Mode Support',
        estEffort: '5 Days',
        priority: 'Medium',
        type: 'Incoming',
    },
    {
        id: '102',
        title: 'Audit Logs for Admins',
        estEffort: '8 Days',
        priority: 'High',
        type: 'Incoming',
    },
    {
        id: '201',
        title: 'AI Chatbot Integration',
        requester: 'Sales Team',
        dateAdded: '2024-09-15',
        type: 'Wishlist',
    },
    {
        id: '202',
        title: 'Mobile App Wrapper',
        requester: 'CEO',
        dateAdded: '2024-10-01',
        type: 'Wishlist',
    },
];

export const featureStatusData: FeatureStatus[] = [
    {
        id: 'f1',
        name: 'User Authentication',
        status: 'operational',
        publicNote: 'Systems normal.',
        linkedTicket: null
    },
    {
        id: 'f2',
        name: 'Payment Gateway',
        status: 'degraded',
        publicNote: 'Experiencing intermittent latency with Stripe API.',
        linkedTicket: 'BUG-102'
    },
    {
        id: 'f3',
        name: 'Email Notifications',
        status: 'critical',
        publicNote: 'Email service provider is down. No emails are being sent.',
        linkedTicket: 'INC-404'
    },
    {
        id: 'f4',
        name: 'Reporting Engine',
        status: 'operational',
        publicNote: 'All reports generating correctly.',
        linkedTicket: null
    },
    {
        id: 'f5',
        name: 'API Rate Limiting',
        status: 'operational',
        publicNote: ' functioning as expected.',
        linkedTicket: null
    },
    {
        id: 'f6',
        name: 'Search Indexing',
        status: 'degraded',
        publicNote: 'Re-indexing is slower than usual due to high load.',
        linkedTicket: 'PERF-201'
    }
];

export const roadmapData: RoadmapPhase[] = [
    {
        id: 'p1',
        phase: 'Phase 1',
        date: 'Q3 2024',
        title: 'Core Platform Foundation',
        description: 'Establishing the secure, scalable backend and basic user management features.',
        status: 'completed',
        deliverables: [
            { text: 'User Authentication (SSO)', status: 'done' },
            { text: 'Database Schema Design', status: 'done' },
            { text: 'API Gateway Setup', status: 'done' },
            { text: 'Cloud Infrastructure (AWS)', status: 'done' },
        ],
    },
    {
        id: 'p2',
        phase: 'Phase 2',
        date: 'Q4 2024',
        title: 'Interactive Dashboard MVP',
        description: 'Enabling real-time data visualization and basic reporting for leadership.',
        status: 'current',
        health: 'on-track',
        deliverables: [
            { text: 'Real-time KPI Cards', status: 'done' },
            { text: 'Burn-up & Velocity Charts', status: 'done' },
            { text: 'Task Management View', status: 'in-progress' },
            { text: 'Email Notifications', status: 'pending' },
        ],
    },
    {
        id: 'p3',
        phase: 'Phase 3',
        date: 'Q1 2025',
        title: 'Collaboration & workflows',
        description: 'Advanced features for team collaboration and automated workflow triggers.',
        status: 'upcoming',
        deliverables: [
            { text: 'Comments & Mentions', status: 'pending' },
            { text: 'Slack Integration', status: 'pending' },
            { text: 'Custom Report Builder', status: 'pending' },
            { text: 'Role-based Access Control', status: 'pending' },
        ],
    },
    {
        id: 'p4',
        phase: 'Phase 4',
        date: 'Q2 2025',
        title: 'Intelligence & Automation',
        description: 'Leveraging AI to predict delays and optimize resource allocation.',
        status: 'upcoming',
        deliverables: [
            { text: 'AI Risk Prediction', status: 'pending' },
            { text: 'Automated Sprint Planning', status: 'pending' },
            { text: 'Natural Language Search', status: 'pending' },
        ],
    },
];

export const burnUpData: ChartDataPoint[] = [
    { name: 'Week 1', completed: 10, scope: 100 },
    { name: 'Week 2', completed: 25, scope: 105 },
    { name: 'Week 3', completed: 45, scope: 105 },
    { name: 'Week 4', completed: 65, scope: 110 },
    { name: 'Week 5', completed: 80, scope: 115 }, // Projected
];

export const velocityData: ChartDataPoint[] = [
    { name: 'Sprint 1', completed: 12 },
    { name: 'Sprint 2', completed: 15 },
    { name: 'Sprint 3', completed: 10 },
    { name: 'Sprint 4', completed: 14 },
];
