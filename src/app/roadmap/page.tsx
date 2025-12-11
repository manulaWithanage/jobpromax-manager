"use client";


import { useProject } from "@/context/ProjectContext";
import { useRole } from "@/context/RoleContext";
import { Clock, Edit3, Map } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useState } from "react";
import TimelineView from "@/components/roadmap/TimelineView";
import ListView from "@/components/roadmap/ListView";
import { cn } from "@/lib/utils";

type Tab = 'timeline' | 'list';

export default function DeliveryTimelinePage() {
    const { isLoading } = useProject();
    const { isManager } = useRole();
    const [activeTab, setActiveTab] = useState<Tab>('timeline');

    if (isLoading) {
        return (
            <div className="flex bg-slate-50/50 min-h-screen font-sans text-slate-900 items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <Map className="h-10 w-10 text-slate-300 mb-4" />
                    <p className="text-slate-400 font-medium">Loading Delivery Timeline...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50/50 min-h-screen font-sans text-slate-900 p-8 lg:p-12">
            <div className="space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Clock className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Delivery Timeline</h1>
                            <p className="text-slate-500">Strategic roadmap and upcoming release schedule.</p>
                        </div>
                    </div>
                    {isManager && (
                        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                            <Edit3 className="h-3 w-3 mr-1" /> Manager Edit Mode Active
                        </Badge>
                    )}
                </div>

                {/* View Toggle */}
                <div className="flex justify-start">
                    <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                        <button
                            onClick={() => setActiveTab('timeline')}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                                activeTab === 'timeline'
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                            )}
                        >
                            Timeline View
                        </button>
                        <button
                            onClick={() => setActiveTab('list')}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                                activeTab === 'list'
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                            )}
                        >
                            List View
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="mt-8">
                    {activeTab === 'timeline' ? <TimelineView /> : <ListView />}
                </div>

            </div>
        </div>
    );
}
