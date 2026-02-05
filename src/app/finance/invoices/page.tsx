"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRole } from "@/context/RoleContext";
import AccessDenied from "@/components/auth/AccessDenied";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";
import {
    Receipt, ArrowLeft, Check, Clock, DollarSign, Users,
    Building2, AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getPaymentRecords, markPaymentAsPaid, markPaymentAsPending, PaymentRecord } from "@/lib/actions/finance";
import { BankDetailsModal } from "@/components/finance/BankDetailsModal";

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

type PeriodType = 'P1' | 'P2' | 'all';

export default function TeamInvoicesPage() {
    const { isManager, isFinance, isLoading: isRoleLoading, user } = useRole();
    const router = useRouter();

    const now = new Date();
    const currentDay = now.getDate();

    // Auto-select period based on current date
    const defaultPeriod: PeriodType = currentDay <= 15 ? 'P1' : 'P2';

    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>(defaultPeriod);
    const [records, setRecords] = useState<PaymentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    // State for bank details modal
    const [viewingBankDetails, setViewingBankDetails] = useState<PaymentRecord | null>(null);

    // Quick month presets
    const monthPresets = useMemo(() => {
        const presets = [];
        for (let i = 0; i < 3; i++) {
            let m = now.getMonth() + 1 - i;
            let y = now.getFullYear();
            if (m <= 0) {
                m += 12;
                y -= 1;
            }
            const label = i === 0 ? 'This Month' : i === 1 ? 'Last Month' : '2 Months Ago';
            presets.push({ month: m, year: y, label, short: MONTHS[m - 1].substring(0, 3) });
        }
        return presets;
    }, [now]);

    const loadRecords = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getPaymentRecords(
                selectedMonth,
                selectedYear,
                selectedPeriod === 'all' ? undefined : selectedPeriod
            );
            setRecords(data);
        } catch (err) {
            console.error('Failed to load records:', err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedMonth, selectedYear, selectedPeriod]);

    useEffect(() => {
        if (isManager || isFinance) {
            loadRecords();
        }
    }, [isManager, isFinance, loadRecords]);

    const handleTogglePayment = async (record: PaymentRecord) => {
        if (!user) return;
        setUpdating(record.id);
        try {
            if (record.status === 'pending') {
                await markPaymentAsPaid(record.userId, record.period, record.month, record.year, user.name);
            } else {
                await markPaymentAsPending(record.userId, record.period, record.month, record.year);
            }
            await loadRecords();
        } catch (err) {
            console.error('Failed to update payment:', err);
        } finally {
            setUpdating(null);
        }
    };

    const selectMonthPreset = (month: number, year: number) => {
        setSelectedMonth(month);
        setSelectedYear(year);
    };

    // Check if month preset is selected
    const isPresetActive = (month: number, year: number) => {
        return selectedMonth === month && selectedYear === year;
    };

    // Calculate totals
    const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
    const totalHours = records.reduce((sum, r) => sum + r.hours, 0);
    const paidAmount = records.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0);
    const pendingAmount = records.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);
    const uniqueMembers = new Set(records.map(r => r.userId)).size;

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
                    <Card className="border-none shadow-sm bg-white">
                        <SkeletonTable rows={3} cols={6} />
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
                                <Receipt className="h-7 w-7 text-emerald-600" />
                                Team Invoices
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Monthly payroll overview and payment tracking
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Month Selector */}
                <div className="flex flex-wrap gap-2">
                    {monthPresets.map((preset) => (
                        <Button
                            key={`${preset.month}-${preset.year}`}
                            variant={isPresetActive(preset.month, preset.year) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => selectMonthPreset(preset.month, preset.year)}
                            className={isPresetActive(preset.month, preset.year)
                                ? 'bg-slate-800 hover:bg-slate-900 text-white'
                                : 'border-slate-200'
                            }
                        >
                            {preset.label}
                        </Button>
                    ))}
                    <select
                        value={`${selectedYear}-${selectedMonth}`}
                        onChange={(e) => {
                            const [year, month] = e.target.value.split('-');
                            setSelectedYear(Number(year));
                            setSelectedMonth(Number(month));
                        }}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium bg-white"
                    >
                        {(() => {
                            const options = [];
                            const startYear = 2025;
                            const endYear = now.getFullYear() + 1;

                            for (let year = endYear; year >= startYear; year--) {
                                for (let month = 12; month >= 1; month--) {
                                    // Only include months up to current month for current year
                                    if (year === now.getFullYear() && month > now.getMonth() + 1) continue;

                                    options.push(
                                        <option key={`${year}-${month}`} value={`${year}-${month}`}>
                                            {MONTHS[month - 1]} {year}
                                        </option>
                                    );
                                }
                            }
                            return options;
                        })()}
                    </select>
                </div>

                {/* Period Selector */}
                <div className="flex gap-2">
                    {([
                        { key: 'P1' as PeriodType, label: 'P1 (1-15)' },
                        { key: 'P2' as PeriodType, label: 'P2 (16-End)' },
                        { key: 'all' as PeriodType, label: 'Full Month' }
                    ]).map(({ key, label }) => (
                        <Button
                            key={key}
                            variant={selectedPeriod === key ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedPeriod(key)}
                            className={selectedPeriod === key
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'border-slate-200'
                            }
                        >
                            {label}
                        </Button>
                    ))}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <DollarSign className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Total Payroll</p>
                                    <p className="text-2xl font-bold text-slate-900">${totalAmount.toFixed(2)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

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
                                    <Check className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Paid</p>
                                    <p className="text-2xl font-bold text-green-600">${paidAmount.toFixed(2)}</p>
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
                                    <p className="text-2xl font-bold text-amber-600">${pendingAmount.toFixed(2)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Members Table */}
                <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Users className="h-5 w-5 text-slate-400" />
                            Member Breakdown
                            <Badge variant="outline" className="ml-2">{uniqueMembers} members</Badge>
                        </CardTitle>
                    </CardHeader>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="font-semibold w-[25%] lg:w-[30%]">Member</TableHead>
                                <TableHead className="font-semibold text-center w-[100px]">Period</TableHead>
                                <TableHead className="font-semibold text-right w-[100px]">Hours</TableHead>
                                <TableHead className="font-semibold text-right w-[120px]">Rate</TableHead>
                                <TableHead className="font-semibold text-right w-[120px]">Amount</TableHead>
                                <TableHead className="font-semibold text-center w-[120px]">Bank</TableHead>
                                <TableHead className="font-semibold text-right w-[180px]">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <>
                                    {[1, 2, 3].map((i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                                        </TableRow>
                                    ))}
                                </>
                            ) : records.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                                        No payment records for this period
                                    </TableCell>
                                </TableRow>
                            ) : (
                                records.map((record) => (
                                    <TableRow key={`${record.userId}-${record.period}`} className={record.status === 'paid' ? 'bg-green-50/50' : ''}>
                                        <TableCell>
                                            <div className="font-semibold text-slate-900">{record.userName}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="text-xs">
                                                {record.period}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{record.hours.toFixed(1)}h</TableCell>
                                        <TableCell className="text-right text-slate-500">${record.hourlyRate}/hr</TableCell>
                                        <TableCell className="text-right font-bold text-slate-900">${record.amount.toFixed(2)}</TableCell>
                                        <TableCell className="text-center">
                                            {record.hasBankDetails ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all font-medium h-7 px-3 rounded-full whitespace-nowrap"
                                                    onClick={() => setViewingBankDetails(record)}
                                                >
                                                    <Building2 className="h-3 w-3 mr-1.5" /> View Details
                                                </Button>
                                            ) : (
                                                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                                    <AlertCircle className="h-3 w-3 mr-1" /> Missing
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant={record.status === 'paid' ? 'outline' : 'default'}
                                                size="sm"
                                                onClick={() => handleTogglePayment(record)}
                                                disabled={updating === record.id}
                                                className={record.status === 'paid'
                                                    ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200 whitespace-nowrap'
                                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap'
                                                }
                                            >
                                                {updating === record.id ? '...' : record.status === 'paid' ? (
                                                    <>
                                                        <Check className="h-3 w-3 mr-1" />
                                                        Paid {record.paidAt ? new Date(record.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                                                    </>
                                                ) : (
                                                    'Mark as Paid'
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>

                {/* Bank Details Modal */}
                <BankDetailsModal
                    isOpen={!!viewingBankDetails}
                    onClose={() => setViewingBankDetails(null)}
                    userName={viewingBankDetails?.userName || ""}
                    bankDetails={viewingBankDetails?.bankDetails}
                />
            </div>
        </div>
    );
}
