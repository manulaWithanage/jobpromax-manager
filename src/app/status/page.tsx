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
        <div className="bg-slate-50/50 min-h-screen font-sans text-slate-900 p-8 lg:p-12">
            <div className="space-y-12">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <Activity className="h-8 w-8 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Feature Status Hub</h1>
                            <p className="text-slate-500">Real-time visibility into the operational health of our core capabilities.</p>
                        </div>
                    </div>
                    {isManager && (
                        <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                            <ShieldCheck className="h-3 w-3 mr-1" /> Manager Access Active
                        </Badge>
                    )}
                </div>

                {/* Filters */}
                <div className="flex justify-start gap-2">
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
                {filteredFeatures.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">No Features Found</h3>
                        <p className="text-slate-500">
                            {filter === 'all'
                                ? "No features have been added to the system yet."
                                : `No features match the '${filter}' filter status.`}
                        </p>
                    </div>
                ) : (
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
                )}

            </div>
        </div>
    );
}
