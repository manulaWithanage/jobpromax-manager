"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, RoadmapPhase, FeatureStatus, User } from '@/types';
import { api } from '@/services/api';
import { useAuth } from './AuthContext';
import { getUsers as getUsersAction, updateUserProfile, createUser as createUserAction, deleteUser as deleteUserAction } from '@/lib/actions/user';

interface ProjectContextType {
    tasks: Task[];
    roadmap: RoadmapPhase[];
    features: FeatureStatus[];
    isLoading: boolean;
    refreshData: () => Promise<void>;
    updateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
    toggleDeliverable: (phaseId: string, index: number) => Promise<void>;
    updateFeature: (id: string, updates: Partial<FeatureStatus>) => Promise<void>;
    updatePhase: (id: string, updates: Partial<RoadmapPhase>) => Promise<void>;
    addPhase: (phase: RoadmapPhase) => Promise<void>;
    deletePhase: (id: string) => Promise<void>;
    addFeature: (feature: FeatureStatus) => Promise<void>;
    deleteFeature: (id: string) => Promise<void>;
    // User Management
    users: User[];
    addUser: (user: Omit<User, 'id'>) => Promise<void>;
    updateUser: (id: string, updates: Partial<User>) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    changeUserPassword: (userId: string, newPassword: string, currentPassword?: string, isForced?: boolean) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [roadmap, setRoadmap] = useState<RoadmapPhase[]>([]);
    const [features, setFeatures] = useState<FeatureStatus[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const { user, loading: authLoading } = useAuth();

    const refreshData = async () => {
        if (authLoading) {
            console.log('[ProjectContext] refreshData skipped - auth is still loading');
            return;
        }
        if (!user) {
            console.log('[ProjectContext] refreshData skipped - no user authenticated');
            return;
        }

        console.log('[ProjectContext] refreshData starting for user:', user.email, 'Role:', user.role);
        setIsLoading(true);

        try {
            // Fetch users (Critical)
            let fetchedUsers: User[] = [];
            try {
                console.log('[ProjectContext] Fetching users via Server Action...');
                fetchedUsers = await getUsersAction();
                console.log('[ProjectContext] Users response received:', fetchedUsers);
            } catch (err) {
                console.error('[ProjectContext] ❌ Error fetching users:', err);
                if (err instanceof Error && err.message.includes('Authentication')) {
                    console.error('[ProjectContext] 💡 SESSION ERROR: Your login session might be invalid. Please LOGOUT and LOGIN again.');
                }
            }

            // Fetch tasks (Graceful failure)
            let fetchedTasks: Task[] = [];
            try {
                fetchedTasks = await api.getTasks();
            } catch (err) {
                console.warn('[ProjectContext] Error fetching tasks (Likely missing API route):', err);
            }

            // Fetch roadmap (Graceful failure)
            let fetchedRoadmap: RoadmapPhase[] = [];
            try {
                fetchedRoadmap = await api.getRoadmap();
            } catch (err) {
                console.warn('[ProjectContext] Error fetching roadmap (Likely missing API route):', err);
            }

            // Fetch features (Graceful failure)
            let fetchedFeatures: FeatureStatus[] = [];
            try {
                fetchedFeatures = await api.getFeatures();
            } catch (err) {
                console.warn('[ProjectContext] Error fetching features (Likely missing API route):', err);
            }

            // Update state with whatever we got
            setTasks(fetchedTasks || []);
            setRoadmap(fetchedRoadmap || []);
            setFeatures(fetchedFeatures || []);
            setUsers(fetchedUsers || []);

            console.log('[ProjectContext] State updated with latest data');
        } catch (error) {
            console.error("[ProjectContext] Critical failure in refreshData", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, [user, authLoading]);

    const updateTaskStatus = async (taskId: string, status: Task['status']) => {
        // Optimistic Update can be added here, but for simplicity awaiting API
        await api.updateTaskStatus(taskId, status);
        await refreshData(); // Re-fetch to ensure sync
    };

    const toggleDeliverable = async (phaseId: string, index: number) => {
        await api.toggleDeliverable(phaseId, index);
        await refreshData();
    };

    const updateFeature = async (id: string, updates: Partial<FeatureStatus>) => {
        await api.updateFeature(id, updates);
        await refreshData();
    };

    const addFeature = async (feature: FeatureStatus) => {
        await api.addFeature(feature);
        await refreshData();
    };

    const deleteFeature = async (id: string) => {
        await api.deleteFeature(id);
        await refreshData();
    };

    const updatePhase = async (id: string, updates: Partial<RoadmapPhase>) => {
        console.log('[ProjectContext] Calling API: updatePhase');
        console.log('[ProjectContext] Phase ID:', id);
        console.log('[ProjectContext] Updates:', updates);
        await api.updatePhase(id, updates);
        console.log('[ProjectContext] Refreshing data...');
        await refreshData();
        console.log('[ProjectContext] Data refreshed');
    };

    const addPhase = async (phase: RoadmapPhase) => {
        console.log('[ProjectContext] Calling API: addPhase');
        console.log('[ProjectContext] Phase data:', phase);
        await api.addPhase(phase);
        console.log('[ProjectContext] Refreshing data...');
        await refreshData();
        console.log('[ProjectContext] Data refreshed');
    };

    const deletePhase = async (id: string) => {
        console.log('[ProjectContext] Calling API: deletePhase');
        console.log('[ProjectContext] Phase ID:', id);
        console.log('[ProjectContext] Phase ID type:', typeof id);

        // Validate ID exists
        if (!id || id === 'undefined' || id === 'null') {
            console.error('[ProjectContext] ❌ Invalid phase ID received:', id);
            throw new Error(`Cannot delete phase: Invalid ID (${id})`);
        }

        await api.deletePhase(id);
        console.log('[ProjectContext] Refreshing data...');
        await refreshData();
        console.log('[ProjectContext] Data refreshed');
    };

    const addUser = async (userData: any) => {
        try {
            await createUserAction({
                ...userData,
                password: userData.password || 'password123'
            });
            await refreshData();
        } catch (error) {
            console.error('[ProjectContext] Failed to add user:', error);
            throw error;
        }
    };

    const updateUser = async (id: string, updates: Partial<User>) => {
        try {
            console.log('[ProjectContext] updateUser called with:', { id, updates });

            const updatedUser = await updateUserProfile(id, {
                name: updates.name,
                email: updates.email,
                role: updates.role,
                hourlyRate: updates.hourlyRate,
                department: updates.department as any,
                dailyHoursTarget: updates.dailyHoursTarget,
            });

            console.log('[ProjectContext] Server action returned:', updatedUser);

            // Update local state with the actual data from the server
            setUsers(prev => {
                const updated = prev.map(u => u.id === id ? updatedUser : u);
                console.log('[ProjectContext] Local state updated with server response');
                return updated;
            });

            // Force a full refresh to ensure all related data is in sync
            console.log('[ProjectContext] Refreshing all data after user update...');
            await refreshData();
        } catch (error) {
            console.error('[ProjectContext] Failed to update user:', error);
            throw error;
        }
    };

    const deleteUser = async (id: string) => {
        try {
            await deleteUserAction(id);
            await refreshData();
        } catch (error) {
            console.error('[ProjectContext] Failed to delete user:', error);
            throw error;
        }
    };

    const changeUserPassword = async (userId: string, newPassword: string, currentPassword?: string, isForced: boolean = false) => {
        const { changeUserPassword: changePasswordAction } = await import('@/lib/actions/user');
        await changePasswordAction(userId, newPassword, currentPassword, isForced);
    };

    return (
        <ProjectContext.Provider value={{
            tasks,
            roadmap,
            features,
            isLoading,
            refreshData,
            updateTaskStatus,
            toggleDeliverable,
            updateFeature,
            addFeature,
            deleteFeature,
            updatePhase,
            addPhase,
            deletePhase,
            users,
            addUser,
            updateUser,
            deleteUser,
            changeUserPassword
        }}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
}
