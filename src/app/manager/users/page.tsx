"use client";

import React, { useState } from "react";
import { useProject } from "@/context/ProjectContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Trash2, Shield, ShieldAlert, User as UserIcon, Users, UserPlus, ChevronDown, ChevronUp, Activity, Clock, Settings, Lock, Eye, EyeOff, Save } from "lucide-react";
import { User } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";

import { useRole } from "@/context/RoleContext";
import { useActivity, ActivityLog } from "@/context/ActivityContext";
import AccessDenied from "@/components/auth/AccessDenied";
import { cn } from "@/lib/utils";

// Helper to format action for display
function formatAction(action: string): string {
    const actionMap: Record<string, string> = {
        "LOGIN": "Logged in",
        "LOGOUT": "Logged out",
        "TIMESHEET_ENTRY_CREATED": "Logged time",
        "TIMESHEET_ENTRY_UPDATED": "Updated time entry",
        "TIMESHEET_ENTRY_DELETED": "Deleted time entry",
        "TIMESHEET_SUBMITTED": "Submitted timesheet",
        "TIMESHEET_APPROVED": "Approved timesheet",
        "TIMESHEET_REJECTED": "Rejected timesheet",
        "FEATURE_STATUS_UPDATE": "Updated feature status",
        "REPORT_CREATED": "Submitted a report",
        "REPORT_ACKNOWLEDGED": "Acknowledged a report",
        "REPORT_ADDRESSED": "Closed a report",
        "REPORT_NOTE_ADDED": "Added note to report",
        "ROADMAP_PHASE_UPDATE": "Updated roadmap phase",
        "ROADMAP_DELIVERABLE_TOGGLE": "Toggled deliverable",
        "USER_CREATED": "Created new user",
        "USER_DELETED": "Deleted user",
        "USER_SETTINGS_UPDATED": "Updated settings",
        "PASSWORD_CHANGED": "Changed password",
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
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
}

// User Activity Modal Component
function UserActivityModal({ user, isOpen, onClose }: { user: User; isOpen: boolean; onClose: () => void }) {
    const { getRecentActivitiesByUser } = useActivity();
    const activities = getRecentActivitiesByUser(user.id, 50);

    const renderDetailValue = (val: unknown): React.ReactNode => {
        if (typeof val === 'string' || typeof val === 'number') return val;
        return JSON.stringify(val);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose} containerClassName="lg:pl-72">
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        Activity History - {user.name}
                    </DialogTitle>
                    <DialogDescription>
                        Showing activities from the last 2 months
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {activities.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No recent activity</p>
                            <p className="text-sm">No activities recorded in the last 2 months</p>
                        </div>
                    ) : (
                        activities.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
                            >
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        {activity.action.includes('TIMESHEET') ? (
                                            <Clock className="h-4 w-4 text-blue-600" />
                                        ) : activity.action.includes('LOGIN') ? (
                                            <UserIcon className="h-4 w-4 text-green-600" />
                                        ) : activity.action.includes('LOGOUT') ? (
                                            <UserIcon className="h-4 w-4 text-slate-600" />
                                        ) : (
                                            <Activity className="h-4 w-4 text-blue-600" />
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">
                                                {formatAction(activity.action)}
                                            </p>
                                            {activity.targetName && (
                                                <p className="text-sm text-slate-600 mt-0.5">
                                                    {activity.targetName}
                                                </p>
                                            )}
                                            {activity.details && Object.keys(activity.details).length > 0 && (
                                                <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                                                    {!!activity.details?.hours && (
                                                        <p>Hours: {renderDetailValue(activity.details.hours)}</p>
                                                    )}
                                                    {!!activity.details?.workType && (
                                                        <p>Type: {renderDetailValue(activity.details.workType)}</p>
                                                    )}
                                                    {!!activity.details?.oldStatus && !!activity.details?.newStatus && (
                                                        <p>
                                                            {renderDetailValue(activity.details.oldStatus)} → {renderDetailValue(activity.details.newStatus)}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-500 whitespace-nowrap">
                                            {formatRelativeTime(activity.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button
                        onClick={() => {
                            window.location.href = `/manager/activity?user=${user.id}`;
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        View Full History
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


// User Edit Modal Component
function UserEditModal({ user, isOpen, onClose }: { user: User; isOpen: boolean; onClose: () => void }) {
    const { isManager } = useRole();
    const { updateUser, changeUserPassword } = useProject();
    const { addActivity } = useActivity();

    // Basic Info
    const [newName, setNewName] = useState(user.name);
    const [newEmail, setNewEmail] = useState(user.email);
    const [newRole, setNewRole] = useState(user.role);
    const [newDepartment, setNewDepartment] = useState(user.department || "");
    const [newHourlyRate, setNewHourlyRate] = useState(user.hourlyRate || 0);
    const [newDailyHoursTarget, setNewDailyHoursTarget] = useState(user.dailyHoursTarget || 8);

    const [infoLoading, setInfoLoading] = useState(false);
    const [infoSuccess, setInfoSuccess] = useState(false);
    const [infoError, setInfoError] = useState("");

    // Password Change
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [forcePasswordChange, setForcePasswordChange] = useState(false);

    const handleInfoUpdate = async () => {
        setInfoError("");
        setInfoSuccess(false);

        if (!newName.trim()) {
            setInfoError("Name cannot be empty");
            return;
        }

        if (!newEmail.trim()) {
            setInfoError("Email cannot be empty");
            return;
        }

        setInfoLoading(true);
        try {
            await updateUser(user.id, {
                name: newName,
                email: newEmail,
                role: newRole,
                department: newDepartment as User['department'],
                hourlyRate: newHourlyRate,
                dailyHoursTarget: newDailyHoursTarget
            });

            await addActivity({
                action: 'USER_SETTINGS_UPDATED',
                targetType: 'user',
                targetId: user.id,
                targetName: newName,
                details: {
                    updatedBy: 'manager'
                }
            });

            setInfoSuccess(true);
            setTimeout(() => setInfoSuccess(false), 3000);
        } catch (error: unknown) {
            setInfoError(error instanceof Error ? error.message : "Failed to update user information");
        } finally {
            setInfoLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        setPasswordError("");
        setPasswordSuccess(false);

        // Manager force change doesn't require current password
        if (!forcePasswordChange && !currentPassword) {
            setPasswordError("Current password is required");
            return;
        }

        if (!newPassword || !confirmPassword) {
            setPasswordError("New password and confirmation are required");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError("New password must be at least 8 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match");
            return;
        }

        setPasswordLoading(true);
        try {
            await changeUserPassword(user.id, newPassword, currentPassword, forcePasswordChange);

            await addActivity({
                action: 'PASSWORD_CHANGED',
                targetType: 'user',
                targetId: user.id,
                targetName: user.name,
                details: {
                    isForced: forcePasswordChange,
                    updatedBy: 'manager'
                }
            });

            setPasswordSuccess(true);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setForcePasswordChange(false);
            setTimeout(() => setPasswordSuccess(false), 3000);
        } catch (error: unknown) {
            setPasswordError(error instanceof Error ? error.message : "Failed to change password");
        } finally {
            setPasswordLoading(false);
        }
    };

    const hasInfoChanges =
        newName !== user.name ||
        newEmail !== user.email ||
        newRole !== user.role ||
        newDepartment !== (user.department || "") ||
        newHourlyRate !== (user.hourlyRate || 0) ||
        newDailyHoursTarget !== (user.dailyHoursTarget || 8);

    return (
        <Dialog open={isOpen} onOpenChange={onClose} containerClassName="lg:pl-72">
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[90vw]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-indigo-900">
                        <Settings className="h-5 w-5" />
                        Edit Team Member - {user.name}
                    </DialogTitle>
                    <DialogDescription>
                        Update user profile details and manage account security.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* User Information Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5 text-indigo-500" />
                            <h4 className="font-semibold text-slate-800">User Information</h4>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor={`name-${user.id}`}>Full Name</Label>
                                <Input
                                    id={`name-${user.id}`}
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="John Doe"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`email-${user.id}`}>Email Address</Label>
                                <Input
                                    id={`email-${user.id}`}
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="john@company.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`role-${user.id}`}>Role</Label>
                                <select
                                    id={`role-${user.id}`}
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value as User['role'])}
                                    disabled={!isManager}
                                >
                                    <option value="developer">Developer</option>
                                    <option value="manager">Manager</option>
                                    <option value="finance">Finance Manager</option>
                                    <option value="leadership">Leadership</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`department-${user.id}`}>Department</Label>
                                <select
                                    id={`department-${user.id}`}
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newDepartment}
                                    onChange={(e) => setNewDepartment(e.target.value)}
                                >
                                    <option value="">Select Department</option>
                                    <option value="Frontend">Frontend Development</option>
                                    <option value="Backend">Backend Development</option>
                                    <option value="Marketing">Marketing & Growth</option>
                                    <option value="Customer Success">Customer Success</option>
                                    <option value="Management">Management</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`rate-${user.id}`}>Hourly Rate ($)</Label>
                                <Input
                                    id={`rate-${user.id}`}
                                    type="number"
                                    value={newHourlyRate}
                                    onChange={(e) => setNewHourlyRate(parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`target-${user.id}`}>Daily Hours Target</Label>
                                <Input
                                    id={`target-${user.id}`}
                                    type="number"
                                    value={newDailyHoursTarget}
                                    onChange={(e) => setNewDailyHoursTarget(parseFloat(e.target.value) || 8)}
                                    placeholder="8"
                                />
                            </div>
                        </div>

                        {infoError && <p className="text-sm text-red-600">{infoError}</p>}
                        {infoSuccess && <p className="text-sm text-green-600">✓ Information updated successfully!</p>}

                        <Button
                            onClick={handleInfoUpdate}
                            disabled={infoLoading || !hasInfoChanges}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {infoLoading ? "Saving..." : <><Save className="h-3 w-3 mr-1" /> Save Changes</>}
                        </Button>
                    </div>

                    {/* Password Change Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Lock className="h-5 w-5 text-indigo-500" />
                                <h4 className="font-semibold text-slate-800">Change Password</h4>
                            </div>
                            {isManager && (
                                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={forcePasswordChange}
                                        onChange={(e) => setForcePasswordChange(e.target.checked)}
                                        className="rounded border-slate-300"
                                    />
                                    Force Reset (Skip current password)
                                </label>
                            )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {!forcePasswordChange && (
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor={`current-pwd-${user.id}`}>Current Password</Label>
                                    <div className="relative">
                                        <Input
                                            id={`current-pwd-${user.id}`}
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Enter current password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor={`new-pwd-${user.id}`}>New Password</Label>
                                <div className="relative">
                                    <Input
                                        id={`new-pwd-${user.id}`}
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min. 8 characters"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`confirm-pwd-${user.id}`}>Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        id={`confirm-pwd-${user.id}`}
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                        {passwordSuccess && <p className="text-sm text-green-600">✓ Password changed successfully!</p>}

                        <Button
                            onClick={handlePasswordChange}
                            disabled={passwordLoading}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {passwordLoading ? "Changing..." : <><Lock className="h-3 w-3 mr-1" /> {forcePasswordChange ? "Reset Password" : "Change Password"}</>}
                        </Button>
                    </div>
                </div>

                <DialogFooter className="mt-6 border-t pt-4">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function UserManagementPage() {
    const { isManager, isLoading: isRoleLoading } = useRole();
    const { users, addUser, deleteUser } = useProject();
    const { activities, getActivitiesByUser } = useActivity();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [activityUserId, setActivityUserId] = useState<string | null>(null);
    const [editUserId, setEditUserId] = useState<string | null>(null);
    const [newUser, setNewUser] = useState<Omit<User, 'id'> & { password: string }>({
        name: '',
        email: '',
        role: 'developer',
        password: '',
        hourlyRate: 0,
        department: 'Frontend',
        dailyHoursTarget: 8
    });
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [createError, setCreateError] = useState("");

    const handleCreateUser = async () => {
        setCreateError("");

        // Validation
        if (!newUser.name.trim() || !newUser.email.trim()) {
            setCreateError("Name and email are required");
            return;
        }

        if (!newUser.department) {
            setCreateError("Department is required");
            return;
        }

        if (!newUser.password) {
            setCreateError("Password is required");
            return;
        }

        if (newUser.password.length < 8) {
            setCreateError("Password must be at least 8 characters");
            return;
        }

        if (newUser.password !== confirmPassword) {
            setCreateError("Passwords do not match");
            return;
        }

        await addUser(newUser);
        setIsCreateOpen(false);
        setNewUser({
            name: '',
            email: '',
            role: 'developer',
            password: '',
            hourlyRate: 0,
            department: 'Frontend',
            dailyHoursTarget: 8
        });
        setConfirmPassword("");
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const handleDeleteUser = async (id: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            await deleteUser(id);
        }
    };

    const toggleEdit = (userId: string) => {
        setEditUserId(userId);
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

                {/* Create User Dialog */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen} containerClassName="lg:pl-72">
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-blue-900">
                                <UserPlus className="h-5 w-5" />
                                Add New Team Member
                            </DialogTitle>
                            <DialogDescription>
                                Create a new user account and grant access to the platform.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name *</Label>
                                    <Input
                                        placeholder="John Doe"
                                        value={newUser.name}
                                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email Address *</Label>
                                    <Input
                                        type="email"
                                        placeholder="john@company.com"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role *</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value as User['role'] })}
                                    >
                                        <option value="developer">Developer</option>
                                        <option value="manager">Manager</option>
                                        <option value="finance">Finance Manager</option>
                                        <option value="leadership">Leadership</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Department *</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        value={newUser.department}
                                        onChange={(e) => setNewUser({ ...newUser, department: e.target.value as User['department'] })}
                                    >
                                        <option value="">Select Department</option>
                                        <option value="Frontend">Frontend Development</option>
                                        <option value="Backend">Backend Development</option>
                                        <option value="Marketing">Marketing & Growth</option>
                                        <option value="Customer Success">Customer Success</option>
                                        <option value="Management">Management</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Password *</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Min. 8 characters"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Confirm Password *</Label>
                                    <div className="relative">
                                        <Input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Hourly Rate ($)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={newUser.hourlyRate}
                                        onChange={(e) => setNewUser({ ...newUser, hourlyRate: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Daily Hours Target</Label>
                                    <Input
                                        type="number"
                                        placeholder="8"
                                        value={newUser.dailyHoursTarget}
                                        onChange={(e) => setNewUser({ ...newUser, dailyHoursTarget: parseFloat(e.target.value) || 8 })}
                                    />
                                </div>
                            </div>
                        </div>

                        {createError && (
                            <div className="rounded-md bg-red-50 p-3 border border-red-200">
                                <p className="text-sm text-red-600">{createError}</p>
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateUser}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Create Account
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>


                {/* Users List with Activity */}
                <div className="space-y-4">
                    {users.map((user) => {
                        const isEditing = editUserId === user.id;

                        return (
                            <Card key={user.id} className={cn("shadow-sm border-slate-200 transition-all", isEditing && "ring-2 ring-blue-200")}>
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
                                                user.role === 'leadership' && "bg-amber-50 text-amber-700 border-amber-200",
                                                user.role === 'finance' && "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            )}>
                                                {user.role === 'manager' && <ShieldAlert className="w-3 h-3 mr-1" />}
                                                {user.role === 'developer' && <UserIcon className="w-3 h-3 mr-1" />}
                                                {user.role === 'leadership' && <Shield className="w-3 h-3 mr-1" />}
                                                {user.role === 'finance' && <span className="w-3 h-3 mr-1 inline-flex items-center">$</span>}
                                                {user.role === 'finance' ? 'Finance' : user.role}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setActivityUserId(user.id)}
                                                className="text-slate-500"
                                            >
                                                <Activity className="h-4 w-4 mr-1" />
                                                Activity
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => toggleEdit(user.id)}
                                                className="text-slate-500"
                                            >
                                                <Settings className="h-4 w-4 mr-1" />
                                                Settings
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

                                    {/* Edit User Modal */}
                                    {isEditing && (
                                        <UserEditModal
                                            user={user}
                                            isOpen={true}
                                            onClose={() => setEditUserId(null)}
                                        />
                                    )}

                                    {/* Activity Modal */}
                                    {activityUserId === user.id && (
                                        <UserActivityModal
                                            user={user}
                                            isOpen={true}
                                            onClose={() => setActivityUserId(null)}
                                        />
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
