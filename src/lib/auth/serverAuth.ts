import { cookies } from 'next/headers';
import mongoose from 'mongoose';
import { verifyToken, JWTPayload } from './jwt';
import connectDB from '../mongodb';
import User, { IUser } from '@/models/User';

// Simplified user type for server-side auth that doesn't include Mongoose Document methods
export interface AuthUser {
    id: string;
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    passwordHash: string;
    role: 'manager' | 'developer' | 'leadership' | 'finance';
    isSuperAdmin?: boolean;
    hourlyRate?: number;
    department?: 'Frontend' | 'Backend' | 'Marketing' | 'Customer Success' | 'Management';
    dailyHoursTarget?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Get the current authenticated user from the JWT cookie
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return null;
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return null;
        }

        // Connect to DB and fetch full user details
        await connectDB();
        const user = await User.findById(payload.userId).lean();

        if (!user) {
            return null;
        }

        // Transform _id to id for consistency with frontend types
        return {
            ...user,
            id: user._id.toString(),
            _id: user._id,
        } as AuthUser;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

/**
 * Require authentication - throws if user is not authenticated
 * @returns Authenticated user object
 * @throws Error if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Authentication required');
    }
    return user;
}

/**
 * Require specific role(s) - throws if user doesn't have required role
 * @param allowedRoles Array of allowed roles
 * @returns Authenticated user object
 * @throws Error if not authenticated or lacks required role
 */
export async function requireRole(allowedRoles: string[]): Promise<AuthUser> {
    const user = await requireAuth();
    if (!allowedRoles.includes(user.role)) {
        throw new Error(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
    }
    return user;
}
