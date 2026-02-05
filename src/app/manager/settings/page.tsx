"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/context/RoleContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ArrowLeft, User, Lock, Save, Eye, EyeOff } from "lucide-react";

export default function UserSettingsPage() {
    const router = useRouter();
    const { user } = useRole();

    // Name change state
    const [newName, setNewName] = useState(user?.name || "");
    const [nameLoading, setNameLoading] = useState(false);
    const [nameSuccess, setNameSuccess] = useState(false);

    // Password change state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Error states
    const [nameError, setNameError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const handleNameChange = async () => {
        setNameError("");
        setNameSuccess(false);

        if (!newName.trim()) {
            setNameError("Name cannot be empty");
            return;
        }

        setNameLoading(true);

        try {
            // TODO: Implement API call to update user name
            // const response = await fetch('/api/user/update-name', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ name: newName })
            // });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            setNameSuccess(true);
            setTimeout(() => setNameSuccess(false), 3000);
        } catch (error) {
            setNameError("Failed to update name. Please try again.");
        } finally {
            setNameLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        setPasswordError("");
        setPasswordSuccess(false);

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError("All password fields are required");
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
            // TODO: Implement API call to change password
            // const response = await fetch('/api/user/change-password', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ currentPassword, newPassword })
            // });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            setPasswordSuccess(true);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => setPasswordSuccess(false), 3000);
        } catch (error) {
            setPasswordError("Failed to change password. Please try again.");
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="bg-slate-50/50 min-h-screen p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="p-2 h-auto hover:bg-white"
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-400" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                            <User className="h-8 w-8 text-indigo-600" /> User Settings
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Manage your account settings and preferences
                        </p>
                    </div>
                </div>

                {/* Change Name Card */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="border-b border-slate-100">
                        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <User className="h-5 w-5 text-slate-400" /> Change Name
                        </CardTitle>
                        <CardDescription>Update your display name</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Enter your full name"
                                    className="max-w-md"
                                />
                            </div>

                            {nameError && (
                                <p className="text-sm text-red-600">{nameError}</p>
                            )}

                            {nameSuccess && (
                                <p className="text-sm text-green-600">✓ Name updated successfully!</p>
                            )}

                            <Button
                                onClick={handleNameChange}
                                disabled={nameLoading || newName === user?.name}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                {nameLoading ? (
                                    <>Saving...</>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Name
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Change Password Card */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="border-b border-slate-100">
                        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Lock className="h-5 w-5 text-slate-400" /> Change Password
                        </CardTitle>
                        <CardDescription>Update your account password</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {/* Current Password */}
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <div className="relative max-w-md">
                                    <Input
                                        id="current-password"
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showCurrentPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <div className="relative max-w-md">
                                    <Input
                                        id="new-password"
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password (min. 8 characters)"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showNewPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <div className="relative max-w-md">
                                    <Input
                                        id="confirm-password"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {passwordError && (
                                <p className="text-sm text-red-600">{passwordError}</p>
                            )}

                            {passwordSuccess && (
                                <p className="text-sm text-green-600">✓ Password changed successfully!</p>
                            )}

                            <Button
                                onClick={handlePasswordChange}
                                disabled={passwordLoading}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                {passwordLoading ? (
                                    <>Changing Password...</>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Change Password
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
