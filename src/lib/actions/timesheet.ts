'use server';

import { requireAuth, requireRole } from '../auth/serverAuth';
import connectDB from '../mongodb';
import TimeLog from '@/models/TimeLog';
import { TimeLog as TimeLogType } from '@/types';
import { createActivity } from '../activityActions';

interface TimeLogFilters {
    userId?: string;
    startDate?: string;
    endDate?: string;
    status?: 'pending' | 'approved' | 'rejected';
}

/**
 * Get time logs with optional filters
 * Authorization: Developers see only their logs; Managers see all
 */
export async function getTimeLogs(filters?: TimeLogFilters): Promise<TimeLogType[]> {
    const user = await requireAuth();
    await connectDB();

    const query: any = {};

    // Developers can only see their own logs
    if (user.role === 'developer') {
        query.userId = user.id;
    } else if (filters?.userId) {
        // Managers can filter by userId
        query.userId = filters.userId;
    }

    // Date range filter
    if (filters?.startDate && filters?.endDate) {
        query.date = { $gte: filters.startDate, $lte: filters.endDate };
    } else if (filters?.startDate) {
        query.date = { $gte: filters.startDate };
    } else if (filters?.endDate) {
        query.date = { $lte: filters.endDate };
    }

    // Status filter
    if (filters?.status) {
        query.status = filters.status;
    }

    const logs = await TimeLog.find(query).sort({ date: -1, createdAt: -1 }).lean();

    return logs.map((log: any) => ({
        id: log._id.toString(),
        userId: log.userId,
        userName: log.userName,
        userRole: log.userRole,
        date: log.date,
        hours: log.hours,
        summary: log.summary,
        jiraTickets: log.jiraTickets || (log.jiraTicket ? [log.jiraTicket] : []),
        workType: log.workType,
        status: log.status,
        approvedBy: log.approvedBy,
        managerComment: log.managerComment,
        createdAt: log.createdAt.toISOString(),
        updatedAt: log.updatedAt.toISOString(),
    }));
}

/**
 * Submit a new time log entry
 * Authorization: Developer or Manager role
 */
export async function submitTimeLog(data: {
    date: string;
    hours: number;
    summary: string;
    jiraTickets: string[];
    workType: 'feature' | 'bug' | 'refactor' | 'testing' | 'documentation' | 'planning' | 'review' | 'meeting' | 'content' | 'campaign' | 'analytics' | 'other';
}): Promise<TimeLogType> {
    const user = await requireRole(['developer', 'manager']);
    await connectDB();

    // Validate input
    if (!data.date || !data.hours || !data.summary) {
        throw new Error('Required fields are missing');
    }

    if (data.hours <= 0 || data.hours > 24) {
        throw new Error('Hours must be between 0 and 24');
    }

    const newLog = await TimeLog.create({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        date: data.date,
        hours: data.hours,
        summary: data.summary,
        jiraTickets: data.jiraTickets || [],
        workType: data.workType,
        status: 'pending',
    });

    return {
        id: newLog._id.toString(),
        userId: newLog.userId,
        userName: newLog.userName,
        userRole: newLog.userRole,
        date: newLog.date,
        hours: newLog.hours,
        summary: newLog.summary,
        jiraTickets: newLog.jiraTickets,
        workType: newLog.workType,
        status: newLog.status,
        createdAt: newLog.createdAt.toISOString(),
        updatedAt: newLog.updatedAt.toISOString(),
    };
}

/**
 * Update an existing pending time log entry
 * Authorization: Developer (own log) or Manager
 */
export async function updateTimeLog(
    logId: string,
    data: {
        date: string;
        hours: number;
        summary: string;
        jiraTickets: string[];
        workType: 'feature' | 'bug' | 'refactor' | 'testing' | 'documentation' | 'planning' | 'review' | 'meeting' | 'content' | 'campaign' | 'analytics' | 'other';
    }
): Promise<TimeLogType> {
    const user = await requireRole(['developer', 'manager']);
    await connectDB();

    // Validate input
    if (!data.date || !data.hours || !data.summary) {
        throw new Error('Required fields are missing');
    }

    if (data.hours <= 0 || data.hours > 24) {
        throw new Error('Hours must be between 0 and 24');
    }

    const log = await TimeLog.findById(logId);
    if (!log) {
        throw new Error('Time log not found');
    }

    // Security checks
    if (user.role === 'developer' && log.userId !== user.id) {
        throw new Error('You can only edit your own time logs');
    }

    if (log.status !== 'pending') {
        throw new Error('You can only edit logs that are pending approval');
    }

    log.date = data.date;
    log.hours = data.hours;
    log.summary = data.summary;
    log.jiraTickets = data.jiraTickets || [];
    log.workType = data.workType;

    await log.save();

    await createActivity({
        action: 'TIMESHEET_ENTRY_UPDATED',
        targetType: 'timesheet',
        targetId: log._id.toString(),
        targetName: `${log.userName}'s log on ${log.date}`,
        details: {
            hours: log.hours,
            workType: log.workType,
            tickets: log.jiraTickets.join(", "),
        }
    });

    return {
        id: log._id.toString(),
        userId: log.userId,
        userName: log.userName,
        userRole: log.userRole,
        date: log.date,
        hours: log.hours,
        summary: log.summary,
        jiraTickets: log.jiraTickets,
        workType: log.workType,
        status: log.status,
        createdAt: log.createdAt.toISOString(),
        updatedAt: log.updatedAt.toISOString(),
    };
}

/**
 * Update time log status (approve/reject)
 * Authorization: Manager role only
 */
export async function updateLogStatus(
    logId: string,
    status: 'approved' | 'rejected',
    comment?: string
): Promise<TimeLogType> {
    const user = await requireRole(['manager']);
    await connectDB();

    const log = await TimeLog.findById(logId);
    if (!log) {
        throw new Error('Time log not found');
    }

    log.status = status;
    log.approvedBy = user.id;
    if (comment) {
        log.managerComment = comment;
    }

    await log.save();

    await createActivity({
        action: status === 'approved' ? 'TIMESHEET_APPROVED' : 'TIMESHEET_REJECTED',
        targetType: 'timesheet',
        targetId: log._id.toString(),
        targetName: `${log.userName}'s log on ${log.date}`,
        details: {
            hours: log.hours,
            comment: comment || '',
        }
    });

    return {
        id: log._id.toString(),
        userId: log.userId,
        userName: log.userName,
        userRole: log.userRole,
        date: log.date,
        hours: log.hours,
        summary: log.summary,
        jiraTickets: (log as any).jiraTickets || ((log as any).jiraTicket ? [(log as any).jiraTicket] : []),
        workType: log.workType,
        status: log.status,
        approvedBy: log.approvedBy,
        managerComment: log.managerComment,
        createdAt: log.createdAt.toISOString(),
        updatedAt: log.updatedAt.toISOString(),
    };
}

/**
 * Delete a time log entry
 * Authorization: 
 * - Developers: only their own logs AND status must be 'pending'
 * - Managers: any log
 */
export async function deleteTimeLog(logId: string): Promise<{ success: boolean; message: string }> {
    const user = await requireAuth();
    await connectDB();

    const log = await TimeLog.findById(logId);
    if (!log) {
        throw new Error('Time log not found');
    }

    // Security checks
    if (user.role === 'developer') {
        if (log.userId !== user.id) {
            throw new Error('You can only delete your own time logs');
        }
        if (log.status !== 'pending') {
            throw new Error('You can only delete logs that are still pending approval');
        }
    } else if (user.role !== 'manager') {
        throw new Error('Unauthorized to delete time logs');
    }

    await TimeLog.findByIdAndDelete(logId);

    // Only log if the user deleting is not the owner (manager deleting developer's log)
    // or if you want to log all deletions. Let's log all deletions.
    await createActivity({
        action: 'TIMESHEET_ENTRY_DELETED',
        targetType: 'timesheet',
        targetId: logId,
        targetName: `${log.userName}'s log on ${log.date}`,
        details: {
            hours: log.hours
        }
    });

    return { success: true, message: 'Time log deleted successfully' };
}
