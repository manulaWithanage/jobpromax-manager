"use client";

import { useState, useEffect } from "react";
import { useRole } from "@/context/RoleContext";
import { useProject } from "@/context/ProjectContext";
import AccessDenied from "@/components/auth/AccessDenied";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import {
    CreditCard, ArrowLeft, Check, X, Edit2, Trash2, Search, Building2, User as UserIcon
} from "lucide-react";
import { useRouter } from "next/navigation";
import { updateUserBankDetails, clearUserBankDetails } from "@/lib/actions/user";
import { User, BankDetails } from "@/types";

export default function PaymentSettingsPage() {
    const { isManager, isLoading: isRoleLoading } = useRole();
    const { users, refreshData } = useProject();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState("");
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<BankDetails>({
        accountName: "",
        bankName: "",
        accountNumber: "",
        branchName: "",
        branchCode: "",
        country: "",
        currency: "USD",
        notes: "",
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    // Filter users based on search
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            accountName: user.bankDetails?.accountName || "",
            bankName: user.bankDetails?.bankName || "",
            accountNumber: user.bankDetails?.accountNumber || "",
            branchName: user.bankDetails?.branchName || "",
            branchCode: user.bankDetails?.branchCode || "",
            country: user.bankDetails?.country || "",
            currency: user.bankDetails?.currency || "USD",
            notes: user.bankDetails?.notes || "",
        });
        setError("");
    };

    const handleSave = async () => {
        if (!editingUser) return;

        if (!formData.accountName || !formData.bankName || !formData.accountNumber) {
            setError("Account name, bank name, and account number are required");
            return;
        }

        setIsSaving(true);
        setError("");

        try {
            await updateUserBankDetails(editingUser.id, formData);
            await refreshData();
            setEditingUser(null);
        } catch (err: any) {
            setError(err.message || "Failed to save bank details");
        } finally {
            setIsSaving(false);
        }
    };

    const handleClear = async (userId: string) => {
        if (!confirm("Are you sure you want to clear bank details for this user?")) return;

        try {
            await clearUserBankDetails(userId);
            await refreshData();
        } catch (err: any) {
            alert(err.message || "Failed to clear bank details");
        }
    };

    if (isRoleLoading) return <div className="p-12 text-center text-slate-500">Loading...</div>;
    if (!isManager) return <AccessDenied />;

    return (
        <div className="bg-slate-50/50 min-h-screen p-6 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/manager/timesheets')}
                            className="text-slate-500 hover:text-slate-700"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <CreditCard className="h-7 w-7 text-indigo-600" />
                                Payment Settings
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Configure bank details for team invoicing
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Users Table */}
                <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="font-semibold">User</TableHead>
                                <TableHead className="font-semibold">Bank Details</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => {
                                const hasDetails = user.bankDetails?.accountNumber;
                                return (
                                    <TableRow key={user.id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                    <UserIcon className="h-5 w-5 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900">{user.name}</div>
                                                    <div className="text-sm text-slate-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {hasDetails ? (
                                                <div className="text-sm">
                                                    <div className="font-medium text-slate-800">{user.bankDetails?.bankName}</div>
                                                    <div className="text-slate-500">
                                                        ****{user.bankDetails?.accountNumber?.slice(-4)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-sm">Not configured</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {hasDetails ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 border-none">
                                                    <Check className="h-3 w-3 mr-1" /> Ready
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                                    <X className="h-3 w-3 mr-1" /> Missing
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(user)}
                                                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                >
                                                    <Edit2 className="h-4 w-4 mr-1" />
                                                    {hasDetails ? "Edit" : "Setup"}
                                                </Button>
                                                {hasDetails && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleClear(user.id)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {filteredUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                                        No users found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>

                {/* Edit Modal */}
                {editingUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-lg bg-white shadow-2xl">
                            <CardHeader className="border-b">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-indigo-600" />
                                    Bank Details for {editingUser.name}
                                </CardTitle>
                                <CardDescription>
                                    Configure payment information for invoicing
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                {error && (
                                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <Label htmlFor="accountName">Account Name *</Label>
                                        <Input
                                            id="accountName"
                                            value={formData.accountName}
                                            onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                                            placeholder="Name on account"
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <Label htmlFor="bankName">Bank Name *</Label>
                                        <Input
                                            id="bankName"
                                            value={formData.bankName}
                                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                            placeholder="e.g. Bank of America"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="accountNumber">Account Number *</Label>
                                        <Input
                                            id="accountNumber"
                                            value={formData.accountNumber}
                                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                            placeholder="Account number"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="country">Country</Label>
                                        <Input
                                            id="country"
                                            value={formData.country}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            placeholder="e.g. USA, UK"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="branchName">Branch Name</Label>
                                        <Input
                                            id="branchName"
                                            value={formData.branchName}
                                            onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                                            placeholder="e.g. Downtown Branch"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="branchCode">SWIFT / IFSC Code</Label>
                                        <Input
                                            id="branchCode"
                                            value={formData.branchCode}
                                            onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                                            placeholder="Bank code"
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <Label htmlFor="currency">Currency / Preferred Payment Type</Label>
                                        <Input
                                            id="currency"
                                            value={formData.currency}
                                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                            placeholder="USD, Bank Transfer, Payoneer, etc."
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <Label htmlFor="notes">Notes</Label>
                                        <Textarea
                                            id="notes"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Additional payment instructions..."
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={() => setEditingUser(null)}
                                        disabled={isSaving}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        {isSaving ? "Saving..." : "Save Details"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
