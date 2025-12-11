"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { IncidentReport, IncidentNote } from "@/types";

interface ReportContextType {
    reports: IncidentReport[];
    addReport: (report: Omit<IncidentReport, 'id' | 'status' | 'createdAt' | 'adminNotes'>) => void;
    updateReportStatus: (id: string, status: 'acknowledged' | 'addressed') => void;
    addAdminNote: (id: string, note: string, author: string) => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

// Initial Mock Data
const MOCK_REPORTS: IncidentReport[] = [
    {
        id: '1',
        reporterName: 'System Monitor',
        impactLevel: 'high',
        description: 'High Latency detected in API Gateway (Region: US-East)',
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 mins ago
        adminNotes: []
    },
    {
        id: '2',
        reporterName: 'User Report (J.Doe)',
        impactLevel: 'high',
        description: 'Payment Failed 500 Error when trying to checkout with PayPal.',
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        adminNotes: []
    },
    {
        id: '3',
        reporterName: 'System Monitor',
        impactLevel: 'low',
        description: 'Database Backup Completed Successfully.',
        status: 'addressed',
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        adminNotes: [
            { id: 'n1', note: 'Routine check pass.', author: 'Admin System', createdAt: new Date().toISOString() }
        ]
    }
];

export function ReportProvider({ children }: { children: ReactNode }) {
    const [reports, setReports] = useState<IncidentReport[]>(MOCK_REPORTS);

    const addReport = (reportData: Omit<IncidentReport, 'id' | 'status' | 'createdAt' | 'adminNotes'>) => {
        const newReport: IncidentReport = {
            ...reportData,
            id: Math.random().toString(36).substr(2, 9),
            status: 'pending',
            createdAt: new Date().toISOString(),
            adminNotes: []
        };
        setReports(prev => [newReport, ...prev]);
    };

    const updateReportStatus = (id: string, status: 'acknowledged' | 'addressed') => {
        setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    };

    const addAdminNote = (id: string, note: string, author: string) => {
        const newNote: IncidentNote = {
            id: Math.random().toString(36).substr(2, 9),
            note,
            author,
            createdAt: new Date().toISOString()
        };
        setReports(prev => prev.map(r => {
            if (r.id === id) {
                return { ...r, adminNotes: [...r.adminNotes, newNote] };
            }
            return r;
        }));
    };

    return (
        <ReportContext.Provider value={{ reports, addReport, updateReportStatus, addAdminNote }}>
            {children}
        </ReportContext.Provider>
    );
}

export function useReport() {
    const context = useContext(ReportContext);
    if (!context) {
        throw new Error("useReport must be used within a ReportProvider");
    }
    return context;
}
