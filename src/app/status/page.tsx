"use client";

import Sidebar from "@/components/layout/Sidebar";
import { useProject } from "@/context/ProjectContext";
import { useRole } from "@/context/RoleContext";
import { Badge } from "@/components/ui/Badge";
import { Activity, ShieldCheck } from "lucide-react";
import FeatureCard from "@/components/features/FeatureCard";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function StatusPage() {
    const { features, isLoading } = useProject();
    const { isManager } = useRole();
    const [filter, setFilter] = useState<'all' | 'operational' | 'degraded' | 'critical'>('all');

    const filteredFeatures = features.filter(f => filter === 'all' || f.status === filter);

    if (isLoading) {
        return (
            <div className="flex bg-slate-50/50 min-h-screen font-sans text-slate-900 items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <Activity className="h-10 w-10 text-slate-300 mb-4" />
                    <p className="text-slate-400 font-medium">Checking System Status...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-slate-50/50 min-h-screen font-sans text-slate-900">
            <Sidebar />

            <main className="flex-1 ml-72 p-8 lg:p-12 overflow-y-auto">
                <div className="max-w-5xl mx-auto space-y-12">

                    {/* Header */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-full mb-2">
                            <Activity className="h-8 w-8 text-purple-600" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Feature Status Hub</h1>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                            Real-time visibility into the operational health of our core capabilities.
                        </p>
                        {isManager && (
                            <Badge variant="outline" className="mt-2 text-purple-600 border-purple-200 bg-purple-50">
                                <ShieldCheck className="h-3 w-3 mr-1" /> Manager Access Active
                            </Badge>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex justify-center gap-2">
                        {['all', 'operational', 'degraded', 'critical'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium transition-all capitalize",
                                    filter === f
                                        ? "bg-slate-900 text-white shadow-md"
                                        : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFeatures.map((feature) => (
                            <FeatureCard
                                key={feature.id}
                                name={feature.name}
                                status={feature.status}
                                linkedTicket={feature.linkedTicket}
                                publicNote={feature.publicNote}
                            />
                        ))}
                    </div>

                </div>
            </main>
        </div>
    );
}
