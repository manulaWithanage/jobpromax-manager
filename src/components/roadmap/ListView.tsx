"use client";

import { useState, useMemo } from "react";
import { useProject } from "@/context/ProjectContext";
import { useRole } from "@/context/RoleContext";
import { cn } from "@/lib/utils";
import { ArrowUpDown, CheckCircle2, Circle } from "lucide-react";

type SortField = 'deliverable' | 'phase' | 'health' | 'status';
type SortDirection = 'asc' | 'desc';

export default function ListView() {
    const { roadmap, toggleDeliverable } = useProject();
    const { isManager } = useRole();
    const [sortField, setSortField] = useState<SortField>('phase');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Flatten Data
    const flatData = useMemo(() => {
        return roadmap.flatMap(phase =>
            phase.deliverables.map((del, idx) => ({
                id: `${phase.id}-${idx}`,
                phaseId: phase.id,
                phaseIndex: idx, // index within the phase
                deliverable: del.text,
                phase: phase.phase,
                date: phase.date,
                health: phase.health || 'neutral',
                isDone: del.status === 'done',
                phaseStatus: phase.status // 'completed' | 'current' | 'upcoming'
            }))
        );
    }, [roadmap]);

    // Sort Data
    const sortedData = useMemo(() => {
        return [...flatData].sort((a, b) => {
            let res = 0;
            switch (sortField) {
                case 'deliverable':
                    res = a.deliverable.localeCompare(b.deliverable);
                    break;
                case 'phase':
                    // Sort by phase status order primarily, then date
                    const statusOrder = { 'completed': 1, 'current': 2, 'upcoming': 3 };
                    res = (statusOrder[a.phaseStatus] || 99) - (statusOrder[b.phaseStatus] || 99);
                    break;
                case 'health':
                    // Sort health: on-track < at-risk < delayed < neutral
                    const healthOrder = { 'on-track': 1, 'at-risk': 2, 'delayed': 3, 'neutral': 4 };
                    res = (healthOrder[a.health as keyof typeof healthOrder] || 99) - (healthOrder[b.health as keyof typeof healthOrder] || 99);
                    break;
                case 'status':
                    // Done first or last? Let's say Pending first.
                    res = (a.isDone === b.isDone) ? 0 : a.isDone ? 1 : -1;
                    break;
            }
            return sortDirection === 'asc' ? res : -res;
        });
    }, [flatData, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => (
        <ArrowUpDown className={cn(
            "ml-2 h-4 w-4 transition-colors",
            sortField === field ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"
        )} />
    );

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                        <tr>
                            <th
                                className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                                onClick={() => handleSort('deliverable')}
                            >
                                <div className="flex items-center">
                                    Deliverable Name
                                    <SortIcon field="deliverable" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                                onClick={() => handleSort('phase')}
                            >
                                <div className="flex items-center">
                                    Phase / Q
                                    <SortIcon field="phase" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                                onClick={() => handleSort('health')}
                            >
                                <div className="flex items-center">
                                    Health
                                    <SortIcon field="health" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center">
                                    Completion Status
                                    <SortIcon field="status" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedData.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    {item.deliverable}
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-700">{item.phase}</span>
                                        <span className="text-xs uppercase">{item.date}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {item.health === 'neutral' ? (
                                        <span className="text-slate-400">-</span>
                                    ) : (
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold uppercase",
                                            item.health === 'on-track' ? "bg-emerald-50 text-emerald-600" :
                                                item.health === 'at-risk' ? "bg-amber-50 text-amber-600" :
                                                    "bg-red-50 text-red-600"
                                        )}>
                                            <span className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                item.health === 'on-track' ? "bg-emerald-500" :
                                                    item.health === 'at-risk' ? "bg-amber-500" :
                                                        "bg-red-500"
                                            )} />
                                            {item.health.replace('-', ' ')}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => isManager && toggleDeliverable(item.phaseId, item.phaseIndex)}
                                        disabled={!isManager}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                                            item.isDone
                                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                                : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600",
                                            !isManager && "cursor-default opacity-80"
                                        )}
                                    >
                                        {item.isDone ? (
                                            <>
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Done
                                            </>
                                        ) : (
                                            <>
                                                <Circle className="h-3.5 w-3.5" />
                                                Remaining
                                            </>
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {sortedData.length === 0 && (
                <div className="p-8 text-center text-slate-500">No deliverables found.</div>
            )}
        </div>
    );
}
