"use client";

import React, { useState, useEffect } from "react";
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

import { getActivitiesByUser } from "@/lib/activityActions";

// User Activity Modal Component
function UserActivityModal({ user, isOpen, onClose }: { user: User; isOpen: boolean; onClose: () => void }) {
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            getActivitiesByUser(user.id, 50)
                .then(data => setActivities(data as ActivityLog[]))
                .catch(err => console.error("Failed to fetch user activities", err))
                .finally(() => setLoading(false));
        }
    }, [user.id, isOpen]);

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
                    {loading ? (
                        <div className="text-center py-12 text-slate-500">
                            <Activity className="h-8 w-8 mx-auto mb-3 animate-pulse text-blue-400" />
                            <p className="font-medium">Loading activities...</p>
                        </div>
                    ) : activities.length === 0 ? (
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
                                                    {(() => {
                                                        if (!activity.details?.changes) return null;
                                                        const changesObj = activity.details.changes as Record<string, { old: unknown, new: unknown }>;
                                                        return Object.keys(changesObj).map((field) => {
                                                            const detailVals = changesObj[field];
                                                            return (
                                                                <p key={field} className="capitalize">
                                                                    {field.replace(/([A-Z])/g, ' $1').trim()}:{' '}
                                                                    <span className="line-through text-slate-400 mr-1">{renderDetailValue(detailVals?.old)}</span>
                                                                    <span className="text-slate-700">→ {renderDetailValue(detailVals?.new)}</span>
                                                                </p>
                                                            );
                                                        });
                                                    })()}
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

    // Tab State
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

    // Basic Info
    const [newName, setNewName] = useState(user.name);
    const [newEmail, setNewEmail] = useState(user.email);
    const [newRole, setNewRole] = useState(user.role);
    const [newDepartments, setNewDepartments] = useState<string[]>(user.departments || (user.department ? [user.department] : []));
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
                departments: newDepartments,
                department: newDepartments[0] || undefined,
                hourlyRate: newHourlyRate,
                dailyHoursTarget: newDailyHoursTarget
            });

            setInfoSuccess(true);
            setTimeout(() => {
                setInfoSuccess(false);
                onClose();
            }, 1000);
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

            setPasswordSuccess(true);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setForcePasswordChange(false);
            setTimeout(() => {
                setPasswordSuccess(false);
                onClose();
            }, 1000);
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
        JSON.stringify(newDepartments) !== JSON.stringify(user.departments || (user.department ? [user.department] : [])) ||
        newHourlyRate !== (user.hourlyRate || 0) ||
        newDailyHoursTarget !== (user.dailyHoursTarget || 8);

    const DEPARTMENTS = [
        { value: 'Frontend', label: 'Frontend' },
        { value: 'Backend', label: 'Backend' },
        { value: 'Infrastructure', label: 'Infrastructure' },
        { value: 'Marketing', label: 'Marketing' },
        { value: 'Customer Success', label: 'Customer Success' },
        { value: 'QA', label: 'QA' },
        { value: 'Management', label: 'Management' },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl w-[95vw] md:w-full p-0 gap-0 overflow-hidden bg-white rounded-xl shadow-2xl border-none">
                {/* Header Area */}
                <div className="bg-slate-50/80 p-6 border-b border-slate-100 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold text-slate-800 tracking-tight">
                            Edit {user.name}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500 mt-1">
                            Update profile details and manage security settings.
                        </DialogDescription>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex px-6 border-b border-slate-100">
                    <button
                        className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <Settings className="h-4 w-4" /> Profile Details
                    </button>
                    <button
                        className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'security' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                        onClick={() => setActiveTab('security')}
                    >
                        <Lock className="h-4 w-4" /> Security
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="p-6 max-h-[60vh] min-h-[400px] sm:min-h-[480px] overflow-y-auto w-full">
                    {activeTab === 'profile' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor={`name-${user.id}`}>Full Name</Label>
                                    <Input
                                        id={`name-${user.id}`}
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor={`email-${user.id}`}>Email Address</Label>
                                    <Input
                                        id={`email-${user.id}`}
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor={`role-${user.id}`}>Role</Label>
                                    <select
                                        id={`role-${user.id}`}
                                        className="flex w-full h-11 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors disabled:opacity-50"
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value as User['role'])}
                                        disabled={!isManager}
                                    >
                                        <option value="developer">Developer</option>
                                        <option value="manager">Manager</option>
                                        <option value="finance">Finance Manager</option>
                                        <option value="leadership">Leadership</option>
                                        <option value="operation">Operation</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor={`rate-${user.id}`}>Hourly Rate ($)</Label>
                                    <Input
                                        id={`rate-${user.id}`}
                                        type="number"
                                        value={newHourlyRate}
                                        onChange={(e) => setNewHourlyRate(parseFloat(e.target.value) || 0)}
                                        className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor={`target-${user.id}`}>Daily Hours Target</Label>
                                    <Input
                                        id={`target-${user.id}`}
                                        type="number"
                                        value={newDailyHoursTarget}
                                        onChange={(e) => setNewDailyHoursTarget(parseFloat(e.target.value) || 8)}
                                        className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                    />
                                </div>

                                <div className="space-y-3 sm:col-span-2 pt-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Departments</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {DEPARTMENTS.map((dept) => {
                                            const isSelected = newDepartments.includes(dept.value);
                                            return (
                                                <button
                                                    key={dept.value}
                                                    type="button"
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setNewDepartments(newDepartments.filter(d => d !== dept.value));
                                                        } else {
                                                            setNewDepartments([...newDepartments, dept.value]);
                                                        }
                                                    }}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border cursor-pointer select-none ${isSelected
                                                        ? 'bg-indigo-100 border-indigo-200 text-indigo-700 shadow-sm outline-none ring-2 ring-indigo-500/20'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {dept.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {newDepartments.length === 0 && (
                                        <p className="text-xs text-amber-500 font-medium">Please select at least one department.</p>
                                    )}
                                </div>
                            </div>

                            {infoError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{infoError}</div>}
                            {infoSuccess && <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100 flex items-center gap-2"><Save className="h-4 w-4" /> Profile updated successfully!</div>}
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {isManager && (
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-3">
                                    <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-amber-900">Manager Override</p>
                                        <p className="text-xs text-amber-700 mt-1 mb-2">As a manager, you can bypass the requirement for the current password to force a reset.</p>
                                        <label className="flex items-center gap-2 text-sm font-medium text-amber-900 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={forcePasswordChange}
                                                onChange={(e) => setForcePasswordChange(e.target.checked)}
                                                className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                            />
                                            Force Reset Password
                                        </label>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                {!forcePasswordChange && (
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor={`current-pwd-${user.id}`}>Current Password</Label>
                                        <div className="relative">
                                            <Input
                                                id={`current-pwd-${user.id}`}
                                                type={showCurrentPassword ? "text" : "password"}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                placeholder="Enter current password"
                                                className="h-11 bg-slate-50 border-slate-200 focus:bg-white pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor={`new-pwd-${user.id}`}>New Password</Label>
                                        <div className="relative">
                                            <Input
                                                id={`new-pwd-${user.id}`}
                                                type={showNewPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Min. 8 characters"
                                                className="h-11 bg-slate-50 border-slate-200 focus:bg-white pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor={`confirm-pwd-${user.id}`}>Confirm Password</Label>
                                        <div className="relative">
                                            <Input
                                                id={`confirm-pwd-${user.id}`}
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm new password"
                                                className="h-11 bg-slate-50 border-slate-200 focus:bg-white pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {passwordError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{passwordError}</div>}
                            {passwordSuccess && <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100 flex items-center gap-2"><Lock className="h-4 w-4" /> Password updated successfully!</div>}
                        </div>
                    )}
                </div>

                {/* Footer Area */}
                <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} className="text-slate-600 hover:text-slate-900 hover:bg-slate-200">
                        Cancel
                    </Button>

                    {activeTab === 'profile' ? (
                        <Button
                            onClick={handleInfoUpdate}
                            disabled={infoLoading || !hasInfoChanges}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                        >
                            {infoLoading ? "Saving..." : "Save Profile Changes"}
                        </Button>
                    ) : (
                        <Button
                            onClick={handlePasswordChange}
                            disabled={passwordLoading || (!forcePasswordChange && !currentPassword) || !newPassword}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                        >
                            {passwordLoading ? "Changing..." : (forcePasswordChange ? "Force Reset Password" : "Change Password")}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}


type TabView = 'users' | 'activity';

export default function UserManagementPage() {
    const [activeTab, setActiveTab] = useState<TabView>('users');
    const [globalActivityFilterUser, setGlobalActivityFilterUser] = useState<string>('all');
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
        departments: [],
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

        if (!newUser.departments || newUser.departments.length === 0) {
            setCreateError("At least one department is required");
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
            departments: [],
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

    const globalFilteredActivities = globalActivityFilterUser === 'all'
        ? activities
        : activities.filter((a) => a.userId === globalActivityFilterUser || a.userName === users.find(u => u.id === globalActivityFilterUser)?.name);

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

                {/* Tabs */}
                <div className="flex border-b border-slate-200 gap-6">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={cn(
                            "pb-4 font-medium transition-colors relative",
                            activeTab === 'users' ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Directory
                        {activeTab === 'users' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={cn(
                            "pb-4 font-medium transition-colors relative flex items-center gap-2",
                            activeTab === 'activity' ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Activity className="h-4 w-4" /> Global Activity
                        {activeTab === 'activity' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                    </button>
                </div>

                {/* Create User Dialog */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="max-w-2xl w-[95vw] md:w-full p-0 gap-0 overflow-hidden bg-white rounded-xl shadow-2xl border-none">
                        <div className="bg-slate-50/80 p-6 border-b border-slate-100 flex items-start gap-4">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <UserPlus className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-slate-800 tracking-tight">
                                    Add New Team Member
                                </DialogTitle>
                                <DialogDescription className="text-sm text-slate-500 mt-1">
                                    Create a new user account and grant access to the platform.
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="p-6 max-h-[70vh] overflow-y-auto w-full space-y-6">
                            <div className="grid sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name *</Label>
                                    <Input
                                        placeholder="John Doe"
                                        value={newUser.name}
                                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                        className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address *</Label>
                                    <Input
                                        type="email"
                                        placeholder="john@company.com"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role *</Label>
                                    <select
                                        className="flex w-full h-11 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value as User['role'] })}
                                    >
                                        <option value="developer">Developer</option>
                                        <option value="manager">Manager</option>
                                        <option value="finance">Finance Manager</option>
                                        <option value="leadership">Leadership</option>
                                        <option value="operation">Operation</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hourly Rate ($)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={newUser.hourlyRate || ''}
                                        onChange={(e) => setNewUser({ ...newUser, hourlyRate: parseFloat(e.target.value) || 0 })}
                                        className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Hours Target</Label>
                                    <Input
                                        type="number"
                                        placeholder="8"
                                        value={newUser.dailyHoursTarget || ''}
                                        onChange={(e) => setNewUser({ ...newUser, dailyHoursTarget: parseFloat(e.target.value) || 8 })}
                                        className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                    />
                                </div>

                                <div className="space-y-3 sm:col-span-2 py-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Departments *</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { value: 'Frontend', label: 'Frontend' },
                                            { value: 'Backend', label: 'Backend' },
                                            { value: 'Infrastructure', label: 'Infrastructure' },
                                            { value: 'Marketing', label: 'Marketing' },
                                            { value: 'Customer Success', label: 'Customer Success' },
                                            { value: 'QA', label: 'QA' },
                                            { value: 'Management', label: 'Management' },
                                        ].map((dept) => {
                                            const isSelected = (newUser.departments || []).includes(dept.value);
                                            return (
                                                <button
                                                    key={dept.value}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = newUser.departments || [];
                                                        if (isSelected) {
                                                            setNewUser({ ...newUser, departments: current.filter(d => d !== dept.value) });
                                                        } else {
                                                            setNewUser({ ...newUser, departments: [...current, dept.value] });
                                                        }
                                                    }}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border cursor-pointer select-none ${isSelected
                                                        ? 'bg-blue-100 border-blue-200 text-blue-700 shadow-sm outline-none ring-2 ring-blue-500/20'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {dept.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {(!newUser.departments || newUser.departments.length === 0) && (
                                        <p className="text-xs text-amber-500 font-medium">Please select at least one department.</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password *</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Min. 8 characters"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm Password *</Label>
                                    <div className="relative">
                                        <Input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {createError && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                                    <p>{createError}</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-3 rounded-b-xl">
                            <Button
                                variant="ghost"
                                onClick={() => setIsCreateOpen(false)}
                                className="text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateUser}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Create Account
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>


                {activeTab === 'users' ? (
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
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Recent System Activity</h2>
                                <p className="text-sm text-slate-500">A timeline of all recorded actions across the platform.</p>
                            </div>
                            <select
                                className="flex h-10 w-full sm:w-64 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={globalActivityFilterUser}
                                onChange={(e) => setGlobalActivityFilterUser(e.target.value)}
                            >
                                <option value="all">All Users</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {globalFilteredActivities.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p className="font-medium">No activity to display</p>
                                    {globalActivityFilterUser !== 'all' && (
                                        <p className="text-sm text-slate-400 mt-1">Try selecting a different user</p>
                                    )}
                                </div>
                            ) : (
                                // Render all activities directly
                                globalFilteredActivities.map((activity) => {
                                    const renderDetailValue = (val: unknown): React.ReactNode => {
                                        if (typeof val === 'string' || typeof val === 'number') return val;
                                        return JSON.stringify(val);
                                    };

                                    return (
                                        <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-4">
                                            <div className="flex-shrink-0 mt-1">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    {activity.action.includes('TIMESHEET') ? (
                                                        <Clock className="h-5 w-5 text-blue-600" />
                                                    ) : activity.action.includes('LOGIN') ? (
                                                        <UserIcon className="h-5 w-5 text-green-600" />
                                                    ) : activity.action.includes('LOGOUT') ? (
                                                        <UserIcon className="h-5 w-5 text-slate-600" />
                                                    ) : (
                                                        <Activity className="h-5 w-5 text-blue-600" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">
                                                        <span className="font-semibold">{activity.userName}</span> {formatAction(activity.action).toLowerCase()}
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
                                                            {(() => {
                                                                if (!activity.details?.changes) return null;
                                                                const changesObj = activity.details.changes as Record<string, { old: unknown, new: unknown }>;
                                                                return Object.keys(changesObj).map((field) => {
                                                                    const detailVals = changesObj[field];
                                                                    return (
                                                                        <p key={field} className="capitalize">
                                                                            {field.replace(/([A-Z])/g, ' $1').trim()}:{' '}
                                                                            <span className="line-through text-slate-400 mr-1">{renderDetailValue(detailVals?.old)}</span>
                                                                            <span className="text-slate-700">→ {renderDetailValue(detailVals?.new)}</span>
                                                                        </p>
                                                                    );
                                                                });
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-xs text-slate-500 whitespace-nowrap">
                                                    {formatRelativeTime(activity.timestamp)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
