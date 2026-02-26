'use server';

import { requireAuth } from '../auth/serverAuth';
import connectDB from '../mongodb';
import TimeLog from '@/models/TimeLog';
import User from '@/models/User';

export interface DeveloperDashboardMetrics {
    // Personal stats
    personalHoursThisMonth: number;
    personalPendingHours: number;

    // Team stats (Aggregated/Anonymized)
    totalTeamMembers: number;
    totalTeamHoursThisMonth: number;
    totalPendingSheets: number;

    // MVP of the month
    mvp: {
        id: string;
        name: string;
        role: string;
        hours: number;
    } | null;

    // Department Breakdown
    departmentDistribution: {
        department: string;
        count: number;
        percentage: number;
    }[];
}

/**
 * Fetches secure, aggregated dashboard metrics specifically for developers.
 * Ensures no sensitive data (hourly rates, bank details, other users' raw logs) is exposed.
 */
export async function getDeveloperDashboardMetrics(): Promise<DeveloperDashboardMetrics> {
    const sessionUser = await requireAuth();

    await connectDB();

    // 1. Get User Data
    // We only select non-sensitive fields. We exclude leadership/finance to match the manager dashboard logic.
    const activeTeamMembers = await User.find({
        role: { $in: ['developer', 'manager'] }
    }).select('_id name role department departments').lean();

    const totalTeamMembers = activeTeamMembers.length;

    // 2. Department Distribution
    const departmentCounts: Record<string, number> = {};
    activeTeamMembers.forEach(user => {
        const depts = (user as any).departments || (user.department ? [user.department] : ['Unassigned']);
        if (depts.length === 0) depts.push('Unassigned');
        depts.forEach((dept: string) => {
            departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
        });
    });

    const departmentDistribution = Object.entries(departmentCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([dept, count]) => ({
            department: dept,
            count,
            percentage: Math.round((count / totalTeamMembers) * 100)
        }));

    // 3. Time Logs for current month
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const startStr = startOfMonth.toISOString().split('T')[0];
    const endStr = endOfMonth.toISOString().split('T')[0];

    // Fetch ONLY necessary fields from time logs to calculate aggregates
    const monthLogs = await TimeLog.find({
        date: { $gte: startStr, $lte: endStr }
    }).select('userId status hours').lean();

    let personalHoursThisMonth = 0;
    let personalPendingHours = 0;
    let totalTeamHoursThisMonth = 0;
    let totalPendingSheets = 0;

    const userHoursMap: Record<string, number> = {};

    monthLogs.forEach((log: any) => {
        const uid = log.userId.toString();
        const isMe = uid === sessionUser.id;
        const hours = log.hours || 0;

        if (log.status === 'approved') {
            totalTeamHoursThisMonth += hours;
            userHoursMap[uid] = (userHoursMap[uid] || 0) + hours;
            if (isMe) personalHoursThisMonth += hours;
        } else if (log.status === 'pending') {
            totalPendingSheets += 1; // Count sheets, not hours, for team aggregate to match manager view
            if (isMe) personalPendingHours += hours;
        }
    });

    // 4. Calculate MVP
    let mvpId: string | null = null;
    let maxHours = 0;

    Object.entries(userHoursMap).forEach(([uid, hours]) => {
        if (hours > maxHours) {
            maxHours = hours;
            mvpId = uid;
        }
    });

    let mvp = null;
    if (mvpId) {
        const mvpData = activeTeamMembers.find(u => u._id.toString() === mvpId);
        if (mvpData) {
            mvp = {
                id: mvpData._id.toString(),
                name: mvpData.name,
                role: mvpData.role,
                hours: maxHours
            };
        }
    }

    return {
        personalHoursThisMonth,
        personalPendingHours,
        totalTeamMembers,
        totalTeamHoursThisMonth,
        totalPendingSheets,
        mvp,
        departmentDistribution
    };
}
