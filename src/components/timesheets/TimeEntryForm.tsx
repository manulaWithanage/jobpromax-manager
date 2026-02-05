"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProject } from "@/context/ProjectContext";
import { useTimeLog } from "@/context/TimeLogContext";
import { useActivity } from "@/context/ActivityContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Clock, Ticket, FileText, Send, Loader2, User as UserIcon, Briefcase, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeEntryFormProps {
    onSuccess?: () => void;
    showDeveloperSelect?: boolean;
    defaultDeveloperId?: string;
}

export function TimeEntryForm({ onSuccess, showDeveloperSelect = false, defaultDeveloperId }: TimeEntryFormProps) {
    const { user: currentUser } = useAuth();
    const { users } = useProject();
    const { addLog, isLoading } = useTimeLog();
    const { addActivity } = useActivity();

    // Filter to only show developers for selection
    const developers = users.filter(u => u.role === 'developer');

    const [formData, setFormData] = useState({
        userId: currentUser?.id || "guest",
        userName: currentUser?.name || "Guest",
        userRole: (currentUser?.role as "manager" | "developer" | "leadership") || "developer",
        userDepartment: (currentUser as any)?.department || "",
        date: new Date().toISOString().split('T')[0],
        hours: "",
        summary: "",
        jiraTickets: [] as string[],
        workType: "feature" as any
    });

    const [ticketInput, setTicketInput] = useState("");

    // Update form if user or developers change
    useEffect(() => {
        if (!showDeveloperSelect && currentUser) {
            setFormData(prev => ({
                ...prev,
                userId: currentUser.id,
                userName: currentUser.name,
                userRole: (currentUser.role as any) || "developer",
                userDepartment: (currentUser as any).department || ""
            }));
        } else if (showDeveloperSelect && defaultDeveloperId) {
            const dev = developers.find(d => d.id === defaultDeveloperId);
            if (dev) {
                setFormData(prev => ({
                    ...prev,
                    userId: dev.id,
                    userName: dev.name,
                    userRole: dev.role as any,
                    userDepartment: (dev as any).department || ""
                }));
            }
        }
    }, [currentUser, showDeveloperSelect, defaultDeveloperId, users]);

    // Listen for timer and template application
    useEffect(() => {
        const handleApplyTimer = () => {
            const hours = sessionStorage.getItem("pending_timer_hours");
            if (hours) {
                setFormData(prev => ({ ...prev, hours }));
                sessionStorage.removeItem("pending_timer_hours");
            }
        };

        const handleApplyTemplate = () => {
            const templateJson = sessionStorage.getItem("pending_template");
            if (templateJson) {
                const template = JSON.parse(templateJson);
                setFormData(prev => ({
                    ...prev,
                    jiraTickets: template.jiraTicket ? [template.jiraTicket] : (template.jiraTickets || []),
                    summary: template.summary || "",
                    workType: template.workType || "feature"
                }));
                sessionStorage.removeItem("pending_template");
            }
        };

        window.addEventListener("apply_timer_hours", handleApplyTimer);
        window.addEventListener("apply_template", handleApplyTemplate);

        // Check if data is already there (case where form opened and event fired immediately)
        handleApplyTimer();
        handleApplyTemplate();

        return () => {
            window.removeEventListener("apply_timer_hours", handleApplyTimer);
            window.removeEventListener("apply_template", handleApplyTemplate);
        };
    }, []);

    const [error, setError] = useState("");

    const addTicket = (ticket: string) => {
        const cleanTicket = ticket.trim().toUpperCase();
        if (cleanTicket && !formData.jiraTickets.includes(cleanTicket)) {
            setFormData(prev => ({
                ...prev,
                jiraTickets: [...prev.jiraTickets, cleanTicket]
            }));
        }
        setTicketInput("");
    };

    const removeTicket = (ticketToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            jiraTickets: prev.jiraTickets.filter(t => t !== ticketToRemove)
        }));
    };

    const handleTicketKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTicket(ticketInput);
        }
    };

    const handleDeveloperChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const devId = e.target.value;
        const dev = developers.find(d => d.id === devId);
        if (dev) {
            setFormData({
                ...formData,
                userId: dev.id,
                userName: dev.name,
                userRole: dev.role as any,
                userDepartment: (dev as any).department || ""
            });
        }
    };

    const WORK_CATEGORIES = [
        {
            label: "💻 Development",
            departments: ["Frontend", "Backend", "Frontend Development", "Backend Development"],
            options: [
                { value: "feature", label: "✨ Feature - New functionality" },
                { value: "bug", label: "🐛 Bug Fix - Fixing issues" },
                { value: "refactor", label: "🔧 Refactor - Code improvement" },
                { value: "testing", label: "🧪 Testing - QA & testing" },
                { value: "documentation", label: "📚 Documentation - Docs & guides" },
            ]
        },
        {
            label: "📊 Management",
            departments: ["Management"],
            options: [
                { value: "planning", label: "📋 Planning - Sprint planning" },
                { value: "review", label: "👀 Review - Code/design review" },
                { value: "meeting", label: "🤝 Meeting - Team meetings" },
            ]
        },
        {
            label: "📣 Marketing",
            departments: ["Marketing", "Marketing & Growth"],
            options: [
                { value: "content", label: "✍️ Content - Content creation" },
                { value: "campaign", label: "🎯 Campaign - Marketing campaigns" },
                { value: "analytics", label: "📈 Analytics - Data analysis" },
            ]
        },
        {
            label: "📦 Other",
            departments: ["Customer Success", ""], // Show for Customer Success or if No Department
            options: [
                { value: "other", label: "📦 Other - Miscellaneous" },
            ]
        }
    ];

    // Filter categories based on department
    const filteredCategories = WORK_CATEGORIES.filter(cat =>
        cat.departments.includes(formData.userDepartment) || cat.label === "📦 Other"
    );

    // Reset workType if it's no longer valid for the department
    useEffect(() => {
        const allValidValues = filteredCategories.flatMap(cat => cat.options.map(opt => opt.value));
        if (!allValidValues.includes(formData.workType)) {
            // Set to first available option
            const firstOption = filteredCategories[0]?.options[0]?.value;
            if (firstOption) {
                setFormData(prev => ({ ...prev, workType: firstOption }));
            }
        }
    }, [formData.userDepartment, filteredCategories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        let hoursNum = 0;
        if (formData.hours.includes(':')) {
            const [hrs, mins] = formData.hours.split(':').map(Number);
            hoursNum = (hrs || 0) + (mins || 0) / 60;
        } else {
            hoursNum = parseFloat(formData.hours);
        }

        if (isNaN(hoursNum) || hoursNum <= 0) {
            setError("Please enter a valid amount of hours.");
            return;
        }

        if (!formData.summary.trim()) {
            setError("Summary is required.");
            return;
        }

        if (showDeveloperSelect && !formData.userId) {
            setError("Please select a developer.");
            return;
        }

        try {
            await addLog({
                userId: formData.userId,
                userName: formData.userName,
                userRole: formData.userRole,
                date: formData.date,
                hours: hoursNum,
                summary: formData.summary,
                jiraTickets: formData.jiraTickets,
                workType: formData.workType,
            });

            // Log activity for time entry creation
            await addActivity({
                action: "TIMESHEET_ENTRY_CREATED",
                targetType: "timesheet",
                targetName: formData.summary.substring(0, 50) + (formData.summary.length > 50 ? "..." : ""),
                details: {
                    hours: hoursNum,
                    date: formData.date,
                    workType: formData.workType,
                    tickets: formData.jiraTickets.join(", "),
                },
            });

            setFormData({
                ...formData,
                date: new Date().toISOString().split('T')[0],
                hours: "",
                summary: "",
                jiraTickets: [],
                workType: "feature"
            });
            setTicketInput("");

            if (onSuccess) onSuccess();
        } catch (err) {
            setError("Failed to save time log. Please try again.");
        }
    };

    return (
        <Card className="border-blue-100 shadow-lg bg-white overflow-hidden w-full">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
                    <Clock className="h-5 w-5 text-blue-600" /> {showDeveloperSelect ? "Manual Time Entry" : "Log Time"}
                </CardTitle>
                <CardDescription>
                    {showDeveloperSelect ? "Log hours for a developer." : "Enter your task details and hours spent."}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 animate-in fade-in transition-all">
                            {error}
                        </div>
                    )}

                    {showDeveloperSelect && (
                        <div className="space-y-2">
                            <Label htmlFor="developer">Assign to Developer</Label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <select
                                    id="developer"
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.userId}
                                    onChange={handleDeveloperChange}
                                    required
                                >
                                    <option value="" disabled>Select a developer...</option>
                                    {developers.map(dev => (
                                        <option key={dev.id} value={dev.id}>{dev.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hours">Log Time (Decimal or HH:MM)</Label>
                            <Input
                                id="hours"
                                type="text"
                                placeholder="eg. 1.5 or 1:30"
                                value={formData.hours}
                                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                                required
                            />
                            {formData.hours && (
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                                    {(() => {
                                        let h = 0;
                                        if (formData.hours.includes(':')) {
                                            const [hrs, mins] = formData.hours.split(':').map(Number);
                                            h = (hrs || 0) + (mins || 0) / 60;
                                        } else {
                                            h = parseFloat(formData.hours) || 0;
                                        }

                                        const hrs = Math.floor(h);
                                        const mins = Math.round((h - hrs) * 60);
                                        return h > 0 ? `Equivalent to ${hrs}h ${mins}m (${h.toFixed(2)} decimal hours)` : "";
                                    })()}
                                </p>
                            )}
                            {formData.date === new Date().toISOString().split('T')[0] && (
                                <div id="timer-trigger" className="hidden" />
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="jiraTicket">Jira Tickets (Press Enter or Comma to add)</Label>
                        <div className="space-y-3">
                            <div className="relative">
                                <Ticket className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="jiraTicket"
                                    placeholder="e.g. JPM-123"
                                    className="pl-10"
                                    value={ticketInput}
                                    onChange={(e) => setTicketInput(e.target.value)}
                                    onKeyDown={handleTicketKeyDown}
                                    onBlur={() => addTicket(ticketInput)}
                                />
                            </div>

                            {formData.jiraTickets.length > 0 && (
                                <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                                    {formData.jiraTickets.map((ticket) => (
                                        <div
                                            key={ticket}
                                            className="group flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-100 hover:bg-blue-100 transition-colors shadow-sm"
                                        >
                                            <Zap className="h-3 w-3" />
                                            {ticket}
                                            <button
                                                type="button"
                                                onClick={() => removeTicket(ticket)}
                                                className="ml-1 text-blue-400 hover:text-blue-600 transition-colors rounded-full hover:bg-white p-0.5"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="workType">Work Type</Label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <select
                                id="workType"
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.workType}
                                onChange={(e) => setFormData({ ...formData, workType: e.target.value as any })}
                                required
                            >
                                {filteredCategories.map(cat => (
                                    <optgroup key={cat.label} label={cat.label}>
                                        {cat.options.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="summary">Work Summary</Label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <textarea
                                id="summary"
                                rows={3}
                                className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-10 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Describe what was accomplished..."
                                value={formData.summary}
                                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 transition-all active:scale-[0.98]"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                            <Send className="h-5 w-5 mr-2" />
                        )}
                        {showDeveloperSelect ? "Add Developer Time Log" : "Submit Time Log"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
