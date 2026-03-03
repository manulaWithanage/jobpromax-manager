"use client";

import React, { useState, useMemo } from "react";
import { useTimeLog } from "@/context/TimeLogContext";
import { useProject } from "@/context/ProjectContext";
import { useRole } from "@/context/RoleContext";
import AccessDenied from "@/components/auth/AccessDenied";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import {
    CheckCircle2, Clock, Users, Search, X, Calendar,
    FileText, Briefcase, DollarSign, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

type Period = 'p1' | 'p2' | '2m' | '3m' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
    p1: 'P1 (Last 2 Weeks)',
    p2: 'P2 (Last Month)',
    '2m': '2 Months',
    '3m': '3 Months',
    all: 'All Time',
};

const WORK_TYPE_LABELS: Record<string, string> = {
    feature: 'Feature',
    bug: 'Bug Fix',
    refactor: 'Refactor',
    testing: 'Testing',
    documentation: 'Documentation',
    planning: 'Planning',
    review: 'Review',
    meeting: 'Meeting',
    content: 'Content',
    campaign: 'Campaign',
    analytics: 'Analytics',
    other: 'Other',
};

const WORK_TYPE_COLORS: Record<string, string> = {
    feature: 'bg-blue-50 text-blue-700 border-blue-200',
    bug: 'bg-red-50 text-red-700 border-red-200',
    refactor: 'bg-amber-50 text-amber-700 border-amber-200',
    testing: 'bg-purple-50 text-purple-700 border-purple-200',
    documentation: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    planning: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    review: 'bg-pink-50 text-pink-700 border-pink-200',
    meeting: 'bg-teal-50 text-teal-700 border-teal-200',
    content: 'bg-orange-50 text-orange-700 border-orange-200',
    campaign: 'bg-lime-50 text-lime-700 border-lime-200',
    analytics: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    other: 'bg-slate-50 text-slate-600 border-slate-200',
};

function toLocalDateString(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function parseLocalDate(dateStr: string): Date {
    // Append local time offset to avoid UTC-midnight off-by-one in IST/other TZs
    return new Date(`${dateStr}T00:00:00`);
}

function getPeriodDates(period: Period): { start: string | null; end: string | null } {
    if (period === 'all') return { start: null, end: null };

    const now = new Date();
    const end = toLocalDateString(now);

    const start = new Date(now);
    if (period === 'p1') start.setDate(now.getDate() - 14);
    else if (period === 'p2') start.setDate(now.getDate() - 30);
    else if (period === '2m') start.setMonth(now.getMonth() - 2);
    else if (period === '3m') start.setMonth(now.getMonth() - 3);

    return { start: toLocalDateString(start), end };
}

export default function ApprovedLogsPage() {
    const { isManager, isLoading: isRoleLoading } = useRole();
    const { logs } = useTimeLog();
    const { users } = useProject();

    const [selectedPeriod, setSelectedPeriod] = useState<Period>('p2');
    const [selectedUserId, setSelectedUserId] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // All unique users who have approved logs
    const usersWithApprovedLogs = useMemo(() => {
        const approvedLogs = logs.filter(l => l.status === 'approved');
        const userIds = new Set(approvedLogs.map(l => l.userId));

        // Merge from project users list + log users
        const result: { id: string; name: string }[] = [];
        userIds.forEach(uid => {
            const projectUser = users.find(u => u.id === uid);
            if (projectUser) {
                result.push({ id: projectUser.id, name: projectUser.name });
            } else {
                const log = approvedLogs.find(l => l.userId === uid);
                if (log) result.push({ id: uid, name: log.userName });
            }
        });
        return result.sort((a, b) => a.name.localeCompare(b.name));
    }, [logs, users]);

    // Filter approved logs by period, user, and search
    const filteredLogs = useMemo(() => {
        const { start, end } = getPeriodDates(selectedPeriod);

        return logs
            .filter(l => {
                if (l.status !== 'approved') return false;
                if (start && l.date < start) return false;
                if (end && l.date > end) return false;
                if (selectedUserId !== 'all' && l.userId !== selectedUserId) return false;
                if (searchQuery.trim()) {
                    const q = searchQuery.trim().toLowerCase();
                    const matchesSummary = l.summary.toLowerCase().includes(q);
                    const matchesWorkType = (WORK_TYPE_LABELS[l.workType] || l.workType).toLowerCase().includes(q);
                    const matchesTickets = l.jiraTickets?.some(t => t.toLowerCase().includes(q));
                    const matchesUser = l.userName.toLowerCase().includes(q);
                    if (!matchesSummary && !matchesWorkType && !matchesTickets && !matchesUser) return false;
                }
                return true;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [logs, selectedPeriod, selectedUserId, searchQuery]);

    // Summary metrics
    const metrics = useMemo(() => {
        const totalHours = filteredLogs.reduce((sum, l) => sum + l.hours, 0);
        const totalEntries = filteredLogs.length;
        const uniqueContributors = new Set(filteredLogs.map(l => l.userId)).size;

        const estimatedBilling = filteredLogs.reduce((sum, l) => {
            const user = users.find(u => u.id === l.userId);
            return sum + l.hours * (user?.hourlyRate || 0);
        }, 0);

        return { totalHours, totalEntries, uniqueContributors, estimatedBilling };
    }, [filteredLogs, users]);

    if (isRoleLoading) return <div className="p-12 text-center text-slate-500">Loading...</div>;
    if (!isManager) return <AccessDenied />;

    const { start, end } = getPeriodDates(selectedPeriod);

    return (
        <div className="bg-slate-50/50 min-h-screen p-4 md:p-8 lg:p-12">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-200">
                            <CheckCircle2 className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                                Approved Logs
                            </h1>
                            <p className="text-sm md:text-base text-slate-500 mt-0.5">
                                Audit and review all approved time log entries across the team.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Period Selector */}
                <Card className="border-none shadow-sm bg-white p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-2 text-slate-500 shrink-0">
                            <Calendar className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Period</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(Object.keys(PERIOD_LABELS) as Period[]).map((period) => (
                                <Button
                                    key={period}
                                    size="sm"
                                    variant={selectedPeriod === period ? 'default' : 'outline'}
                                    onClick={() => setSelectedPeriod(period)}
                                    className={cn(
                                        "h-8 text-xs font-bold transition-all",
                                        selectedPeriod === period
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm shadow-emerald-200'
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                    )}
                                >
                                    {period === 'p1' ? 'P1' : period === 'p2' ? 'P2' : period === '2m' ? '2 Months' : period === '3m' ? '3 Months' : 'All Time'}
                                </Button>
                            ))}
                        </div>
                        {start && (
                            <span className="text-xs text-slate-400 font-medium ml-auto shrink-0">
                                {start} — {end}
                            </span>
                        )}
                    </div>
                </Card>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-none shadow-sm bg-white border-l-4 border-l-emerald-500">
                        <CardHeader className="pb-1 pt-4 px-4">
                            <CardDescription className="flex items-center gap-1.5 text-xs">
                                <Clock className="h-3.5 w-3.5" /> Total Hours
                            </CardDescription>
                            <CardTitle className="text-2xl font-black text-slate-800">
                                {metrics.totalHours.toFixed(1)}
                                <span className="text-base text-slate-400 font-semibold ml-1">hrs</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4 px-4">
                            <p className="text-xs text-slate-400">Approved in period</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white border-l-4 border-l-blue-500">
                        <CardHeader className="pb-1 pt-4 px-4">
                            <CardDescription className="flex items-center gap-1.5 text-xs">
                                <FileText className="h-3.5 w-3.5" /> Entries
                            </CardDescription>
                            <CardTitle className="text-2xl font-black text-slate-800">
                                {metrics.totalEntries}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4 px-4">
                            <p className="text-xs text-slate-400">Log records</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white border-l-4 border-l-purple-500">
                        <CardHeader className="pb-1 pt-4 px-4">
                            <CardDescription className="flex items-center gap-1.5 text-xs">
                                <Users className="h-3.5 w-3.5" /> Contributors
                            </CardDescription>
                            <CardTitle className="text-2xl font-black text-slate-800">
                                {metrics.uniqueContributors}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4 px-4">
                            <p className="text-xs text-slate-400">Unique members</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white border-l-4 border-l-indigo-600 bg-indigo-50/20">
                        <CardHeader className="pb-1 pt-4 px-4">
                            <CardDescription className="flex items-center gap-1.5 text-xs text-indigo-600">
                                <DollarSign className="h-3.5 w-3.5" /> Est. Billing
                            </CardDescription>
                            <CardTitle className="text-2xl font-black text-indigo-700">
                                ${metrics.estimatedBilling.toFixed(2)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4 px-4">
                            <p className="text-xs text-indigo-400">Approved payout</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by summary, work type, ticket or user..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-9 bg-white border-slate-200 h-10"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* User Filter */}
                    <div className="relative flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-400 absolute left-3 pointer-events-none" />
                        <select
                            className="h-10 pl-9 pr-4 rounded-md border border-slate-200 bg-white text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[200px]"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                        >
                            <option value="all">All Members</option>
                            {usersWithApprovedLogs.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 font-medium">
                        Showing <span className="font-bold text-slate-800">{filteredLogs.length}</span> approved log{filteredLogs.length !== 1 ? 's' : ''}
                        {selectedUserId !== 'all' && (
                            <span> for <span className="font-bold text-slate-800">{usersWithApprovedLogs.find(u => u.id === selectedUserId)?.name}</span></span>
                        )}
                    </p>
                    {(searchQuery || selectedUserId !== 'all') && (
                        <button
                            onClick={() => { setSearchQuery(''); setSelectedUserId('all'); }}
                            className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 flex items-center gap-1"
                        >
                            <X className="h-3 w-3" /> Clear filters
                        </button>
                    )}
                </div>

                {/* Logs Table */}
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    {filteredLogs.length === 0 ? (
                        <div className="p-16 flex flex-col items-center gap-3 text-slate-400">
                            <CheckCircle2 className="h-12 w-12 opacity-20" />
                            <div className="text-center">
                                <p className="font-semibold text-slate-600">No approved logs found</p>
                                <p className="text-sm mt-1">Try adjusting the period, filters, or search query.</p>
                            </div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50/70">
                                <TableRow>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Date</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider">User</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider">Hours</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider">Work Type</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider">Tickets</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider">Summary</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.map((log) => {
                                    const user = users.find(u => u.id === log.userId);
                                    const dept = (user as any)?.departments?.[0] || user?.department;
                                    return (
                                        <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            {/* Date */}
                                            <TableCell className="py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800">
                                                        {parseLocalDate(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {parseLocalDate(log.date).getFullYear()}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* User */}
                                            <TableCell>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {log.userName.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-800 truncate">{log.userName}</p>
                                                        {dept && (
                                                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{dept}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Hours */}
                                            <TableCell>
                                                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 font-bold text-sm">
                                                    {log.hours.toFixed(1)}h
                                                </Badge>
                                            </TableCell>

                                            {/* Work Type */}
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-[10px] font-bold uppercase tracking-wider",
                                                        WORK_TYPE_COLORS[log.workType] || WORK_TYPE_COLORS.other
                                                    )}
                                                >
                                                    <Briefcase className="h-2.5 w-2.5 mr-1" />
                                                    {WORK_TYPE_LABELS[log.workType] || log.workType}
                                                </Badge>
                                            </TableCell>

                                            {/* Jira Tickets */}
                                            <TableCell>
                                                {log.jiraTickets && log.jiraTickets.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {log.jiraTickets.slice(0, 2).map(ticket => (
                                                            <Badge
                                                                key={ticket}
                                                                variant="outline"
                                                                className="text-[10px] font-bold text-blue-700 border-blue-200 bg-blue-50 py-0"
                                                            >
                                                                {ticket}
                                                            </Badge>
                                                        ))}
                                                        {log.jiraTickets.length > 2 && (
                                                            <Badge variant="outline" className="text-[10px] font-bold text-slate-500 py-0">
                                                                +{log.jiraTickets.length - 2}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 text-xs italic">—</span>
                                                )}
                                            </TableCell>

                                            {/* Summary */}
                                            <TableCell className="max-w-xs">
                                                <p className="text-sm text-slate-600 line-clamp-2 leading-snug">
                                                    {log.summary}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </Card>

                {/* Footer padding */}
                <div className="pb-8" />
            </div>
        </div>
    );
}
