"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { AlertCircle, CheckCircle, Bug } from "lucide-react";
import { useReport } from "@/context/ReportContext";

interface ReportIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    featureName?: string;
}

import { useAuth } from "@/context/AuthContext";

export function ReportIssueModal({ isOpen, onClose, featureName }: ReportIssueModalProps) {
    const { addReport } = useReport();
    const { user } = useAuth();
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [impact, setImpact] = useState<'low' | 'medium' | 'high'>('low');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!description) {
            alert("Please provide a description of the issue.");
            return;
        }

        setIsSubmitting(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        addReport({
            reporterName: user?.name || 'Public User',
            impactLevel: impact,
            description: description,
            featureId: featureName
        });

        setIsSubmitting(false);
        setStep('success');
    };

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setStep('form');
            setImpact('low');
            setDescription('');
        }, 300);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                {step === 'form' ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <Bug className="h-5 w-5 text-red-500" />
                                Report an Issue
                            </DialogTitle>
                            <DialogDescription>
                                Are you experiencing problems with <strong>{featureName || 'the system'}</strong>?
                                Please provide details to help us investigate.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-6 py-4">
                            <div className="space-y-2">
                                <Label>Impact Level</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['low', 'medium', 'high'] as const).map((level) => (
                                        <div
                                            key={level}
                                            onClick={() => setImpact(level)}
                                            className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all ${impact === level
                                                ? level === 'high'
                                                    ? 'border-red-500 bg-red-50 text-red-700'
                                                    : level === 'medium'
                                                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                                        : 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-slate-100 hover:border-slate-200'
                                                }`}
                                        >
                                            <div className="text-sm font-bold capitalize">{level}</div>
                                            <div className="text-[10px] text-slate-500">
                                                {level === 'high' ? 'System Down' : level === 'medium' ? 'Performance' : 'Minor Glitch'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Context & Description</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Please describe what you were doing and what went wrong..."
                                    className="min-h-[120px]"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting || !description} className="bg-red-600 hover:bg-red-700 text-white">
                                {isSubmitting ? "Submitting..." : "Submit Report"}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <div className="py-8 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Report Submitted</h3>
                            <p className="text-slate-500 max-w-[80%] mx-auto mt-2">
                                Thank you for your feedback. Our team has been notified and will investigate the issue shortly.
                            </p>
                        </div>
                        <Button onClick={handleClose} className="mt-4">Close</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
