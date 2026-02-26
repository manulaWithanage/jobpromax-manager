"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Shell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isPublic = pathname === '/' || pathname?.startsWith('/sign-in');
    const isSharedView = pathname?.startsWith('/p/');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className={`flex flex-col flex-1 w-full overflow-x-hidden ${isPublic ? "" : "md:pl-72"}`}>
                {/* Mobile Header (only visible on small screens and when not public/shared layout) */}
                {!isPublic && !isSharedView && (
                    <header className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 h-16 flex items-center shadow-sm">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 -ml-2 mr-3 hover:bg-slate-100 rounded-lg text-slate-600"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-6 w-6" />
                        </Button>
                        <span className="font-bold text-slate-800 text-lg">JobProMax</span>
                    </header>
                )}

                <main className="flex-1 w-full relative flex flex-col">
                    {children}
                </main>
            </div>
        </div>
    );
}
