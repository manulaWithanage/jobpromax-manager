"use client";

import React, { createContext, useContext, useState } from "react";

export interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    userRole: "manager" | "developer" | "leadership";
    action: string;
    targetType?: "feature" | "report" | "roadmap" | "user" | "task";
    targetId?: string;
    targetName?: string;
    details?: Record<string, unknown>;
    timestamp: string;
}

interface ActivityContextType {
    activities: ActivityLog[];
    addActivity: (activity: Omit<ActivityLog, "id" | "timestamp">) => void;
    getActivitiesByUser: (userId: string) => ActivityLog[];
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

// Mock data for testing
const mockActivities: ActivityLog[] = [
    {
        id: "act1",
        userId: "mgr1",
        userName: "Alice Manager",
        userRole: "manager",
        action: "LOGIN",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
        id: "act2",
        userId: "dev1",
        userName: "Bob Developer",
        userRole: "developer",
        action: "ROADMAP_DELIVERABLE_TOGGLE",
        targetType: "roadmap",
        targetName: "Sprint 3 - API Integration",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        id: "act3",
        userId: "mgr1",
        userName: "Alice Manager",
        userRole: "manager",
        action: "FEATURE_STATUS_UPDATE",
        targetType: "feature",
        targetName: "Payment Processor",
        details: { oldStatus: "operational", newStatus: "critical" },
        timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
    {
        id: "act4",
        userId: "lead1",
        userName: "Carol Leadership",
        userRole: "leadership",
        action: "LOGIN",
        timestamp: new Date(Date.now() - 900000).toISOString(),
    },
    {
        id: "act5",
        userId: "mgr1",
        userName: "Alice Manager",
        userRole: "manager",
        action: "REPORT_ACKNOWLEDGED",
        targetType: "report",
        targetName: "Payment failing with 500 error",
        timestamp: new Date(Date.now() - 600000).toISOString(),
    },
    {
        id: "act6",
        userId: "dev1",
        userName: "Bob Developer",
        userRole: "developer",
        action: "TASK_STATUS_UPDATE",
        targetType: "task",
        targetName: "Implement user auth",
        details: { oldStatus: "In Progress", newStatus: "In Review" },
        timestamp: new Date(Date.now() - 300000).toISOString(),
    },
];

export function ActivityProvider({ children }: { children: React.ReactNode }) {
    const [activities, setActivities] = useState<ActivityLog[]>(mockActivities);

    const addActivity = (activity: Omit<ActivityLog, "id" | "timestamp">) => {
        const newActivity: ActivityLog = {
            ...activity,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
        };
        setActivities((prev) => [newActivity, ...prev]);
    };

    const getActivitiesByUser = (userId: string): ActivityLog[] => {
        return activities.filter((a) => a.userId === userId);
    };

    return (
        <ActivityContext.Provider value={{ activities, addActivity, getActivitiesByUser }}>
            {children}
        </ActivityContext.Provider>
    );
}

export function useActivity() {
    const context = useContext(ActivityContext);
    if (context === undefined) {
        throw new Error("useActivity must be used within an ActivityProvider");
    }
    return context;
}
