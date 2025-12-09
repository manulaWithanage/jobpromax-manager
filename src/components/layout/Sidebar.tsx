"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRole } from "@/context/RoleContext";
import {
    LayoutDashboard,
    BarChart3,
    Clock,
    Settings,
    LogOut,
    User,
    ChevronRight,
    Map,
    Activity,
    Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface NavItemProps {
    href: string;
    label: string;
    icon: any;
    isActive?: boolean;
    disabled?: boolean;
    comingSoon?: boolean;
}

function NavItem({ href, label, icon: Icon, isActive, disabled, comingSoon }: NavItemProps) {
    if (disabled) {
        return (
            <div className="group flex items-center justify-between px-3 py-2 text-slate-500 cursor-not-allowed opacity-60">
                <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{label}</span>
                </div>
                {comingSoon && (
                    <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                        SOON
                    </span>
                )}
            </div>
        );
    }

    return (
        <Link
            href={href}
            className={cn(
                "group flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200",
                isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            )}
        >
            <div className="flex items-center gap-3">
                <Icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", isActive && "text-blue-100")} />
                <span className="font-medium">{label}</span>
            </div>
            {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
        </Link>
    );
}

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { role, user, logout, isManager, isLeadership, isDeveloper } = useRole();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-72 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 z-50">
            {/* Header / Brand */}
            <div className="p-6">
                <div className="mb-6 px-1 flex items-center gap-3">
                    {/* Minimalist Accent Logo */}
                    <div className="h-8 w-1.5 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>

                    <div>
                        <h1 className="text-lg font-bold text-white tracking-tight leading-none">
                            JobProMax
                        </h1>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">
                            Progress Hub
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-4 space-y-8 overflow-y-auto">
                {/* Main Section */}
                <div className="space-y-1">
                    <div className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Analytics
                    </div>
                    <NavItem
                        href="/roadmap"
                        label="Delivery Timeline"
                        icon={Clock}
                        isActive={pathname === '/roadmap'}
                    />
                    <NavItem
                        href="/status"
                        label="System Status"
                        icon={Activity}
                        isActive={pathname === '/status'}
                    />
                    {/* Disabled Features */}
                    <NavItem href="#" label="Overview" icon={LayoutDashboard} disabled comingSoon />
                    <NavItem href="#" label="Performance" icon={BarChart3} disabled comingSoon />
                </div>

                {/* Management Section (Admin Only) */}
                {isManager && (
                    <div className="space-y-1 animate-in slide-in-from-left-4 fade-in duration-500">
                        <div className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Shield className="h-3 w-3" /> Management
                        </div>
                        <NavItem
                            href="/manager/roadmap"
                            label="Edit Timeline"
                            icon={Map}
                            isActive={pathname === '/manager/roadmap'}
                        />
                        <NavItem
                            href="/manager/status"
                            label="Manage Status"
                            icon={Settings}
                            isActive={pathname === '/manager/status'}
                        />
                    </div>
                )}
            </div>

            {/* Footer / User Profile */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                            {user?.name || 'Guest User'}
                        </p>
                        <p className="text-xs text-slate-400 capitalize truncate">
                            {role} Access
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </aside>
    );
}
