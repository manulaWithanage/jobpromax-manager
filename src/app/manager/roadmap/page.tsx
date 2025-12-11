"use client";

import { useProject } from "@/context/ProjectContext";
import { useRole } from "@/context/RoleContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RoadmapPhase, Deliverable } from "@/types";
import { Trash2, Plus, Save, Map, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";

export default function ManagerRoadmapPage() {
    const { roadmap, updatePhase, addPhase, deletePhase } = useProject();
    const { isManager, role } = useRole();
    const router = useRouter();

    // Local state for editing
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<RoadmapPhase>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isCreating, setIsCreating] = useState(false);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [phaseToDelete, setPhaseToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!isManager && role !== 'manager') {
            router.push('/dashboard');
        }
    }, [isManager, role, router]);



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

            console.log('📤 Sending UPDATE request to backend...');
            console.log('Phase ID:', id);
            console.log('Updated data:', JSON.stringify(formData, null, 2));

            try {
                await updatePhase(id, formData);
                console.log('✅ Phase updated successfully!');
                alert('✅ Phase updated successfully!');
                setEditingId(null);
                setErrors({});
            } catch (err: any) {
                console.error('❌ Failed to update phase:', err);
                alert(`❌ Failed to update phase: ${err.message}`);
            }
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({});
        setErrors({});
    };

    const onDeleteClick = (id: string) => {
        console.log('🔘 DELETE REQUESTED for ID:', id);

        // Validate ID before opening modal
        if (!id || id === 'undefined' || id === 'null') {
            console.error('❌ CRITICAL: Invalid phase ID detected!');
            alert(`❌ Cannot delete phase: Invalid ID (${id}). Please refresh.`);
            return;
        }

        setPhaseToDelete(id);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!phaseToDelete) return;

        setIsDeleting(true);
        console.log('🗑️ Confirmed delete for ID:', phaseToDelete);

        try {
            await deletePhase(phaseToDelete);
            console.log('✅ Phase deleted successfully!');

            // Close edit mode if deleting the currently edited phase
            if (editingId === phaseToDelete) {
                setEditingId(null);
                setFormData({});
                setErrors({});
            }

            setDeleteModalOpen(false);
            setPhaseToDelete(null);
        } catch (err: any) {
            console.error('❌ Failed to delete phase:', err);
            alert(`❌ Failed to delete phase: ${err.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAddPhase = async () => {
        const newPhase: any = {
            phase: 'New Phase',
            date: 'Q4 2025',
            title: 'Untitled Phase',
            description: 'Description of the new phase.',
            status: 'upcoming',
            deliverables: []
        };
        try {
            console.log('📤 Sending CREATE request to backend...');
            console.log('New phase data:', JSON.stringify(newPhase, null, 2));
            setIsCreating(true);

            await addPhase(newPhase as RoadmapPhase);

            console.log('✅ Phase created successfully!');
            console.log('Waiting for roadmap to refresh...');
            // After addPhase completes, refreshData will run and update roadmap
            // The useEffect below will auto-edit the newest phase
        } catch (err: any) {
            console.error('❌ Failed to create phase:', err);
            alert(`❌ Failed to create phase: ${err.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    // Auto-edit the newest phase after creation
    useEffect(() => {
        if (!isCreating && roadmap.length > 0 && !editingId) {
            // Check if we just added a new phase (it will be the last one)
            const latestPhase = roadmap[roadmap.length - 1];
            if (latestPhase.title === 'Untitled Phase') {
                setEditingId(latestPhase.id);
                setFormData(latestPhase);
            }
        }
    }, [roadmap, isCreating]);

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

    // Hooks must run before this return
    if (!isManager) return null;

    return (
        <div className="bg-slate-50/50 min-h-screen font-sans text-slate-900 p-8 lg:p-12">
            <div className="space-y-8">

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
                    <Button onClick={handleAddPhase} disabled={isCreating} className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-all duration-200">
                        {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                        {isCreating ? "Creating..." : "Add Phase"}
                    </Button>
                </div>

                <div className="space-y-6">
                    {roadmap.length === 0 && (
                        <div className="py-12 px-8 bg-white rounded-xl border-2 border-dashed border-slate-200">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-slate-100 rounded-xl">
                                    <Map className="h-8 w-8 text-slate-400" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-slate-900">No Roadmap Phases</h3>
                                    <p className="text-slate-500 max-w-md">Your timeline is currently empty. Get started by creating your first project phase to track progress.</p>
                                    <div className="pt-4">
                                        <Button onClick={handleAddPhase} variant="outline">
                                            <Plus className="h-4 w-4 mr-2" /> Create First Phase
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    )}
                    {roadmap.map((phase) => {
                        // Debug: Log phase structure for first phase
                        if (roadmap.indexOf(phase) === 0) {
                            console.log('📊 [DEBUG] First phase object:', phase);
                            console.log('📊 [DEBUG] First phase.id:', phase.id);
                            console.log('📊 [DEBUG] First phase._id:', (phase as any)._id);
                        }

                        return (
                            <Card key={phase.id} id={phase.id} className={`group transition-all duration-300 ${editingId === phase.id ? 'ring-2 ring-blue-500 shadow-xl' : 'hover:shadow-md'
                                }`}>
                                <CardContent className="p-6">
                                    {editingId === phase.id ? (
                                        /* EDIT MODE */
                                        <div className="space-y-6 animate-in fade-in duration-300">
                                            <div className="flex items-center justify-between border-b pb-4">
                                                <h3 className="tex-lg font-bold text-blue-600">Editing Phase</h3>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
                                                    <Button onClick={() => handleSave(phase.id)} className="bg-blue-600 hover:bg-blue-700 text-white">
                                                        <Save className="h-4 w-4 mr-2" /> Save Changes
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-sm font-semibold text-slate-700">Phase Label</label>
                                                        <input
                                                            value={formData.phase || ''}
                                                            onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                                                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                            placeholder="e.g. Phase 1"
                                                        />
                                                        {errors.phase && <p className="text-red-500 text-xs mt-1">{errors.phase}</p>}
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-semibold text-slate-700">Timeline / Date</label>
                                                        <input
                                                            value={formData.date || ''}
                                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                            placeholder="e.g. Q4 2024"
                                                        />
                                                        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-semibold text-slate-700">Status</label>
                                                        <select
                                                            value={formData.status || 'upcoming'}
                                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <option value="upcoming">Upcoming</option>
                                                            <option value="current">Current (In Progress)</option>
                                                            <option value="completed">Completed</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-sm font-semibold text-slate-700">Title</label>
                                                        <input
                                                            value={formData.title || ''}
                                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                            placeholder="e.g. Foundation & Setup"
                                                        />
                                                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-semibold text-slate-700">Description</label>
                                                        <textarea
                                                            value={formData.description || ''}
                                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                            className="flex min-h-[120px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                            placeholder="Brief description of goals..."
                                                        />
                                                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-100">
                                                <div className="flex items-center justify-between mb-4">
                                                    <label className="text-sm font-semibold text-slate-700">Deliverables</label>
                                                    <Button size="sm" variant="outline" onClick={addDeliverable}>
                                                        <Plus className="h-3 w-3 mr-2" /> Add Item
                                                    </Button>
                                                </div>
                                                <div className="space-y-3 pl-2">
                                                    {formData.deliverables?.map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 animate-in slide-in-from-left-2">
                                                            <div className="bg-slate-200 h-1.5 w-1.5 rounded-full" />
                                                            <input
                                                                value={item.text}
                                                                onChange={(e) => updateDeliverable(idx, 'text', e.target.value)}
                                                                className="flex-1 h-8 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                placeholder="Deliverable description..."
                                                            />
                                                            <select
                                                                value={item.status}
                                                                onChange={(e) => updateDeliverable(idx, 'status', e.target.value)}
                                                                className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            >
                                                                <option value="pending">Pending</option>
                                                                <option value="in-progress">In Progress</option>
                                                                <option value="done">Done</option>
                                                            </select>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => removeDeliverable(idx)}
                                                                className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    {(!formData.deliverables || formData.deliverables.length === 0) && (
                                                        <p className="text-slate-400 text-sm italic">No deliverables added yet.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* VIEW MODE */
                                        <div className="flex flex-col md:flex-row gap-8">
                                            {/* Left Column: Info */}
                                            <div className="md:w-1/3 space-y-4 border-r border-slate-100 pr-6">
                                                <div>
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${phase.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                        phase.status === 'current' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {phase.status}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-900">{phase.phase}</h3>
                                                    <p className="text-sm font-bold text-blue-600 mt-1">{phase.date}</p>
                                                </div>
                                                <div className="pt-2">
                                                    <h4 className="font-semibold text-slate-800">{phase.title}</h4>
                                                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                                                        {phase.description}
                                                    </p>
                                                </div>

                                                <div className="flex gap-2 pt-4">
                                                    <Button variant="outline" size="sm" onClick={() => handleEdit(phase)} className="w-full">
                                                        Edit Phase
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-slate-400 hover:text-red-500 hover:border-red-200"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteClick(phase.id);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    <DeleteConfirmationModal
                                                        isOpen={deleteModalOpen && phaseToDelete === phase.id}
                                                        onClose={() => setDeleteModalOpen(false)}
                                                        onConfirm={handleConfirmDelete}
                                                        title="Delete Phase"
                                                        description={`Are you sure you want to delete '${phase.phase}: ${phase.title}'?`}
                                                        isDeleting={isDeleting}
                                                    />
                                                </div>
                                            </div>

                                            {/* Right Column: Deliverables */}

                                            <div className="md:w-2/3">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Key Deliverables</h4>
                                                <div className="grid sm:grid-cols-2 gap-3">
                                                    {phase.deliverables && phase.deliverables.map((item, idx) => (
                                                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                                            {item.status === 'done' ? (
                                                                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                            ) : item.status === 'in-progress' ? (
                                                                <Loader2 className="h-4 w-4 text-blue-500 mt-0.5 animate-spin flex-shrink-0" />
                                                            ) : (
                                                                <Circle className="h-4 w-4 text-slate-300 mt-0.5 flex-shrink-0" />
                                                            )}
                                                            <span className={`text-sm ${item.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                                                                {item.text}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {(!phase.deliverables || phase.deliverables.length === 0) && (
                                                        <p className="text-sm text-slate-400 italic">No deliverables recorded.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                <DeleteConfirmationModal
                    isOpen={deleteModalOpen && !phaseToDelete} // General modal if not specific (though logic handles specific above)
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Delete Phase"
                    description="Are you sure you want to delete this phase?"
                    isDeleting={isDeleting}
                />
            </div>
        </div>
    );
}
