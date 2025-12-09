"use client";

import { RoleProvider } from "@/context/RoleContext";
import { ProjectProvider } from "@/context/ProjectContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <RoleProvider>
            <ProjectProvider>
                {children}
            </ProjectProvider>
        </RoleProvider>
    );
}
