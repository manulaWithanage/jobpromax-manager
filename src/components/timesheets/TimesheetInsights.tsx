"use client";

import { useMemo } from "react";
import { TimeLog } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { PieChart as PieIcon, BarChart3, TrendingUp } from "lucide-react";

interface TimesheetInsightsProps {
    logs: TimeLog[];
}

const WORK_TYPE_COLORS: Record<string, string> = {
    feature: "#3b82f6", // blue-500
    bug: "#ef4444",     // red-500
    refactor: "#8b5cf6", // violet-500
    testing: "#10b981",  // emerald-500
    documentation: "#f59e0b", // amber-500
    planning: "#64748b", // slate-500
    review: "#06b6d4",   // cyan-500
    meeting: "#ec4899",  // pink-500
    other: "#94a3b8"     // slate-400
};

export function TimesheetInsights({ logs }: TimesheetInsightsProps) {
    // 1. Data for Pie Chart: Work Type Distribution
    const workTypeData = useMemo(() => {
        const counts: Record<string, number> = {};
        logs.forEach(log => {
            const type = log.workType || "other";
            counts[type] = (counts[type] || 0) + log.hours;
        });

        return Object.entries(counts).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
            color: WORK_TYPE_COLORS[name] || WORK_TYPE_COLORS.other
        }));
    }, [logs]);

    // 2. Data for Bar Chart: Daily Activity (Last 7 Days)
    const dailyActivityData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const activityMap: Record<string, number> = {};
        logs.forEach(log => {
            if (last7Days.includes(log.date)) {
                activityMap[log.date] = (activityMap[log.date] || 0) + log.hours;
            }
        });

        return last7Days.map(date => ({
            date: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
            hours: activityMap[date] || 0
        }));
    }, [logs]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm bg-white">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-500 uppercase tracking-wider">
                        <PieIcon className="h-4 w-4 text-blue-500" /> Work Distribution
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={workTypeData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {workTypeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number) => [`${value.toFixed(1)}h`, 'Hours']}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-500 uppercase tracking-wider">
                        <BarChart3 className="h-4 w-4 text-emerald-500" /> Weekly Activity
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyActivityData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                            />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar
                                dataKey="hours"
                                fill="#10b981"
                                radius={[4, 4, 0, 0]}
                                barSize={30}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
