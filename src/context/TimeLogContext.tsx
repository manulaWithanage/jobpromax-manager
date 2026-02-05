"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { TimeLog } from "@/types";
import { useAuth } from "./AuthContext";
import { getTimeLogs, submitTimeLog, updateLogStatus as updateLogStatusAction } from "@/lib/actions/timesheet";

interface TimeLogContextType {
    logs: TimeLog[];
    addLog: (log: Omit<TimeLog, "id" | "createdAt" | "updatedAt" | "status">) => Promise<void>;
    updateLogStatus: (id: string, status: TimeLog['status'], comment?: string) => Promise<void>;
    getLogsByUser: (userId: string) => TimeLog[];
    isLoading: boolean;
    refreshLogs: () => Promise<void>;
}

const TimeLogContext = createContext<TimeLogContextType | undefined>(undefined);

export function TimeLogProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [logs, setLogs] = useState<TimeLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const refreshLogs = async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            console.log('[TimeLogContext] Fetching logs via Server Action...');
            const fetchedLogs = await getTimeLogs();
            console.log(`[TimeLogContext] Received ${fetchedLogs.length} logs`);
            setLogs(fetchedLogs);
        } catch (error) {
            console.error("[TimeLogContext] ❌ Failed to fetch logs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshLogs();
    }, [user]);

    const addLog = async (newLogData: Omit<TimeLog, "id" | "createdAt" | "updatedAt" | "status">) => {
        setIsLoading(true);
        try {
            const newLog = await submitTimeLog({
                date: newLogData.date,
                hours: newLogData.hours,
                summary: newLogData.summary,
                jiraTickets: newLogData.jiraTickets || [],
                workType: (newLogData as any).workType || 'other', // Handle missing workType
            });

            // Optimistic update
            setLogs(prev => [newLog, ...prev]);
        } catch (error) {
            console.error("Failed to add log:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const updateLogStatus = async (id: string, status: TimeLog['status'], comment?: string) => {
        if (status === 'pending') return; // Cannot set status back to pending via this action

        setIsLoading(true);
        try {
            const updatedLog = await updateLogStatusAction(id, status as 'approved' | 'rejected', comment);

            // Optimistic update
            setLogs(prev => prev.map(log =>
                log.id === id ? updatedLog : log
            ));
        } catch (error) {
            console.error("Failed to update log status:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const getLogsByUser = (userId: string) => {
        return logs.filter(log => log.userId === userId);
    };

    return (
        <TimeLogContext.Provider value={{ logs, addLog, updateLogStatus, getLogsByUser, isLoading, refreshLogs }}>
            {children}
        </TimeLogContext.Provider>
    );
}

export function useTimeLog() {
    const context = useContext(TimeLogContext);
    if (context === undefined) {
        throw new Error("useTimeLog must be used within a TimeLogProvider");
    }
    return context;
}
