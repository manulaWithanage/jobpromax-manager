"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { api } from "@/services/api";
import { KPI, ChartDataPoint } from "@/types";
import KPICard from "@/components/dashboard/KPICard";
import BurnUpChart from "@/components/dashboard/BurnUpChart";
import StatusDistribution from "@/components/dashboard/StatusDistribution";
import { Activity, CheckCircle2, Clock, Zap, LayoutDashboard } from "lucide-react";

export default function OverviewPage() {
    const [kpis, setKpis] = useState<KPI[]>([]);
    const [burnUpData, setBurnUpData] = useState<ChartDataPoint[]>([]);

    useEffect(() => {
        // Fetch Dashboard Data
        const loadData = async () => {
            const kpiData = await api.getKPIs();
            const chartData = await api.getBurnUp();
            setKpis(kpiData);
            setBurnUpData(chartData);
        };
        loadData();
    }, []);

    // Mock Status Distribution
    const statusData = [
        { name: 'Operational', value: 8, color: '#10b981' }, // Emerald-500
        { name: 'Degraded', value: 2, color: '#f59e0b' },    // Amber-500
        { name: 'Critical', value: 1, color: '#ef4444' },    // Red-500
    ];

    const activities = [
        { id: 1, text: "Deployed Auth V2 to Production", time: "2 hours ago", icon: Zap, color: "text-blue-500 bg-blue-50" },
        { id: 2, text: "Completed 'User Management' phase", time: "5 hours ago", icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50" },
        { id: 3, text: "New Incident: API Latency", time: "1 day ago", icon: Activity, color: "text-amber-500 bg-amber-50" },
    ];

    return (
        <div className="bg-slate-50/50 min-h-screen font-sans text-slate-900 p-8 lg:p-12">
            <div className="space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <LayoutDashboard className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Executive Overview</h1>
                            <p className="text-slate-500">Real-time insights and project velocity tracking.</p>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {kpis.map((kpi, idx) => (
                        <KPICard
                            key={idx}
                            title={kpi.label}
                            value={kpi.value}
                            change={kpi.change}
                            trend={kpi.trend}
                            icon={idx === 0 ? Activity : idx === 1 ? Zap : Clock} // Simple icon mapping
                            color={idx === 0 ? "blue" : idx === 1 ? "emerald" : "amber"}
                        />
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                    <BurnUpChart data={burnUpData} />
                    <StatusDistribution data={statusData} />
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h3>
                    <div className="space-y-6">
                        {activities.map((activity) => {
                            const Icon = activity.icon;
                            return (
                                <div key={activity.id} className="flex gap-4">
                                    <div className={`p-2 rounded-lg h-fit ${activity.color}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{activity.text}</p>
                                        <p className="text-xs text-slate-500">{activity.time}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
