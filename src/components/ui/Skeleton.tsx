import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-slate-200",
                className
            )}
        />
    );
}

export function SkeletonCard({ className }: SkeletonProps) {
    return (
        <div className={cn("p-6 rounded-xl border bg-white shadow-sm", className)}>
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-24" />
                </div>
            </div>
        </div>
    );
}

export function SkeletonTable({ rows = 4, cols = 5 }: { rows?: number; cols?: number }) {
    return (
        <div className="w-full space-y-3 p-4">
            {/* Header */}
            <div className="flex gap-4 pb-2 border-b">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={`header-${i}`} className="h-4 flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div key={`row-${rowIdx}`} className="flex gap-4 py-2">
                    {Array.from({ length: cols }).map((_, colIdx) => (
                        <Skeleton
                            key={`cell-${rowIdx}-${colIdx}`}
                            className={cn("h-4 flex-1", colIdx === 0 && "w-32 flex-none")}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function SkeletonChart({ className }: SkeletonProps) {
    return (
        <div className={cn("p-4 rounded-xl border bg-white shadow-sm", className)}>
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
    );
}

export function LoadingSpinner({ className }: SkeletonProps) {
    return (
        <div className={cn("flex items-center justify-center", className)}>
            <div className="relative">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            </div>
        </div>
    );
}
