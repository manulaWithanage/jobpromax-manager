"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useRole } from "@/context/RoleContext";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, XCircle, RefreshCw, MessageSquare } from "lucide-react";

import { ReportIssueModal } from "@/components/features/ReportIssueModal";

interface FeatureCardProps {
    name: string;
    status: 'operational' | 'degraded' | 'critical';
    linkedTicket?: string | null;
    publicNote?: string;
}

export default function FeatureCard({ name, status, linkedTicket, publicNote }: FeatureCardProps) {
    const { role } = useRole();
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);

    const isManager = role === 'manager';

    // Status-specific details content
    const getDetailsContent = () => {
        if (status === 'operational') {
            return {
                title: "System Nominal",
                description: "No outages reported in the last 24 hours. Performance metrics are within expected SLAs.",
                icon: <RefreshCw className="h-5 w-5 text-emerald-600" />
            };
        } else if (status === 'degraded') {
            return {
                title: "Performance Degraded",
                description: "Some users may experience slower response times. Our team is actively investigating.",
                icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />
            };
        } else {
            return {
                title: "Service Disruption",
                description: "We are experiencing a major outage affecting this service. Engineers are working to restore functionality.",
                icon: <XCircle className="h-5 w-5 text-red-600" />
            };
        }
    };

    const details = getDetailsContent();

    return (
        <Card className="hover:shadow-lg transition-all duration-300 border-slate-200 overflow-hidden flex flex-col">
            <CardContent className="p-6 flex-1 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                        <div className={cn(
                            "p-3 rounded-full flex-shrink-0",
                            status === 'operational' ? "bg-emerald-50 text-emerald-600" :
                                status === 'degraded' ? "bg-yellow-50 text-yellow-600" :
                                    "bg-red-50 text-red-600"
                        )}>
                            {status === 'operational' ? <CheckCircle2 className="h-6 w-6" /> :
                                status === 'degraded' ? <AlertTriangle className="h-6 w-6" /> :
                                    <XCircle className="h-6 w-6" />}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-slate-900 leading-tight">{name}</h3>
                            <p className="text-sm text-slate-500 line-clamp-2">{publicNote || "System is fully operational."}</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={cn(
                            "text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider",
                            status === 'operational' ? "bg-emerald-100 text-emerald-700" :
                                status === 'degraded' ? "bg-yellow-100 text-yellow-700" :
                                    "bg-red-100 text-red-700"
                        )}>
                            {status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Updated 5 min ago</span>
                    </div>
                </div>

                {/* Uptime Graph Visual */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>60 Days Ago</span>
                        <span className={cn(
                            status === 'operational' ? "text-emerald-600" :
                                status === 'degraded' ? "text-yellow-600" : "text-red-500"
                        )}>
                            {status === 'operational' ? '99.99%' : status === 'degraded' ? '98.50%' : '85.20%'} Uptime
                        </span>
                        <span>Today</span>
                    </div>
                    <div className="flex gap-[2px] items-end h-8">
                        {Array.from({ length: 60 }).map((_, i) => {
                            const isEnd = i > 50;
                            const isDegradedBar = status === 'degraded' && isEnd && i % 3 === 0;
                            const isDown = status === 'critical' && isEnd && i % 2 === 0;

                            let colorClass = 'bg-emerald-400';
                            if (isDown) colorClass = 'bg-red-400';
                            else if (isDegradedBar) colorClass = 'bg-yellow-400';

                            return (
                                <div
                                    key={i}
                                    className={cn("w-full rounded-sm transition-all hover:scale-y-110 hover:opacity-80", colorClass)}
                                    style={{ height: isDown ? '40%' : isDegradedBar ? '70%' : `${60 + Math.random() * 40}%` }}
                                />
                            );
                        })}
                    </div>
                </div>
            </CardContent>

            {/* Expandable Details Panel */}
            <div className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                expanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
            )}>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 flex-shrink-0">
                            {details.icon}
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold text-slate-800 text-sm">{details.title}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">{details.description}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                    className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
                    onClick={() => setReportModalOpen(true)}
                >
                    <MessageSquare className="h-4 w-4" />
                    <span>Report Issue</span>
                </button>

                <button
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors"
                    onClick={() => setExpanded(!expanded)}
                >
                    <span>{expanded ? 'Hide Details' : 'View Details'}</span>
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
            </div>

            <ReportIssueModal
                isOpen={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                featureName={name}
            />
        </Card>
    );
}
