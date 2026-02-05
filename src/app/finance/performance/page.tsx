"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRole } from "@/context/RoleContext";
import { useProject } from "@/context/ProjectContext";
import AccessDenied from "@/components/auth/AccessDenied";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Skeleton, SkeletonCard, SkeletonChart, SkeletonTable } from "@/components/ui/Skeleton";
import {
    TrendingUp, ArrowLeft, Clock, Users, Calendar, ChevronRight, DollarSign, BarChart3
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getTimeLogs } from "@/lib/actions/timesheet";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const CHART_COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4'];

// Consistent department color mapping for charts and badges
const DEPARTMENT_COLORS: Record<string, { bg: string; text: string; border: string; hex: string }> = {
    'Frontend': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', hex: '#10B981' },
    'Backend': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', hex: '#3B82F6' },
    'Marketing': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', hex: '#F59E0B' },
    'Customer Success': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', hex: '#8B5CF6' },
    'Management': { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300', hex: '#EC4899' },
    'Other': { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300', hex: '#06B6D4' },
};

const getDeptColor = (dept: string | undefined) => {
    return DEPARTMENT_COLORS[dept || 'Other'] || DEPARTMENT_COLORS['Other'];
};

interface UserPerformance {
    userId: string;
    userName: string;
    department?: string;
    hourlyRate: number;
    totalHours: number;
    approvedHours: number;
    pendingHours: number;
    estimatedCost: number;
}

interface MonthData {
    month: string;
    hours: number;
    cost: number;
}

type PeriodType = 'P1' | 'P2' | 'full' | '3months';

export default function TeamPerformancePage() {
    const { isManager, isFinance, isLoading: isRoleLoading } = useRole();
    const { users } = useProject();
    const router = useRouter();

    const now = new Date();
    const currentDay = now.getDate();

    // Auto-select period based on current date
    const defaultPeriod: PeriodType = currentDay <= 15 ? 'P1' : 'P2';

    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>(defaultPeriod);
    const [userPerformance, setUserPerformance] = useState<UserPerformance[]>([]);
    const [monthlyTrend, setMonthlyTrend] = useState<MonthData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Calculate date range based on period
    const getDateRange = useCallback((month: number, year: number, period: PeriodType) => {
        if (period === '3months') {
            // Last 3 months from selected month
            const endMonth = month;
            const endYear = year;
            let startMonth = month - 2;
            let startYear = year;
            if (startMonth <= 0) {
                startMonth += 12;
                startYear -= 1;
            }
            const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-01`;
            const lastDay = new Date(endYear, endMonth, 0).getDate();
            const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-${lastDay}`;
            return { startDate, endDate };
        }

        const lastDayOfMonth = new Date(year, month, 0).getDate();
        let startDay = 1;
        let endDay = lastDayOfMonth;

        if (period === 'P1') {
            endDay = 15;
        } else if (period === 'P2') {
            startDay = 16;
        }

        const startDate = `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
        return { startDate, endDate };
    }, []);

    const loadPerformance = useCallback(async () => {
        setIsLoading(true);
        try {
            const { startDate, endDate } = getDateRange(selectedMonth, selectedYear, selectedPeriod);

            // Fetch timelogs using server action
            const logs = await getTimeLogs({ startDate, endDate });

            // Create user map with hourly rates from context
            const userMap = new Map<string, UserPerformance>();

            for (const user of users) {
                userMap.set(user.id, {
                    userId: user.id,
                    userName: user.name,
                    department: user.department,
                    hourlyRate: user.hourlyRate || 0,
                    totalHours: 0,
                    approvedHours: 0,
                    pendingHours: 0,
                    estimatedCost: 0
                });
            }

            // Aggregate hours by user
            for (const log of logs) {
                const userId = log.userId;
                if (userMap.has(userId)) {
                    const userStats = userMap.get(userId)!;
                    userStats.totalHours += log.hours || 0;
                    if (log.status === 'approved') {
                        userStats.approvedHours += log.hours || 0;
                    } else if (log.status === 'pending') {
                        userStats.pendingHours += log.hours || 0;
                    }
                }
            }

            // Calculate estimated costs
            for (const [, userStats] of userMap) {
                userStats.estimatedCost = userStats.approvedHours * userStats.hourlyRate;
            }

            // Sort by total hours descending, filter out users with no hours
            const result = Array.from(userMap.values())
                .filter(u => u.totalHours > 0)
                .sort((a, b) => b.totalHours - a.totalHours);

            setUserPerformance(result);

            // Load monthly trend data (last 3 months)
            if (selectedPeriod !== '3months') {
                const trendData: MonthData[] = [];
                for (let i = 2; i >= 0; i--) {
                    let m = selectedMonth - i;
                    let y = selectedYear;
                    if (m <= 0) {
                        m += 12;
                        y -= 1;
                    }
                    const { startDate: mStart, endDate: mEnd } = getDateRange(m, y, 'full');
                    const monthLogs = await getTimeLogs({ startDate: mStart, endDate: mEnd });

                    let hours = 0;
                    let cost = 0;
                    for (const log of monthLogs) {
                        if (log.status === 'approved') {
                            hours += log.hours || 0;
                            const user = users.find(u => u.id === log.userId);
                            cost += (log.hours || 0) * (user?.hourlyRate || 0);
                        }
                    }

                    trendData.push({
                        month: MONTHS[m - 1].substring(0, 3),
                        hours,
                        cost
                    });
                }
                setMonthlyTrend(trendData);
            }
        } catch (err) {
            console.error('Failed to load performance:', err);
            setUserPerformance([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedMonth, selectedYear, selectedPeriod, users, getDateRange]);

    useEffect(() => {
        if ((isManager || isFinance) && users.length > 0) {
            loadPerformance();
        }
    }, [isManager, isFinance, loadPerformance, users]);

    // Calculate totals
    const totalHours = userPerformance.reduce((sum, u) => sum + u.totalHours, 0);
    const totalApproved = userPerformance.reduce((sum, u) => sum + u.approvedHours, 0);
    const totalPending = userPerformance.reduce((sum, u) => sum + u.pendingHours, 0);
    const totalCost = userPerformance.reduce((sum, u) => sum + u.estimatedCost, 0);

    // Data for pie chart (department breakdown)
    const departmentData = useMemo(() => {
        const deptMap = new Map<string, number>();
        for (const u of userPerformance) {
            const dept = u.department || 'Other';
            deptMap.set(dept, (deptMap.get(dept) || 0) + u.estimatedCost);
        }
        return Array.from(deptMap.entries()).map(([name, value]) => ({ name, value }));
    }, [userPerformance]);

    // Data for bar chart (member hours)
    const memberChartData = useMemo(() => {
        return userPerformance.slice(0, 6).map(u => ({
            name: u.userName.split(' ')[0],
            approved: u.approvedHours,
            pending: u.pendingHours
        }));
    }, [userPerformance]);

    if (isRoleLoading) {
        return (
            <div className="bg-slate-50/50 min-h-screen p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <Skeleton className="h-10 w-64" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <SkeletonChart className="h-[300px]" />
                        <SkeletonChart className="h-[300px]" />
                    </div>
                    <Card className="border-none shadow-sm bg-white">
                        <SkeletonTable rows={4} cols={6} />
                    </Card>
                </div>
            </div>
        );
    }
    if (!isManager && !isFinance) return <AccessDenied />;

    return (
        <div className="bg-slate-50/50 min-h-screen p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="text-slate-500 hover:text-slate-700"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <TrendingUp className="h-7 w-7 text-blue-600" />
                                Team Performance
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Budget overview and cost analysis
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium bg-white"
                        >
                            {MONTHS.map((m, i) => (
                                <option key={m} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium bg-white"
                        >
                            {[2025, 2026, 2027].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    {/* Period Selector */}
                    <div className="flex gap-2">
                        {([
                            { key: 'P1', label: 'P1 (1-15)' },
                            { key: 'P2', label: 'P2 (16-End)' },
                            { key: 'full', label: 'Full Month' },
                            { key: '3months', label: 'Last 3 Months' }
                        ] as { key: PeriodType; label: string }[]).map(({ key, label }) => (
                            <Button
                                key={key}
                                variant={selectedPeriod === key ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedPeriod(key)}
                                className={selectedPeriod === key
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'border-slate-200'
                                }
                            >
                                {label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Clock className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Total Hours</p>
                                    <p className="text-2xl font-bold text-slate-900">{totalHours.toFixed(1)}h</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Approved</p>
                                    <p className="text-2xl font-bold text-green-600">{totalApproved.toFixed(1)}h</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <Clock className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Pending</p>
                                    <p className="text-2xl font-bold text-amber-600">{totalPending.toFixed(1)}h</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <DollarSign className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Est. Cost</p>
                                    <p className="text-2xl font-bold text-emerald-600">${totalCost.toFixed(2)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Member Hours Bar Chart */}
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-slate-400" />
                                Member Hours
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {memberChartData.length > 0 ? (
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={memberChartData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                            <XAxis type="number" tick={{ fontSize: 12 }} />
                                            <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={60} />
                                            <Tooltip />
                                            <Bar dataKey="approved" stackId="a" fill="#10B981" name="Approved" />
                                            <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-[250px] flex items-center justify-center text-slate-400">
                                    No data for this period
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Department Cost Pie Chart */}
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-slate-400" />
                                Cost by Department
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {departmentData.length > 0 ? (
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={departmentData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={2}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                                            >
                                                {departmentData.map((entry) => (
                                                    <Cell key={`cell-${entry.name}`} fill={getDeptColor(entry.name).hex} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-[250px] flex items-center justify-center text-slate-400">
                                    No data for this period
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* 3-Month Trend Chart */}
                {selectedPeriod !== '3months' && monthlyTrend.length > 0 && (
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-slate-400" />
                                Monthly Cost Trend
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                        <Bar dataKey="cost" fill="#10B981" name="Cost" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Members Table */}
                <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Users className="h-5 w-5 text-slate-400" />
                            Member Breakdown
                            <Badge variant="outline" className="ml-2">{userPerformance.length} active</Badge>
                        </CardTitle>
                    </CardHeader>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="font-semibold w-[25%] lg:w-[30%]">Member</TableHead>
                                <TableHead className="font-semibold w-[150px]">Department</TableHead>
                                <TableHead className="font-semibold text-right w-[100px]">Rate</TableHead>
                                <TableHead className="font-semibold text-right w-[100px]">Approved</TableHead>
                                <TableHead className="font-semibold text-right w-[100px]">Pending</TableHead>
                                <TableHead className="font-semibold text-right w-[120px]">Est. Cost</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <>
                                    {[1, 2, 3].map((i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                        </TableRow>
                                    ))}
                                </>
                            ) : userPerformance.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                                        No hours logged for this period
                                    </TableCell>
                                </TableRow>
                            ) : (
                                userPerformance.map((u) => {
                                    const deptColor = getDeptColor(u.department);
                                    return (
                                        <TableRow key={u.userId}>
                                            <TableCell className="font-semibold text-slate-900">{u.userName}</TableCell>
                                            <TableCell>
                                                {u.department && (
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs ${deptColor.bg} ${deptColor.text} ${deptColor.border}`}
                                                    >
                                                        {u.department}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-slate-500">${u.hourlyRate}/hr</TableCell>
                                            <TableCell className="text-right text-green-600 font-medium">{u.approvedHours.toFixed(1)}h</TableCell>
                                            <TableCell className="text-right text-amber-600">{u.pendingHours.toFixed(1)}h</TableCell>
                                            <TableCell className="text-right font-bold text-emerald-600">${u.estimatedCost.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.push(`/manager/timesheets?user=${u.userId}`)}
                                                    className="text-slate-400 hover:text-slate-600"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    );
}
