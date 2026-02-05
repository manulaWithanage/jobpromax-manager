"use client";

import { useState } from "react";
import { useRole } from "@/context/RoleContext";
import { useActivity, ActivityLog } from "@/context/ActivityContext";
import { useProject } from "@/context/ProjectContext";
import AccessDenied from "@/components/auth/AccessDenied";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
    Activity,
    Clock,
    Filter,
    Search,
    User,
    Shield,
    Settings,
    FileText,
    Map,
    CheckSquare,
    LogIn,
    LogOut,
    AlertCircle
} from "lucide-react";

// Action to icon mapping
const actionIcons: Record<string, any> = {
    LOGIN: LogIn,
    LOGOUT: LogOut,
    FEATURE_STATUS_UPDATE: Settings,
    REPORT_CREATED: AlertCircle,
    REPORT_ACKNOWLEDGED: CheckSquare,
    REPORT_ADDRESSED: CheckSquare,
    REPORT_NOTE_ADDED: FileText,
    ROADMAP_PHASE_UPDATE: Map,
    ROADMAP_DELIVERABLE_TOGGLE: CheckSquare,
    USER_CREATED: User,
    USER_DELETED: User,
    TASK_STATUS_UPDATE: CheckSquare,
};

// Action to color mapping
const actionColors: Record<string, string> = {
    LOGIN: "bg-green-100 text-green-700",
    LOGOUT: "bg-slate-100 text-slate-600",
    FEATURE_STATUS_UPDATE: "bg-blue-100 text-blue-700",
    REPORT_CREATED: "bg-red-100 text-red-700",
    REPORT_ACKNOWLEDGED: "bg-amber-100 text-amber-700",
    REPORT_ADDRESSED: "bg-green-100 text-green-700",
    REPORT_NOTE_ADDED: "bg-purple-100 text-purple-700",
    ROADMAP_PHASE_UPDATE: "bg-indigo-100 text-indigo-700",
    ROADMAP_DELIVERABLE_TOGGLE: "bg-cyan-100 text-cyan-700",
    USER_CREATED: "bg-emerald-100 text-emerald-700",
    USER_DELETED: "bg-red-100 text-red-700",
    TASK_STATUS_UPDATE: "bg-blue-100 text-blue-700",
};

// Format action for display
function formatAction(action: string): string {
    const actionMap: Record<string, string> = {
        LOGIN: "Logged in",
        LOGOUT: "Logged out",
        FEATURE_STATUS_UPDATE: "Updated feature status",
        REPORT_CREATED: "Submitted a report",
        REPORT_ACKNOWLEDGED: "Acknowledged a report",
        REPORT_ADDRESSED: "Closed a report",
        REPORT_NOTE_ADDED: "Added note to report",
        ROADMAP_PHASE_UPDATE: "Updated roadmap phase",
        ROADMAP_DELIVERABLE_TOGGLE: "Toggled deliverable",
        USER_CREATED: "Created new user",
        USER_DELETED: "Deleted user",
        TASK_STATUS_UPDATE: "Updated task status",
    };
    return actionMap[action] || action;
}

// Format timestamp
function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// Format relative time
function formatRelativeTime(timestamp: string): string {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

export default function ActivityLogPage() {
    const { isManager, isLoading: isRoleLoading } = useRole();
    const { activities } = useActivity();
    const { users } = useProject();

    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState<string>("all");
    const [filterAction, setFilterAction] = useState<string>("all");

    // Filter activities
    const filteredActivities = activities.filter((activity) => {
        const matchesSearch =
            searchQuery === "" ||
            activity.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.targetName?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = filterRole === "all" || activity.userRole === filterRole;
        const matchesAction = filterAction === "all" || activity.action === filterAction;

        return matchesSearch && matchesRole && matchesAction;
    });

    // Get unique action types for filter dropdown
    const actionTypes = [...new Set(activities.map((a) => a.action))];

    if (isRoleLoading) return <div className="p-12 text-center text-slate-500">Loading access rights...</div>;
    if (!isManager) return <AccessDenied />;

    return (
        <div className="bg-slate-50/50 min-h-screen font-sans text-slate-900 p-8 lg:p-12">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <Activity className="h-8 w-8 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Activity Log</h1>
                            <p className="text-slate-500">Track all user activities across the platform.</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-slate-600">
                        {filteredActivities.length} activities
                    </Badge>
                </div>

                {/* Filters */}
                <Card className="shadow-sm border-slate-200">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-center gap-4">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search by user or target..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {/* Role Filter */}
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-slate-400" />
                                <select
                                    className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                >
                                    <option value="all">All Roles</option>
                                    <option value="manager">Manager</option>
                                    <option value="developer">Developer</option>
                                    <option value="leadership">Leadership</option>
                                </select>
                            </div>

                            {/* Action Filter */}
                            <select
                                className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value)}
                            >
                                <option value="all">All Actions</option>
                                {actionTypes.map((action) => (
                                    <option key={action} value={action}>
                                        {formatAction(action)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Activity List */}
                <div className="space-y-3">
                    {filteredActivities.length === 0 ? (
                        <Card className="shadow-sm border-slate-200">
                            <CardContent className="p-8 text-center text-slate-500">
                                <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p>No activities found matching your filters.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredActivities.map((activity) => {
                            const ActionIcon = actionIcons[activity.action] || Activity;
                            const colorClass = actionColors[activity.action] || "bg-slate-100 text-slate-600";

                            return (
                                <Card key={activity.id} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            {/* Action Icon */}
                                            <div className={cn("p-2.5 rounded-lg", colorClass)}>
                                                <ActionIcon className="h-5 w-5" />
                                            </div>

                                            {/* Activity Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-slate-900">{activity.userName}</span>
                                                    <Badge variant="outline" className={cn(
                                                        "text-xs capitalize",
                                                        activity.userRole === "manager" && "bg-purple-50 text-purple-700 border-purple-200",
                                                        activity.userRole === "developer" && "bg-blue-50 text-blue-700 border-blue-200",
                                                        activity.userRole === "leadership" && "bg-amber-50 text-amber-700 border-amber-200",
                                                        activity.userRole === "finance" && "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    )}>
                                                        {activity.userRole}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-600 mt-0.5">
                                                    {formatAction(activity.action)}
                                                    {activity.targetName && (
                                                        <span className="font-medium text-slate-800"> "{activity.targetName}"</span>
                                                    )}
                                                </p>
                                                {activity.details && (
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {JSON.stringify(activity.details)}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Timestamp */}
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-medium text-slate-500">{formatRelativeTime(activity.timestamp)}</p>
                                                <p className="text-xs text-slate-400">{formatTimestamp(activity.timestamp)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
