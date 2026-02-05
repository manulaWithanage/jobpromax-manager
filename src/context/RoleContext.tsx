"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

export type UserRole = 'manager' | 'developer' | 'leadership' | 'finance';

export interface User {
    username: string;
    email?: string;
    name: string;
}

interface RoleContextType {
    role: UserRole;
    user: User | null;
    login: (username: string, role: UserRole) => void; // Deprecated
    logout: () => void;
    isManager: boolean;
    isDeveloper: boolean;
    isLeadership: boolean;
    isFinance: boolean;
    isAdmin: boolean;       // Deprecated
    isStakeholder: boolean; // Deprecated
    isLoading: boolean;
    setRole: () => void; // Deprecated
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
    const { user: authUser, loading, logout: authLogout } = useAuth();

    const role: UserRole = useMemo(() => {
        if (!authUser) return 'leadership'; // Default safely
        const r = authUser.role?.toLowerCase();
        if (r === 'manager') return 'manager';
        if (r === 'developer') return 'developer';
        if (r === 'finance') return 'finance';
        return 'leadership';
    }, [authUser]);

    const user: User | null = authUser ? {
        username: authUser.email.split('@')[0],
        name: authUser.name || 'User',
        email: authUser.email
    } : null;

    const isManager = role === 'manager';
    const isDeveloper = role === 'developer';
    const isLeadership = role === 'leadership';
    const isFinance = role === 'finance';

    const value = {
        role,
        user,
        login: () => console.warn("Login via RoleContext is deprecated"),
        logout: authLogout,
        setRole: () => { }, // No-op
        isManager,
        isDeveloper,
        isLeadership,
        isFinance,
        isAdmin: isManager,
        isStakeholder: isLeadership,
        isLoading: loading
    };

    return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
    const context = useContext(RoleContext);
    if (context === undefined) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
}
