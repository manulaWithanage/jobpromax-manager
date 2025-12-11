
import { Card, CardContent } from "@/components/ui/Card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface KPICardProps {
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon: any;
    color?: string; // e.g. "text-blue-600", "bg-blue-50"
}

export default function KPICard({ title, value, change, trend, icon: Icon, color = "blue" }: KPICardProps) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">{title}</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
                    </div>
                    <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>

                {change && (
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium">
                        {trend === 'up' && <ArrowUp className="h-3 w-3 text-emerald-500" />}
                        {trend === 'down' && <ArrowDown className="h-3 w-3 text-red-500" />}
                        {trend === 'neutral' && <Minus className="h-3 w-3 text-slate-400" />}

                        <span className={
                            trend === 'up' ? "text-emerald-600" :
                                trend === 'down' ? "text-red-600" : "text-slate-500"
                        }>
                            {change}
                        </span>
                        <span className="text-slate-400">vs last period</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
