"use server";

import dbConnect from "@/lib/mongodb";
import ActivityLog, { IActivityLog } from "@/models/ActivityLog";
import User from "@/models/User";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/auth/serverAuth";

export interface ActivityLogInput {
    action: string;
    targetType?: 'feature' | 'report' | 'roadmap' | 'user' | 'task' | 'timesheet';
    targetId?: string;
    targetName?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

export interface ActivityLogFilter {
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    skip?: number;
}

/**
 * Create a new activity log entry
 * Automatically captures user info from session
 */
export async function createActivity(input: ActivityLogInput): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        await dbConnect();
        const user = await getCurrentUser();

        if (!user) {
            return { success: false, error: "Not authenticated" };
        }

        // Create activity log
        const activity = await ActivityLog.create({
            userId: user._id,
            userName: user.name,
            userRole: user.role,
            action: input.action,
            targetType: input.targetType,
            targetId: input.targetId,
            targetName: input.targetName,
            details: input.details,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
            timestamp: new Date(),
        });

        return { success: true, id: activity._id.toString() };
    } catch (error) {
        console.error("Error creating activity:", error);
        return { success: false, error: "Failed to create activity" };
    }
}

/**
 * Get activities with optional filters
 */
export async function getActivities(filter: ActivityLogFilter = {}): Promise<any[]> {
    try {
        await dbConnect();

        const query: any = {};

        // Apply filters
        if (filter.userId) {
            query.userId = new mongoose.Types.ObjectId(filter.userId);
        }

        if (filter.action) {
            query.action = filter.action;
        }

        // Date range filter (default to last 2 months)
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        query.timestamp = {
            $gte: filter.startDate || twoMonthsAgo,
            ...(filter.endDate && { $lte: filter.endDate }),
        };

        const activities = await ActivityLog.find(query)
            .sort({ timestamp: -1 })
            .limit(filter.limit || 100)
            .skip(filter.skip || 0)
            .lean();

        // Convert to plain objects and transform
        return activities.map((activity) => ({
            id: activity._id.toString(),
            userId: activity.userId.toString(),
            userName: activity.userName,
            userRole: activity.userRole,
            action: activity.action,
            targetType: activity.targetType,
            targetId: activity.targetId,
            targetName: activity.targetName,
            details: activity.details,
            timestamp: activity.timestamp.toISOString(),
        }));
    } catch (error) {
        console.error("Error fetching activities:", error);
        return [];
    }
}

/**
 * Get activities for a specific user (last 2 months)
 */
export async function getActivitiesByUser(userId: string, limit: number = 50): Promise<any[]> {
    return getActivities({
        userId,
        limit,
    });
}

/**
 * Get recent activities (for dashboard/overview)
 */
export async function getRecentActivities(limit: number = 20): Promise<any[]> {
    return getActivities({ limit });
}

/**
 * Delete old activities (manual cleanup if needed)
 * Note: TTL index handles automatic deletion, this is for manual cleanup
 */
export async function deleteOldActivities(cutoffDate: Date): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
        await dbConnect();

        const result = await ActivityLog.deleteMany({
            timestamp: { $lt: cutoffDate },
        });

        return { success: true, deletedCount: result.deletedCount };
    } catch (error) {
        console.error("Error deleting old activities:", error);
        return { success: false, error: "Failed to delete activities" };
    }
}
