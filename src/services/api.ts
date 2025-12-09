import { Task, RoadmapPhase, FeatureStatus, tasks as initialTasks, roadmapData as initialRoadmap, featureStatusData as initialFeatures } from "@/lib/mockData";

// Simulate a database with local variables (in-memory for simple dev session persistence)
let dbTasks = [...initialTasks];
let dbRoadmap = [...initialRoadmap];
let dbFeatures = [...initialFeatures];

const DELAY_MS = 600;

export const api = {
    getTasks: async (): Promise<Task[]> => {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        return [...dbTasks];
    },

    updateTaskStatus: async (taskId: string, status: Task['status']): Promise<Task> => {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        const taskIndex = dbTasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) throw new Error("Task not found");

        const updatedTask = { ...dbTasks[taskIndex], status };
        dbTasks[taskIndex] = updatedTask;
        return updatedTask;
    },

    getRoadmap: async (): Promise<RoadmapPhase[]> => {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        return [...dbRoadmap];
    },

    toggleDeliverable: async (phaseId: string, deliverableIndex: number): Promise<RoadmapPhase> => {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        const phaseIndex = dbRoadmap.findIndex(p => p.id === phaseId);
        if (phaseIndex === -1) throw new Error("Phase not found");

        const phase = { ...dbRoadmap[phaseIndex] };
        const newDeliverables = [...phase.deliverables];
        const currentStatus = newDeliverables[deliverableIndex].status;

        // Toggle logic
        newDeliverables[deliverableIndex] = {
            ...newDeliverables[deliverableIndex],
            status: currentStatus === 'done' ? 'pending' : 'done'
        };

        phase.deliverables = newDeliverables;
        dbRoadmap[phaseIndex] = phase;
        return phase;
    },

    getFeatures: async (): Promise<FeatureStatus[]> => {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        return [...dbFeatures];
    },

    updateFeature: async (id: string, updates: Partial<FeatureStatus>): Promise<FeatureStatus> => {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        const index = dbFeatures.findIndex(f => f.id === id);
        if (index === -1) throw new Error("Feature not found");

        const updatedFeature = { ...dbFeatures[index], ...updates };
        dbFeatures[index] = updatedFeature;
        return updatedFeature;
    },

    addFeature: async (feature: FeatureStatus): Promise<FeatureStatus> => {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        dbFeatures.push(feature);
        return feature;
    },

    deleteFeature: async (id: string): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        dbFeatures = dbFeatures.filter(f => f.id !== id);
    },

    updatePhase: async (id: string, updates: Partial<RoadmapPhase>): Promise<RoadmapPhase> => {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        const index = dbRoadmap.findIndex(p => p.id === id);
        if (index === -1) throw new Error("Phase not found");

        const updatedPhase = { ...dbRoadmap[index], ...updates };
        dbRoadmap[index] = updatedPhase;
        return updatedPhase;
    },

    addPhase: async (phase: RoadmapPhase): Promise<RoadmapPhase> => {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        dbRoadmap.push(phase);
        return phase;
    },

    deletePhase: async (id: string): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        dbRoadmap = dbRoadmap.filter(p => p.id !== id);
    }
};
