"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TrendingUp, Calendar, Zap, AlertCircle, Search, Bell, RefreshCw, CheckCircle, Users, Clock, Trophy, Sparkles } from "lucide-react";
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

export default function DashboardPage() {
    const { users, roadmap, isLoading, refreshData } = useProject();
    const { role, isAdmin, isOperation } = useRole();
    const { logs } = useTimeLog();

    const [kpiData, setKpiData] = useState<KPI[]>([]);

    // Developer specific state
    const [devMetrics, setDevMetrics] = useState<DeveloperDashboardMetrics | null>(null);
    const [isDevMetricsLoading, setIsDevMetricsLoading] = useState(false);

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
                ) : (
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
                )}
            </div>
        </div>
    );
}
