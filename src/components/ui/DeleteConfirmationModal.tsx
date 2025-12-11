import React from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    title: string;
    description: string;
    isDeleting?: boolean;
}

export function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    isDeleting = false
}: DeleteConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-red-100 rounded-full">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    </div>

                    <p className="text-slate-500 mb-6 leading-relaxed">
                        {description}
                    </p>

                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white min-w-[100px]"
                            onClick={onConfirm}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
