"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTimeLog } from "@/context/TimeLogContext";
import { TimeEntryForm } from "@/components/timesheets/TimeEntryForm";
import { TimeLogTable } from "@/components/timesheets/TimeLogTable";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { LiveTimer } from "@/components/timesheets/LiveTimer";
import { TimesheetInsights } from "@/components/timesheets/TimesheetInsights";
import { TimeLog } from "@/types";
import { Plus, History as HistoryIcon, Clock, FileSpreadsheet, Zap, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export default function TimesheetsPage() {
    const today = new Date();
    const { user } = useAuth();
    const { getLogsByUser, deleteLog } = useTimeLog();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingLog, setEditingLog] = useState<TimeLog | null>(null);

    // Filtering State
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [viewPeriod, setViewPeriod] = useState<'all' | 'p1' | 'p2' | 'all_time'>('all');

    const userLogs = user ? getLogsByUser(user.id) : [];

    // Filtering Logic
    const filteredLogs = useMemo(() => {
        if (viewPeriod === 'all_time') return userLogs;

        return userLogs.filter(log => {
            const logDate = new Date(log.date);
            const isSameMonth = logDate.getMonth() === selectedMonth && logDate.getFullYear() === selectedYear;

            if (!isSameMonth) return false;

            if (viewPeriod === 'p1') {
                return logDate.getDate() <= 15;
            } else if (viewPeriod === 'p2') {
                return logDate.getDate() >= 16;
            }

            return true;
        });
    }, [userLogs, selectedMonth, selectedYear, viewPeriod]);

    const totalHours = filteredLogs.reduce((sum, log) => sum + (log.status === 'approved' ? log.hours : 0), 0);
    const pendingHours = filteredLogs.reduce((sum, log) => sum + (log.status === 'pending' ? log.hours : 0), 0);

    return (
        <div className="bg-slate-50/50 min-h-screen p-4 md:p-8 lg:p-12">
            <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                            <Clock className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">My Timesheets</h1>
                            <p className="text-sm md:text-base text-slate-500">Log your daily tasks and track approval status.</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 px-6"
                    >
                        {isFormOpen ? "Close Form" : <><Plus className="h-4 w-4 mr-2" /> New Time Log</>}
                    </Button>
                </div>

                {/* Popup Modal */}
                <Dialog open={isFormOpen || !!editingLog} onOpenChange={(open) => {
                    if (!open) {
                        setIsFormOpen(false);
                        setEditingLog(null);
                    } else {
                        setIsFormOpen(true);
                    }
                }}>
                    <DialogContent className="sm:min-w-[700px] sm:max-w-[900px] p-0 border-none bg-transparent">
                        <TimeEntryForm
                            initialData={editingLog || undefined}
                            onSuccess={() => {
                                setIsFormOpen(false);
                                setEditingLog(null);
                            }}
                        />
                    </DialogContent>
                </Dialog>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                <HistoryIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Approved Hours</p>
                                <p className="text-2xl font-bold text-slate-900">{totalHours.toFixed(1)}h</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Pending Approval</p>
                                <p className="text-2xl font-bold text-slate-900">{pendingHours.toFixed(1)}h</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                <FileSpreadsheet className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total Entries</p>
                                <p className="text-2xl font-bold text-slate-900">{userLogs.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Productivity Insights */}
                <TimesheetInsights logs={userLogs} />

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Logs */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-none shadow-sm bg-white">
                            <CardHeader className="flex flex-col space-y-4 pb-4 border-b border-slate-50">
                                <div className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <HistoryIcon className="h-5 w-5 text-slate-400" /> Recent Activity
                                    </CardTitle>

                                    <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-xl border border-slate-200">
                                        {(['all', 'p1', 'p2', 'all_time'] as const).map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => setViewPeriod(p)}
                                                className={cn(
                                                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                                    viewPeriod === p
                                                        ? "bg-white text-blue-600 shadow-sm"
                                                        : "text-slate-500 hover:text-slate-700"
                                                )}
                                            >
                                                {p === 'all' ? 'Month' : p === 'all_time' ? 'All Time' : p.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Calendar className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">
                                            {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => {
                                                if (selectedMonth === 0) {
                                                    setSelectedMonth(11);
                                                    setSelectedYear(prev => prev - 1);
                                                } else {
                                                    setSelectedMonth(prev => prev - 1);
                                                }
                                            }}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => {
                                                if (selectedMonth === 11) {
                                                    setSelectedMonth(0);
                                                    setSelectedYear(prev => prev + 1);
                                                } else {
                                                    setSelectedMonth(prev => prev + 1);
                                                }
                                            }}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <TimeLogTable
                                    logs={filteredLogs}
                                    onDelete={(id) => deleteLog(id)}
                                    onEdit={(log) => setEditingLog(log)}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Widgets */}
                    <div className="space-y-6">
                        {/* Live Timer Widget */}
                        <LiveTimer
                            onApplyTime={(hours) => {
                                // This will be handled by opening the form and pre-filling it
                                setIsFormOpen(true);
                                // We can use a small delay or a ref to pass this to the form
                                // For now, we'll use a custom event or session storage
                                sessionStorage.setItem("pending_timer_hours", hours.toString());
                                window.dispatchEvent(new Event("apply_timer_hours"));
                            }}
                        />

                        {/* Quick Templates Placeholder */}
                        <Card className="border-none shadow-sm bg-white">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-500 uppercase tracking-wider">
                                    <Zap className="h-4 w-4 text-amber-500" /> Quick Templates
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {userLogs.slice(0, 3).map((log, i) => (
                                        <button
                                            key={i}
                                            className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
                                            onClick={() => {
                                                setIsFormOpen(true);
                                                sessionStorage.setItem("pending_template", JSON.stringify({
                                                    jiraTickets: log.jiraTickets && log.jiraTickets.length > 0 ? log.jiraTickets : ((log as any).jiraTicket ? [(log as any).jiraTicket] : []),
                                                    summary: log.summary,
                                                    workType: log.workType
                                                }));
                                                window.dispatchEvent(new Event("apply_template"));
                                            }}
                                        >
                                            <div className="flex flex-wrap gap-1 mb-1">
                                                {log.jiraTickets && log.jiraTickets.length > 0 ? (
                                                    log.jiraTickets.map(t => (
                                                        <span key={t} className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1 rounded">
                                                            {t}
                                                        </span>
                                                    ))
                                                ) : (log as any).jiraTicket ? (
                                                    <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1 rounded">
                                                        {(log as any).jiraTicket}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-400">No Ticket</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-700 line-clamp-1 group-hover:text-slate-900 transition-colors">
                                                {log.summary}
                                            </p>
                                        </button>
                                    ))}
                                    {userLogs.length === 0 && (
                                        <p className="text-xs text-slate-400 italic py-4 text-center">
                                            Log your first task to see templates here.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </div>
        </div>
    );
}
