"use client";

import { useProject } from "@/context/ProjectContext";
import { useRole } from "@/context/RoleContext";
import { useReport } from "@/context/ReportContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FeatureStatus } from "@/types";
import {
    ShieldCheck, Save, Trash2, Plus, CheckCircle2, AlertTriangle, XCircle,
    Activity, ChevronDown, Megaphone, Ticket, Bell, Settings, Inbox, Check, FileText
} from "lucide-react";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { HistoryBar } from "@/components/features/HistoryBar";
import { cn } from "@/lib/utils";

import { useAuth } from "@/context/AuthContext";

export default function ManagerStatusPage() {
    const { features, updateFeature, addFeature, deleteFeature } = useProject();
    const { isManager, role } = useRole();
    const { user } = useAuth();
    const { reports, updateReportStatus, addAdminNote } = useReport();
    const router = useRouter();

    // Tab State
    const [activeTab, setActiveTab] = useState<string>("status-control");

    // Notifications Tab State
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [newNote, setNewNote] = useState("");

    // Edit State (Status Control Tab)
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<FeatureStatus>>({});

    // Create State (Settings Tab)
    const [newFeature, setNewFeature] = useState<Partial<FeatureStatus>>({
        name: '',
        status: 'operational',
        publicNote: ''
    });

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [featureToDelete, setFeatureToDelete] = useState<string | null>(null);
    const [featureToDeleteName, setFeatureToDeleteName] = useState<string>('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!isManager && role !== 'manager') {
            router.push('/dashboard');
        }
    }, [isManager, role, router]);

    // Data Filtering
    const activeReports = reports.filter(r => r.status !== 'addressed');
    const historicalReports = reports.filter(r => r.status === 'addressed');
    const selectedReport = reports.find(r => r.id === selectedReportId);

    // Handlers
    const handleEdit = (feature: FeatureStatus) => {
        setEditingId(feature.id);
        setEditForm({ ...feature });
    };

    const handleSave = async (id: string) => {
        if (editForm) {
            await updateFeature(id, editForm);
            setEditingId(null);
            setEditForm({});
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleCreate = async () => {
        if (newFeature.name && newFeature.status) {
            await addFeature(newFeature as FeatureStatus);
            setNewFeature({ name: '', status: 'operational', publicNote: '' });
            alert("Monitor created successfully!");
        }
    };

    const onDeleteClick = (id: string, name: string) => {
        setFeatureToDelete(id);
        setFeatureToDeleteName(name);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (featureToDelete) {
            setIsDeleting(true);
            try {
                await deleteFeature(featureToDelete);
                setDeleteModalOpen(false);
                setFeatureToDelete(null);
            } catch (error) {
                console.error("Failed to delete feature", error);
                alert("Failed to delete feature");
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const handleSubmitNote = () => {
        if (selectedReportId && newNote) {
            addAdminNote(selectedReportId, newNote, user?.name || "Manager");
            setNewNote("");
        }
    };

    if (!isManager) return null;

    return (
        <div className="bg-slate-50/50 min-h-screen font-sans text-slate-900 p-8 lg:p-12">
            <div className="space-y-8">

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <ShieldCheck className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Status Manager</h1>
                            <p className="text-slate-500">Manage real-time system health and public incidents.</p>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="notifications" className="space-y-6">
                    <TabsList className="bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
                        <TabsTrigger value="notifications" className="gap-2 px-6">
                            <Inbox className="h-4 w-4" />
                            Notifications
                            {activeReports.filter(r => r.status === 'pending').length > 0 && (
                                <Badge className="ml-1 bg-red-500 hover:bg-red-600 text-white border-0 h-5 px-1.5">
                                    {activeReports.filter(r => r.status === 'pending').length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="status-control" className="gap-2 px-6">
                            <Activity className="h-4 w-4" /> Status Control
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="gap-2 px-6">
                            <Settings className="h-4 w-4" /> Settings
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB 1: NOTIFICATIONS (Revised) */}
                    <TabsContent value="notifications" className="space-y-6">

                        {/* Active Reports Section */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-1">Active Incident Reports</h3>
                            {activeReports.length === 0 && (
                                <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-xl text-slate-400">
                                    <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-50 text-emerald-500" />
                                    No active reports. Systems normal.
                                </div>
                            )}
                            {activeReports.map((report) => (
                                <Card key={report.id} className={cn("transition-all hover:shadow-md", report.status === 'pending' ? "border-l-4 border-l-red-500 shadow-sm" : "border-l-4 border-l-blue-500 opacity-90")}>
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <Badge variant={report.impactLevel === 'high' ? 'destructive' : report.impactLevel === 'medium' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                                                    {report.impactLevel} Impact
                                                </Badge>
                                                {report.status === 'pending' && <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                                                <span className="text-xs text-slate-400">{new Date(report.createdAt).toLocaleString()}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {report.status === 'pending' && (
                                                    <Button size="sm" variant="outline" className="h-8 gap-2 hover:bg-blue-50 hover:text-blue-600" onClick={() => updateReportStatus(report.id, 'acknowledged')}>
                                                        <Check className="h-3 w-3" /> Acknowledge
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="ghost" className="h-8 gap-2" onClick={() => setSelectedReportId(report.id)}>
                                                    <FileText className="h-3 w-3" /> View Details
                                                </Button>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-800">{report.reporterName}</h4>
                                            <p className="text-sm text-slate-600 line-clamp-1 mt-1">{report.description}</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Historical Reports Section */}
                        {historicalReports.length > 0 && (
                            <div className="space-y-3 pt-6 border-t border-slate-200">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">Addressed / Historical</h3>
                                {historicalReports.map((report) => (
                                    <Card key={report.id} className="opacity-60 bg-slate-50 hover:opacity-100 transition-opacity">
                                        <div className="p-4 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="text-[10px] text-slate-500">{report.impactLevel}</Badge>
                                                    <span className="text-xs text-slate-400 line-through">{new Date(report.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <h4 className="font-medium text-slate-700">{report.reporterName}</h4>
                                            </div>
                                            <Button size="sm" variant="ghost" onClick={() => setSelectedReportId(report.id)}>Details</Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* TAB 2: STATUS CONTROL (Updated with HistoryBar) */}
                    <TabsContent value="status-control" className="space-y-4">
                        <div className="grid gap-6">
                            {features.map((feature) => (
                                <Card key={feature.id} className={cn("transition-all duration-300 group", editingId === feature.id ? "ring-2 ring-blue-500 shadow-xl" : "hover:shadow-md border-t-4",
                                    editingId !== feature.id && (feature.status === 'operational' ? 'border-t-emerald-500' : feature.status === 'degraded' ? 'border-t-yellow-500' : 'border-t-red-500')
                                )}>
                                    {editingId === feature.id ? (
                                        /* EDIT MODE */
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                                <h3 className="font-bold text-lg text-blue-900 flex items-center gap-2">
                                                    <Activity className="h-5 w-5 text-blue-500" /> Editing: {feature.name}
                                                </h3>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
                                                    <Button onClick={() => handleSave(feature.id)} className="bg-blue-600 hover:bg-blue-700 text-white">
                                                        <Save className="h-4 w-4 mr-2" /> Save Changes
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-8">
                                                <div className="space-y-5">
                                                    <div>
                                                        <label className="text-sm font-semibold text-slate-700 block mb-1.5">Feature Name</label>
                                                        <Input
                                                            value={editForm.name || ''}
                                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-semibold text-slate-700 block mb-1.5">Status</label>
                                                        <select
                                                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                            value={editForm.status || 'operational'}
                                                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                                                        >
                                                            <option value="operational">Operational</option>
                                                            <option value="degraded">Degraded</option>
                                                            <option value="critical">Critical</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="space-y-5">
                                                    <div>
                                                        <label className="text-sm font-semibold text-slate-700 block mb-1.5">Public Status Note</label>
                                                        <Textarea
                                                            value={editForm.publicNote || ''}
                                                            onChange={(e) => setEditForm({ ...editForm, publicNote: e.target.value })}
                                                            className="min-h-[140px]"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    ) : (
                                        /* VIEW MODE (UPTIME CARD STYLE WITH HISTORY BAR) */
                                        <CardContent className="p-6 space-y-6">
                                            {/* Header */}
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex gap-4">
                                                    <div className={cn(
                                                        "p-3 rounded-full flex-shrink-0 h-12 w-12 flex items-center justify-center",
                                                        feature.status === 'operational' ? "bg-emerald-50 text-emerald-600" :
                                                            feature.status === 'degraded' ? "bg-yellow-50 text-yellow-600" :
                                                                "bg-red-50 text-red-600"
                                                    )}>
                                                        {feature.status === 'operational' ? <CheckCircle2 className="h-6 w-6" /> :
                                                            feature.status === 'degraded' ? <AlertTriangle className="h-6 w-6" /> :
                                                                <XCircle className="h-6 w-6" />}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="text-lg font-bold text-slate-900 leading-tight">{feature.name}</h3>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm text-slate-500 line-clamp-1">{feature.publicNote || "System is fully operational."}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                    <Badge className={cn(
                                                        "uppercase tracking-wider font-bold px-2 py-0.5 text-[10px]",
                                                        feature.status === 'operational' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200" :
                                                            feature.status === 'degraded' ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200" :
                                                                "bg-red-100 text-red-700 hover:bg-red-100 border-red-200"
                                                    )}>
                                                        {feature.status}
                                                    </Badge>
                                                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">Updated 5 min ago</span>
                                                </div>
                                            </div>

                                            {/* Uptime History Bar Integration */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <span>30 Days Ago</span>
                                                    <span className={cn(
                                                        feature.status === 'operational' ? "text-emerald-600" :
                                                            feature.status === 'degraded' ? "text-yellow-600" : "text-red-500"
                                                    )}>
                                                        {feature.status === 'operational' ? '99.99%' : feature.status === 'degraded' ? '98.50%' : '85.20%'} Uptime
                                                    </span>
                                                    <span>Today</span>
                                                </div>
                                                {/* HistoryBar Component */}
                                                <HistoryBar status={feature.status} />
                                            </div>

                                            {/* Footer Actions */}
                                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onDeleteClick(feature.id, feature.name)}
                                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 text-xs font-medium px-2"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(feature)}
                                                    className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 text-xs font-medium"
                                                >
                                                    <span>Update Status</span>
                                                    <ChevronDown className="h-3 w-3 ml-1.5" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    )}
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* TAB 3: SETTINGS (Unchanged mostly) */}
                    <TabsContent value="settings" className="space-y-6">
                        <Card className="border-blue-200 shadow-lg bg-blue-50/50">
                            <CardHeader>
                                <CardTitle className="text-blue-900 flex items-center gap-2">
                                    <Activity className="h-5 w-5" /> Add New Status Monitor
                                </CardTitle>
                                <CardDescription>Register a new system component to track public status.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-semibold text-slate-700 block mb-1.5">Feature Name</label>
                                            <Input
                                                placeholder="e.g. Payment Gateway"
                                                value={newFeature.name}
                                                onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-slate-700 block mb-1.5">Initial Status</label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={newFeature.status}
                                                onChange={(e) => setNewFeature({ ...newFeature, status: e.target.value as any })}
                                            >
                                                <option value="operational">Operational</option>
                                                <option value="degraded">Degraded</option>
                                                <option value="critical">Critical</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-semibold text-slate-700 block mb-1.5">Initial Public Note</label>
                                            <Textarea
                                                placeholder="Visible to all users..."
                                                value={newFeature.publicNote}
                                                onChange={(e) => setNewFeature({ ...newFeature, publicNote: e.target.value })}
                                                className="min-h-[120px]"
                                            />
                                        </div>
                                        <div className="flex justify-end items-end h-full pt-4">
                                            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto">
                                                <Plus className="h-4 w-4 mr-2" /> Add Monitor
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Shared Delete Modal */}
                <DeleteConfirmationModal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Delete Feature"
                    description={`Are you sure you want to delete ${featureToDeleteName ? `'${featureToDeleteName}'` : 'this feature'}? This status monitor will be removed permanently.`}
                    isDeleting={isDeleting}
                />

                {/* Report Detail Modal */}
                <Dialog open={!!selectedReportId} onOpenChange={(open) => !open && setSelectedReportId(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Incident Report Details</DialogTitle>
                        </DialogHeader>
                        {selectedReport && (
                            <div className="space-y-6">
                                {/* Header Info */}
                                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                                    <div className={cn("p-2 rounded-lg", selectedReport.impactLevel === 'high' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600")}>
                                        <Bell className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">{selectedReport.reporterName}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline">{selectedReport.impactLevel} Impact</Badge>
                                            <span className="text-sm text-slate-500">{new Date(selectedReport.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 mb-2">Detailed Description</h4>
                                    <div className="p-4 rounded-lg border border-slate-200 bg-white text-slate-700 leading-relaxed text-sm">
                                        {selectedReport.description}
                                    </div>
                                </div>

                                {/* Admin Notes Section */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-900">Admin Notes & Updates</h4>
                                    {selectedReport.adminNotes.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic">No notes added yet.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {selectedReport.adminNotes.map(note => (
                                                <div key={note.id} className="bg-yellow-50 p-3 rounded-md text-xs border border-yellow-100">
                                                    <p className="text-slate-800">{note.note}</p>
                                                    <div className="mt-1 text-slate-400 flex justify-between">
                                                        <span>{note.author}</span>
                                                        <span>{new Date(note.createdAt).toLocaleTimeString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-2">
                                        <Input
                                            placeholder="Add internal note..."
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            className="h-9 text-sm"
                                        />
                                        <Button size="sm" onClick={handleSubmitNote} disabled={!newNote}>Add Note</Button>
                                    </div>
                                </div>

                                {/* Actions */}
                                <DialogFooter className="border-t pt-4 mt-4">
                                    <Button variant="ghost" onClick={() => setSelectedReportId(null)}>Close</Button>
                                    {selectedReport.status !== 'addressed' && (
                                        <Button
                                            variant="outline"
                                            className="text-slate-600"
                                            onClick={() => { updateReportStatus(selectedReport.id, 'addressed'); setSelectedReportId(null); }}
                                        >
                                            <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Addressed (Archive)
                                        </Button>
                                    )}
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

            </div>
        </div>
    );
}
