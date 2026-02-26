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
    Shield,
    CreditCard,
    DollarSign,
    TrendingUp,
    Receipt,
    Link2,
    CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Image from "next/image";

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

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps = {}) {
    const pathname = usePathname();
    const router = useRouter();
    const { role, user, isManager, isFinance, logout } = useRole();

    const isSharedView = pathname?.startsWith('/p/');

    // Hide sidebar completely on home and sign-in
    if (pathname === '/' || pathname?.startsWith('/sign-in')) {
        return null;
    }

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-[50] md:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            <aside className={cn(
                "fixed left-0 top-0 h-screen w-72 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 z-[60] transition-transform duration-300 ease-in-out md:translate-x-0 tracking-tight",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Header / Brand */}
                <div className="p-6">
                    <div className="mb-2 px-1 flex items-center justify-center">
                        <Image
                            src="https://jpm-public-storage.nyc3.cdn.digitaloceanspaces.com/website/FinalPoweredbyTJH%20v10%20white%20transparent.png"
                            alt="JobProMax Logo"
                            width={200}
                            height={64}
                            priority
                            className="max-h-16 w-auto object-contain"
                        />
                    </div>
                </div>

                {/* Navigation */}
                {!isSharedView ? (
                    <div className="flex-1 px-4 space-y-8 overflow-y-auto">
                        {/* Analytics Section (Leadership, Developer, Manager) */}
                        {(role === 'leadership' || role === 'developer' || role === 'manager') && (
                            <div className="space-y-1 animate-in slide-in-from-left-4 fade-in duration-500">
                                <div className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <BarChart3 className="h-3 w-3" /> Analytics
                                </div>
                                <NavItem
                                    href="/dashboard"
                                    label="Overview"
                                    icon={LayoutDashboard}
                                    isActive={pathname === '/dashboard'}
                                />
                                <NavItem
                                    href="/roadmap"
                                    label="Roadmap"
                                    icon={Map}
                                    isActive={pathname === '/roadmap'}
                                />
                                <NavItem
                                    href="/status"
                                    label="Feature Status"
                                    icon={CheckCircle2}
                                    isActive={pathname === '/status'}
                                    disabled={user?.email !== 'manager@example.com'}
                                    comingSoon={user?.email !== 'manager@example.com'}
                                />
                            </div>
                        )}

                        {/* Operations Section (Developer, Manager, Finance) */}
                        {(role === 'developer' || role === 'manager' || role === 'finance') && (
                            <div className="space-y-1 animate-in slide-in-from-left-4 fade-in duration-500">
                                <div className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Clock className="h-3 w-3" /> Operations
                                </div>
                                <NavItem
                                    href="/timesheets"
                                    label="Timesheet Log"
                                    icon={Clock}
                                    isActive={pathname === '/timesheets'}
                                />
                            </div>
                        )}

                        {/* Management Section (Admin Only) */}
                        {isManager && (
                            <div className="space-y-1 animate-in slide-in-from-left-4 fade-in duration-500">
                                <div className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Shield className="h-3 w-3" /> Management
                                </div>
                                <NavItem
                                    href="/manager/timesheets"
                                    label="Team Timesheets"
                                    icon={Clock}
                                    isActive={pathname === '/manager/timesheets'}
                                />
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
                                <NavItem
                                    href="/manager/users"
                                    label="Manage Users"
                                    icon={User}
                                    isActive={pathname === '/manager/users'}
                                />
                            </div>
                        )}

                        {/* Budget & Expenses Section (Manager + Finance) */}
                        {(isManager || isFinance) && (
                            <div className="space-y-1 animate-in slide-in-from-left-4 fade-in duration-500">
                                <div className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <DollarSign className="h-3 w-3" /> Budget & Expenses
                                </div>
                                <NavItem
                                    href="/finance/invoices"
                                    label="Team Invoices"
                                    icon={Receipt}
                                    isActive={pathname?.startsWith('/finance/invoices')}
                                />
                                <NavItem
                                    href="/finance/performance"
                                    label="Team Performance"
                                    icon={TrendingUp}
                                    isActive={pathname === '/finance/performance'}
                                />
                                <NavItem
                                    href="/finance/payment-settings"
                                    label="Payment Settings"
                                    icon={CreditCard}
                                    isActive={pathname === '/finance/payment-settings'}
                                />
                                <NavItem
                                    href="/manager/shared-links"
                                    label="Shared Links"
                                    icon={Link2}
                                    isActive={pathname === '/manager/shared-links'}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1"></div>
                )}

                {/* Footer / User Profile - Only show if not shared view */}
                {!isSharedView && (
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
                                onClick={() => logout()}
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
}
