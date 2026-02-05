"use client";

import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Calendar, Download, Zap, Calculator, Users, ArrowRight } from "lucide-react";
import { TimeLog, User } from "@/types";
import * as XLSX from "xlsx";

interface ExportReportsProps {
    logs: TimeLog[];
    developers: User[];
}

export function ExportReports({ logs, developers }: ExportReportsProps) {
    const today = new Date();

    // Explicitly track the targeted month/year for shortcuts
    const [targetYear, setTargetYear] = useState(today.getFullYear());
    const [targetMonth, setTargetMonth] = useState(today.getMonth()); // 0-11

    // State for the actual range
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [rates, setRates] = useState<Record<string, number>>({});

    // Helper to format numeric parts to YYYY-MM-DD
    const formatDate = (y: number, m: number, d: number) => {
        return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    };

    // Initialize range on mount or when target changes
    React.useEffect(() => {
        const first = formatDate(targetYear, targetMonth, 1);
        const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
        const last = formatDate(targetYear, targetMonth, lastDay);

        setStartDate(first);
        setEndDate(last);
    }, [targetYear, targetMonth]);

    const setP1 = () => {
        setStartDate(formatDate(targetYear, targetMonth, 1));
        setEndDate(formatDate(targetYear, targetMonth, 15));
    };

    const setP2 = () => {
        const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
        setStartDate(formatDate(targetYear, targetMonth, 16));
        setEndDate(formatDate(targetYear, targetMonth, lastDay));
    };

    // Simplified rates management - prioritizing persistent rates from context
    const [localRates, setLocalRates] = useState<Record<string, number>>({});

    const getRate = (userId: string) => {
        return localRates[userId] ?? developers.find(d => d.id === userId)?.hourlyRate ?? 0;
    };

    // Sync target month if user manually changes the start date
    const handleStartDateChange = (val: string) => {
        setStartDate(val);
        if (val) {
            const [y, m] = val.split('-').map(Number);
            if (!isNaN(y) && !isNaN(m)) {
                setTargetYear(y);
                setTargetMonth(m - 1);
            }
        }
    };

    const handleRateChange = (userId: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        setLocalRates(prev => ({ ...prev, [userId]: numValue }));
    };

    // Filter logs by date range and status (only approved for billing usually, but user might want all)
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const logDate = log.date;
            return logDate >= startDate && logDate <= endDate && log.status === 'approved';
        });
    }, [logs, startDate, endDate]);

    // Aggregate by developer
    const billingData = useMemo(() => {
        const data: Record<string, { userId: string, name: string, hours: number }> = {};

        filteredLogs.forEach(log => {
            if (!data[log.userId]) {
                data[log.userId] = { userId: log.userId, name: log.userName, hours: 0 };
            }
            data[log.userId].hours += log.hours;
        });

        return Object.values(data);
    }, [filteredLogs]);

    const totalHours = billingData.reduce((sum, item) => sum + item.hours, 0);
    const totalCharge = billingData.reduce((sum, item) => sum + (item.hours * getRate(item.userId)), 0);

    const exportToExcel = () => {
        const reportData = billingData.map(item => ({
            "Developer": item.name,
            "Period": `${startDate} to ${endDate}`,
            "Total Hours": item.hours,
            "Hourly Rate ($)": getRate(item.userId),
            "Total Charge ($)": item.hours * getRate(item.userId)
        }));

        const ws = XLSX.utils.json_to_sheet(reportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Timesheet Report");

        // Generate file name
        const fileName = `Timesheet_Report_${startDate}_to_${endDate}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <Card className="border-none shadow-lg bg-white overflow-hidden">
                <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                            <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-white text-lg">Export Financial Report</CardTitle>
                            <CardDescription className="text-slate-400">Select range and configure billing rates</CardDescription>
                        </div>
                    </div>
                </div>

                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Range Selection */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Zap className="h-4 w-4 text-amber-500" /> Period Selection
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start">Start Date</Label>
                                    <Input
                                        type="date"
                                        id="start"
                                        value={startDate}
                                        onChange={(e) => handleStartDateChange(e.target.value)}
                                        className="bg-slate-50 border-slate-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end">End Date</Label>
                                    <Input
                                        type="date"
                                        id="end"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-slate-50 border-slate-200"
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-900/5 rounded-xl p-3 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    Shortcuts for {new Date(targetYear, targetMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={setP1}
                                        className="h-8 text-blue-600 font-bold hover:bg-blue-50"
                                    >
                                        P1 (1-15)
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={setP2}
                                        className="h-8 text-blue-600 font-bold hover:bg-blue-50"
                                    >
                                        P2 (16-End)
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="bg-slate-50 rounded-2xl p-6 flex flex-col justify-center border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                    <Users className="h-4 w-4" /> Active Developers
                                </div>
                                <span className="font-bold text-slate-900">{billingData.length}</span>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-end justify-between border-b border-slate-200 pb-2">
                                    <span className="text-slate-500 text-sm">Total Approved Hours</span>
                                    <span className="text-xl font-black text-slate-900">{totalHours.toFixed(1)}h</span>
                                </div>
                                <div className="flex items-end justify-between pt-2">
                                    <span className="text-slate-500 text-sm font-bold flex items-center gap-2">
                                        <Calculator className="h-4 w-4 text-emerald-500" /> Total Charge
                                    </span>
                                    <span className="text-2xl font-black text-emerald-600">${totalCharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Developer Rates Table */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-blue-500" /> Billing Configuration
                        </h3>
                        <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50/80">
                                    <TableRow>
                                        <TableHead className="w-[300px]">Developer</TableHead>
                                        <TableHead>Approved Hours</TableHead>
                                        <TableHead className="w-[150px]">Hourly Rate ($)</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {billingData.length > 0 ? (
                                        billingData.map((item) => (
                                            <TableRow key={item.userId}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 text-xs font-bold">
                                                            {item.name.charAt(0)}
                                                        </div>
                                                        {item.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none font-bold">
                                                        {item.hours.toFixed(1)}h
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                                                        <Input
                                                            type="number"
                                                            placeholder="0.00"
                                                            className="pl-6 h-9 transition-all focus:ring-emerald-500"
                                                            value={localRates[item.userId] ?? developers.find(d => d.id === item.userId)?.hourlyRate ?? ""}
                                                            onChange={(e) => handleRateChange(item.userId, e.target.value)}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-slate-900">
                                                    ${(item.hours * getRate(item.userId)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-slate-400">
                                                No approved logs found for this period.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="pt-8 flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => window.history.back()}
                            className="px-6 py-6 rounded-xl border-slate-200 text-slate-600 font-bold"
                        >
                            Back to Overview
                        </Button>
                        <Button
                            onClick={exportToExcel}
                            disabled={billingData.length === 0}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100 px-8 py-6 rounded-xl flex items-center gap-3 active:scale-95 transition-all"
                        >
                            <Download className="h-5 w-5" />
                            <div className="text-left">
                                <div className="text-sm font-bold">Export to Excel</div>
                                <div className="text-[10px] opacity-70 uppercase tracking-widest font-black">Generate .xlsx file</div>
                            </div>
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
