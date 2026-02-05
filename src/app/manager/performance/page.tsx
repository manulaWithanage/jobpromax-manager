"use client";

import { useMemo, useState } from "react";
import { useTimeLog } from "@/context/TimeLogContext";
import { useProject } from "@/context/ProjectContext";
import { useRole } from "@/context/RoleContext";
import AccessDenied from "@/components/auth/AccessDenied";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    ShieldCheck, TrendingUp, Users, AlertTriangle,
    CheckCircle2, Flame, ArrowLeft, BarChart3,
    Briefcase, Bug, Settings, Info, Clock, Target, Award, Calendar
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";

type TimePeriod = 'this-month' | 'last-month' | '3-months' | '6-months' | 'this-year' | 'all-time';

export default function TeamPerformancePage() {
    const { isManager, isLoading: isRoleLoading } = useRole();
    const { logs } = useTimeLog();
    const { users } = useProject();
    const router = useRouter();
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('this-month');
    const [selectedCategory, setSelectedCategory] = useState<'Development' | 'Management' | 'Marketing'>('Development');

    // Category mapping
    const CATEGORY_CONFIG = {
        Development: {
            departments: ['Frontend', 'Backend', 'Frontend Development', 'Backend Development'],
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

    // Date range calculation
    const getDateRange = (period: TimePeriod) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        switch (period) {
            case 'this-month':
                return { start: startOfMonth, end: now };
            case 'last-month':
                const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
                return { start: lastMonthStart, end: lastMonthEnd };
            case '3-months':
                const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                return { start: threeMonthsAgo, end: now };
            case '6-months':
                const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                return { start: sixMonthsAgo, end: now };
            case 'this-year':
                return { start: startOfYear, end: now };
            case 'all-time':
            default:
                return { start: new Date(0), end: now };
        }
    };

    // Data Preparation
    const analytics = useMemo(() => {
        // Filter logs by time period
        const { start, end } = getDateRange(timePeriod);
        const approvedLogs = logs.filter(l => {
            if (l.status !== 'approved') return false;
            const logDate = new Date(l.date);
            return logDate >= start && logDate <= end;
        });

        // 1. Leaderboard
        const devMap: Record<string, { id: string, name: string, hours: number, tickets: Set<string> }> = {};
        approvedLogs.forEach(log => {
            if (!devMap[log.userId]) {
                devMap[log.userId] = { id: log.userId, name: log.userName, hours: 0, tickets: new Set() };
            }
            devMap[log.userId].hours += log.hours;
            if (log.jiraTickets && log.jiraTickets.length > 0) {
                log.jiraTickets.forEach(t => devMap[log.userId].tickets.add(t));
            } else if ((log as any).jiraTicket) {
                devMap[log.userId].tickets.add((log as any).jiraTicket);
            }
        });

        const leaderboard = Object.values(devMap)
            .sort((a, b) => b.hours - a.hours)
            .map(dev => ({ ...dev, ticketCount: dev.tickets.size }));

        // 2. Category-Based Impact Analysis
        const userDeptMap: Record<string, string> = {};
        users.forEach(u => { userDeptMap[u.id] = (u as any).department || 'Other'; });

        // Calculate impact for each category
        const categoryImpacts: Record<string, { workTypes: Record<string, number>, total: number }> = {
            Development: { workTypes: {}, total: 0 },
            Management: { workTypes: {}, total: 0 },
            Marketing: { workTypes: {}, total: 0 }
        };

        // Initialize work types for each category
        Object.entries(CATEGORY_CONFIG).forEach(([cat, config]) => {
            config.workTypes.forEach(wt => {
                categoryImpacts[cat].workTypes[wt] = 0;
            });
        });

        approvedLogs.forEach(log => {
            const dept = userDeptMap[log.userId] || 'Other';
            const workType = log.workType?.toLowerCase() || 'other';

            // Find which category this log belongs to
            let matchedCategory: string | null = null;
            for (const [cat, config] of Object.entries(CATEGORY_CONFIG)) {
                if (config.departments.includes(dept)) {
                    matchedCategory = cat;
                    break;
                }
            }

            if (matchedCategory && categoryImpacts[matchedCategory]) {
                categoryImpacts[matchedCategory].total += log.hours;
                if (categoryImpacts[matchedCategory].workTypes[workType] !== undefined) {
                    categoryImpacts[matchedCategory].workTypes[workType] += log.hours;
                } else {
                    // If work type doesn't match, add to 'other' or first available
                    const firstWT = Object.keys(categoryImpacts[matchedCategory].workTypes)[0];
                    if (firstWT) categoryImpacts[matchedCategory].workTypes[firstWT] += log.hours;
                }
            }
        });

        // Format category data for charts
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

        // 3. Performance Flags
        const flags: { id: string, devName: string, type: 'warning' | 'info' | 'critical', msg: string }[] = [];
        const developers = users.filter(u => u.role === 'developer');

        developers.forEach(dev => {
            const devLogs = logs.filter(l => l.userId === dev.id);
            const lastLog = devLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

            // Flag: Inactive
            if (!lastLog) {
                flags.push({ id: dev.id, devName: dev.name, type: 'critical', msg: 'No activity recorded yet' });
            } else {
                const daysSince = Math.floor((new Date().getTime() - new Date(lastLog.date).getTime()) / (1000 * 3600 * 24));
                if (daysSince > 3) {
                    flags.push({ id: dev.id, devName: dev.name, type: 'warning', msg: `Inactive for ${daysSince} days` });
                }
            }

            // Flag: High single-ticket concentration
            const ticketHours: Record<string, number> = {};
            devLogs.forEach(l => {
                const tickets = (l.jiraTickets && l.jiraTickets.length > 0)
                    ? l.jiraTickets
                    : ((l as any).jiraTicket ? [(l as any).jiraTicket] : ["N/A"]);

                tickets.forEach(ticket => {
                    ticketHours[ticket] = (ticketHours[ticket] || 0) + l.hours;
                });
            });
            Object.entries(ticketHours).forEach(([ticket, hours]) => {
                if (hours > 30) {
                    flags.push({ id: dev.id, devName: dev.name, type: 'info', msg: `Highly focused on ${ticket} (${hours}h)` });
                }
            });
        });

        // Calculate totals for hero stats
        const totalHours = approvedLogs.reduce((sum, log) => sum + log.hours, 0);
        const activeDevelopers = new Set(approvedLogs.map(log => log.userId)).size;

        return { leaderboard, categoryChartData, flags, totalHours, activeDevelopers };
    }, [logs, users, timePeriod]);

    if (isRoleLoading) return <div className="p-12 text-center text-slate-500">Loading metrics...</div>;
    if (!isManager) return <AccessDenied />;

    return (
        <div className="bg-slate-50/50 min-h-screen p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="p-2 h-auto hover:bg-white"
                        >
                            <ArrowLeft className="h-5 w-5 text-slate-400" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                                <TrendingUp className="h-8 w-8 text-indigo-600" /> Team Impact & Performance
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Analytics, leaderboards, and productivity insights
                            </p>
                        </div>
                    </div>

                    {/* Time Period Filter */}
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <Select value={timePeriod} onValueChange={(value: string) => setTimePeriod(value as TimePeriod)}>
                            <SelectTrigger className="w-[180px] bg-white">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="this-month">This Month</SelectItem>
                                <SelectItem value="last-month">Last Month</SelectItem>
                                <SelectItem value="3-months">Last 3 Months</SelectItem>
                                <SelectItem value="6-months">Last 6 Months</SelectItem>
                                <SelectItem value="this-year">This Year</SelectItem>
                                <SelectItem value="all-time">All Time</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Hero Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Team MVP */}
                    <Card className="border-none shadow-md bg-gradient-to-br from-indigo-600 to-indigo-700 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Award className="h-5 w-5 text-indigo-200" />
                                <span className="text-sm font-semibold text-indigo-100">Team MVP</span>
                            </div>
                            <div className="text-3xl font-black mb-1">
                                {analytics.leaderboard[0]?.name || "N/A"}
                            </div>
                            <div className="text-sm text-indigo-100">
                                {analytics.leaderboard[0]?.hours.toFixed(1) || 0}h approved this cycle
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Impact */}
                    <Card className="border-none shadow-md bg-gradient-to-br from-emerald-600 to-emerald-700 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-5 w-5 text-emerald-200" />
                                <span className="text-sm font-semibold text-emerald-100">Total Impact</span>
                            </div>
                            <div className="text-3xl font-black mb-1">
                                {analytics.totalHours.toFixed(1)}h
                            </div>
                            <div className="text-sm text-emerald-100">
                                Total approved hours this cycle
                            </div>
                        </CardContent>
                    </Card>

                    {/* Active Developers */}
                    <Card className="border-none shadow-md bg-gradient-to-br from-violet-600 to-violet-700 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="h-5 w-5 text-violet-200" />
                                <span className="text-sm font-semibold text-violet-100">Active Team</span>
                            </div>
                            <div className="text-3xl font-black mb-1">
                                {analytics.activeDevelopers}
                            </div>
                            <div className="text-sm text-violet-100">
                                Developers contributing
                            </div>
                        </CardContent>
                    </Card>
                </div>


                {/* Category-Based Impact Analysis & Team Productivity - Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Category Impact Analysis */}
                    <Card className="border-none shadow-sm bg-white lg:col-span-1">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-slate-400" /> Category Impact
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
                                                <BarChart3 className="h-10 w-10 text-slate-300" />
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
                    <Card className="border-none shadow-sm bg-white lg:col-span-2 flex flex-col">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-slate-400" /> Team Productivity
                            </CardTitle>
                            <CardDescription className="text-sm text-slate-500">
                                Hours logged by each developer
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-[380px]">
                            <div className="h-full w-full">
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

                {/* Developer Impact Leaderboard */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-slate-400" /> Developer Impact Leaderboard
                    </h2>
                    <Card className="border-none shadow-sm overflow-hidden bg-white">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-[60px] text-center font-bold">Rank</TableHead>
                                    <TableHead className="font-bold">Developer</TableHead>
                                    <TableHead className="font-bold">Impact (Hours)</TableHead>
                                    <TableHead className="font-bold">Tasks Completed</TableHead>
                                    <TableHead className="text-right font-bold">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analytics.leaderboard.map((dev, index) => (
                                    <TableRow key={dev.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="text-center">
                                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${index === 0 ? 'bg-amber-100 text-amber-700' :
                                                index === 1 ? 'bg-slate-200 text-slate-700' :
                                                    index === 2 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}>
                                                {index + 1}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                                    {dev.name.charAt(0)}
                                                </div>
                                                <span className="font-semibold text-slate-800">{dev.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                                                        style={{ width: `${Math.min((dev.hours / (analytics.leaderboard[0]?.hours || 1)) * 100, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="font-bold text-slate-900 min-w-[60px]">{dev.hours.toFixed(1)}h</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-none font-semibold">
                                                {dev.ticketCount} {dev.ticketCount === 1 ? 'Ticket' : 'Tickets'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`/manager/timesheets`)}
                                                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold"
                                            >
                                                View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </div>

            </div>
        </div>
    );
}
