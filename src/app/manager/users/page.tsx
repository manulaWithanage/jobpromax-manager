"use client";

import { useState } from "react";
import { useProject } from "@/context/ProjectContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Trash2, Shield, ShieldAlert, User as UserIcon, Users, UserPlus, ChevronDown, ChevronUp, Activity, Clock } from "lucide-react";
import { User } from "@/types";

import { useRole } from "@/context/RoleContext";
import { useActivity, ActivityLog } from "@/context/ActivityContext";
import AccessDenied from "@/components/auth/AccessDenied";
import { cn } from "@/lib/utils";

// Helper to format action for display
function formatAction(action: string): string {
    const actionMap: Record<string, string> = {
        "LOGIN": "Logged in",
        "LOGOUT": "Logged out",
        "FEATURE_STATUS_UPDATE": "Updated feature status",
        "REPORT_CREATED": "Submitted a report",
        "REPORT_ACKNOWLEDGED": "Acknowledged a report",
        "REPORT_ADDRESSED": "Closed a report",
        "REPORT_NOTE_ADDED": "Added note to report",
        "ROADMAP_PHASE_UPDATE": "Updated roadmap phase",
        "ROADMAP_DELIVERABLE_TOGGLE": "Toggled deliverable",
        "USER_CREATED": "Created new user",
        "USER_DELETED": "Deleted user",
        "TASK_STATUS_UPDATE": "Updated task status",
    };
    return actionMap[action] || action;
}

// Helper to format relative time
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

export default function UserManagementPage() {
    const { isManager, isLoading: isRoleLoading } = useRole();
    const { users, addUser, deleteUser } = useProject();
    const { activities, getActivitiesByUser } = useActivity();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [newUser, setNewUser] = useState<Partial<User>>({
        name: '',
        email: '',
        role: 'developer'
    });

    const handleCreateUser = async () => {
        if (!newUser.name || !newUser.email || !newUser.role) return;

        const userToAdd: User = {
            id: crypto.randomUUID(),
            name: newUser.name,
            email: newUser.email,
            role: newUser.role as 'manager' | 'developer' | 'leadership',
            isSuperAdmin: false
        };

        await addUser(userToAdd);
        setIsCreateOpen(false);
        setNewUser({ name: '', email: '', role: 'developer' });
    };

    const handleDeleteUser = async (id: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            await deleteUser(id);
        }
    };

    const toggleExpand = (userId: string) => {
        setExpandedUserId(expandedUserId === userId ? null : userId);
    };

    // For demo, match activities by userName since mock activities have different userIds
    const getActivitiesForUser = (user: User): ActivityLog[] => {
        // In production, use getActivitiesByUser(user.id)
        // For demo, we'll filter by name matching or show all for first user
        return activities.filter(a =>
            a.userName.toLowerCase().includes(user.name.split(' ')[0].toLowerCase()) ||
            a.userRole === user.role
        ).slice(0, 5);
    };

    if (isRoleLoading) return <div className="p-12 text-center text-slate-500">Loading access rights...</div>;
    if (!isManager) return <AccessDenied />;

    return (
        <div className="bg-slate-50/50 min-h-screen font-sans text-slate-900 p-8 lg:p-12">
            <div className="space-y-8">

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Users className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
                            <p className="text-slate-500">Manage team access, roles, and view activity logs.</p>
                        </div>
                    </div>
                    <Button onClick={() => setIsCreateOpen(!isCreateOpen)} className={cn("transition-all duration-300", isCreateOpen ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-blue-600 hover:bg-blue-700 text-white")}>
                        {isCreateOpen ? "Cancel" : <><UserPlus className="h-4 w-4 mr-2" /> Add User</>}
                    </Button>
                </div>

                {/* Create User Form */}
                {isCreateOpen && (
                    <Card className="border-blue-200 shadow-lg bg-blue-50/50 animate-in slide-in-from-top-4">
                        <CardHeader>
                            <CardTitle className="text-blue-900 flex items-center gap-2">
                                <UserPlus className="h-5 w-5" /> Add New Team Member
                            </CardTitle>
                            <CardDescription>Grant access to the platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input
                                        placeholder="John Doe"
                                        value={newUser.name}
                                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <Input
                                        type="email"
                                        placeholder="john@company.com"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                                    >
                                        <option value="developer">Developer</option>
                                        <option value="manager">Manager</option>
                                        <option value="leadership">Leadership</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end">
                            <Button onClick={handleCreateUser} className="bg-blue-600 hover:bg-blue-700 text-white">
                                Create Account
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {/* Users List with Activity */}
                <div className="space-y-4">
                    {users.map((user) => {
                        const userActivities = getActivitiesForUser(user);
                        const isExpanded = expandedUserId === user.id;

                        return (
                            <Card key={user.id} className={cn("shadow-sm border-slate-200 transition-all", isExpanded && "ring-2 ring-blue-200")}>
                                <div className="p-4">
                                    {/* User Row */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">{user.name}</p>
                                                <p className="text-sm text-slate-500">{user.email}</p>
                                            </div>
                                            <Badge variant="outline" className={cn(
                                                "capitalize font-normal ml-2",
                                                user.role === 'manager' && "bg-purple-50 text-purple-700 border-purple-200",
                                                user.role === 'developer' && "bg-blue-50 text-blue-700 border-blue-200",
                                                user.role === 'leadership' && "bg-amber-50 text-amber-700 border-amber-200"
                                            )}>
                                                {user.role === 'manager' && <ShieldAlert className="w-3 h-3 mr-1" />}
                                                {user.role === 'developer' && <UserIcon className="w-3 h-3 mr-1" />}
                                                {user.role === 'leadership' && <Shield className="w-3 h-3 mr-1" />}
                                                {user.role}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => toggleExpand(user.id)}
                                                className="text-slate-500"
                                            >
                                                <Activity className="h-4 w-4 mr-1" />
                                                Activity
                                                {isExpanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDeleteUser(user.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Activity Panel (Expandable) */}
                                    {isExpanded && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Activity className="h-4 w-4 text-blue-500" />
                                                <h4 className="font-medium text-slate-700">Recent Activity</h4>
                                            </div>
                                            {userActivities.length > 0 ? (
                                                <div className="space-y-2">
                                                    {userActivities.map((activity) => (
                                                        <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 text-sm">
                                                            <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                            <span className="text-slate-600">
                                                                {formatAction(activity.action)}
                                                                {activity.targetName && (
                                                                    <span className="font-medium text-slate-800"> "{activity.targetName}"</span>
                                                                )}
                                                            </span>
                                                            <span className="text-slate-400 ml-auto text-xs">
                                                                {formatRelativeTime(activity.timestamp)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-400 italic">No recent activity recorded.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}
