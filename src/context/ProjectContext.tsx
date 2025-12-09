"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, RoadmapPhase, FeatureStatus } from '@/lib/mockData';
import { api } from '@/services/api';

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
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [roadmap, setRoadmap] = useState<RoadmapPhase[]>([]);
    const [features, setFeatures] = useState<FeatureStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshData = async () => {
        setIsLoading(true);
        try {
            const [fetchedTasks, fetchedRoadmap, fetchedFeatures] = await Promise.all([
                api.getTasks(),
                api.getRoadmap(),
                api.getFeatures()
            ]);
            setTasks(fetchedTasks);
            setRoadmap(fetchedRoadmap);
            setFeatures(fetchedFeatures);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

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
        await api.updatePhase(id, updates);
        await refreshData();
    };

    const addPhase = async (phase: RoadmapPhase) => {
        await api.addPhase(phase);
        await refreshData();
    };

    const deletePhase = async (id: string) => {
        await api.deletePhase(id);
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
            deletePhase
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
