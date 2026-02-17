import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LayoutGrid, CheckCircle2, Loader2 } from 'lucide-react';
import type { ToolBox, Tool, Template } from '@shared/types';
import { deleteObject, ref } from 'firebase/storage';

interface TemplateInventoryProps {
    orgId: string;
}

export default function TemplateInventory({ orgId }: TemplateInventoryProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);

    // Assignment State
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [toolboxes, setToolboxes] = useState<ToolBox[]>([]);
    const [selectedToolboxId, setSelectedToolboxId] = useState<string>("");
    const [selectedDrawerId, setSelectedDrawerId] = useState<string>("");
    const [assigning, setAssigning] = useState(false);

    // Fetch Templates
    useEffect(() => {
        const q = query(collection(db, 'templates'), where('organizationId', '==', orgId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const templates = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Template));
            setTemplates(templates);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [orgId]);

    // Fetch Toolboxes (Only when opening the modal to save reads)
    useEffect(() => {
        if (!selectedTemplate) return;

        const q = query(collection(db, 'toolboxes'), where('organizationId', '==', orgId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tbs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ToolBox));
            setToolboxes(tbs);
        });

        return () => unsubscribe();
    }, [selectedTemplate, orgId]);

    // Execute Assignment
    const handleAssign = async () => {
        if (!selectedTemplate || !selectedToolboxId || !selectedDrawerId) return;
        setAssigning(true);

        try {
            const toolboxRef = doc(db, 'toolboxes', selectedToolboxId);
            const toolbox = toolboxes.find(t => t.id === selectedToolboxId);
            if (!toolbox) throw new Error("Toolbox not found");

            // Find the drawer and attach the templateId to it
            const updatedDrawers = toolbox.drawers.map(d => {
                return d.drawerId === selectedDrawerId ? { ...d, templateId: selectedTemplate.id } : d;
            });

            // Filter OUT tools currently in this drawer
            const otherTools = toolbox.tools.filter(t => t.drawerId !== selectedDrawerId);

            // Create NEW tools from Template
            const newTools: Tool[] = selectedTemplate.tools.map((t, i) => ({
                drawerId: selectedDrawerId,
                toolId: `t${selectedDrawerId.substring(1)}-${i}`,
                toolName: t.toolName,
                x: t.x,
                y: t.y,
                width: t.width,
                height: t.height
            }));

            // Write to Firestore
            await updateDoc(toolboxRef, {
                drawers: updatedDrawers,
                tools: [...otherTools, ...newTools]
            });

            // Close and Reset
            setSelectedTemplate(null);
            setSelectedToolboxId("");
            setSelectedDrawerId("");
            alert(`Successfully assigned "${selectedTemplate.name}"!`);
        } catch (error) {
            console.error("Assignment failed", error);
            alert("Failed to assign template. Check console.");
        } finally {
            setAssigning(false);
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        if (!confirm("Are you sure you want to delete this template? This cannot be undone.")) return;

        try {
            // Find all toolboxes that might contain this template
            const q = query(collection(db, 'toolboxes'), where('organizationId', '==', orgId));
            const snapshot = await getDocs(q);

            const updatePromises = snapshot.docs.map(async (docSnap) => {
                const toolbox = docSnap.data() as ToolBox;
                let needsUpdate = false;

                // Check if any drawer uses this template
                const updatedDrawers = toolbox.drawers.map(d => {
                    if (d.templateId === templateId) {
                        needsUpdate = true;
                        const { templateId, ...rest } = d;
                        return rest;
                    }
                    return d;
                });

                if (needsUpdate) {
                    console.log(`Unlinking template from toolbox: ${toolbox.name}`);
                    return updateDoc(doc(db, 'toolboxes', docSnap.id), {
                        drawers: updatedDrawers
                    });
                }
            });

            await Promise.all(updatePromises);

            // Delete template image and document
            const templateRef = doc(db, 'templates', templateId);
            const templateSnap = await getDoc(templateRef);

            if (templateSnap.exists()) {
                const data = templateSnap.data() as Template;

                if (data.storagePath) {
                    const imageRef = ref(storage, data.storagePath);
                    await deleteObject(imageRef).catch(err => console.warn("Failed to delete image", err));
                }
            }

            await deleteDoc(templateRef);
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete template.");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-4xl font-black text-axiom-headingLight dark:text-white">Template Inventory</h2>
                    <p className="text-axiom-textLight dark:text-axiom-textDark">Manage visual templates and assign them to physical toolboxes.</p>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-axiom-cyan" />
                </div>
            ) : templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-5 rounded-xl border-2 border-dashed border-gray-500  bg-axiom-surfaceLight dark:bg-axiom-surfaceDark">
                    <LayoutGrid className="w-12 h-12 text-gray-500" />
                    <h3 className="text-xl font-bold text-gray-500">No Templates Found</h3>
                    <p className="text-sm text-gray-500">Create templates in the Template Builder to see them here and assign to toolboxes.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {templates.map(template => (
                        <Card key={template.id} className="overflow-hidden group hover:border-axiom-cyan transition-colors bg-axiom-surfaceLight dark:bg-axiom-surfaceDark border-gray-500">
                            {/* Image Preview */}
                            <div className="relative aspect-square bg-black">
                                <img
                                    src={template.imageUrl}
                                    alt={template.name}
                                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-2 right-2 bg-black text-white text-xs p-1">
                                    {template.tools.length} Tools
                                </div>
                            </div>

                            <CardContent className="p-2 space-y-2">
                                <h3 className="font-bold text-lg dark:text-white">{template.name}</h3>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 text-xs border-gray-500"
                                        onClick={() => handleDeleteTemplate(template.id!)}
                                    >
                                        Delete
                                    </Button>
                                    <Button
                                        className="flex-1 text-xs bg-axiom-cyan text-black"
                                        onClick={() => setSelectedTemplate(template)}
                                    >
                                        Assign
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Assignment Modal */}
            <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
                <DialogContent className="bg-axiom-surfaceLight dark:bg-axiom-surfaceDark border-gray-500">
                    <DialogHeader>
                        <DialogTitle className='dark:text-white'>Assign Template {selectedTemplate?.name ?? ""}</DialogTitle>
                    </DialogHeader>

                    {selectedTemplate && (
                        <div className="space-y-4">
                            {/* Template Preview */}
                            <img src={selectedTemplate.imageUrl} className="object-cover rounded" alt="Preview" />

                            {/* Options */}
                            <div className="space-y-2">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-500">Select Toolbox</label>
                                    <select
                                        className="w-full dark:bg-gray-900 dark:text-white border border-gray-500 rounded-lg p-3 text-sm focus:border-axiom-cyan"
                                        value={selectedToolboxId}
                                        onChange={(e) => {
                                            setSelectedToolboxId(e.target.value);
                                            setSelectedDrawerId("");
                                        }}
                                    >
                                        <option value="">-- Choose Toolbox --</option>
                                        {toolboxes.map(tb => (
                                            <option key={tb.id} value={tb.id}>{tb.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-500">Select Target Drawer</label>
                                    <select
                                        className="w-full dark:bg-gray-900 dark:text-white border border-gray-500 rounded-lg p-3 text-sm  focus:border-axiom-cyan disabled:opacity-50"
                                        value={selectedDrawerId}
                                        onChange={(e) => setSelectedDrawerId(e.target.value)}
                                        disabled={!selectedToolboxId}
                                    >
                                        <option value="">-- Choose Drawer --</option>
                                        {selectedToolboxId && toolboxes.find(t => t.id === selectedToolboxId)?.drawers.map(d => (
                                            <option key={d.drawerId} value={d.drawerId}>
                                                {d.drawerName} {d.templateId ? '(Has Template)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Warning */}
                            {selectedDrawerId && (
                                <div className="flex items-start gap-2 p-3 bg-yellow-900/75 border rounded-lg text-yellow-200 text-xs">
                                    <p>
                                        Assigning this template will <strong>permanently replace</strong> all existing tools in the selected drawer with the tools defined in this template.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSelectedTemplate(null)}>Cancel</Button>
                        <Button
                            className="bg-axiom-cyan text-black"
                            disabled={!selectedToolboxId || !selectedDrawerId || assigning}
                            onClick={handleAssign}
                        >
                            {assigning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Confirm Assignment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}