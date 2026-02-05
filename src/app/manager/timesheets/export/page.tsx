"use client";

import { useMemo } from "react";
import { useTimeLog } from "@/context/TimeLogContext";
import { useProject } from "@/context/ProjectContext";
import { useRole } from "@/context/RoleContext";
import AccessDenied from "@/components/auth/AccessDenied";
import { ExportReports } from "@/components/timesheets/ExportReports";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, FileDown } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TimesheetExportPage() {
    const { isManager, isLoading: isRoleLoading } = useRole();
    const { logs } = useTimeLog();
    const { users } = useProject();
    const router = useRouter();

    const developers = useMemo(() => {
        const knownDevs = users.filter(u => u.role === 'developer');

        // Find developers in logs who aren't in the project users list
        const logUsers = logs.reduce((acc, log) => {
            if (!users.find(u => u.id === log.userId) && !acc.find(u => u.id === log.userId)) {
                acc.push({
                    id: log.userId,
                    name: log.userName,
                    email: "",
                    role: "developer" as any
                });
            }
            return acc;
        }, [] as any[]);

        return [...knownDevs, ...logUsers];
    }, [users, logs]);

    if (isRoleLoading) return <div className="p-12 text-center text-slate-500">Loading access rights...</div>;
    if (!isManager) return <AccessDenied />;

    return (
        <div className="bg-slate-50/50 min-h-screen p-8 lg:p-12">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="p-2 h-auto hover:bg-white"
                        >
                            <ArrowLeft className="h-6 w-6 text-slate-400" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                                <FileDown className="h-8 w-8 text-blue-600" /> Financial Export
                            </h1>
                            <p className="text-slate-500">
                                Configure billing and download timesheet reports.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Export Reports Component */}
                <ExportReports logs={logs} developers={developers} />

            </div>
        </div>
    );
}
