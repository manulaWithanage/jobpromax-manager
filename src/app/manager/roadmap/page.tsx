"use client";

import Sidebar from "@/components/layout/Sidebar";
import { useProject } from "@/context/ProjectContext";
import { useRole } from "@/context/RoleContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RoadmapPhase, Deliverable } from "@/lib/mockData";
import { Trash2, Plus, Save, Map, CheckCircle2, Circle } from "lucide-react";

export default function ManagerRoadmapPage() {
    const { roadmap, updatePhase, addPhase, deletePhase } = useProject();
    const { isManager, role } = useRole();
    const router = useRouter();

    // Local state for editing
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<RoadmapPhase>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isManager && role !== 'manager') {
            router.push('/dashboard');
        }
    }, [isManager, role, router]);

    if (!isManager) return null;

    const handleEdit = (phase: RoadmapPhase) => {
        setEditingId(phase.id);
        setFormData(JSON.parse(JSON.stringify(phase))); // Deep copy
        setErrors({});
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.phase?.trim()) newErrors.phase = "Phase Label is required";
        if (!formData.date?.trim()) newErrors.date = "Timeline/Date is required";
        if (!formData.title?.trim()) newErrors.title = "Title is required";
        if (!formData.description?.trim()) newErrors.description = "Description is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async (id: string) => {
        if (formData) {
            if (!validateForm()) return;
            await updatePhase(id, formData);
            setEditingId(null);
            setErrors({});
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({});
        setErrors({});
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this phase? This cannot be undone.")) {
            await deletePhase(id);
        }
    };

    const handleAddPhase = async () => {
        const newPhase: RoadmapPhase = {
            id: `p${Date.now()}`,
            phase: 'New Phase',
            date: 'Q4 2025',
            title: 'Untitled Phase',
            description: 'Description of the new phase.',
            status: 'upcoming',
            deliverables: []
        };
        await addPhase(newPhase);
        // Auto start editing
        setEditingId(newPhase.id);
        setFormData(newPhase);
        setErrors({});
    };

    // Scroll to new/edited card
    useEffect(() => {
        if (editingId) {
            // Small timeout to ensure DOM is ready (especially after adding new phase)
            setTimeout(() => {
                const element = document.getElementById(editingId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }, [editingId, roadmap]); // Depend on roadmap too in case it was just added

    // Deliverable Helpers
    const addDeliverable = () => {
        if (!formData.deliverables) return;
        setFormData({
            ...formData,
            deliverables: [...formData.deliverables, { text: "New Deliverable", status: "pending" }]
        });
    };

    const removeDeliverable = (index: number) => {
        if (!formData.deliverables) return;
        const newDeliverables = [...formData.deliverables];
        newDeliverables.splice(index, 1);
        setFormData({ ...formData, deliverables: newDeliverables });
    };

    const updateDeliverable = (index: number, field: keyof Deliverable, value: any) => {
        if (!formData.deliverables) return;
        const newDeliverables = [...formData.deliverables];
        newDeliverables[index] = { ...newDeliverables[index], [field]: value };
        setFormData({ ...formData, deliverables: newDeliverables });
    };

    return (
        <div className="flex bg-slate-50/50 min-h-screen font-sans text-slate-900">
            <Sidebar />

            <main className="flex-1 ml-72 p-8 lg:p-12 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-8">

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Map className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Roadmap Manager</h1>
                                <p className="text-slate-500">Plan and structure upcoming project phases.</p>
                            </div>
                        </div>
                        <Button onClick={handleAddPhase} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4 mr-2" /> Add Phase
                        </Button>
                    </div>

                    <div className="space-y-6">
                        {roadmap.map((phase) => (
                            <Card id={phase.id} key={phase.id} className={`overflow-hidden transition-all duration-300 ${editingId === phase.id ? 'ring-2 ring-blue-400 shadow-lg' : 'hover:shadow-md'}`}>

                                {editingId === phase.id ? (
                                    /* EDIT MODE */
                                    <CardContent className="p-6 bg-white space-y-6">
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                            <h3 className="text-lg font-bold text-slate-800">Edit Phase</h3>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
                                                <Button onClick={() => handleSave(phase.id)} className="bg-blue-600 hover:bg-blue-700">
                                                    <Save className="h-4 w-4 mr-2" /> Save Changes
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold uppercase text-slate-500">Phase Label</label>
                                                <input
                                                    className={`w-full p-2.5 rounded-lg border ${errors.phase ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} text-sm focus:ring-2 focus:ring-blue-500 outline-none`}
                                                    value={formData.phase || ''}
                                                    onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                                                />
                                                {errors.phase && <p className="text-xs text-red-500">{errors.phase}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold uppercase text-slate-500">Timeline / Date</label>
                                                <input
                                                    className={`w-full p-2.5 rounded-lg border ${errors.date ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} text-sm focus:ring-2 focus:ring-blue-500 outline-none`}
                                                    value={formData.date || ''}
                                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                />
                                                {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
                                            </div>
                                            <div className="col-span-2 space-y-2">
                                                <label className="text-xs font-semibold uppercase text-slate-500">Title</label>
                                                <input
                                                    className={`w-full p-2.5 rounded-lg border ${errors.title ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none`}
                                                    value={formData.title || ''}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                />
                                                {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                                            </div>
                                            <div className="col-span-2 space-y-2">
                                                <label className="text-xs font-semibold uppercase text-slate-500">Description</label>
                                                <textarea
                                                    className={`w-full p-2.5 rounded-lg border ${errors.description ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]`}
                                                    value={formData.description || ''}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                />
                                                {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold uppercase text-slate-500">Status</label>
                                                <select
                                                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                                >
                                                    <option value="completed">Completed</option>
                                                    <option value="current">Current (In Progress)</option>
                                                    <option value="upcoming">Upcoming</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold uppercase text-slate-500">Health (Optional)</label>
                                                <select
                                                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={formData.health || ''}
                                                    onChange={(e) => setFormData({ ...formData, health: e.target.value as any || undefined })}
                                                >
                                                    <option value="">None</option>
                                                    <option value="on-track">On Track (Green)</option>
                                                    <option value="at-risk">At Risk (Amber)</option>
                                                    <option value="delayed">Delayed (Red)</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Deliverables Editor */}
                                        <div className="pt-4 border-t border-slate-100 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-semibold uppercase text-slate-500">Deliverables</label>
                                                <Button size="sm" variant="ghost" onClick={addDeliverable} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8">
                                                    <Plus className="h-3 w-3 mr-1" /> Add Item
                                                </Button>
                                            </div>
                                            <div className="space-y-2">
                                                {formData.deliverables?.map((del, i) => (
                                                    <div key={i} className="flex gap-2 items-center">
                                                        <select
                                                            className="w-32 p-2 rounded-lg border border-slate-200 text-xs bg-slate-50"
                                                            value={del.status}
                                                            onChange={(e) => updateDeliverable(i, 'status', e.target.value)}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="in-progress">In Progress</option>
                                                            <option value="done">Done</option>
                                                        </select>
                                                        <input
                                                            className="flex-1 p-2 rounded-lg border border-slate-200 text-sm"
                                                            value={del.text}
                                                            onChange={(e) => updateDeliverable(i, 'text', e.target.value)}
                                                        />
                                                        <button onClick={() => removeDeliverable(i)} className="p-2 text-slate-400 hover:text-red-500">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </CardContent>
                                ) : (
                                    /* VIEW MODE */
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-bold text-lg text-slate-900">{phase.title}</h3>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${phase.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                        phase.status === 'current' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                            'bg-slate-50 text-slate-500 border-slate-200'
                                                        }`}>
                                                        {phase.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold uppercase text-slate-500">{phase.phase} • {phase.date}</p>
                                                <p className="text-sm text-slate-600 max-w-xl">{phase.description}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(phase)}>Edit</Button>
                                                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-500 hover:bg-red-50" onClick={() => handleDelete(phase.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        {/* Preview Deliverables Count */}
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {phase.deliverables.filter(d => d.status === 'done').length} Done</span>
                                            <span className="flex items-center gap-1"><Circle className="h-3 w-3" /> {phase.deliverables.filter(d => d.status !== 'done').length} Pending</span>
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
