'use server';

import { cookies } from 'next/headers';
import connectDB from '../mongodb';
import User from '@/models/User';
import { createToken } from '../auth/jwt';
import { User as UserType } from '@/types';

interface LoginResult {
    success: boolean;
    user?: UserType;
    message?: string;
}

/**
 * Login with email and password
 * Creates JWT session on success
 */
export async function login(email: string, password: string): Promise<LoginResult> {
    try {
        await connectDB();

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return {
                success: false,
                message: 'Invalid email or password',
            };
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return {
                success: false,
                message: 'Invalid email or password',
            };
        }

        // Create JWT token
        const token = await createToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
        });

        // Set HTTP-only cookie
        const cookieStore = await cookies();
        cookieStore.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        // Return user without password
        return {
            success: true,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                isSuperAdmin: user.isSuperAdmin,
                hourlyRate: user.hourlyRate,
                department: user.department,
            },
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            message: 'An error occurred during login',
        };
    }
}

/**
 * Logout - clear session
 */
export async function logout(): Promise<{ success: boolean }> {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('auth-token');
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false };
    }
}

/**
 * Get current authenticated user
 * Safe to call from Client Components
 */
export async function getCurrentUserAction(): Promise<UserType | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return null;
        }

        const { verifyToken } = await import('../auth/jwt');
        const payload = await verifyToken(token);
        if (!payload) {
            return null;
        }

        await connectDB();
        const user = await User.findById(payload.userId).select('-passwordHash').lean();

        if (!user) {
            return null;
        }

        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            isSuperAdmin: user.isSuperAdmin,
            hourlyRate: user.hourlyRate,
            department: user.department,
        };
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}
