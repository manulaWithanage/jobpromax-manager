import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Building2, Landmark, CreditCard, Hash, FileText, Globe, MapPin, CheckCircle2 } from "lucide-react";

interface BankDetails {
    accountName: string;
    bankName: string;
    accountNumber: string;
    branchName?: string;
    branchCode?: string;
    country?: string;
    currency?: string;
    notes?: string;
}

interface BankDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
    bankDetails: BankDetails | undefined;
}

export function BankDetailsModal({ isOpen, onClose, userName, bankDetails }: BankDetailsModalProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    if (!bankDetails) return null;

    const copyToClipboard = (text: string, field: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const CopyFeedback = ({ isVisible }: { isVisible: boolean }) => (
        <div className={`absolute right-3 top-3 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 transition-all duration-300 ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 -translate-y-1 pointer-events-none'}`}>
            <CheckCircle2 className="h-3 w-3" />
            COPIED
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="px-8 pt-8 pb-4 bg-slate-50/50 border-b">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                        <Building2 className="h-5 w-5 text-emerald-600" />
                        Bank Details Portal
                    </DialogTitle>
                    <p className="text-sm text-slate-500 mt-1">
                        Official payment information for <span className="font-semibold text-slate-700">{userName}</span>
                    </p>
                </DialogHeader>

                <div className="px-8 py-8 space-y-4 font-medium max-h-[70vh] overflow-y-auto">
                    {/* Primary Info: Bank & Account Name */}
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            onClick={() => copyToClipboard(bankDetails.bankName, 'bank')}
                            className="relative space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all group cursor-pointer active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                <Landmark className="h-3 w-3 group-hover:text-emerald-600" />
                                Bank Name
                            </div>
                            <div className="text-slate-700 text-lg group-hover:text-slate-900 pr-12">{bankDetails.bankName}</div>
                            <CopyFeedback isVisible={copiedField === 'bank'} />
                        </div>

                        <div
                            onClick={() => copyToClipboard(bankDetails.accountName, 'accountName')}
                            className="relative space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all group cursor-pointer active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                <CreditCard className="h-3 w-3 group-hover:text-emerald-600" />
                                Account Name
                            </div>
                            <div className="text-slate-700 text-lg group-hover:text-slate-900 pr-12">{bankDetails.accountName}</div>
                            <CopyFeedback isVisible={copiedField === 'accountName'} />
                        </div>
                    </div>

                    {/* Account Number (Prominent) */}
                    <div
                        onClick={() => copyToClipboard(bankDetails.accountNumber, 'accountNumber')}
                        className="relative space-y-1.5 p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all group cursor-pointer active:scale-[0.99]"
                    >
                        <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                            <Hash className="h-3 w-3" />
                            Account Number
                        </div>
                        <div className="text-3xl font-mono text-emerald-700 tracking-wider group-hover:text-emerald-900 mt-2">
                            {bankDetails.accountNumber}
                        </div>
                        <div className="absolute right-8 bottom-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                            <Hash className="h-20 w-20 text-emerald-600" />
                        </div>
                        <CopyFeedback isVisible={copiedField === 'accountNumber'} />
                    </div>

                    {/* Location & Branch */}
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            onClick={() => copyToClipboard(bankDetails.country || "N/A", 'country')}
                            className="relative space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all group cursor-pointer active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                <Globe className="h-3 w-3 group-hover:text-emerald-600" />
                                Country
                            </div>
                            <div className="text-slate-700 text-lg group-hover:text-slate-900">{bankDetails.country || "N/A"}</div>
                            <CopyFeedback isVisible={copiedField === 'country'} />
                        </div>

                        <div
                            onClick={() => copyToClipboard(bankDetails.branchName || "N/A", 'branchName')}
                            className="relative space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all group cursor-pointer active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                <Building2 className="h-3 w-3 group-hover:text-emerald-600" />
                                Branch Name
                            </div>
                            <div className="text-slate-700 text-lg group-hover:text-slate-900">{bankDetails.branchName || "N/A"}</div>
                            <CopyFeedback isVisible={copiedField === 'branchName'} />
                        </div>
                    </div>


                    {/* Secondary Info: SWIFT & Notes */}
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            onClick={() => copyToClipboard(bankDetails.branchCode || "N/A", 'branchCode')}
                            className="relative space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all group cursor-pointer active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                <Hash className="h-3 w-3 group-hover:text-emerald-600" />
                                SWIFT / IFSC Code
                            </div>
                            <div className="text-slate-700 text-lg group-hover:text-slate-900">{bankDetails.branchCode || "N/A"}</div>
                            <CopyFeedback isVisible={copiedField === 'branchCode'} />
                        </div>

                        {bankDetails.notes && (
                            <div className="space-y-1.5 p-4 rounded-xl bg-slate-100/50 border border-slate-100 group transition-all">
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    <FileText className="h-3 w-3" />
                                    Payment Notes
                                </div>
                                <div className="text-slate-600 text-xs italic line-clamp-2">"{bankDetails.notes}"</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end p-6 border-t bg-slate-50/30">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95"
                    >
                        Close Portal
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
