"use client";

import Sidebar from "@/components/layout/Sidebar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import BurnUpChart from "@/components/dashboard/BurnUpChart";
import VelocityChart from "@/components/dashboard/VelocityChart";
import { kpiData, pipelineItems, burnUpData, velocityData } from "@/lib/mockData";
import { TrendingUp, Calendar, Zap, AlertCircle, ArrowUpRight, Search, Bell, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useProject } from "@/context/ProjectContext";
import { useRole } from "@/context/RoleContext";
import { Task } from "@/lib/mockData";

export default function DashboardPage() {
    const { tasks, isLoading, updateTaskStatus, refreshData } = useProject();
    const { role, isDeveloper, isAdmin } = useRole();

    const incomingItems = pipelineItems.filter(i => i.type === 'Incoming');
    const wishlistItems = pipelineItems.filter(i => i.type === 'Wishlist');

    // Quick Stats
    const blockedCount = tasks.filter(t => t.status === 'Blocked').length;
    const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
    const inReviewCount = tasks.filter(t => t.status === 'In Review').length;
    const completedCount = tasks.filter(t => t.status === 'Done').length;

    const handleStatusClick = async (task: Task) => {
        if (!isDeveloper && !isAdmin) return; // Stakeholders cannot edit

        let newStatus: Task['status'] = task.status;
        if (task.status === 'In Progress') newStatus = 'Done';
        else if (task.status === 'Done') newStatus = 'In Progress';
        else if (task.status === 'Blocked') newStatus = 'In Progress';
        else newStatus = 'In Progress';

        await updateTaskStatus(task.id, newStatus);
    };

    return (
        <div className="flex bg-slate-50/50 min-h-screen font-sans text-slate-900">
            <Sidebar />

            {/* Main Content Area - Shifted for wider Sidebar */}
            <main className="flex-1 ml-72 p-8 lg:p-12 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-10">

                    {/* Top Bar / Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                            <p className="text-slate-500 mt-1">
                                Overview of project velocity and ongoing tasks.
                                <span className="ml-2 font-medium text-blue-600">Viewing as: {role}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" className="rounded-full" onClick={() => refreshData()}>
                                <RefreshCw className={`h-4 w-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button variant="outline" size="icon" className="rounded-full">
                                <Search className="h-4 w-4 text-slate-500" />
                            </Button>
                            <Button variant="outline" size="icon" className="rounded-full relative">
                                <Bell className="h-4 w-4 text-slate-500" />
                                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white" />
                            </Button>
                            {isAdmin && (
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 shadow-md shadow-blue-500/20">
                                    New Report
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* 1. THE BIG PICTURE (Header/KPIs) */}
                    <section className="space-y-6">
                        <h2 className="text-xl font-semibold tracking-tight text-slate-800 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-600" /> The Big Picture
                        </h2>
                        <div className="grid gap-6 md:grid-cols-3">
                            {kpiData.map((kpi, index) => (
                                <Card key={index} className="border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-widest">{kpi.label}</CardTitle>
                                        {index === 0 && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                                        {index === 1 && <Calendar className="h-4 w-4 text-blue-500" />}
                                        {index === 2 && <Zap className="h-4 w-4 text-amber-500" />}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-slate-800">{kpi.value}</div>
                                        <div className="flex items-center text-xs font-medium text-slate-500 mt-2 bg-slate-50 w-fit px-2 py-1 rounded-md">
                                            {kpi.trend === 'up' && <ArrowUpRight className="h-3 w-3 mr-1 text-emerald-500" />}
                                            <span className={kpi.change?.includes('+') ? 'text-emerald-600' : ''}>
                                                {kpi.change}
                                            </span>
                                            {kpi.change && <span className="mx-1 text-slate-300">|</span>}
                                            <span>{kpi.subtext}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* 2. WHAT IS DONE (Progress Section) */}
                    <section className="space-y-6">
                        <h2 className="text-xl font-semibold text-slate-800">Progress & Velocity</h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="col-span-1 shadow-sm border-slate-200">
                                <CardHeader>
                                    <CardTitle>Burn-up Chart</CardTitle>
                                    <CardDescription>Scope vs. Completed Work</CardDescription>
                                </CardHeader>
                                <CardContent className="pl-0">
                                    <BurnUpChart data={burnUpData} />
                                </CardContent>
                            </Card>
                            <Card className="col-span-1 shadow-sm border-slate-200">
                                <CardHeader>
                                    <CardTitle>Team Velocity</CardTitle>
                                    <CardDescription>Points Completed per Sprint</CardDescription>
                                </CardHeader>
                                <CardContent className="pl-0">
                                    <VelocityChart data={velocityData} />
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* 3. WHAT IS TO BE DONE (Active Work Section) */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-800">Active Workstream</h2>
                            <Button variant="ghost" className="text-sm text-blue-600 hover:text-blue-700">View All Tasks &rarr;</Button>
                        </div>
                        <div className="grid gap-6 md:grid-cols-4">
                            {/* Status Breakdown Cards */}
                            <Card className="col-span-1 border-none bg-blue-50/50 border-l-4 border-l-blue-500 shadow-none">
                                <CardHeader className="py-4">
                                    <CardTitle className="text-xs font-semibold uppercase text-blue-700/80">In Progress</CardTitle>
                                    <div className="text-3xl font-bold text-blue-800">{inProgressCount}</div>
                                </CardHeader>
                            </Card>
                            <Card className="col-span-1 border-none bg-amber-50/50 border-l-4 border-l-amber-500 shadow-none">
                                <CardHeader className="py-4">
                                    <CardTitle className="text-xs font-semibold uppercase text-amber-700/80">In Review</CardTitle>
                                    <div className="text-3xl font-bold text-amber-800">{inReviewCount}</div>
                                </CardHeader>
                            </Card>
                            <Card className="col-span-1 border-none bg-red-50/50 border-l-4 border-l-red-500 shadow-none">
                                <CardHeader className="py-4">
                                    <CardTitle className="text-xs font-semibold uppercase text-red-700/80">Blocked</CardTitle>
                                    <div className="text-3xl font-bold text-red-800">{blockedCount}</div>
                                </CardHeader>
                            </Card>
                            <Card className="col-span-1 border-none bg-emerald-50/50 border-l-4 border-l-emerald-500 shadow-none">
                                <CardHeader className="py-4">
                                    <CardTitle className="text-xs font-semibold uppercase text-emerald-700/80">Completed</CardTitle>
                                    <div className="text-3xl font-bold text-emerald-800">{completedCount}</div>
                                </CardHeader>
                            </Card>

                            {/* Active Task Table */}
                            <Card className="col-span-4 shadow-md border-slate-200 overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Current Sprint Tasks</CardTitle>
                                        {(isDeveloper || isAdmin) && <p className="text-xs text-slate-400 mt-1">Hint: Click status to update</p>}
                                    </div>
                                </CardHeader>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="py-4 px-6 font-semibold">Task Name</th>
                                                <th className="py-4 px-6 font-semibold">Assignee</th>
                                                <th className="py-4 px-6 font-semibold">Status</th>
                                                <th className="py-4 px-6 font-semibold">Due Date</th>
                                                <th className="py-4 px-6 text-right font-semibold">Priority</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {isLoading ? (
                                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading tasks...</td></tr>
                                            ) : tasks.map((task) => (
                                                <tr
                                                    key={task.id}
                                                    className={`hover:bg-slate-50/80 transition-colors group ${task.status === 'Blocked' ? 'bg-red-50/30 hover:bg-red-50/60' : ''
                                                        }`}
                                                >
                                                    <td className="py-4 px-6 font-medium text-slate-700">
                                                        {task.status === 'Blocked' && <AlertCircle className="inline w-4 h-4 text-red-500 mr-2 -mt-0.5 animate-pulse" />}
                                                        {task.name}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                                                                {task.assignee.charAt(0)}
                                                            </div>
                                                            <span className="text-slate-600">{task.assignee}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div
                                                            onClick={() => handleStatusClick(task)}
                                                            className={`inline-block ${isDeveloper || isAdmin ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                                                        >
                                                            <Badge variant={
                                                                task.status === 'Blocked' ? 'destructive' :
                                                                    task.status === 'In Progress' ? 'default' :
                                                                        task.status === 'In Review' ? 'secondary' :
                                                                            task.status === 'Done' ? 'success' : 'outline'
                                                            } className="shadow-none font-medium select-none">
                                                                {task.status}
                                                            </Badge>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-slate-500 font-mono text-xs">{task.dueDate}</td>
                                                    <td className="py-4 px-6 text-right">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${task.priority === 'High' ? 'bg-red-100 text-red-700' :
                                                                task.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {task.priority}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    </section>

                    {/* 4. THE PIPELINE (Future Work Section) */}
                    <section className="space-y-6 pb-12">
                        <h2 className="text-xl font-semibold text-slate-800">The Pipeline</h2>
                        <div className="grid gap-8 md:grid-cols-2">

                            {/* Incoming Column */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                    <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                        Incoming
                                    </h3>
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">{incomingItems.length}</Badge>
                                </div>
                                <div className="space-y-3">
                                    {incomingItems.map(item => (
                                        <Card key={item.id} className="cursor-pointer group hover:border-blue-400 hover:shadow-md transition-all duration-200 border-slate-200">
                                            <CardContent className="p-5">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{item.title}</h4>
                                                    <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${item.priority === 'High' ? 'border-red-200 text-red-600 bg-red-50' : 'border-slate-200 text-slate-500'
                                                        }`}>
                                                        {item.priority}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center text-xs text-slate-400 gap-4 mt-2">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>Est: {item.estEffort}</span>
                                                    </div>
                                                    <span className="font-mono bg-slate-50 px-1 rounded">#{item.id}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Wishlist Column */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                    <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                        Wishlist
                                    </h3>
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">{wishlistItems.length}</Badge>
                                </div>
                                <div className="space-y-3">
                                    {wishlistItems.map(item => (
                                        <Card key={item.id} className="bg-slate-50 border-dashed border-slate-300 opacity-80 hover:opacity-100 hover:border-slate-400 transition-all">
                                            <CardContent className="p-5">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-medium text-slate-600">{item.title}</h4>
                                                </div>
                                                <div className="flex items-center justify-between mt-3">
                                                    <div className="flex items-center text-xs text-slate-400 gap-2">
                                                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                                                            {item.requester?.charAt(0)}
                                                        </div>
                                                        <span>{item.requester}</span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400">{item.dateAdded}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
}
