'use server';

import { requireRole } from '../auth/serverAuth';
import connectDB from '../mongodb';
import User from '@/models/User';
import { User as UserType } from '@/types';
import bcrypt from 'bcryptjs';

/**
 * Get all users
 * Authorization: Manager or Finance role
 */
export async function getUsers(): Promise<UserType[]> {
    await requireRole(['manager', 'finance']);
    await connectDB();

    const users = await User.find({}).select('-passwordHash').lean();

    console.log(`[getUsers] Found ${users.length} users in database`);
    if (users.length > 0) {
        console.log(`[getUsers] Sample user (first): ID=${users[0]._id}, Name=${users[0].name}, Email=${users[0].email}, Rate=${users[0].hourlyRate}`);
    }

    return users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        hourlyRate: user.hourlyRate,
        department: user.department,
        dailyHoursTarget: user.dailyHoursTarget,
        bankDetails: user.bankDetails,
    }));
}

/**
 * Update user profile (hourly rate, department)
 * Authorization: Manager role only
 */
export async function updateUserProfile(
    userId: string,
    updates: {
        name?: string;
        email?: string;
        role?: 'manager' | 'developer' | 'leadership' | 'finance';
        hourlyRate?: number;
        department?: 'Frontend' | 'Backend' | 'Marketing' | 'Customer Success' | 'Management';
        dailyHoursTarget?: number;
    }
): Promise<UserType> {
    await requireRole(['manager']);
    await connectDB();

    console.log('[updateUserProfile] Updating user:', userId);
    console.log('[updateUserProfile] Updates:', updates);

    // Build the update object, only including defined values
    const updateFields: any = {};

    // Validate and add department if provided
    if (updates.department) {
        const validDepartments = ['Frontend', 'Backend', 'Marketing', 'Customer Success', 'Management'];
        if (!validDepartments.includes(updates.department)) {
            throw new Error('Invalid department');
        }
        updateFields.department = updates.department;
    }

    // Validate and add hourly rate if provided
    if (updates.hourlyRate !== undefined) {
        if (updates.hourlyRate < 0) {
            throw new Error('Hourly rate must be non-negative');
        }
        updateFields.hourlyRate = updates.hourlyRate;
    }

    // Validate and add daily hours target if provided
    if (updates.dailyHoursTarget !== undefined) {
        if (updates.dailyHoursTarget < 0 || updates.dailyHoursTarget > 24) {
            throw new Error('Daily hours target must be between 0 and 24');
        }
        updateFields.dailyHoursTarget = updates.dailyHoursTarget;
    }

    if (updates.name) updateFields.name = updates.name;
    if (updates.email) updateFields.email = updates.email.toLowerCase();
    if (updates.role) updateFields.role = updates.role;

    console.log('[updateUserProfile] Applying updates:', updateFields);

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
        throw new Error('User not found');
    }

    console.log('[updateUserProfile] User updated successfully:', {
        id: user._id.toString(),
        hourlyRate: user.hourlyRate,
        department: user.department,
        dailyHoursTarget: user.dailyHoursTarget
    });

    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        hourlyRate: user.hourlyRate,
        department: user.department,
        dailyHoursTarget: user.dailyHoursTarget,
    };
}

/**
 * Create a new user
 * Authorization: Manager role only
 */
export async function createUser(data: {
    name: string;
    email: string;
    password: string;
    role: 'manager' | 'developer' | 'leadership';
    hourlyRate?: number;
    department?: 'Frontend' | 'Backend' | 'Marketing' | 'Customer Success' | 'Management';
    dailyHoursTarget?: number;
}
): Promise<UserType> {
    await requireRole(['manager']);
    await connectDB();

    // Validate input
    if (!data.name || !data.email || !data.password || !data.role) {
        throw new Error('Name, email, password, and role are required');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    const newUser = await User.create({
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        role: data.role,
        hourlyRate: data.hourlyRate || 0,
        department: data.department,
        dailyHoursTarget: data.dailyHoursTarget || 8,
    });

    return {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isSuperAdmin: newUser.isSuperAdmin,
        hourlyRate: newUser.hourlyRate,
        department: newUser.department,
        dailyHoursTarget: newUser.dailyHoursTarget,
    };
}

/**
 * Delete a user
 * Authorization: Manager role only
 */
export async function deleteUser(userId: string): Promise<void> {
    const currentUser = await requireRole(['manager']);
    await connectDB();

    // Prevent self-deletion
    if (currentUser.id === userId) {
        throw new Error('Cannot delete your own account');
    }

    const result = await User.findByIdAndDelete(userId);
    if (!result) {
        throw new Error('User not found');
    }
}

/**
 * Update user bank details
 * Authorization: Manager role only
 */
export async function updateUserBankDetails(
    userId: string,
    bankDetails: {
        accountName: string;
        bankName: string;
        accountNumber: string;
        branchName?: string;
        branchCode?: string;
        country?: string;
        currency?: string;
        notes?: string;
    }
): Promise<UserType> {
    await requireRole(['manager', 'finance']);
    await connectDB();

    console.log('[updateUserBankDetails] Updating bank details for user:', userId);

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: { bankDetails } },
        { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
        throw new Error('User not found');
    }

    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        hourlyRate: user.hourlyRate,
        department: user.department,
        dailyHoursTarget: user.dailyHoursTarget,
        bankDetails: user.bankDetails,
    };
}

/**
 * Clear user bank details
 * Authorization: Manager or Finance role
 */
export async function clearUserBankDetails(userId: string): Promise<UserType> {
    await requireRole(['manager', 'finance']);
    await connectDB();

    console.log('[clearUserBankDetails] Clearing bank details for user:', userId);

    const user = await User.findByIdAndUpdate(
        userId,
        { $unset: { bankDetails: 1 } },
        { new: true }
    ).select('-passwordHash');

    if (!user) {
        throw new Error('User not found');
    }

    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        hourlyRate: user.hourlyRate,
        department: user.department,
        dailyHoursTarget: user.dailyHoursTarget,
        bankDetails: undefined,
    };
}

/**
 * Change user password
 * Authorization: Manager role (for any user) or User (for self)
 */
export async function changeUserPassword(
    userId: string,
    newPassword: string,
    currentPassword?: string,
    isForced: boolean = false
): Promise<void> {
    const currentUser = await requireRole(['manager', 'developer', 'leadership', 'finance']);
    await connectDB();

    // If not forced (not by manager), verify current password
    if (!isForced) {
        if (!currentPassword) {
            throw new Error('Current password is required');
        }
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            throw new Error('Incorrect current password');
        }
    } else {
        // If forced, requester must be manager
        if (currentUser.role !== 'manager') {
            throw new Error('Unauthorized to force password reset');
        }
    }

    // Hash and update
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { $set: { passwordHash } });

    console.log(`[changeUserPassword] Password updated for user: ${userId}${isForced ? ' (Forced)' : ''}`);
}
