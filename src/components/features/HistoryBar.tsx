"use client";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip";


interface HistoryBarProps {
    status: 'operational' | 'degraded' | 'critical';
}

function generateHistory(currentStatus: string) {
    // Deterministic mock generation based on current status
    // In real app, this would come from backend
    return Array.from({ length: 30 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));

        let status = 'operational';
        const random = 29 - i + (currentStatus.length); // deterministic seed-ish

        if (currentStatus === 'critical' && i > 25) status = 'critical';
        else if (currentStatus === 'degraded' && i > 20) status = i % 2 === 0 ? 'degraded' : 'operational';
        else if (random % 15 === 0) status = 'degraded';

        return {
            date: date.toLocaleDateString(),
            status
        };
    });
}

export function HistoryBar({ status }: HistoryBarProps) {
    const history = generateHistory(status);

    return (
        <TooltipProvider>
            <div className="flex gap-[2px] items-end h-8 w-full">
                {history.map((day, i) => {
                    let colorClass = 'bg-emerald-400 hover:bg-emerald-500';
                    let height = '100%'

                    if (day.status === 'critical') {
                        colorClass = 'bg-red-400 hover:bg-red-500';
                        height = '40%';
                    } else if (day.status === 'degraded') {
                        colorClass = 'bg-yellow-400 hover:bg-yellow-500';
                        height = '70%';
                    }

                    // Variation for operational to look organic
                    if (day.status === 'operational') {
                        height = `${60 + (i % 5) * 8}%`;
                    }

                    return (
                        <Tooltip key={i}>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn("flex-1 rounded-sm transition-all hover:opacity-100 cursor-pointer opacity-70", colorClass)}
                                    style={{ height }}
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="font-bold">{day.date}</p>
                                <p className="text-xs capitalize">{day.status}</p>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
        </TooltipProvider>
    );
}
