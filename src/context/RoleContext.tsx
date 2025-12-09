"use client";

import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'manager' | 'developer' | 'leadership';

export interface User {
    username: string;
    email?: string; // Optional for now
    name: string;
}

interface RoleContextType {
    role: UserRole;
    user: User | null;
    login: (username: string, role: UserRole) => void;
    logout: () => void;

    // New Helpers
    isManager: boolean;
    isDeveloper: boolean;
    isLeadership: boolean;
    // Deprecated Helpers (Backwards Compatibility)
    isAdmin: boolean;
    isStakeholder: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
    const [role, setRole] = useState<UserRole>('leadership');
    const [user, setUser] = useState<User | null>(null);

    const login = (username: string, newRole: UserRole) => {
        setUser({
            username,
            name: username.charAt(0).toUpperCase() + username.slice(1), // Simple capitalization for display name
        });
        setRole(newRole);
    };

    const logout = () => {
        setUser(null);
        setRole('leadership'); // Reset to default safe role
    };

    const isManager = role === 'manager';
    const isDeveloper = role === 'developer';
    const isLeadership = role === 'leadership';

    const value = {
        role,
        user,
        login,
        logout,
        setRole, // Keeping for internal/legacy use if needed, but login() is preferred
        isManager,
        isDeveloper,
        isLeadership,
        // Map old roles to new ones for safety
        isAdmin: isManager,
        isStakeholder: isLeadership,
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
