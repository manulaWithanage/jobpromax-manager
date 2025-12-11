
"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

export function Shell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isPublic = pathname === '/' || pathname?.startsWith('/sign-in');

    return (
        <>
            <Sidebar />
            <div className={isPublic ? "" : "ml-72"}>
                {children}
            </div>
        </>
    );
}
