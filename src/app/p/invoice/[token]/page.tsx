"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";
import {
    Receipt, Check, Clock, DollarSign, Users,
    Building2, AlertCircle, ShieldAlert
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { getPaymentRecords, markPaymentAsPaid, markPaymentAsPending, PaymentRecord } from "@/lib/actions/finance";
import { validateSharedLink } from "@/lib/actions/shared";
import { BankDetailsModal } from "@/components/finance/BankDetailsModal";

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function SharedInvoicePage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [metadata, setMetadata] = useState<{ month: number; year: number; period: 'P1' | 'P2' } | null>(null);
    const [records, setRecords] = useState<PaymentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isValidating, setIsValidating] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // State for bank details modal
    const [viewingBankDetails, setViewingBankDetails] = useState<PaymentRecord | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Validate token and get period metadata
            const validation = await validateSharedLink(token);
            if (!validation.valid) {
                setError(validation.error || "This link is invalid or has expired.");
                setIsValidating(false);
                setIsLoading(false);
                return;
            }

            setMetadata({
                month: validation.month!,
                year: validation.year!,
                period: validation.period!
            });
            setIsValidating(false);

            // 2. Fetch records using the token (which skips auth on the server)
            const data = await getPaymentRecords(
                validation.month!,
                validation.year!,
                validation.period!,
                token
            );
            setRecords(data);
        } catch (err: any) {
            console.error('Failed to load shared invoice data:', err);
            setError("Failed to load invoice data. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            loadData();
        }
    }, [token, loadData]);

    const handleTogglePayment = async (record: PaymentRecord) => {
        setUpdating(record.id);
        try {
            if (record.status === 'pending') {
                // Pass the token to bypass auth and set "Shared Link" as paidBy
                await markPaymentAsPaid(record.userId, record.period, record.month, record.year, "Shared Link", token);
                alert(`Marked ${record.userName} as paid`);
            } else {
                await markPaymentAsPending(record.userId, record.period, record.month, record.year, token);
                alert(`Marked ${record.userName} as pending`);
            }
            await loadData();
        } catch (err: any) {
            console.error('Failed to update payment:', err);
            alert(err.message || "Failed to update payment");
        } finally {
            setUpdating(null);
        }
    };

    // Calculate totals
    const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
    const totalHours = records.reduce((sum, r) => sum + r.hours, 0);
    const paidAmount = records.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0);
    const pendingAmount = records.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);
    const uniqueMembers = new Set(records.map(r => r.userId)).size;

    if (isValidating || isLoading) {
        return (
            <div className="bg-slate-50/50 min-h-screen p-6 lg:p-8">
                <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
                    <div className="h-12 w-64 bg-slate-200 rounded-lg" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                    <Card className="border-none shadow-sm bg-white">
                        <SkeletonTable rows={5} cols={7} />
                    </Card>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-slate-50/50 min-h-screen flex items-center justify-center p-6">
                <Card className="max-w-md w-full border-none shadow-xl bg-white p-8 text-center space-y-6">
                    <div className="h-16 w-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                        <ShieldAlert className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
                        <p className="text-slate-500 text-sm">{error}</p>
                    </div>
                    <Button
                        onClick={() => router.push('/')}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                    >
                        Go to Login
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="bg-slate-50/50 min-h-screen p-6 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <Receipt className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                Shared Invoice View
                            </h1>
                            <div className="flex items-center gap-2 text-slate-500 text-sm mt-0.5 font-medium">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold">
                                    {metadata ? `${MONTHS[metadata.month - 1]} ${metadata.year} - ${metadata.period}` : 'Loading...'}
                                </Badge>
                                <span>•</span>
                                <span>{metadata?.period === 'P1' ? 'First Half (1st-15th)' : 'Second Half (16th-End)'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 flex items-center gap-2 text-amber-700 text-xs font-semibold">
                        <AlertCircle className="h-4 w-4" />
                        External View - Authorization via Link Token
                    </div>
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
                            {records.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-20 bg-slate-50/10">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <Receipt className="h-10 w-10 opacity-20" />
                                            <p className="font-medium">No payment records found for this period</p>
                                        </div>
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
                                        <TableCell className="text-right text-slate-500 font-medium">${record.hourlyRate}/hr</TableCell>
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

                {/* Footer attribution */}
                <div className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest pt-4">
                    Powered by JobProMax Finance Module
                </div>

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
