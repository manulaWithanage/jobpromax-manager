import { Task, RoadmapPhase, FeatureStatus, User, ChartDataPoint, KPI } from "@/types";

// Helper for Fetching from Proxy
export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    // START CHANGE: Use direct backend URL instead of Next.js API proxy
    // Use /api proxy to avoid CORS issues
    const BASE_URL = '/api';

    // Ensure endpoint doesn't start with / to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    const res = await fetch(`${BASE_URL}/${cleanEndpoint}`, {
        ...options,
        // IMPORTANT: data-access layer must include credentials for auth cookies
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    // END CHANGE

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `API Error: ${res.statusText}`);
    }

    try {
        return await res.json();
    } catch {
        // Return empty if no JSON (e.g. 204 No Content)
        return null;
    }
}

export const api = {
    // TASKS
    getTasks: async (): Promise<Task[]> => {
        return fetchAPI('tasks');
    },

    updateTaskStatus: async (taskId: string, status: Task['status']): Promise<Task> => {
        return fetchAPI(`tasks/${taskId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    },

    // ROADMAP
    getRoadmap: async (): Promise<RoadmapPhase[]> => {
        console.log('[API] Fetching roadmap...');
        const rawData: any[] = await fetchAPI('roadmap');

        // Transform _id to id if needed (MongoDB returns _id)
        const transformed = rawData.map((phase: any) => ({
            ...phase,
            id: phase.id || phase._id, // Use id if exists, fallback to _id
        }));

        console.log('[API] Roadmap fetched. First phase structure:', transformed[0]);
        return transformed;
    },

    toggleDeliverable: async (phaseId: string, deliverableIndex: number): Promise<RoadmapPhase> => {
        // Fetch current phase first (Backend logic might be better suited for specific endpoint, but we simulate)
        // OR better, we assume we need to send the FULL phase update or a specific deliverable update logic
        // For robustness without changing backend too much, let's fetch-modify-update
        const phases: RoadmapPhase[] = await fetchAPI('roadmap');
        const phase = phases.find(p => p.id === phaseId);
        if (!phase) throw new Error("Phase not found");

        const newDeliverables = [...phase.deliverables];
        const item = newDeliverables[deliverableIndex];
        newDeliverables[deliverableIndex] = {
            ...item,
            status: item.status === 'done' ? 'pending' : 'done'
        };

        return fetchAPI(`roadmap/${phaseId}`, {
            method: 'PATCH',
            body: JSON.stringify({ deliverables: newDeliverables })
        });
    },

    updatePhase: async (id: string, updates: Partial<RoadmapPhase>): Promise<RoadmapPhase> => {
        console.log('[API] PATCH /api/roadmap/' + id);
        console.log('[API] Request body:', JSON.stringify(updates, null, 2));
        const result = await fetchAPI(`roadmap/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
        console.log('[API] Response:', result);
        return result;
    },

    addPhase: async (phase: RoadmapPhase): Promise<RoadmapPhase> => {
        console.log('[API] POST /api/roadmap');
        console.log('[API] Request body:', JSON.stringify(phase, null, 2));
        const result = await fetchAPI('roadmap', {
            method: 'POST',
            body: JSON.stringify(phase)
        });
        console.log('[API] Response:', result);
        return result;
    },

    deletePhase: async (id: string): Promise<void> => {
        // Validate ID before sending request
        if (!id || id === 'undefined' || id === 'null') {
            console.error('[API] ❌ Invalid phase ID:', id);
            throw new Error(`Invalid phase ID: ${id}. Cannot delete phase with undefined or null ID.`);
        }

        console.log('[API] DELETE /api/roadmap/' + id);
        console.log('[API] Phase ID type:', typeof id, 'Value:', id);

        const result = await fetchAPI(`roadmap/${id}`, { method: 'DELETE' });
        console.log('[API] Delete successful');
        return result;
    },

    // FEATURES
    getFeatures: async (): Promise<FeatureStatus[]> => {
        const rawData: any[] = await fetchAPI('features');
        // Transform _id to id if needed
        return rawData.map((feature: any) => ({
            ...feature,
            id: feature.id || feature._id,
        }));
    },

    updateFeature: async (id: string, updates: Partial<FeatureStatus>): Promise<FeatureStatus> => {
        return fetchAPI(`features/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
    },

    addFeature: async (feature: FeatureStatus): Promise<FeatureStatus> => {
        // Remove ID if it's a temporary client-side ID so backend generates a new one
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...featureData } = feature;

        return fetchAPI('features', {
            method: 'POST',
            body: JSON.stringify(featureData)
        });
    },

    deleteFeature: async (id: string): Promise<void> => {
        return fetchAPI(`features/${id}`, { method: 'DELETE' });
    },

    // USER MANAGEMENT
    getUsers: async (): Promise<User[]> => {
        return fetchAPI('users');
    },

    createUser: async (user: Omit<User, 'id'>): Promise<User> => {
        return fetchAPI('users', {
            method: 'POST',
            body: JSON.stringify(user)
        });
    },

    deleteUser: async (id: string): Promise<void> => {
        return fetchAPI(`users/${id}`, { method: 'DELETE' });
    },

    // ANALYTICS / DASHBOARD
    getKPIs: async (): Promise<KPI[]> => {
        // Mock Data for MVP
        return [
            { label: 'Active Phases', value: 3, change: '+1', trend: 'up', subtext: 'In progress' },
            { label: 'Feature Health', value: '98%', change: '+2%', trend: 'up', subtext: 'Uptime' },
            { label: 'Pending Tasks', value: 12, change: '-4', trend: 'down', subtext: 'To do' }
        ];
        // return fetchAPI('dashboard/kpi');
    },

    getBurnUp: async (): Promise<ChartDataPoint[]> => {
        // Mock Data
        return [
            { name: 'Sprint 1', scope: 20, completed: 20 },
            { name: 'Sprint 2', scope: 40, completed: 35 },
            { name: 'Sprint 3', scope: 60, completed: 50 },
            { name: 'Sprint 4', scope: 80, completed: 65 },
            { name: 'Sprint 5', scope: 100, completed: 85 },
        ];
        // return fetchAPI('dashboard/charts/burnup');
    },

    getVelocity: async (): Promise<ChartDataPoint[]> => {
        return [];
        // return fetchAPI('dashboard/charts/velocity');
    }
};
