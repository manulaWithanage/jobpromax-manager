"use client";

import React, { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useTimeLog } from "@/context/TimeLogContext";
import { useProject } from "@/context/ProjectContext";
import { TimeLogTable } from "@/components/timesheets/TimeLogTable";
import { TimeEntryForm } from "@/components/timesheets/TimeEntryForm";
import { useRole } from "@/context/RoleContext";
import AccessDenied from "@/components/auth/AccessDenied";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ShieldCheck, UserCheck, Clock, Users, AlertCircle, History as HistoryIcon, Plus, Minus, ChevronRight, ArrowLeft, BarChart3, FileDown, Calculator, PieChart as PieIcon, TrendingUp, Settings, Calendar } from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";

export default function ManagerTimesheetsPage() {
    const { isManager, isLoading: isRoleLoading } = useRole();
    const { logs, updateLogStatus } = useTimeLog();
    const { users, updateUser, refreshData } = useProject();
    const router = useRouter(); // Using router for navigation

    const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
    const [selectedDevId, setSelectedDevId] = useState<string | null>(null);
    const [showDevSettings, setShowDevSettings] = useState(false);

    // Date filtering state for individual history
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const formatYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const [filterStart, setFilterStart] = useState<string>(formatYMD(firstDay));
    const [filterEnd, setFilterEnd] = useState<string>(formatYMD(lastDay));
    const [showAllTime, setShowAllTime] = useState(false);

    // Robustly identify developers (from users list + those who have logs)
    const developers = useMemo(() => {
        const knownDevs = users.filter(u => u.role === 'developer');

        // Find developers in logs who aren't in the project users list
        const logUsers = logs.reduce((acc, log) => {
            if (!users.find(u => u.id === log.userId) && !acc.find(u => u.id === log.userId)) {
                acc.push({
                    id: log.userId,
                    name: log.userName,
                    email: "",
                    role: "developer" as any
                });
            }
            return acc;
        }, [] as any[]);

        return [...knownDevs, ...logUsers];
    }, [users, logs]);

    const selectedDev = useMemo(() => {
        const dev = developers.find(d => d.id === selectedDevId);
        console.log('[ManagerTimesheets] selectedDev:', dev);
        return dev;
    }, [developers, selectedDevId]);

    const [modalHourlyRate, setModalHourlyRate] = useState<number>(0);
    const [modalDept, setModalDept] = useState<string>("");
    const [modalDailyHours, setModalDailyHours] = useState<number>(8);

    // Sync modal state when it opens or developer changes
    useEffect(() => {
        if (showDevSettings && selectedDev) {
            console.log('[ManagerTimesheets] Syncing modal state for:', selectedDev.name);
            console.log('[ManagerTimesheets] Current values:', {
                hourlyRate: selectedDev.hourlyRate,
                department: selectedDev.department,
                dailyHoursTarget: selectedDev.dailyHoursTarget
            });
            setModalHourlyRate(selectedDev.hourlyRate || 0);
            setModalDept(selectedDev.department || "");
            setModalDailyHours(selectedDev.dailyHoursTarget || 8);
        }
    }, [showDevSettings, selectedDevId, selectedDev]);


    // Global Filtered Logs (Applies to the entire page)
    const globalFilteredLogs = useMemo(() => {
        if (showAllTime) return logs;
        return logs.filter(log => log.date >= filterStart && log.date <= filterEnd);
    }, [logs, filterStart, filterEnd, showAllTime]);

    // Aggregated Metrics (Filtered)
    const pendingLogs = globalFilteredLogs.filter(l => l.status === 'pending');
    const approvedLogs = globalFilteredLogs.filter(l => l.status === 'approved');
    const totalTeamHours = approvedLogs.reduce((sum, l) => sum + l.hours, 0);
    const activeDevCount = new Set(globalFilteredLogs.map(l => l.userId)).size;

    // Financial Aggregates for Team
    const teamFinancials = useMemo(() => {
        return developers.reduce((acc, dev) => {
            const devLogs = globalFilteredLogs.filter(l => l.userId === dev.id);
            const approved = devLogs.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.hours, 0);
            const pending = devLogs.filter(l => l.status === 'pending').reduce((sum, l) => sum + l.hours, 0);
            const rate = dev.hourlyRate || 0;

            return {
                totalPayout: acc.totalPayout + (approved * rate),
                totalPendingValue: acc.totalPendingValue + (pending * rate)
            };
        }, { totalPayout: 0, totalPendingValue: 0 });
    }, [developers, globalFilteredLogs]);

    // Aggregates per developer (Filtered)
    const devStats = developers.map(dev => {
        const devLogs = globalFilteredLogs.filter(l => l.userId === dev.id);
        const approved = devLogs.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.hours, 0);
        const pending = devLogs.filter(l => l.status === 'pending').reduce((sum, l) => sum + l.hours, 0);
        const latestLog = devLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        return {
            ...dev,
            approvedHours: approved,
            pendingHours: pending,
            totalHours: approved + pending,
            lastActivity: latestLog?.date || 'No activity'
        };
    });

    const selectedDevLogs = useMemo(() => {
        return globalFilteredLogs
            .filter(l => l.userId === selectedDevId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [globalFilteredLogs, selectedDevId]);

    const filteredStats = useMemo(() => {
        if (!selectedDevId) return { approved: 0, pending: 0 };
        return {
            approved: selectedDevLogs.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.hours, 0),
            pending: selectedDevLogs.filter(l => l.status === 'pending').reduce((sum, l) => sum + l.hours, 0)
        };
    }, [selectedDevLogs, selectedDevId]);

    const financialStats = useMemo(() => {
        const rate = selectedDev?.hourlyRate || 0;
        return {
            payout: filteredStats.approved * rate,
            pendingValue: filteredStats.pending * rate
        };
    }, [filteredStats, selectedDev]);

    // Performance Data Calculation
    const chartData = useMemo(() => {
        if (!selectedDevId) return { daily: [], distribution: [] };

        // Daily Productivity (Last 14 days of activity)
        const dailyMap: Record<string, number> = {};
        selectedDevLogs.forEach(log => {
            const date = log.date;
            dailyMap[date] = (dailyMap[date] || 0) + log.hours;
        });

        const daily = Object.entries(dailyMap)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .slice(-10) // Show last 10 days of entries
            .map(([date, hours]) => ({
                name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                hours
            }));

        // Ticket Distribution
        const ticketMap: Record<string, number> = {};
        selectedDevLogs.forEach(log => {
            const ticket = (log.jiraTickets && log.jiraTickets.length > 0)
                ? log.jiraTickets[0]
                : ((log as any).jiraTicket || "Other");
            ticketMap[ticket] = (ticketMap[ticket] || 0) + log.hours;
        });

        const distribution = Object.entries(ticketMap).map(([name, value]) => ({ name, value }));

        return { daily, distribution };
    }, [selectedDevLogs, selectedDevId]);

    const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

    if (isRoleLoading) return <div className="p-12 text-center text-slate-500">Loading access rights...</div>;
    if (!isManager) return <AccessDenied />;

    return (
        <div className="bg-slate-50/50 min-h-screen p-8 lg:p-12">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {selectedDevId ? (
                            <Button
                                variant="ghost"
                                onClick={() => setSelectedDevId(null)}
                                className="p-2 h-auto hover:bg-white"
                            >
                                <ArrowLeft className="h-6 w-6 text-slate-400" />
                            </Button>
                        ) : (
                            <div className="p-3 bg-purple-600 rounded-2xl shadow-lg shadow-purple-200">
                                <ShieldCheck className="h-8 w-8 text-white" />
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                                    {selectedDev ? `${selectedDev.name}'s Timesheets` : "Team Timesheets"}
                                </h1>
                                {selectedDevId && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowDevSettings(!showDevSettings)}
                                        className={cn(
                                            "rounded-full h-8 w-8 transition-all",
                                            showDevSettings ? "bg-purple-50 text-purple-600 rotate-90" : "text-slate-400"
                                        )}
                                    >
                                        <Settings className="h-5 w-5" />
                                    </Button>
                                )}
                            </div>
                            <p className="text-slate-500">
                                {selectedDev ? `Detailed audit and history for ${selectedDev.name}.` : "Review, approve, and audit developer time logs."}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/manager/performance')}
                            className="border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Team Performance
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/manager/timesheets/export')}
                            className="border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                            <FileDown className="h-4 w-4 mr-2" />
                            Export Reports
                        </Button>
                        <Button
                            onClick={() => setIsManualEntryOpen(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200 px-6"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {selectedDevId ? `Log Time for ${selectedDev?.name.split(' ')[0]}` : "Log Team Time"}
                        </Button>
                    </div>
                </div>

                {/* Master Period Controller */}
                <Card className="border-none shadow-sm bg-white p-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-50 rounded-lg">
                                <Calendar className="h-4 w-4 text-slate-400" />
                            </div>
                            <div>
                                <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Active Audit Period</h2>
                                <p className="text-[10px] text-slate-400 font-medium">All charts and stats respect this range</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 pr-3 border-r border-slate-100">
                                <input
                                    type="checkbox"
                                    id="showAllTime"
                                    checked={showAllTime}
                                    onChange={(e) => setShowAllTime(e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                />
                                <Label htmlFor="showAllTime" className="text-xs font-bold text-slate-600 cursor-pointer">All Time</Label>
                            </div>

                            {!showAllTime ? (
                                <div className="flex items-center gap-2 transition-all duration-300">
                                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 focus-within:ring-2 focus-within:ring-purple-200">
                                        <Calendar className="h-3 w-3 text-slate-400" />
                                        <input
                                            type="date"
                                            value={filterStart}
                                            onChange={(e) => setFilterStart(e.target.value)}
                                            className="bg-transparent border-none text-xs font-bold text-slate-600 outline-none focus:ring-0"
                                        />
                                    </div>
                                    <span className="text-slate-300 text-xs">to</span>
                                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 focus-within:ring-2 focus-within:ring-purple-200">
                                        <Calendar className="h-3 w-3 text-slate-400" />
                                        <input
                                            type="date"
                                            value={filterEnd}
                                            onChange={(e) => setFilterEnd(e.target.value)}
                                            className="bg-transparent border-none text-xs font-bold text-slate-600 outline-none focus:ring-0"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 opacity-40 cursor-not-allowed transition-all duration-300">
                                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                        <Calendar className="h-3 w-3 text-slate-400" />
                                        <span className="text-xs font-bold text-slate-400">Range Start</span>
                                    </div>
                                    <span className="text-slate-300 text-xs text-slate-400">to</span>
                                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                        <Calendar className="h-3 w-3 text-slate-400" />
                                        <span className="text-xs font-bold text-slate-400">Range End</span>
                                    </div>
                                </div>
                            )}

                            {showAllTime && (
                                <span className="text-xs font-bold text-slate-400 px-4">
                                    Full historical data
                                </span>
                            )}
                        </div>
                    </div>
                </Card>

                {!selectedDevId ? (
                    <>
                        {/* Team Level View */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="border-none shadow-sm bg-white border-l-4 border-l-blue-500">
                                <CardHeader className="pb-2">
                                    <CardDescription className="flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4" /> Team Capacity
                                    </CardDescription>
                                    <CardTitle className="text-2xl font-black">{totalTeamHours.toFixed(1)}h</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-slate-400">Total approved hours</p>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-sm bg-white border-l-4 border-l-amber-500">
                                <CardHeader className="pb-2">
                                    <CardDescription className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" /> Team Pending
                                    </CardDescription>
                                    <CardTitle className="text-2xl font-black">{pendingLogs.length}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-slate-400">Logs awaiting review</p>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-sm bg-white border-l-4 border-l-emerald-500">
                                <CardHeader className="pb-2">
                                    <CardDescription className="flex items-center gap-2">
                                        <UserCheck className="h-4 w-4" /> Active Now
                                    </CardDescription>
                                    <CardTitle className="text-2xl font-black">{activeDevCount}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-slate-400">Members with logs</p>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-sm bg-white border-l-4 border-l-indigo-600 bg-indigo-50/20">
                                <CardHeader className="pb-2">
                                    <CardDescription className="flex items-center gap-2 text-indigo-600">
                                        <Calculator className="h-4 w-4" /> Team Billing
                                    </CardDescription>
                                    <CardTitle className="text-2xl font-black text-indigo-700">${teamFinancials.totalPayout.toLocaleString()}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-indigo-400 font-medium">Estimated payout total</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Team Overview Table */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Users className="h-5 w-5 text-slate-400" /> Member Overview
                            </h2>
                            <Card className="border-none shadow-sm overflow-hidden bg-white">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow>
                                            <TableHead>Developer</TableHead>
                                            <TableHead>Department</TableHead>
                                            <TableHead>Approved Hours</TableHead>
                                            <TableHead>Pending Hours</TableHead>
                                            <TableHead>Hourly Rate</TableHead>
                                            <TableHead>Last Activity</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {devStats.map((dev) => (
                                            <TableRow key={dev.id} className="hover:bg-slate-50/50 cursor-pointer transition-colors" onClick={() => setSelectedDevId(dev.id)}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 text-xs font-bold">
                                                            {dev.name.charAt(0)}
                                                        </div>
                                                        {dev.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {dev.department ? (
                                                        <Badge variant="outline" className={cn(
                                                            "font-bold text-[10px] uppercase tracking-wider px-2 py-0.5",
                                                            dev.department === 'Frontend' && "border-blue-200 text-blue-600 bg-blue-50",
                                                            dev.department === 'Backend' && "border-indigo-200 text-indigo-600 bg-indigo-50",
                                                            dev.department === 'Marketing' && "border-pink-200 text-pink-600 bg-pink-50",
                                                            dev.department === 'Customer Success' && "border-emerald-200 text-emerald-600 bg-emerald-50",
                                                            dev.department === 'Management' && "border-purple-200 text-purple-600 bg-purple-50"
                                                        )}>
                                                            {dev.department}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-slate-300 text-xs italic">Not set</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none font-bold">
                                                        {dev.approvedHours.toFixed(1)}h
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-none font-bold">
                                                        {dev.pendingHours.toFixed(1)}h
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-slate-600 font-medium">
                                                        {dev.hourlyRate ? `$${dev.hourlyRate}/hr` : '--'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-sm">{dev.lastActivity}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold gap-1">
                                                        View Details <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>

                        {/* Recent Team Action Items (Global Pending) */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-amber-500" /> Critical Approval Queue
                                {pendingLogs.length > 0 && (
                                    <Badge className="bg-amber-100 text-amber-700 ml-2">{pendingLogs.length} Action Needed</Badge>
                                )}
                            </h2>
                            <TimeLogTable
                                logs={pendingLogs}
                                showApprovalActions={true}
                                onApprove={(id) => updateLogStatus(id, 'approved')}
                                onReject={(id, comment) => updateLogStatus(id, 'rejected', comment)}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        {/* Individual Drilldown View */}
                        {/* Member Settings Dialog (Popup) */}
                        <Dialog open={showDevSettings} onOpenChange={setShowDevSettings}>
                            <DialogContent className="sm:max-w-[400px] p-6 bg-white border-none shadow-2xl rounded-2xl">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                        <div className="h-10 w-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                                            <Settings className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-800">Member Settings</h2>
                                            <p className="text-xs text-slate-500">Update configuration for {selectedDev?.name}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Department Setting */}
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                <ShieldCheck className="h-3 w-3" /> Specialization / Department
                                            </Label>
                                            <select
                                                className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-200 transition-all outline-none cursor-pointer hover:bg-slate-100"
                                                value={modalDept}
                                                onChange={(e) => setModalDept(e.target.value)}
                                            >
                                                <option value="" disabled>Select Department</option>
                                                <option value="Frontend">Frontend Development</option>
                                                <option value="Backend">Backend Development</option>
                                                <option value="Marketing">Marketing & Growth</option>
                                                <option value="Customer Success">Customer Success</option>
                                                <option value="Management">Management</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                <Calculator className="h-3 w-3" /> Standard Hourly Rate
                                            </Label>
                                            <div className="flex items-center gap-2">
                                                <div className="group relative flex-1 flex items-center">
                                                    <div className="absolute left-4 pointer-events-none flex items-center">
                                                        <span className="text-slate-400 font-bold text-sm">$</span>
                                                    </div>
                                                    <Input
                                                        type="number"
                                                        className="h-12 pl-8 pr-20 w-full border-none bg-slate-50 font-black text-slate-700 text-base rounded-xl focus-visible:ring-2 focus-visible:ring-purple-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                                                        placeholder="0.00"
                                                        value={modalHourlyRate}
                                                        onChange={(e) => setModalHourlyRate(parseFloat(e.target.value) || 0)}
                                                    />
                                                    <div className="absolute right-4 pointer-events-none flex items-center">
                                                        <span className="text-slate-300 text-[10px] font-black uppercase tracking-tighter">USD / HR</span>
                                                    </div>
                                                </div>

                                                {/* Custom Stepper Buttons */}
                                                <div className="flex flex-col gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-[23px] w-8 rounded-md border-slate-200 text-slate-400 hover:text-purple-600 hover:border-purple-200 transition-all"
                                                        onClick={() => setModalHourlyRate(prev => prev + 1)}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-[23px] w-8 rounded-md border-slate-200 text-slate-400 hover:text-purple-600 hover:border-purple-200 transition-all"
                                                        onClick={() => setModalHourlyRate(prev => Math.max(0, prev - 1))}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Daily Hours Target Setting */}
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> Daily Hours Target
                                            </Label>
                                            <div className="flex items-center gap-2">
                                                <div className="group relative flex-1 flex items-center">
                                                    <Input
                                                        type="number"
                                                        className="h-12 px-4 pr-20 w-full border-none bg-slate-50 font-black text-slate-700 text-base rounded-xl focus-visible:ring-2 focus-visible:ring-purple-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                                                        placeholder="8"
                                                        value={modalDailyHours}
                                                        onChange={(e) => setModalDailyHours(parseFloat(e.target.value) || 8)}
                                                        min="0"
                                                        max="24"
                                                        step="0.5"
                                                    />
                                                    <div className="absolute right-4 pointer-events-none flex items-center">
                                                        <span className="text-slate-300 text-[10px] font-black uppercase tracking-tighter">HOURS / DAY</span>
                                                    </div>
                                                </div>

                                                {/* Custom Stepper Buttons */}
                                                <div className="flex flex-col gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-[23px] w-8 rounded-md border-slate-200 text-slate-400 hover:text-purple-600 hover:border-purple-200 transition-all"
                                                        onClick={() => setModalDailyHours(prev => Math.min(24, prev + 0.5))}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-[23px] w-8 rounded-md border-slate-200 text-slate-400 hover:text-purple-600 hover:border-purple-200 transition-all"
                                                        onClick={() => setModalDailyHours(prev => Math.max(0, prev - 0.5))}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            className="w-full bg-slate-900 hover:bg-black text-white rounded-xl h-11 font-bold shadow-lg shadow-slate-200"
                                            onClick={async () => {
                                                if (selectedDevId) {
                                                    try {
                                                        const updates: Partial<any> = {};

                                                        // Only include hourlyRate if it's a valid number
                                                        if (modalHourlyRate !== undefined && modalHourlyRate >= 0) {
                                                            updates.hourlyRate = modalHourlyRate;
                                                        }

                                                        // Only include department if it's not empty
                                                        if (modalDept && modalDept !== '') {
                                                            updates.department = modalDept;
                                                        }

                                                        // Only include dailyHoursTarget if it's a valid number
                                                        if (modalDailyHours !== undefined && modalDailyHours >= 0 && modalDailyHours <= 24) {
                                                            updates.dailyHoursTarget = modalDailyHours;
                                                        }

                                                        console.log('[UI] Saving with updates:', updates);
                                                        console.log('[UI] Selected Dev ID:', selectedDevId);

                                                        await updateUser(selectedDevId, updates);

                                                        // Refresh data to ensure UI reflects database state
                                                        console.log('[UI] Refreshing data after save...');
                                                        await refreshData();

                                                        setShowDevSettings(false);
                                                        console.log('[UI] Save completed successfully');
                                                    } catch (error) {
                                                        console.error('[UI] Failed to update user settings:', error);
                                                        alert(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
                                                    }
                                                }
                                            }}
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Performance & Insights Section */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-blue-500" /> Performance & Insights
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Approved Card */}
                                <Card className="border-none shadow-sm bg-white border-l-4 border-l-emerald-500">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 font-bold shrink-0">
                                            {filteredStats.approved.toFixed(1)}h
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved</p>
                                            <p className="text-xs font-semibold text-slate-600 truncate">Period Total</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Pending Card */}
                                <Card className="border-none shadow-sm bg-white border-l-4 border-l-amber-500">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 font-bold shrink-0">
                                            {filteredStats.pending.toFixed(1)}h
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending</p>
                                            <p className="text-xs font-semibold text-slate-600 truncate">Awaiting Review</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Log Entries Card */}
                                <Card className="border-none shadow-sm bg-white border-l-4 border-l-blue-500">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold shrink-0">
                                            {selectedDevLogs.length}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entries</p>
                                            <p className="text-xs font-semibold text-slate-600 truncate">Records in Range</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Financial Insight Card */}
                                <Card className={cn(
                                    "border-none shadow-sm bg-white border-l-4 transition-all hover:shadow-md",
                                    financialStats.payout > 0 ? "border-l-indigo-600 bg-indigo-50/30" : "border-l-slate-200 bg-slate-50 opacity-80"
                                )}>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className={cn(
                                            "h-10 w-10 rounded-lg flex items-center justify-center font-black shrink-0 text-xs",
                                            financialStats.payout > 0 ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-400"
                                        )}>
                                            ${financialStats.payout.toFixed(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Payout</p>
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <p className={cn("text-xs font-semibold truncate", financialStats.payout > 0 ? "text-indigo-700" : "text-slate-500")}>
                                                    Approved Billing
                                                </p>
                                                {financialStats.payout === 0 && (selectedDev?.hourlyRate || 0) === 0 && (
                                                    <Badge variant="outline" className="text-[8px] h-3 px-1 border-slate-200 text-slate-400 font-bold bg-white">RATE NOT SET</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Daily Productivity Chart */}
                                <Card className="border-none shadow-sm bg-white p-6 relative overflow-hidden">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Daily Productivity (Last 10 Entries)</h3>
                                    {chartData.daily.length > 0 ? (
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartData.daily}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis
                                                        dataKey="name"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                        dy={10}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                    />
                                                    <ReTooltip
                                                        cursor={{ fill: '#f8fafc' }}
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Bar
                                                        dataKey="hours"
                                                        fill="#3b82f6"
                                                        radius={[4, 4, 0, 0]}
                                                        barSize={32}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="h-[250px] w-full flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-50 rounded-xl">
                                            <BarChart3 className="h-8 w-8 opacity-20" />
                                            <p className="text-xs font-medium">No productivity data recorded for this period</p>
                                        </div>
                                    )}
                                </Card>

                                {/* Ticket Distribution Chart */}
                                <Card className="border-none shadow-sm bg-white p-6 relative overflow-hidden">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Ticket Workload Distribution</h3>
                                    {chartData.distribution.length > 0 ? (
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={chartData.distribution}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {chartData.distribution.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <ReTooltip
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Legend
                                                        verticalAlign="bottom"
                                                        height={36}
                                                        iconType="circle"
                                                        formatter={(value) => <span className="text-xs font-medium text-slate-600">{value}</span>}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="h-[250px] w-full flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-50 rounded-xl">
                                            <PieIcon className="h-8 w-8 opacity-20" />
                                            <p className="text-xs font-medium">No ticket assignments in this range</p>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <HistoryIcon className="h-5 w-5 text-slate-400" />
                                    {showAllTime ? "Complete Log History" : `Log History (${new Date(filterStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(filterEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`}
                                </h2>
                            </div>
                            <TimeLogTable
                                logs={selectedDevLogs}
                                showApprovalActions={true}
                                onApprove={(id) => updateLogStatus(id, 'approved')}
                                onReject={(id, comment) => updateLogStatus(id, 'rejected', comment)}
                            />
                        </div>

                    </>
                )}
            </div>

            {/* Popup Modal for Manual Entry (Global) */}
            <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 border-none bg-transparent rounded-2xl overflow-hidden shadow-2xl">
                    <TimeEntryForm
                        showDeveloperSelect={true}
                        defaultDeveloperId={selectedDevId || undefined}
                        onSuccess={() => setIsManualEntryOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
