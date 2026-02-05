'use server';

import { requireRole } from '../auth/serverAuth';
import connectDB from '../mongodb';
import Payment from '@/models/Payment';
import TimeLog from '@/models/TimeLog';
import User from '@/models/User';
import { validateSharedLink } from './shared';

export interface PaymentRecord {
    id: string;
    userId: string;
    userName: string;
    period: 'P1' | 'P2';
    month: number;
    year: number;
    hours: number;
    amount: number;
    status: 'pending' | 'paid';
    paidAt?: string;
    paidBy?: string;
    notes?: string;
    hourlyRate: number;
    hasBankDetails: boolean;
    bankDetails?: {
        accountName: string;
        bankName: string;
        accountNumber: string;
        branchName?: string;
        branchCode?: string;
        country?: string;
        currency?: string;
        notes?: string;
    };
}

/**
 * Get all payment records for a given month/year
 * OPTIMIZED: Uses batch queries instead of N+1 pattern
 * @param sharedToken - Optional shared link token for public access
 */
export async function getPaymentRecords(
    month: number,
    year: number,
    period?: 'P1' | 'P2',
    sharedToken?: string
): Promise<PaymentRecord[]> {
    // If shared token provided, validate it instead of requiring auth
    if (sharedToken) {
        const validation = await validateSharedLink(sharedToken);
        if (!validation.valid) {
            throw new Error('Invalid shared link');
        }
        // Override parameters with token metadata
        month = validation.month!;
        year = validation.year!;
        period = validation.period!;
    } else {
        await requireRole(['manager', 'finance']);
    }

    await connectDB();

    // Get all users with relevant roles (single query)
    const users = await User.find({ role: { $in: ['developer', 'manager', 'leadership', 'finance'] } })
        .select('name hourlyRate bankDetails')
        .lean();

    // Calculate date ranges
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const p1StartDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const p1EndDate = `${year}-${String(month).padStart(2, '0')}-15`;
    const p2StartDate = `${year}-${String(month).padStart(2, '0')}-16`;
    const p2EndDate = `${year}-${String(month).padStart(2, '0')}-${lastDayOfMonth}`;

    // Determine date range based on period
    let startDate = p1StartDate;
    let endDate = p2EndDate;
    if (period === 'P1') {
        endDate = p1EndDate;
    } else if (period === 'P2') {
        startDate = p2StartDate;
    }

    // Batch fetch all approved time logs for the period (single query)
    const allLogs = await TimeLog.find({
        status: 'approved',
        date: { $gte: startDate, $lte: endDate }
    }).lean();

    // Batch fetch all existing payment records for this month/year (single query)
    const existingPayments = await Payment.find({
        month,
        year,
        ...(period ? { period } : {})
    }).lean();

    // Create lookup maps for O(1) access
    const paymentMap = new Map<string, any>();
    for (const payment of existingPayments) {
        const key = `${payment.userId.toString()}-${payment.period}`;
        paymentMap.set(key, payment);
    }

    // Aggregate hours by user and period
    const hoursMap = new Map<string, number>();
    for (const log of allLogs) {
        const logDate = new Date(log.date);
        const day = logDate.getDate();
        const logPeriod: 'P1' | 'P2' = day <= 15 ? 'P1' : 'P2';

        // Skip if period filter doesn't match
        if (period && period !== logPeriod) continue;

        const key = `${log.userId.toString()}-${logPeriod}`;
        hoursMap.set(key, (hoursMap.get(key) || 0) + (log.hours || 0));
    }

    const records: PaymentRecord[] = [];
    const periods: ('P1' | 'P2')[] = period ? [period] : ['P1', 'P2'];

    // Build records for each user and period
    for (const user of users) {
        for (const p of periods) {
            const key = `${user._id.toString()}-${p}`;
            const hours = hoursMap.get(key) || 0;
            const payment = paymentMap.get(key);
            const rate = user.hourlyRate || 0;
            const amount = hours * rate;

            // Only include users with hours or existing payment records
            if (hours > 0 || payment) {
                records.push({
                    id: payment?._id?.toString() || '',
                    userId: user._id.toString(),
                    userName: user.name,
                    period: p,
                    month,
                    year,
                    hours: payment?.hours ?? hours,
                    amount: payment?.amount ?? amount,
                    status: payment?.status || 'pending',
                    paidAt: payment?.paidAt?.toISOString(),
                    paidBy: payment?.paidBy,
                    notes: payment?.notes,
                    hourlyRate: rate,
                    hasBankDetails: !!(user.bankDetails?.accountNumber),
                    bankDetails: user.bankDetails ? {
                        accountName: user.bankDetails.accountName,
                        bankName: user.bankDetails.bankName,
                        accountNumber: user.bankDetails.accountNumber,
                        branchName: user.bankDetails.branchName,
                        branchCode: user.bankDetails.branchCode,
                        country: user.bankDetails.country,
                        currency: user.bankDetails.currency,
                        notes: user.bankDetails.notes,
                    } : undefined
                });
            }
        }
    }

    return records.sort((a, b) => a.userName.localeCompare(b.userName));
}

/**
 * Mark a payment as paid
 * @param sharedToken - Optional shared link token for public access
 */
export async function markPaymentAsPaid(
    userId: string,
    period: 'P1' | 'P2',
    month: number,
    year: number,
    paidBy: string,
    sharedToken?: string
): Promise<PaymentRecord> {
    // If shared token provided, validate it and use generic paidBy
    if (sharedToken) {
        const validation = await validateSharedLink(sharedToken);
        if (!validation.valid) {
            throw new Error('Invalid shared link');
        }
        // Verify the token matches the payment period
        if (validation.month !== month || validation.year !== year || validation.period !== period) {
            throw new Error('Token does not match payment period');
        }
        paidBy = 'Shared Link';
    } else {
        await requireRole(['manager', 'finance']);
    }

    await connectDB();

    const payment = await Payment.findOneAndUpdate(
        { userId, period, month, year },
        {
            $set: {
                status: 'paid',
                paidAt: new Date(),
                paidBy
            }
        },
        { new: true, upsert: false }
    ).lean();

    if (!payment) {
        throw new Error('Payment record not found');
    }

    const user = await User.findById(userId).select('hourlyRate bankDetails').lean();

    return {
        id: payment._id.toString(),
        userId: payment.userId.toString(),
        userName: payment.userName,
        period: payment.period,
        month: payment.month,
        year: payment.year,
        hours: payment.hours,
        amount: payment.amount,
        status: payment.status,
        paidAt: payment.paidAt?.toISOString(),
        paidBy: payment.paidBy,
        notes: payment.notes,
        hourlyRate: user?.hourlyRate || 0,
        hasBankDetails: !!(user?.bankDetails?.accountNumber)
    };
}

/**
 * Mark a payment as pending (undo paid)
 * @param sharedToken - Optional shared link token for public access
 */
export async function markPaymentAsPending(
    userId: string,
    period: 'P1' | 'P2',
    month: number,
    year: number,
    sharedToken?: string
): Promise<PaymentRecord> {
    // If shared token provided, validate it
    if (sharedToken) {
        const validation = await validateSharedLink(sharedToken);
        if (!validation.valid) {
            throw new Error('Invalid shared link');
        }
        // Verify the token matches the payment period
        if (validation.month !== month || validation.year !== year || validation.period !== period) {
            throw new Error('Token does not match payment period');
        }
    } else {
        await requireRole(['manager', 'finance']);
    }

    await connectDB();

    const payment = await Payment.findOneAndUpdate(
        { userId, period, month, year },
        {
            $set: { status: 'pending' },
            $unset: { paidAt: 1, paidBy: 1 }
        },
        { new: true }
    ).lean();

    if (!payment) {
        throw new Error('Payment record not found');
    }

    const user = await User.findById(userId).select('hourlyRate bankDetails').lean();

    return {
        id: payment._id.toString(),
        userId: payment.userId.toString(),
        userName: payment.userName,
        period: payment.period,
        month: payment.month,
        year: payment.year,
        hours: payment.hours,
        amount: payment.amount,
        status: payment.status,
        paidAt: undefined,
        paidBy: undefined,
        notes: payment.notes,
        hourlyRate: user?.hourlyRate || 0,
        hasBankDetails: !!(user?.bankDetails?.accountNumber)
    };
}

/**
 * Create or update payment record for hours tracking
 */
export async function upsertPaymentRecord(
    userId: string,
    userName: string,
    period: 'P1' | 'P2',
    month: number,
    year: number,
    hours: number,
    amount: number
): Promise<void> {
    await requireRole(['manager', 'finance']);
    await connectDB();

    await Payment.findOneAndUpdate(
        { userId, period, month, year },
        {
            $set: {
                userName,
                hours,
                amount
            },
            $setOnInsert: {
                status: 'pending'
            }
        },
        { upsert: true }
    );
}
