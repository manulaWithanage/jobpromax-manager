
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserAction, login as loginAction, logout as logoutAction } from '@/lib/actions/auth';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    department?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkUser();
    }, []);

    async function checkUser() {
        try {
            const currentUser = await getCurrentUserAction();
            if (currentUser) {
                setUser({
                    id: currentUser.id,
                    email: currentUser.email,
                    name: currentUser.name,
                    role: currentUser.role,
                    department: currentUser.department,
                });
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Auth Check Error:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    async function login(email: string, password: string) {
        const result = await loginAction(email, password);

        if (result.success && result.user) {
            setUser({
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                role: result.user.role,
                department: result.user.department,
            });

            // Redirect based on role
            if (result.user.role === 'manager') {
                router.push('/manager/users');
            } else if (result.user.role === 'developer') {
                router.push('/timesheets');
            } else {
                router.push('/roadmap');
            }
        } else {
            throw new Error(result.message || 'Login failed');
        }
    }

    async function logout() {
        await logoutAction();
        setUser(null);
        router.push('/');
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
