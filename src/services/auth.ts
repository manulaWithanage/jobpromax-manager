import { User } from "@/types";
import { api } from "./api"; // We will update api.ts to export fetchAPI or similar

// Define response types if not in types
interface LoginResponse {
    success: boolean;
    user: User;
    message?: string;
}

// Helper to access the shared fetchAPI from api.ts (we need to export it there)
// For now, assuming we will export `fetchAPI` or similar from api.ts
// Or we can just duplicate the fetch wrapper logic here if we want strict separation, 
// BUT reusing is better. 
// Let's assume we maintain the pattern in the guide.

// Actually, strict following of guide means creating this file.
// Ideally, api.ts should export its fetcher.

import { fetchAPI } from "./api";

export const authService = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        return fetchAPI('auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    logout: async (): Promise<void> => {
        return fetchAPI('auth/logout', { method: 'POST' });
    },

    getCurrentUser: async (): Promise<{ user: User | null }> => {
        const data = await fetchAPI('auth/me');
        // Handle potential differences in backend response structure
        // If data has 'user' key (wrapped)
        if (data && data.user) {
            return data;
        }
        // If data is the user itself (flat) - check for a known user field like 'id' or 'email'
        if (data && (data.id || data.email)) {
            return { user: data };
        }
        // Fallback
        return { user: null };
    },
};
