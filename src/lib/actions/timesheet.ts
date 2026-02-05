'use server';

import { requireAuth, requireRole } from '../auth/serverAuth';
import connectDB from '../mongodb';
import TimeLog from '@/models/TimeLog';
import { TimeLog as TimeLogType } from '@/types';

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
