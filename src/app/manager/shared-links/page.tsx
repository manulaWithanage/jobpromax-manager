"use client";

import { useState, useEffect } from "react";
import { useRole } from "@/context/RoleContext";
import AccessDenied from "@/components/auth/AccessDenied";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { useRouter } from "next/navigation";
import { createSharedInvoiceLink, getSharedLinks, deleteSharedLink } from "@/lib/actions/shared";
import { getPaymentRecords } from "@/lib/actions/finance";
import { AlertCircle, DollarSign, Users, Clock, ExternalLink, Link2, ArrowLeft, Copy, Trash2, Plus, Calendar, Check } from "lucide-react";


export default function ManagerSharedLinksPage() {
    const { isManager, isFinance, isLoading: isRoleLoading } = useRole();
    const router = useRouter();

    const [links, setLinks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Preview state
    const [previewData, setPreviewData] = useState<{ count: number, hours: number, amount: number } | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    // Form state
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [period, setPeriod] = useState<'P1' | 'P2'>(new Date().getDate() <= 15 ? 'P1' : 'P2');

    useEffect(() => {
        if (!isRoleLoading && (isManager || isFinance)) {
            fetchLinks();
        }
    }, [isRoleLoading, isManager, isFinance]);

    // Fetch preview data when form changes
    useEffect(() => {
        if (!isRoleLoading && (isManager || isFinance)) {
            fetchPreview();
        }
    }, [isRoleLoading, isManager, isFinance, month, year, period]);

    const fetchLinks = async () => {
        setIsLoading(true);
        const result = await getSharedLinks();
        if (result.success && result.links) {
            setLinks(result.links);
        }
        setIsLoading(false);
    };

    const fetchPreview = async () => {
        setIsPreviewLoading(true);
        try {
            const data = await getPaymentRecords(month, year, period);
            const summary = data.reduce((acc: any, curr: any) => ({
                count: acc.count + 1,
                hours: acc.hours + curr.hours,
                amount: acc.amount + curr.amount
            }), { count: 0, hours: 0, amount: 0 });
            setPreviewData(summary);
        } catch (err) {
            console.error('Failed to fetch preview:', err);
            setPreviewData(null);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleCreateLink = async () => {
        setIsCreating(true);
        const result = await createSharedInvoiceLink(month, year, period);
        if (result.success && result.url) {
            alert("Link generated and copied to clipboard!");
            navigator.clipboard.writeText(result.url);
            fetchLinks();
        } else {
            alert(result.error || "Failed to generate link");
        }
        setIsCreating(false);
    };

    const handleCopy = (token: string) => {
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/p/invoice/${token}`;
        navigator.clipboard.writeText(url);
        alert("Link copied!");
    };

    const handleDelete = async (token: string) => {
        if (!confirm("Are you sure you want to delete this shared link? Access will be immediately revoked.")) return;

        const result = await deleteSharedLink(token);
        if (result.success) {
            alert("Link deleted");
            fetchLinks();
        } else {
            alert(result.error || "Failed to delete link");
        }
    };

    const getMonthName = (m: number) => {
        return new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' });
    };

    if (isRoleLoading) return <div className="p-12 text-center text-slate-500 font-medium">Loading session...</div>;
    if (!isManager && !isFinance) return <AccessDenied />;

    return (
        <div className="bg-slate-50/50 min-h-screen p-6 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="text-slate-500 hover:text-slate-700 hover:bg-white/80"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <Link2 className="h-7 w-7 text-indigo-600" />
                                Shared Invoice Links
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Generate secure, no-login access for company stakeholders
                            </p>
                        </div>
                    </div>
                </div>

                {/* Create Link Card */}
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="border-b bg-slate-50/50">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Plus className="h-5 w-5 text-indigo-600" />
                            Generate New Link
                        </CardTitle>
                        <CardDescription>
                            Select the period you want to share
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> Month
                                </label>
                                <select
                                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                    value={month}
                                    onChange={(e) => setMonth(parseInt(e.target.value))}
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> Year
                                </label>
                                <select
                                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                    value={year}
                                    onChange={(e) => setYear(parseInt(e.target.value))}
                                >
                                    <option value={2025}>2025</option>
                                    <option value={2026}>2026</option>
                                    <option value={2027}>2027</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                    Period
                                </label>
                                <div className="flex bg-slate-100 p-1 rounded-lg h-[42px]">
                                    <button
                                        onClick={() => setPeriod('P1')}
                                        className={`flex-1 rounded-md text-xs font-bold transition-all ${period === 'P1' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        P1 (1-15)
                                    </button>
                                    <button
                                        onClick={() => setPeriod('P2')}
                                        className={`flex-1 rounded-md text-xs font-bold transition-all ${period === 'P2' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        P2 (16+)
                                    </button>
                                </div>
                            </div>

                            <Button
                                onClick={handleCreateLink}
                                disabled={isCreating}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white h-[42px]"
                            >
                                {isCreating ? "Generating..." : "Generate & Copy Link"}
                            </Button>
                        </div>

                        {/* Preview Section */}
                        {(previewData || isPreviewLoading) && (
                            <div className="mt-8 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                        <ExternalLink className="h-4 w-4 text-indigo-500" />
                                        Data Preview for {getMonthName(month)} {year} ({period})
                                    </h3>
                                    {isPreviewLoading && <div className="text-[10px] font-bold text-indigo-500 animate-pulse uppercase tracking-widest">Refreshing...</div>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                                        <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm">
                                            <Users className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Members</p>
                                            <p className="text-lg font-black text-slate-900 leading-none mt-1">
                                                {isPreviewLoading ? "..." : previewData?.count || 0}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                                        <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm">
                                            <Clock className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Hours</p>
                                            <p className="text-lg font-black text-slate-900 leading-none mt-1">
                                                {isPreviewLoading ? "..." : (previewData?.hours || 0).toFixed(1)}h
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3 border-l-4 border-l-emerald-400">
                                        <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm">
                                            <DollarSign className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice Amount</p>
                                            <p className="text-lg font-black text-emerald-600 leading-none mt-1">
                                                {isPreviewLoading ? "..." : `$${(previewData?.amount || 0).toFixed(2)}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {!isPreviewLoading && previewData?.count === 0 && (
                                    <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 text-xs font-medium flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        Warning: No approved work logs found for this period. The link will show an empty invoice.
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Links Table Card */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="p-6">
                        <CardTitle className="text-lg">Active Shared Links</CardTitle>
                        <CardDescription>
                            All persistent links that are currently accessible without login
                        </CardDescription>
                    </CardHeader>
                    <div className="border-t border-slate-100">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="font-semibold text-slate-600">Period</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Share Link</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Generated</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-600">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={4} className="h-12 bg-slate-50/50 animate-pulse" />
                                        </TableRow>
                                    ))
                                ) : links.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-16">
                                            <div className="flex flex-col items-center gap-3 text-slate-400">
                                                <Link2 className="h-10 w-10 opacity-20" />
                                                <p className="font-medium">No active links found</p>
                                                <p className="text-xs">Generate a link above to share invoice data</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    links.map((link) => (
                                        <TableRow key={link.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${link.period === 'P1' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {link.period}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 leading-tight">
                                                            {getMonthName(link.month)} {link.year}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 uppercase tracking-wider">
                                                            {link.period === 'P1' ? 'First half' : 'Second half'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 max-w-[200px] lg:max-w-[300px]">
                                                    <code className="text-[11px] bg-slate-100 px-2 py-1 rounded text-slate-500 truncate block">
                                                        .../p/invoice/{link.token.slice(0, 8)}...
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                                        onClick={() => handleCopy(link.token)}
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                                                    {new Date(link.createdAt).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 border-slate-200 hover:bg-slate-50 text-slate-600"
                                                        onClick={() => window.open(`/p/invoice/${link.token}`, '_blank')}
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                        onClick={() => handleDelete(link.token)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
