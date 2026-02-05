"use client";

import { RoleProvider } from "@/context/RoleContext";
import { ProjectProvider } from "@/context/ProjectContext";
import { TimeLogProvider } from "@/context/TimeLogContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <RoleProvider>
            <ProjectProvider>
                <TimeLogProvider>
                    {children}
                </TimeLogProvider>
            </ProjectProvider>
        </RoleProvider>
    );
}
