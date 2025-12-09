"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRole } from "@/context/RoleContext";
import { useRouter } from "next/navigation";

interface FeatureCardProps {
    name: string;
    status: 'operational' | 'degraded' | 'critical';
    linkedTicket?: string | null;
    publicNote?: string;
}

export default function FeatureCard({ name, status, linkedTicket, publicNote }: FeatureCardProps) {
    const { role } = useRole();
    const router = useRouter();

    const isManager = role === 'manager';
    const isDeveloper = role === 'developer';

    return (
        <Card className="hover:shadow-md transition-shadow duration-300 border-slate-200 overflow-hidden group">
            <div className={cn(
                "h-1 w-full",
                status === 'operational' ? "bg-emerald-500" :
                    status === 'degraded' ? "bg-amber-500" :
                        "bg-red-500"
            )} />

            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{name}</h3>
                    <div className={cn(
                        "rounded-full p-1.5",
                        status === 'operational' ? "bg-emerald-100 text-emerald-600" :
                            status === 'degraded' ? "bg-amber-100 text-amber-600" :
                                "bg-red-100 text-red-600 animate-pulse"
                    )}>
                        {status === 'operational' ? <CheckCircle2 className="h-5 w-5" /> :
                            status === 'degraded' ? <AlertTriangle className="h-5 w-5" /> :
                                <AlertCircle className="h-5 w-5" />}
                    </div>
                </div>

                <p className="text-sm text-slate-600 mb-6 line-clamp-2 h-10">
                    {publicNote || "System functioning normally."}
                </p>

                {/* Footer / Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                        {linkedTicket ? (
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-1 rounded">
                                {linkedTicket}
                            </span>
                        ) : (
                            <span className="text-[10px] text-slate-300 italic">No Ticket</span>
                        )}
                    </div>

                    {isManager && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => router.push('/manager/status')}
                        >
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
