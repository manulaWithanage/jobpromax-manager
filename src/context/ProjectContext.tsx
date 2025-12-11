"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, RoadmapPhase, FeatureStatus, User } from '@/types';
import { api } from '@/services/api';
import { useAuth } from './AuthContext';

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
    deleteUser: (id: string) => Promise<void>;
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
        if (authLoading || !user) return; // Don't fetch if not logged in
        setIsLoading(true);
        try {
            const [fetchedTasks, fetchedRoadmap, fetchedFeatures, fetchedUsers] = await Promise.all([
                api.getTasks(),
                api.getRoadmap(),
                api.getFeatures(),
                api.getUsers()
            ]);
            setTasks(fetchedTasks);
            setRoadmap(fetchedRoadmap);
            setFeatures(fetchedFeatures);
            setUsers(fetchedUsers);
        } catch (error) {
            console.error("Failed to fetch data", error);
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

    const addUser = async (user: Omit<User, 'id'>) => {
        await api.createUser(user);
        await refreshData();
    };

    const deleteUser = async (id: string) => {
        await api.deleteUser(id);
        await refreshData();
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
            deleteUser
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
