"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ChartDataPoint } from "@/types";

interface BurnUpChartProps {
    data: ChartDataPoint[];
}

export default function BurnUpChart({ data }: BurnUpChartProps) {
    return (
        <Card className="col-span-1 lg:col-span-2 hover:shadow-md transition-shadow">
            <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900">Project Velocity (Burn-up)</CardTitle>
                <p className="text-sm text-slate-500">Tracking scope vs. completed story points over time.</p>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorScope" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey="name"
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend iconType="circle" />
                        <Area
                            type="monotone"
                            dataKey="scope"
                            stroke="#94a3b8"
                            fillOpacity={1}
                            fill="url(#colorScope)"
                            name="Total Scope"
                        />
                        <Area
                            type="monotone"
                            dataKey="completed"
                            stroke="#2563eb"
                            fillOpacity={1}
                            fill="url(#colorCompleted)"
                            name="Completed Points"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
