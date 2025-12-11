
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

import { authService } from '@/services/auth';

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
            const res = await authService.getCurrentUser();
            // Assuming the proxy returns { user: ... } or null
            // The service returns the response body directly
            // If the route returns { user }, then res.user is sufficient
            // But fetchAPI returns `any` (res.json()).
            // Let's assume authService types are correct or inferred.

            // Wait, fetchAPI returns Promise<any> in api.ts?
            // "return await res.json();" -> inferred any.
            // authService methods return Promise<LoginResponse> etc.

            // If authService.getCurrentUser() returns { user: User | null } (as defined in auth.ts)
            if (res && res.user) {
                setUser(res.user);
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
        // authService.login throws if fetch fails (fetchAPI throws on !res.ok)
        const data = await authService.login(email, password);

        // If success
        if (data.user) {
            setUser(data.user);
            router.push('/manager/users'); // Redirect after login
        } else {
            throw new Error(data.message || 'Login failed');
        }
    }

    async function logout() {
        await authService.logout();
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
