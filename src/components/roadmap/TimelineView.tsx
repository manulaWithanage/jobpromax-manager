"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { useProject } from "@/context/ProjectContext";
import { useRole } from "@/context/RoleContext";
import { RoadmapPhase } from "@/lib/mockData";

export default function TimelineView() {
    const { roadmap, toggleDeliverable } = useProject();
    const { isManager } = useRole();

    // Helper to calculate completion percentage for a phase
    const getCompletion = (phase: RoadmapPhase) => {
        if (!phase.deliverables.length) return 0;
        const done = phase.deliverables.filter(d => d.status === 'done').length;
        return Math.round((done / phase.deliverables.length) * 100);
    };

    return (
        <div className="relative space-y-8 pl-8 md:pl-0 animate-in fade-in duration-500">
            {/* Continuous Vertical Line */}
            <div className="absolute left-8 md:left-1/2 top-4 bottom-4 w-0.5 -ml-px bg-slate-200 md:block hidden" />

            {roadmap.map((phase, index) => {
                const isCompleted = phase.status === 'completed';
                const isCurrent = phase.status === 'current';
                const isFuture = phase.status === 'upcoming';
                const completion = getCompletion(phase);

                return (
                    <div key={phase.id} className={cn(
                        "relative md:flex items-center justify-between group",
                        index % 2 === 0 ? "md:flex-row-reverse" : "md:flex-row"
                    )}>

                        {/* Timeline Dot (Center) */}
                        <div className="absolute left-[-23px] md:left-1/2 md:-ml-3 top-8 md:top-1/2 md:-mt-3 z-10">
                            <div className={cn(
                                "h-6 w-6 rounded-full border-4 transition-all duration-300 shadow-sm",
                                isCompleted ? "bg-emerald-500 border-emerald-100" :
                                    isCurrent ? "bg-blue-600 border-blue-100 scale-125 shadow-blue-200 shadow-lg" :
                                        "bg-slate-300 border-slate-100"
                            )}>
                                {isCompleted && <CheckCircle2 className="h-3 w-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                                {isCurrent && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse" />}
                            </div>
                        </div>

                        {/* Spacer for the other side */}
                        <div className="hidden md:block w-[45%]" />

                        {/* Content Card */}
                        <div className={cn(
                            "w-full md:w-[45%] rounded-2xl border transition-all duration-300 relative overflow-hidden",
                            // 1. THE PAST (Completed)
                            isCompleted && "bg-slate-50/80 border-slate-200 opacity-75 hover:opacity-100 hover:shadow-md",
                            // 2. THE PRESENT (In Progress - Hero Card)
                            isCurrent && "bg-white border-blue-200 ring-2 ring-blue-100 shadow-xl scale-[1.02] md:scale-105 z-20",
                            // 3. THE FUTURE (Planned)
                            isFuture && "bg-white border-slate-200 border-dashed hover:border-solid hover:shadow-md"
                        )}>

                            {/* Current Phase Accent Banner */}
                            {isCurrent && <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />}

                            <div className="p-6 space-y-4">

                                {/* Header Section */}
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider",
                                                isCompleted ? "text-slate-500" : isCurrent ? "text-blue-600" : "text-slate-400"
                                            )}>
                                                {phase.date}
                                            </span>

                                            {/* Health Indicator for Current Phase */}
                                            {isCurrent && phase.health && (
                                                <div className={cn(
                                                    "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                                                    phase.health === 'on-track' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                        phase.health === 'at-risk' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                            "bg-red-50 text-red-600 border-red-100"
                                                )}>
                                                    <span className={cn("w-1.5 h-1.5 rounded-full",
                                                        phase.health === 'on-track' ? "bg-emerald-500" :
                                                            phase.health === 'at-risk' ? "bg-amber-500" : "bg-red-500"
                                                    )} />
                                                    <span>{phase.health.replace('-', ' ')}</span>
                                                </div>
                                            )}
                                        </div>
                                        <h3 className={cn("font-bold text-slate-900 leading-tight", isCurrent ? "text-xl" : "text-lg")}>
                                            {phase.title}
                                        </h3>
                                    </div>
                                    <Badge variant={isCompleted ? "success" : isCurrent ? "default" : "secondary"}>
                                        {isCompleted ? "Done" : isCurrent ? "Active" : "Plan"}
                                    </Badge>
                                </div>

                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {phase.description}
                                </p>

                                {/* Progress Bar (Current Phase Only) */}
                                {isCurrent && (
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-semibold text-slate-500">
                                            <span>Progress</span>
                                            <span className="text-blue-600">{completion}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                                style={{ width: `${completion}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Deliverables List (Visual Rules applied) */}
                                <div className="space-y-3 pt-2">
                                    {isCurrent ? (
                                        // Present: Split List
                                        <>
                                            {/* Completed Items */}
                                            {phase.deliverables.filter(d => d.status === 'done').map((item, originalIndex) => (
                                                <DeliverableItem
                                                    key={`done-${originalIndex}`}
                                                    item={item}
                                                    state="past"
                                                    isAdmin={isManager}
                                                    onClick={() => toggleDeliverable(phase.id, phase.deliverables.indexOf(item))}
                                                />
                                            ))}

                                            {/* Divider if mixed */}
                                            {phase.deliverables.some(d => d.status === 'done') &&
                                                phase.deliverables.some(d => d.status !== 'done') && (
                                                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center py-1 border-t border-slate-100 mt-2">
                                                        Remaining Scope
                                                    </div>
                                                )}

                                            {/* Remaining Items */}
                                            {phase.deliverables.filter(d => d.status !== 'done').map((item, originalIndex) => (
                                                <DeliverableItem
                                                    key={`todo-${originalIndex}`}
                                                    item={item}
                                                    state="present" // Show as actionable/empty
                                                    isAdmin={isManager}
                                                    onClick={() => toggleDeliverable(phase.id, phase.deliverables.indexOf(item))}
                                                />
                                            ))}
                                        </>
                                    ) : (
                                        // Past/Future: Simple List
                                        phase.deliverables.map((item, i) => (
                                            <DeliverableItem
                                                key={i}
                                                item={item}
                                                state={isCompleted ? "past" : "future"}
                                                isAdmin={isManager && isFuture} // Editable if future? Or keep all editable. Let's allow editing if admin.
                                                onClick={() => isManager && toggleDeliverable(phase.id, i)}
                                                isReadonly={!isManager}
                                            />
                                        ))
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function DeliverableItem({
    item,
    state,
    isAdmin,
    onClick,
    isReadonly = false
}: {
    item: any,
    state: 'past' | 'present' | 'future',
    isAdmin: boolean,
    onClick: () => void,
    isReadonly?: boolean
}) {
    const isDone = item.status === 'done';

    return (
        <div
            className={cn(
                "flex items-start gap-3 text-sm transition-colors",
                isAdmin && !isReadonly ? "cursor-pointer group/item" : "cursor-default"
            )}
            onClick={isAdmin && !isReadonly ? onClick : undefined}
        >
            <div className="mt-0.5 shrink-0">
                {state === 'past' || isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                    <Circle className={cn(
                        "h-4 w-4",
                        state === 'present' ? "text-slate-300 group-hover/item:text-blue-500" : "text-slate-500"
                    )} />
                )}
            </div>

            <span className={cn(
                "leading-tight",
                (state === 'past' || isDone) ? "text-slate-400 line-through" : "text-slate-700 font-medium",
                isAdmin && !isReadonly && "group-hover/item:text-slate-900"
            )}>
                {item.text}
            </span>
        </div>
    );
}
