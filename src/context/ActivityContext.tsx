"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getActivities, createActivity as createActivityAction } from "@/lib/activityActions";

export interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    userRole: "manager" | "developer" | "leadership" | "finance";
    action: string;
    targetType?: "feature" | "report" | "roadmap" | "user" | "task" | "timesheet";
    targetId?: string;
    targetName?: string;
    details?: Record<string, unknown>;
    timestamp: string;
}

interface ActivityContextType {
    activities: ActivityLog[];
    loading: boolean;
    addActivity: (activity: Omit<ActivityLog, "id" | "timestamp" | "userId" | "userName" | "userRole">) => Promise<void>;
    getActivitiesByUser: (userId: string) => ActivityLog[];
    getRecentActivitiesByUser: (userId: string, limit?: number) => ActivityLog[];
    getActivitiesInDateRange: (startDate: Date, endDate: Date) => ActivityLog[];
    refreshActivities: () => Promise<void>;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Load activities from database on mount
    useEffect(() => {
        loadActivities();
    }, []);

    const loadActivities = async () => {
        try {
            setLoading(true);
            const data = await getActivities({ limit: 100 });
            setActivities(data);
        } catch (error) {
            console.error("Error loading activities:", error);
        } finally {
            setLoading(false);
        }
    };

    const addActivity = async (activity: Omit<ActivityLog, "id" | "timestamp" | "userId" | "userName" | "userRole">) => {
        try {
            await createActivityAction({
                action: activity.action,
                targetType: activity.targetType,
                targetId: activity.targetId,
                targetName: activity.targetName,
                details: activity.details,
            });
            // Refresh activities after adding
            await loadActivities();
        } catch (error) {
            console.error("Error adding activity:", error);
        }
    };

    const getActivitiesByUser = (userId: string): ActivityLog[] => {
        return activities.filter((a) => a.userId === userId);
    };

    const getRecentActivitiesByUser = (userId: string, limit: number = 20): ActivityLog[] => {
        // Only show activities from last 2 months
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        return activities
            .filter((a) => a.userId === userId && new Date(a.timestamp) >= twoMonthsAgo)
            .slice(0, limit);
    };

    const getActivitiesInDateRange = (startDate: Date, endDate: Date): ActivityLog[] => {
        return activities.filter((a) => {
            const activityDate = new Date(a.timestamp);
            return activityDate >= startDate && activityDate <= endDate;
        });
    };

    const refreshActivities = async () => {
        await loadActivities();
    };

    return (
        <ActivityContext.Provider value={{
            activities,
            loading,
            addActivity,
            getActivitiesByUser,
            getRecentActivitiesByUser,
            getActivitiesInDateRange,
            refreshActivities
        }}>
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
