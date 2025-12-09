"use client";

import Sidebar from "@/components/layout/Sidebar";
import { useProject } from "@/context/ProjectContext";
import { useRole } from "@/context/RoleContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FeatureStatus } from "@/lib/mockData";
import { ShieldCheck, Save, Trash2, Plus } from "lucide-react";

export default function ManagerStatusPage() {
    const { features, updateFeature, addFeature, deleteFeature } = useProject();
    const { isManager, role } = useRole();
    const router = useRouter();

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<FeatureStatus>>({});

    // Create State
    const [isCreating, setIsCreating] = useState(false);
    const [newFeatureData, setNewFeatureData] = useState<FeatureStatus>({
        id: '',
        name: '',
        status: 'operational',
        publicNote: '',
        linkedTicket: ''
    });

    useEffect(() => {
        if (!isManager && role !== 'manager') {
            router.push('/dashboard');
        }
    }, [isManager, role, router]);

    if (!isManager) return null;

    // --- Edit Handlers ---
    const handleEdit = (feature: FeatureStatus) => {
        setEditingId(feature.id);
        setFormData({
            status: feature.status,
            linkedTicket: feature.linkedTicket,
            publicNote: feature.publicNote
        });
        setIsCreating(false); // Close create mode if open
    };

    const handleSave = async (id: string) => {
        await updateFeature(id, formData);
        setEditingId(null);
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({});
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this feature? This cannot be undone.")) {
            await deleteFeature(id);
            if (editingId === id) setEditingId(null);
        }
    };

    // --- Create Handlers ---
    const startCreating = () => {
        setEditingId(null); // Close edit mode if open
        setIsCreating(true);
        setNewFeatureData({
            id: `f-${Date.now()}`, // Temporary ID generation
            name: '',
            status: 'operational',
            publicNote: '',
            linkedTicket: ''
        });
    };

    const handleCreateSave = async () => {
        if (!newFeatureData.name) {
            alert("Feature Name is required");
            return;
        }
        await addFeature(newFeatureData);
        setIsCreating(false);
    };

    return (
        <div className="flex bg-slate-50/50 min-h-screen font-sans text-slate-900">
            <Sidebar />

            <main className="flex-1 ml-72 p-8 lg:p-12 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-8">

                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <ShieldCheck className="h-8 w-8 text-purple-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Feature Status Manager</h1>
                                <p className="text-slate-500">
                                    Update public status indicators and link engineering tickets.
                                </p>
                            </div>
                        </div>
                        <Button onClick={startCreating} className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20">
                            <Plus className="h-5 w-5 mr-2" /> Add Feature
                        </Button>
                    </div>

                    {/* Create Form */}
                    {isCreating && (
                        <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
                            <Card className="border-2 border-purple-200 shadow-xl ring-4 ring-purple-50">
                                <CardContent className="p-6 bg-white space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                        <h3 className="text-lg font-bold text-purple-900">Create New Feature</h3>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                                            <Button onClick={handleCreateSave} className="bg-purple-600 hover:bg-purple-700">
                                                <Save className="h-4 w-4 mr-2" /> Create Feature
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold uppercase text-slate-500">Feature Name</label>
                                            <input
                                                type="text"
                                                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                                                placeholder="e.g. Mobile App Checkout"
                                                value={newFeatureData.name}
                                                onChange={(e) => setNewFeatureData({ ...newFeatureData, name: e.target.value })}
                                                autoFocus
                                            />
                                        </div>

                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold uppercase text-slate-500">Initial Status</label>
                                                <select
                                                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                                                    value={newFeatureData.status}
                                                    onChange={(e) => setNewFeatureData({ ...newFeatureData, status: e.target.value as any })}
                                                >
                                                    <option value="operational">🟢 Operational</option>
                                                    <option value="degraded">🟡 Degraded (Warning)</option>
                                                    <option value="critical">🔴 Critical (Outage)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold uppercase text-slate-500">Ticket ID (Optional)</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm font-mono focus:ring-2 focus:ring-purple-500 outline-none"
                                                    placeholder="e.g. JIRA-123"
                                                    value={newFeatureData.linkedTicket || ''}
                                                    onChange={(e) => setNewFeatureData({ ...newFeatureData, linkedTicket: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold uppercase text-slate-500">Public Note</label>
                                            <textarea
                                                className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-purple-500 outline-none min-h-[80px]"
                                                placeholder="Initial status description..."
                                                value={newFeatureData.publicNote}
                                                onChange={(e) => setNewFeatureData({ ...newFeatureData, publicNote: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* List */}
                    <div className="space-y-4">
                        {features.map((feature) => (
                            <Card key={feature.id} className={`overflow-hidden transition-all duration-300 ${editingId === feature.id ? 'ring-2 ring-purple-400 shadow-lg relative z-10' : 'hover:shadow-md'}`}>

                                {editingId === feature.id ? (
                                    /* EDIT MODE */
                                    <CardContent className="p-6 bg-white space-y-6">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                            <h3 className="text-lg font-bold text-slate-800">{feature.name}</h3>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
                                                <Button onClick={() => handleSave(feature.id)} className="bg-purple-600 hover:bg-purple-700">
                                                    <Save className="h-4 w-4 mr-2" /> Save Changes
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold uppercase text-slate-500">Traffic Light Status</label>
                                                <select
                                                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                                                    value={formData.status}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                                                >
                                                    <option value="operational">🟢 Operational</option>
                                                    <option value="degraded">🟡 Degraded (Warning)</option>
                                                    <option value="critical">🔴 Critical (Outage)</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold uppercase text-slate-500">Linked Ticket ID</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm font-mono focus:ring-2 focus:ring-purple-500 outline-none"
                                                    placeholder="e.g. JIRA-123"
                                                    value={formData.linkedTicket || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, linkedTicket: e.target.value }))}
                                                />
                                            </div>

                                            <div className="col-span-2 space-y-2">
                                                <label className="text-xs font-semibold uppercase text-slate-500">Public Status Note</label>
                                                <textarea
                                                    className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-purple-500 outline-none min-h-[80px]"
                                                    placeholder="Explain the status to leadership..."
                                                    value={formData.publicNote || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, publicNote: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                                            <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs" onClick={() => handleDelete(feature.id)}>
                                                <Trash2 className="h-4 w-4 mr-2" /> Delete Feature
                                            </Button>
                                        </div>
                                    </CardContent>
                                ) : (
                                    /* VIEW MODE (ROW) */
                                    <CardContent className="p-6 flex items-center justify-between group cursor-pointer hover:bg-slate-50/50" onClick={() => handleEdit(feature)}>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-semibold text-slate-800">{feature.name}</h3>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${feature.status === 'operational' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                    feature.status === 'degraded' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                        'bg-red-50 text-red-600 border-red-200'
                                                    }`}>
                                                    {feature.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 truncate max-w-lg">{feature.publicNote}</p>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            {feature.linkedTicket ? (
                                                <div className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                                                    {feature.linkedTicket}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-300 italic">No Ticket</span>
                                            )}
                                            <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                Edit
                                            </Button>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>

                </div>
            </main>
        </div>
    );
}
