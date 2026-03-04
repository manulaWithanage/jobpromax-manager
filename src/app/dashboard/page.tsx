"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TrendingUp, Calendar, Zap, AlertCircle, Search, Bell, RefreshCw, CheckCircle, Users, Clock, Trophy, Sparkles, MessageSquarePlus, Bug, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { useProject } from "@/context/ProjectContext";
import { useRole } from "@/context/RoleContext";
import { useTimeLog } from "@/context/TimeLogContext";
import { KPI } from "@/types";
import { useEffect, useState, useMemo } from "react";
import { api } from "@/services/api";
import { getDeveloperDashboardMetrics, DeveloperDashboardMetrics } from "@/lib/actions/dashboard";
import { ReportIssueModal } from "@/components/features/ReportIssueModal";
import { useReport } from "@/context/ReportContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const { users, roadmap, isLoading, refreshData } = useProject();
    const { role, isAdmin, isOperation } = useRole();
    const { logs } = useTimeLog();
    const { reports } = useReport();
    const router = useRouter();

    const [kpiData, setKpiData] = useState<KPI[]>([]);

    // Developer specific state
    const [devMetrics, setDevMetrics] = useState<DeveloperDashboardMetrics | null>(null);
    const [isDevMetricsLoading, setIsDevMetricsLoading] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);

    const activeReportCount = reports.filter(r => r.status !== 'addressed').length;

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                if (role === 'developer') {
                    setIsDevMetricsLoading(true);
                    const devData = await getDeveloperDashboardMetrics();
                    setDevMetrics(devData);
                    setIsDevMetricsLoading(false);
                } else {
                    const [kpis] = await Promise.all([
                        api.getKPIs()
                    ]);
                    if (kpis) setKpiData(kpis);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard metrics", error);
                setIsDevMetricsLoading(false);
            }
        };

        if (role) {
            fetchDashboardData();
        }
    }, [role]);

    // --- Dynamic Calculations (Managers Only) ---
    const activeTeamMembers = users.filter(u => !['leadership', 'finance'].includes(u.role));

    // 1. MVP of the Month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthLogs = logs.filter(log => {
        const logDate = new Date(log.date);
        return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear && log.status === 'approved';
    });

    const pendingMonthLogs = logs.filter(log => {
        const logDate = new Date(log.date);
        return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear && log.status === 'pending';
    });
    const pendingHours = pendingMonthLogs.reduce((acc, log) => acc + log.hours, 0);

    const userHours: Record<string, number> = {};
    currentMonthLogs.forEach(log => {
        userHours[log.userId] = (userHours[log.userId] || 0) + log.hours;
    });

    let topUserId = '';
    let maxHours = 0;
    Object.entries(userHours).forEach(([userId, hours]) => {
        if (hours > maxHours) {
            maxHours = hours;
            topUserId = userId;
        }
    });

    const mvpUser = topUserId ? activeTeamMembers.find(u => u.id === topUserId) : null;

    // 2. Team by Department
    const departmentCounts: Record<string, number> = {};
    activeTeamMembers.forEach(user => {
        const depts = (user as any).departments || (user.department ? [user.department] : ['Unassigned']);
        if (depts.length === 0) depts.push('Unassigned');
        depts.forEach((dept: string) => {
            departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
        });
    });

    const sortedDepartments = Object.entries(departmentCounts).sort((a, b) => b[1] - a[1]);

    // 3. Active Roadmap Phases
    const activePhases = roadmap.filter(phase => phase.status === 'current');

    // 4. Analytics & Charts
    const [selectedCategory, setSelectedCategory] = useState<'Development' | 'Management' | 'Marketing'>('Development');

    const CATEGORY_CONFIG = {
        Development: {
            departments: ['Frontend', 'Backend', 'Infrastructure', 'Frontend Development', 'Backend Development'],
            workTypes: ['feature', 'bug', 'refactor', 'testing', 'documentation'],
            colors: {
                feature: '#3b82f6',
                bug: '#ef4444',
                refactor: '#f59e0b',
                testing: '#8b5cf6',
                documentation: '#10b981'
            },
            labels: {
                feature: 'Feature',
                bug: 'Bug Fix',
                refactor: 'Refactor',
                testing: 'Testing',
                documentation: 'Documentation'
            }
        },
        Management: {
            departments: ['Management'],
            workTypes: ['planning', 'review', 'meeting'],
            colors: {
                planning: '#6366f1',
                review: '#ec4899',
                meeting: '#14b8a6'
            },
            labels: {
                planning: 'Planning',
                review: 'Review',
                meeting: 'Meeting'
            }
        },
        Marketing: {
            departments: ['Marketing', 'Marketing & Growth'],
            workTypes: ['content', 'campaign', 'analytics'],
            colors: {
                content: '#f97316',
                campaign: '#84cc16',
                analytics: '#06b6d4'
            },
            labels: {
                content: 'Content',
                campaign: 'Campaign',
                analytics: 'Analytics'
            }
        }
    };

    const analytics = useMemo(() => {
        // Leaderboard (Productivity Chart)
        const devMap: Record<string, { id: string, name: string, hours: number, tickets: Set<string> }> = {};
        currentMonthLogs.forEach(log => {
            // Only show productivity for non-stakeholders
            if (activeTeamMembers.find(u => u.id === log.userId)) {
                if (!devMap[log.userId]) {
                    devMap[log.userId] = { id: log.userId, name: log.userName, hours: 0, tickets: new Set() };
                }
                devMap[log.userId].hours += log.hours;
            }
        });

        const leaderboard = Object.values(devMap)
            .sort((a, b) => b.hours - a.hours);

        // Category Impact
        const userDeptsMap: Record<string, string[]> = {};
        activeTeamMembers.forEach(u => {
            userDeptsMap[u.id] = (u as any).departments || (u.department ? [u.department] : []);
        });

        const categoryImpacts: Record<string, { workTypes: Record<string, number>, total: number }> = {
            Development: { workTypes: {}, total: 0 },
            Management: { workTypes: {}, total: 0 },
            Marketing: { workTypes: {}, total: 0 }
        };

        Object.entries(CATEGORY_CONFIG).forEach(([cat, config]) => {
            config.workTypes.forEach(wt => {
                categoryImpacts[cat].workTypes[wt] = 0;
            });
        });

        currentMonthLogs.forEach(log => {
            if (!activeTeamMembers.find(u => u.id === log.userId)) return;

            const userDepts = userDeptsMap[log.userId] || [];
            const workType = log.workType?.toLowerCase() || 'other';

            let matchedCategory: string | null = null;
            for (const [cat, config] of Object.entries(CATEGORY_CONFIG)) {
                if (userDepts.some(dept => config.departments.includes(dept))) {
                    matchedCategory = cat;
                    break;
                }
            }

            if (matchedCategory && categoryImpacts[matchedCategory]) {
                categoryImpacts[matchedCategory].total += log.hours;
                if (categoryImpacts[matchedCategory].workTypes[workType] !== undefined) {
                    categoryImpacts[matchedCategory].workTypes[workType] += log.hours;
                } else {
                    const firstWT = Object.keys(categoryImpacts[matchedCategory].workTypes)[0];
                    if (firstWT) categoryImpacts[matchedCategory].workTypes[firstWT] += log.hours;
                }
            }
        });

        const categoryChartData = Object.entries(categoryImpacts).map(([cat, data]) => {
            const config = CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG];
            return {
                name: cat,
                total: data.total,
                breakdown: Object.entries(data.workTypes).map(([wt, hours]) => ({
                    name: config.labels[wt as keyof typeof config.labels] || wt,
                    value: hours,
                    color: config.colors[wt as keyof typeof config.colors] || '#94a3b8'
                }))
            };
        });

        return { leaderboard, categoryChartData };
    }, [currentMonthLogs, activeTeamMembers]);


    return (
        <div className="bg-slate-50/50 min-h-screen font-sans text-slate-900 p-8 lg:p-12">
            <div className="mx-auto space-y-10">

                {/* Top Bar / Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Overview</h1>
                        <p className="text-slate-500 mt-1">
                            {role === 'developer'
                                ? 'Your personal progress and team momentum.'
                                : 'Overview of performance, team distribution, and roadmap progress.'}
                            <span className="ml-2 font-medium text-blue-600">Viewing as: {role}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" className="rounded-full" onClick={() => refreshData()}>
                            <RefreshCw className={`h-4 w-4 text-slate-500 ${isLoading || isDevMetricsLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {role === 'developer' ? (
                    // ==========================================
                    // DEVELOPER DASHBOARD VIEW
                    // ==========================================
                    <div className="space-y-10">
                        {/* 1. MY PROGRESS */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-indigo-500" /> My Progress
                            </h2>
                            <div className="grid gap-6 md:grid-cols-2">
                                <Card className="border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Logged This Month</CardTitle>
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-black text-slate-800">
                                            {isDevMetricsLoading ? '...' : devMetrics?.personalHoursThisMonth || 0}
                                            <span className="text-lg text-slate-400 ml-1 font-semibold">hrs</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 font-medium">Approved hours toward your goal</p>
                                    </CardContent>
                                </Card>
                                <Card className="border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Pending Approval</CardTitle>
                                        <Clock className="h-4 w-4 text-amber-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-black text-slate-800">
                                            {isDevMetricsLoading ? '...' : devMetrics?.personalPendingHours || 0}
                                            <span className="text-lg text-slate-400 ml-1 font-semibold">hrs</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 font-medium">Awaiting manager review</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* 2. TEAM MOMENTUM */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2">
                                <Zap className="h-5 w-5 text-amber-500" /> Team Momentum
                            </h2>
                            <div className="grid gap-6 md:grid-cols-3">
                                {/* Total Hours Logged */}
                                <Card className="col-span-1 border-slate-100 shadow-sm bg-gradient-to-br from-slate-50 to-white">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Team Hours Driven</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-end gap-2">
                                            <div className="text-4xl font-black text-indigo-600">
                                                {isDevMetricsLoading ? '...' : devMetrics?.totalTeamHoursThisMonth || 0}
                                            </div>
                                            <span className="text-slate-500 font-semibold mb-1 uppercase text-sm tracking-wider">Hrs</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 font-medium">
                                            Combined team effort this month
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* MVP */}
                                <Card className="col-span-1 relative overflow-hidden border border-amber-200/50 shadow-sm bg-white group hover:shadow-md transition-all duration-300">
                                    {/* Animated background gradient mesh */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-orange-50/50 opacity-80 group-hover:opacity-100 transition-opacity duration-700" />
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl flex-shrink-0 transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl flex-shrink-0 transition-transform duration-700 group-hover:scale-110" />

                                    <CardHeader className="pb-0 relative z-10">
                                        <CardTitle className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center justify-center gap-2">
                                            <Trophy className="h-4 w-4 text-amber-500" /> MVP of the Month
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="relative z-10 flex flex-col items-center justify-center pt-5 pb-6 min-h-[160px]">
                                        {isDevMetricsLoading ? (
                                            <div className="text-slate-400 font-medium animate-pulse">Loading MVP...</div>
                                        ) : devMetrics?.mvp ? (
                                            <>
                                                <div className="relative mb-3">
                                                    {/* Glowing effect around avatar */}
                                                    <div className="absolute inset-0 bg-amber-400 rounded-full blur-md opacity-30 animate-pulse" />
                                                    <div className="h-16 w-16 relative z-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-400 border-[3px] border-white shadow-lg flex items-center justify-center text-white text-2xl font-black uppercase ring-1 ring-amber-100">
                                                        {devMetrics.mvp.name.charAt(0)}
                                                    </div>
                                                    {/* Little decorative star/crown */}
                                                    <div className="absolute -top-2 -right-2 z-20 text-yellow-500 drop-shadow-sm animate-bounce" style={{ animationDuration: '3s' }}>
                                                        <Sparkles className="h-5 w-5 fill-yellow-400" />
                                                    </div>
                                                </div>

                                                <h3 className="text-lg font-bold text-slate-800 mb-1.5 tracking-tight text-center truncate w-full px-2">{devMetrics.mvp.name}</h3>

                                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/50 text-amber-700 text-xs font-bold shadow-sm">
                                                    <Zap className="h-3.5 w-3.5 text-amber-500" fill="currentColor" />
                                                    {devMetrics.mvp.hours} hrs Driven
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center opacity-60 mt-2">
                                                <Trophy className="h-10 w-10 text-slate-300 mb-2" />
                                                <div className="text-sm text-slate-500 font-medium">No MVP data yet</div>
                                                <div className="text-xs text-slate-400 mt-1">Log hours to take the lead!</div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Department Impact */}
                                <Card className="col-span-1 border-slate-100 shadow-sm bg-white">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Team Distribution</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {isDevMetricsLoading ? (
                                            <div className="space-y-3">
                                                <div className="h-2 bg-slate-100 rounded animate-pulse" />
                                                <div className="h-2 bg-slate-100 rounded animate-pulse" />
                                            </div>
                                        ) : devMetrics?.departmentDistribution.map((dept, i) => (
                                            <div key={i} className="mb-2">
                                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                                                    <span className="text-slate-600 truncate mr-2">{dept.department}</span>
                                                    <span className="text-indigo-600 shrink-0">{dept.count} Members</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                                    <div
                                                        className="bg-indigo-500 h-1.5 rounded-full"
                                                        style={{ width: `${dept.percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* 3. ACTIVE ROADMAP */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-emerald-600" /> Active Roadmap Focus
                            </h2>
                            {activePhases.length > 0 ? (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {activePhases.map(phase => {
                                        const totalDeliverables = phase.deliverables.length;
                                        const completedDeliverables = phase.deliverables.filter(d => d.status === 'done').length;
                                        const progress = totalDeliverables === 0 ? 0 : Math.round((completedDeliverables / totalDeliverables) * 100);

                                        return (
                                            <Card key={phase.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                                <CardHeader className="pb-3 border-b border-slate-100">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <CardTitle className="text-base text-slate-800 pr-4">{phase.title}</CardTitle>
                                                        <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200 bg-blue-50 whitespace-nowrap">
                                                            Current
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center text-xs text-slate-500 gap-2">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <span>{phase.date}</span>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="pt-4 pb-4">
                                                    <div className="mb-2 flex justify-between items-center text-xs font-medium">
                                                        <span className="text-slate-600">Phase Completion</span>
                                                        <span className={progress >= 100 ? "text-emerald-600" : "text-blue-600"}>{progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
                                                        <div
                                                            className={`h-1.5 rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <div className="text-xs text-slate-500 font-medium">
                                                        {completedDeliverables} of {totalDeliverables} deliverables tracking as completed
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                                    <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-slate-700">No active phases</h3>
                                    <p className="text-slate-500 text-sm mt-1">There are no roadmap phases currently marked as "In Progress".</p>
                                </div>
                            )}
                        </section>
                    </div>
                ) : (role === 'manager' || role === 'leadership' || isAdmin) ? (
                    // ==========================================
                    // MANAGER DASHBOARD VIEW
                    // ==========================================
                    <div className="space-y-10">
                        {/* 1. THE BIG PICTURE (Header/KPIs) */}
                        <section className="space-y-6">
                            <h2 className="text-xl font-semibold tracking-tight text-slate-800 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-blue-600" /> The Big Picture
                            </h2>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <Card className="border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-widest">Total Team</CardTitle>
                                        <Users className="h-4 w-4 text-purple-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-slate-800">{activeTeamMembers.length}</div>
                                        <div className="flex items-center text-xs font-medium text-slate-500 mt-2 bg-slate-50 w-fit px-2 py-1 rounded-md">
                                            <span className="text-purple-600 font-semibold">{Object.keys(departmentCounts).length}</span>
                                            <span className="mx-1 text-slate-300">|</span>
                                            <span>Departments</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-widest">Logged This Month</CardTitle>
                                        <Calendar className="h-4 w-4 text-blue-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-slate-800">
                                            {Object.values(userHours).reduce((a, b) => a + b, 0)}<span className="text-lg text-slate-400 ml-1">hrs</span>
                                        </div>
                                        <div className="flex items-center text-xs font-medium text-slate-500 mt-2 bg-slate-50 w-fit px-2 py-1 rounded-md">
                                            <span className="text-blue-600 font-semibold">{currentMonthLogs.length}</span>
                                            <span className="mx-1 text-slate-300">|</span>
                                            <span>Approved Sheets</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-widest">Pending Approval</CardTitle>
                                        <Clock className="h-4 w-4 text-amber-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-slate-800">
                                            {pendingHours}<span className="text-lg text-slate-400 ml-1">hrs</span>
                                        </div>
                                        <div className="flex items-center text-xs font-medium text-slate-500 mt-2 bg-slate-50 w-fit px-2 py-1 rounded-md">
                                            <span className="text-amber-600 font-semibold">{pendingMonthLogs.length}</span>
                                            <span className="mx-1 text-slate-300">|</span>
                                            <span>Pending Sheets</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* 2. OVERVIEW (MVP & Departments) */}
                        <section className="space-y-6">
                            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                                <Zap className="h-5 w-5 text-amber-500" /> Team Overview
                            </h2>
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* MVP Card */}
                                <Card className="col-span-1 shadow-sm border-amber-100 bg-gradient-to-br from-amber-50/50 to-orange-50/10 hover:shadow-md transition-all">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-amber-800 flex items-center gap-2">
                                            MVP of the Month
                                        </CardTitle>
                                        <CardDescription>Highest approved hours this month</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {mvpUser ? (
                                            <div className="flex items-center gap-4 mt-2">
                                                <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-amber-400 to-orange-400 border-4 border-white shadow-lg flex items-center justify-center text-white text-2xl font-bold uppercase">
                                                    {mvpUser.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-800">{mvpUser.name}</h3>
                                                    <p className="text-sm font-medium text-amber-600 uppercase tracking-widest">{mvpUser.role}</p>
                                                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                                                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 shadow-sm">
                                                            {maxHours} hrs logged
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-slate-400 bg-white/50 rounded-xl border border-dashed border-amber-200">
                                                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50 text-amber-400" />
                                                <p>No approved timesheets found for this month.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Department Breakdown */}
                                <Card className="col-span-1 shadow-sm border-slate-200">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-slate-800">Team Distribution</CardTitle>
                                        <CardDescription>Headcount by assigned department</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {sortedDepartments.length > 0 ? (
                                            <div className="space-y-4 mt-4">
                                                {sortedDepartments.map(([dept, count]) => {
                                                    const percentage = Math.round((count / activeTeamMembers.length) * 100);
                                                    return (
                                                        <div key={dept} className="space-y-1">
                                                            <div className="flex justify-between text-sm font-medium">
                                                                <span className="text-slate-700">{dept}</span>
                                                                <span className="text-slate-500">{count} member{count !== 1 ? 's' : ''} ({percentage}%)</span>
                                                            </div>
                                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                                <div
                                                                    className={`bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out`}
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-slate-400">
                                                No users assigned to departments yet.
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* 3. IMPACT & PRODUCTIVITY CHARTS */}
                        <section className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Category Impact Analysis */}
                                <Card className="border-slate-100 shadow-sm lg:col-span-1">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <Zap className="h-5 w-5 text-slate-400" /> Category Impact
                                        </CardTitle>
                                        <CardDescription className="text-sm text-slate-500">
                                            Work distribution by team category
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="min-h-[420px]">
                                        {/* Category Toggle Buttons */}
                                        <div className="flex gap-2 mb-6">
                                            {(['Development', 'Management', 'Marketing'] as const).map((cat) => (
                                                <Button
                                                    key={cat}
                                                    variant={selectedCategory === cat ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setSelectedCategory(cat)}
                                                    className={selectedCategory === cat
                                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'}
                                                >
                                                    {cat}
                                                </Button>
                                            ))}
                                        </div>

                                        {(() => {
                                            const selectedData = analytics.categoryChartData.find(c => c.name === selectedCategory);
                                            if (!selectedData || selectedData.total === 0) {
                                                return (
                                                    <div className="flex flex-col items-center justify-center gap-4 h-[340px]">
                                                        <div className="p-4 bg-slate-50 rounded-full">
                                                            <Zap className="h-10 w-10 text-slate-300" />
                                                        </div>
                                                        <div className="text-center">
                                                            <h3 className="text-base font-bold text-slate-900">No data for {selectedCategory}</h3>
                                                            <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">
                                                                Once team members log time, you'll see the breakdown here.
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="p-4 border border-slate-100 rounded-lg bg-slate-50/50">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-base font-bold text-slate-800">
                                                            {selectedData.name}
                                                        </h3>
                                                        <Badge variant="outline" className="text-xs font-bold border-slate-200 text-slate-600">
                                                            {selectedData.total.toFixed(0)}h Total
                                                        </Badge>
                                                    </div>

                                                    <div className="h-[200px] w-full relative mb-4">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie
                                                                    data={selectedData.breakdown.filter((item: any) => item.value > 0)}
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    innerRadius={55}
                                                                    outerRadius={85}
                                                                    paddingAngle={3}
                                                                    dataKey="value"
                                                                >
                                                                    {selectedData.breakdown.map((entry: any, index: number) => (
                                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip
                                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                                                    formatter={(value: number) => [`${value.toFixed(1)}h`, 'Hours']}
                                                                />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center">
                                                            <div className="text-sm font-black text-slate-400 uppercase tracking-tight">Impact</div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {selectedData.breakdown.map((item: any) => (
                                                            <div key={item.name} className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                                                    <span className="text-sm font-semibold text-slate-600">{item.name}</span>
                                                                </div>
                                                                <span className="text-sm font-bold text-slate-900">
                                                                    {((item.value / (selectedData.total || 1)) * 100).toFixed(0)}%
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>

                                {/* Team Productivity Chart */}
                                <Card className="border-slate-100 shadow-sm lg:col-span-2 flex flex-col">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-slate-400" /> Team Productivity
                                        </CardTitle>
                                        <CardDescription className="text-sm text-slate-500">
                                            Hours logged by each developer
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 min-h-[380px]">
                                        <div className="h-[380px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={analytics.leaderboard.slice(0, 10)}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis
                                                        dataKey="name"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                                                        angle={-45}
                                                        textAnchor="end"
                                                        height={80}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                                        label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 12, fontWeight: 600 } }}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: '#f8fafc' }}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                        formatter={(value: number) => [`${value.toFixed(1)}h`, 'Hours']}
                                                    />
                                                    <Bar
                                                        dataKey="hours"
                                                        fill="#6366f1"
                                                        radius={[4, 4, 0, 0]}
                                                        maxBarSize={60}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* 4. ACTIVE ROADMAP (Replacing Pipeline) */}
                        <section className="space-y-6 pb-12">
                            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-blue-600" /> Active Roadmap Focus
                            </h2>

                            {activePhases.length > 0 ? (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {activePhases.map(phase => {
                                        // Calculate phase progress
                                        const totalDeliverables = phase.deliverables.length;
                                        const completedDeliverables = phase.deliverables.filter(d => d.status === 'done').length;
                                        const progress = totalDeliverables === 0 ? 0 : Math.round((completedDeliverables / totalDeliverables) * 100);

                                        return (
                                            <Card key={phase.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                                <CardHeader className="pb-3 border-b border-slate-100">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <CardTitle className="text-base text-slate-800 pr-4">{phase.title}</CardTitle>
                                                        <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200 bg-blue-50 whitespace-nowrap">
                                                            Current
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center text-xs text-slate-500 gap-2">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <span>{phase.date}</span>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="pt-4 pb-4">
                                                    <div className="mb-2 flex justify-between items-center text-xs font-medium">
                                                        <span className="text-slate-600">Phase Completion</span>
                                                        <span className={progress >= 100 ? "text-emerald-600" : "text-blue-600"}>{progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
                                                        <div
                                                            className={`h-1.5 rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {completedDeliverables} of {totalDeliverables} deliverables completed
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
                                    <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-slate-700">No active phases</h3>
                                    <p className="text-slate-500 text-sm mt-1">There are no roadmap phases currently marked as "In Progress".</p>
                                </div>
                            )}
                        </section>
                    </div>
                ) : role === 'operation' ? (
                    // ==========================================
                    // OPERATION OVERVIEW VIEW
                    // ==========================================
                    <div className="space-y-10">
                        {/* 1. TOP METRICS */}
                        <section className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                                <h2 className="text-base font-bold text-slate-800 tracking-tight">The Big Picture</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Dashboard Metric 1 */}
                                <Card className="border-slate-100 shadow-sm bg-white relative overflow-hidden h-full rounded-2xl">
                                    <div className="absolute top-1/2 -translate-y-1/2 right-6 p-1 opacity-[0.03] pointer-events-none">
                                        <div className="h-16 w-16 border-[6px] border-emerald-600 rounded-full flex items-center justify-center">
                                            <CheckCircle className="h-8 w-8 text-emerald-600" />
                                        </div>
                                    </div>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-6 px-6 relative z-10">
                                        <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Phases</CardTitle>
                                        <div className="bg-emerald-50 h-7 w-7 rounded-full flex items-center justify-center border border-emerald-100/50">
                                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-6 pb-6 relative z-10">
                                        <div className="text-[2rem] font-black text-slate-900 tracking-tight leading-none mb-2 mt-1">{roadmap.filter(p => p.status === 'current').length || roadmap.length}</div>
                                        <div className="text-xs font-semibold text-emerald-600 mt-1 flex items-center">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                                            Currently in progress
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Dashboard Metric 2 */}
                                <Card className="border-slate-100 shadow-sm bg-white relative overflow-hidden h-full rounded-2xl">
                                    <div className="absolute top-1/2 -translate-y-1/2 right-6 p-1 opacity-[0.03] pointer-events-none">
                                        <div className="h-16 w-16 border-[6px] border-amber-600 rounded-full flex items-center justify-center">
                                            <AlertCircle className="h-8 w-8 text-amber-600" />
                                        </div>
                                    </div>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-6 px-6 relative z-10">
                                        <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Deliverables</CardTitle>
                                        <div className="bg-amber-50 h-7 w-7 rounded-full flex items-center justify-center border border-amber-100/50">
                                            <AlertCircle className="h-4 w-4 text-amber-600" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-6 pb-6 relative z-10">
                                        {(() => {
                                            const pending = roadmap.reduce((acc, phase) => acc + phase.deliverables.filter(d => d.status !== 'done').length, 0);
                                            const completed = roadmap.reduce((acc, phase) => acc + phase.deliverables.filter(d => d.status === 'done').length, 0);
                                            return (
                                                <>
                                                    <div className="flex items-baseline gap-2 mb-2 mt-1">
                                                        <div className="text-[2rem] font-black text-slate-900 tracking-tight leading-none">{pending}</div>
                                                        <div className="text-xs font-semibold text-slate-500 mb-0.5">pending</div>
                                                    </div>
                                                    <div className="text-xs font-semibold text-emerald-600 mt-1 flex items-center">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        {completed} completed all-time
                                                    </div>
                                                </>
                                            )
                                        })()}
                                    </CardContent>
                                </Card>

                                {/* Dashboard Metric 3 */}
                                <Card className="border-slate-100 shadow-sm bg-white relative overflow-hidden h-full rounded-2xl">
                                    <div className="absolute top-1/2 -translate-y-1/2 right-6 p-1 opacity-[0.03] pointer-events-none">
                                        <div className="h-16 w-16 flex items-center justify-center">
                                            <Users className="h-14 w-14 text-indigo-600" />
                                        </div>
                                    </div>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-6 px-6 relative z-10">
                                        <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Team Capacity</CardTitle>
                                        <div className="bg-indigo-50 h-7 w-7 rounded-full flex items-center justify-center border border-indigo-100/50">
                                            <Users className="h-4 w-4 text-indigo-600" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-6 pb-6 relative z-10">
                                        {(() => {
                                            const excluded = ['Management', 'Operation', 'Leadership', 'Finance'];
                                            const displayDepartments = Object.entries(departmentCounts).filter(([dept]) => !excluded.includes(dept));

                                            // Get unique users who belong to at least one of these display departments
                                            const uniqueDevelopers = activeTeamMembers.filter(user => {
                                                const depts = (user as any).departments || (user.department ? [user.department] : ['Unassigned']);
                                                return depts.some((dept: string) => !excluded.includes(dept));
                                            });

                                            return (
                                                <>
                                                    <div className="flex items-baseline gap-2 mb-2 mt-1">
                                                        <div className="text-[2rem] font-black text-slate-900 tracking-tight leading-none">{uniqueDevelopers.length}</div>
                                                        <div className="text-xs font-semibold text-slate-500 mb-0.5">members</div>
                                                    </div>
                                                    <div className="text-xs font-semibold text-indigo-600 mt-1 flex items-center">
                                                        <div className="bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[10px] mr-1.5">
                                                            {displayDepartments.length}
                                                        </div>
                                                        active departments
                                                    </div>
                                                </>
                                            )
                                        })()}
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* COMBINED 2-COLUMN LAYOUT FOR LESS SCROLLING */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-12">
                            {/* LEFT COLUMN: THE TIMELINE FLOW (Takes up 2/3 of space on very large screens) */}
                            <section className="xl:col-span-2 space-y-4">
                                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-indigo-500" /> Roadmap Timeline Sequence
                                </h2>
                                <Card className="border-0 shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col pt-2">
                                    <CardContent className="p-0 flex-1">
                                        {roadmap.length > 0 ? (
                                            <div className="divide-y divide-slate-100 relative">
                                                {/* Global connection line behind elements */}
                                                <div className="absolute left-10 sm:left-12 top-0 bottom-0 w-px bg-slate-200 z-0 hidden md:block" />

                                                {roadmap.map((phase, idx) => {
                                                    const totalDelivs = phase.deliverables.length;
                                                    const completedDelivs = phase.deliverables.filter(d => d.status === 'done').length;
                                                    const progress = totalDelivs === 0 ? 0 : Math.round((completedDelivs / totalDelivs) * 100);

                                                    const isCompleted = phase.status === 'completed';
                                                    const isCurrent = phase.status === 'current';

                                                    return (
                                                        <div key={phase.id} className={`p-5 sm:p-6 flex flex-col md:flex-row gap-5 transition-colors relative z-10 ${isCurrent ? 'bg-blue-50/40' : 'hover:bg-slate-50/50 bg-white'
                                                            }`}>
                                                            {/* Phase State Icon */}
                                                            <div className="md:w-1/4 flex flex-col shrink-0 relative bg-inherit">
                                                                <div className="flex items-center gap-4 mb-2">
                                                                    {isCompleted ? (
                                                                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 ring-4 ring-white shadow-sm z-10">
                                                                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                                                                        </div>
                                                                    ) : isCurrent ? (
                                                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 ring-4 ring-white shadow-sm z-10 relative">
                                                                            <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></div>
                                                                            <div className="h-3 w-3 rounded-full bg-blue-600" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="h-10 w-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shrink-0 ring-4 ring-white shadow-sm z-10">
                                                                            <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">{isCompleted ? 'Completed' : isCurrent ? 'Active Phase' : 'Upcoming'}</div>
                                                                        <div className="text-xs font-semibold text-slate-400 mt-0.5">{phase.date}</div>
                                                                    </div>
                                                                </div>
                                                                {isCurrent && (
                                                                    <Badge className="w-fit mt-2 bg-blue-100 text-blue-700 hover:bg-blue-200 border-transparent shadow-none text-[10px] py-0">Active Phase</Badge>
                                                                )}
                                                            </div>

                                                            <div className="md:w-3/4 flex flex-col justify-center w-full">
                                                                <h3 className={`text-lg font-bold mb-1 ${isCompleted ? 'text-slate-600 line-through decoration-slate-300' : 'text-slate-900'}`}>{phase.title}</h3>
                                                                <p className="text-sm text-slate-500 line-clamp-2 md:line-clamp-3 mb-3">{phase.description}</p>

                                                                {/* Deliverable Progress Bar */}
                                                                <div className="w-full bg-white/50 p-3 rounded-lg border border-slate-100/50 shadow-sm mt-1">
                                                                    <div className="flex justify-between text-xs font-bold mb-2">
                                                                        <span className="text-slate-600 uppercase tracking-wider text-[10px]">Completion Flow</span>
                                                                        <span className={isCompleted ? 'text-emerald-600' : isCurrent ? 'text-blue-600' : 'text-slate-500'}>{progress}%</span>
                                                                    </div>
                                                                    <div className="w-full bg-slate-200/60 rounded-full h-2 overflow-hidden shadow-inner">
                                                                        <div
                                                                            className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${isCompleted ? 'from-emerald-400 to-emerald-500' : isCurrent ? 'from-blue-400 to-blue-500' : 'from-slate-400 to-slate-400'
                                                                                }`}
                                                                            style={{ width: `${progress}%` }}
                                                                        />
                                                                    </div>
                                                                    <p className="text-[10px] text-slate-500 font-semibold mt-2">{completedDelivs} of {totalDelivs} deliverables checked off</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-12 h-64 flex flex-col items-center justify-center text-slate-400">
                                                <AlertCircle className="h-8 w-8 mx-auto mb-3 opacity-50" />
                                                <p>No roadmap phases defined yet.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                    <div className="bg-gradient-to-b from-white to-slate-50 border-t border-slate-100 p-3 text-center text-xs text-slate-500 font-bold shrink-0 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.03)] relative z-10 rounded-b-xl">
                                        End of Roadmap
                                    </div>
                                </Card>
                            </section>

                            {/* RIGHT COLUMN: OPERATIONAL IMPACT (Takes up 1/3 of space) */}
                            <section className="xl:col-span-1 space-y-4">
                                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-amber-500" /> Operational Overview
                                </h2>

                                <div className="flex flex-col gap-4">
                                    {/* Department Distribution */}
                                    <Card className="border-slate-100 shadow-sm bg-white shrink-0">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base font-bold text-slate-800">Team Distribution</CardTitle>
                                            <CardDescription className="text-xs">Headcount by assigned department</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {(() => {
                                                const excluded = ['Management', 'Operation', 'Leadership', 'Finance'];
                                                const displayDepartments = role === 'operation'
                                                    ? sortedDepartments.filter(([dept]) => !excluded.includes(dept))
                                                    : sortedDepartments;

                                                // Used for chart percentages
                                                const uniqueDevelopers = activeTeamMembers.filter(user => {
                                                    const depts = (user as any).departments || (user.department ? [user.department] : ['Unassigned']);
                                                    return depts.some((dept: string) => !excluded.includes(dept));
                                                });
                                                const totalDisplayMembers = role === 'operation'
                                                    ? uniqueDevelopers.length
                                                    : activeTeamMembers.length;

                                                return displayDepartments.length > 0 ? (
                                                    <div className="space-y-3 mt-1">
                                                        {displayDepartments.map(([dept, count]) => {
                                                            const percentage = totalDisplayMembers > 0 ? Math.round((count / totalDisplayMembers) * 100) : 0;
                                                            return (
                                                                <div key={dept} className="space-y-1">
                                                                    <div className="flex justify-between text-xs font-medium">
                                                                        <span className="text-slate-700">{dept}</span>
                                                                        <span className="text-slate-500">{count} member{count !== 1 ? 's' : ''}</span>
                                                                    </div>
                                                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                                        <div
                                                                            className={`bg-indigo-500 h-1.5 rounded-full`}
                                                                            style={{ width: `${percentage}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="py-4 text-center text-slate-400 text-xs">
                                                        No users assigned to departments yet.
                                                    </div>
                                                )
                                            })()}
                                        </CardContent>
                                    </Card>

                                    {/* Category Impact */}
                                    <Card className="border-slate-100 shadow-sm bg-white shrink-0">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base font-bold text-slate-800">Category Impact</CardTitle>
                                            <CardDescription className="text-xs tracking-tight">Work distribution overview</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                {(['Development', 'Management', 'Marketing'] as const).map((cat) => (
                                                    <Button
                                                        key={cat}
                                                        variant={selectedCategory === cat ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setSelectedCategory(cat)}
                                                        className={`h-7 px-2.5 text-xs ${selectedCategory === cat
                                                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                    >
                                                        {cat}
                                                    </Button>
                                                ))}
                                            </div>

                                            {(() => {
                                                const selectedData = analytics.categoryChartData.find(c => c.name === selectedCategory);
                                                if (!selectedData || selectedData.total === 0) {
                                                    return (
                                                        <div className="py-6 text-center text-slate-400 text-xs">
                                                            No time logged for {selectedCategory} yet.
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="p-3 border border-slate-100 rounded-lg bg-slate-50/50">
                                                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-white">
                                                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">{selectedData.name}</h3>
                                                            <span className="text-[10px] font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                                                {selectedData.total.toFixed(0)}h Total
                                                            </span>
                                                        </div>
                                                        <div className="space-y-2.5 mt-2">
                                                            {selectedData.breakdown.filter((item: any) => item.value > 0).map((item: any) => (
                                                                <div key={item.name} className="flex flex-col gap-1">
                                                                    <div className="flex items-center justify-between text-xs">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <div className="h-2 w-2 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                                                                            <span className="font-medium text-slate-600 line-clamp-1">{item.name}</span>
                                                                        </div>
                                                                        <span className="font-bold text-slate-900 ml-2">
                                                                            {((item.value / (selectedData.total || 1)) * 100).toFixed(0)}%
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-full bg-slate-200/60 rounded-full h-1">
                                                                        <div
                                                                            className="h-full rounded-full"
                                                                            style={{ width: `${(item.value / (selectedData.total || 1)) * 100}%`, backgroundColor: item.color }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </CardContent>
                                    </Card>

                                    {/* Quick Report Issue */}
                                    <Card className="border-red-100 shadow-sm bg-white shrink-0 overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                        <CardHeader className="pb-2 relative z-10">
                                            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                                <MessageSquarePlus className="h-4 w-4 text-red-500" />
                                                Report an Issue
                                            </CardTitle>
                                            <CardDescription className="text-xs">Raise a feature issue for the team to investigate</CardDescription>
                                        </CardHeader>
                                        <CardContent className="relative z-10 space-y-3">
                                            {activeReportCount > 0 && (
                                                <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                                                    <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                                    {activeReportCount} active report{activeReportCount !== 1 ? 's' : ''} pending review
                                                </div>
                                            )}
                                            <Button
                                                onClick={() => setReportModalOpen(true)}
                                                className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
                                            >
                                                <Bug className="h-4 w-4" />
                                                Raise Report
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full text-xs text-slate-500 hover:text-blue-600 gap-1.5"
                                                onClick={() => router.push('/status')}
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                View Feature Status Hub
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </section>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Report Issue Modal (Operation) */}
            {isOperation && (
                <ReportIssueModal
                    isOpen={reportModalOpen}
                    onClose={() => setReportModalOpen(false)}
                />
            )}
        </div>
    );
}
