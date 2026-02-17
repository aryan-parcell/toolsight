import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { ToolBox } from '@shared/types';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { ChevronDown, Plus, User } from 'lucide-react';
import React, { forwardRef, useEffect, useState } from 'react';
import { AppView } from '../App';
import { db } from '../firebase';
import TemplateDisplay from '@/components/TemplateDisplay';

const foamColors = [
    { name: 'Black', value: 'Black', hex: '#18181B' },
    { name: 'Red', value: 'Red', hex: '#DC2626' },
    { name: 'Blue', value: 'Blue', hex: '#2563EB' },
    { name: 'Grey', value: 'Grey', hex: '#4B5563' },
    { name: 'Yellow', value: 'Yellow', hex: '#CA8A04' },
];

interface DashboardProps {
    onNavigate: (view: AppView) => void;
    orgId: string;
}

interface AutosaveInputProps {
    value: string;
    onSave: (val: string) => void;
    placeholder?: string;
}

const AutosaveInput: React.FC<AutosaveInputProps> = ({ value: initialValue, onSave, placeholder }) => {
    const [value, setValue] = useState(initialValue);
    const [error, setError] = useState(false);

    // Sync internal state if prop changes from outside (e.g. real-time update from another user)
    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    const validate = (val: string) => {
        if (val.trim().length === 0) {
            setError(true);
            return false;
        }
        setError(false);
        return true;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
        validate(newValue);
    };

    const handleBlur = () => {
        if (validate(value) && value.trim() !== initialValue.trim()) onSave(value);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && validate(value) && value.trim() !== initialValue.trim()) onSave(value);
    };

    return (
        <div className='w-full'>
            <Input
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={`
                    bg-white dark:bg-black/50 dark:text-white border-gray-300 dark:border-gray-500 focus-visible:ring-axiom-cyan 
                    ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}
                `}
                placeholder={placeholder}
            />
            {error && (
                <span className="text-xs text-red-500 mt-1 ml-1 animate-in slide-in-from-top-1 fade-in">
                    Value cannot be empty
                </span>
            )}
        </div>
    );
};

const ToolboxDetailView = forwardRef<HTMLDivElement, { toolbox: ToolBox }>(({ toolbox, ...props }, ref) => {
    const { id, name, drawers, tools, status } = toolbox;

    const statusColor = status === 'available' ? "bg-green-500" : "bg-yellow-500";
    const drawerCount = drawers?.length || 0;
    const toolCount = tools?.length || 0;

    return (
        <Card ref={ref} {...props} className="bg-axiom-surfaceLight dark:bg-axiom-surfaceDark border border-axiom-borderLight dark:border-axiom-borderDark rounded-lg hover:border-axiom-cyan/50 transition-all duration-300 cursor-pointer group">
            <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="group-hover:text-axiom-cyan transition-colors">{name}</CardTitle>
                <div className={`w-2 h-2 rounded-full ${statusColor}`} />
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center">
                    <div>EID</div>
                    <div>{id}</div>
                </div>
                <div className="flex justify-between items-center">
                    <div># Drawers</div>
                    <div>{drawerCount}</div>
                </div>
                <div className="flex justify-between items-center">
                    <div># Tools</div>
                    <div>{toolCount}</div>
                </div>
            </CardContent>
        </Card>
    );
});

const ToolboxEditDialog: React.FC<{ toolbox: ToolBox }> = ({ toolbox }) => {
    const { id, name, drawers, tools, type, foamColors: toolboxFoamColors, auditProfile } = toolbox;

    const toolboxRef = doc(db, 'toolboxes', id as string);

    const getHexColor = (colorName: string) => {
        return foamColors.find(c => c.value === colorName)?.hex || '#000000';
    };

    const handleUpdateToolbox = async (fields: Partial<ToolBox>) => {
        try {
            await updateDoc(toolboxRef, fields);
        } catch (error) {
            console.error("Error updating toolbox:", error);
        }
    };

    const handleUpdateToolName = async (toolId: string, newName: string) => {
        try {
            // Firestore requires us to write back the entire array to update an object inside it
            const updatedTools = tools.map(t =>
                t.toolId === toolId ? { ...t, toolName: newName } : t
            );

            await updateDoc(toolboxRef, { tools: updatedTools });
        } catch (error) {
            console.error("Error updating tool name:", error);
        }
    };

    const handleDeleteToolbox = async () => {
        try {
            await deleteDoc(toolboxRef);
        } catch (error) {
            console.error("Error deleting toolbox:", error);
        }
    };

    return (
        <>
            <DialogTitle className="text-xl font-bold dark:text-white">Edit Toolbox</DialogTitle>

            <div className="space-y-5">
                <div className="bg-gray-200 dark:bg-gray-700 p-5 rounded-lg space-y-4">
                    <div>
                        <label className="block mb-2 font-medium text-axiom-textLight dark:text-axiom-textDark">Toolbox Name</label>
                        <AutosaveInput value={name} onSave={(val) => handleUpdateToolbox({ name: val })} />
                    </div>

                    <div>
                        <label className="block mb-2 font-medium text-axiom-textLight dark:text-axiom-textDark">Toolbox Type</label>
                        <select
                            value={type}
                            onChange={e => handleUpdateToolbox({ type: e.target.value })}
                            className="w-full rounded-lg p-2 text-sm bg-white dark:bg-black/50 dark:text-white border border-gray-300 dark:border-gray-500 appearance-none cursor-pointer"
                        >
                            <option>Rolling Tool Cart</option>
                            <option>Dispatchable Toolbox</option>
                            <option>Handheld Toolbox</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-2 font-medium text-axiom-textLight dark:text-axiom-textDark">Primary Color</label>
                            <div className="relative">
                                <select
                                    value={toolboxFoamColors.primary}
                                    onChange={e => handleUpdateToolbox({ foamColors: { ...toolboxFoamColors, primary: e.target.value } })}
                                    className="w-full rounded-lg p-2 text-sm bg-white dark:bg-black/50 dark:text-white border border-gray-300 dark:border-gray-500 appearance-none cursor-pointer"
                                >
                                    {foamColors.map(c => (
                                        <option key={c.value} value={c.value}>{c.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getHexColor(toolboxFoamColors.primary) }} />
                                    <ChevronDown className="text-gray-400" size={14} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 font-medium text-axiom-textLight dark:text-axiom-textDark">Secondary Color</label>
                            <div className="relative">
                                <select
                                    value={toolboxFoamColors.secondary}
                                    onChange={e => handleUpdateToolbox({ foamColors: { ...toolboxFoamColors, secondary: e.target.value } })}
                                    className="w-full rounded-lg p-2 text-sm bg-white dark:bg-black/50 dark:text-white border border-gray-300 dark:border-gray-500 appearance-none cursor-pointer"
                                >
                                    {foamColors.map(c => (
                                        <option key={c.value} value={c.value}>{c.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getHexColor(toolboxFoamColors.secondary) }} />
                                    <ChevronDown className="text-gray-400" size={14} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-200 dark:bg-gray-700 p-5 rounded-lg space-y-4">
                    <div>
                        <label className="block mb-2 font-medium text-axiom-textLight dark:text-axiom-textDark">General Audit Options</label>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleUpdateToolbox({ auditProfile: { ...auditProfile, requireOnCheckout: !auditProfile.requireOnCheckout } })}
                                className={`p-2 rounded-lg text-sm transition-colors 
                                    ${auditProfile.requireOnCheckout ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-600 dark:text-gray-300'}`}
                            >
                                Audit on Checkout
                            </button>
                            <button
                                onClick={() => handleUpdateToolbox({ auditProfile: { ...auditProfile, requireOnReturn: !auditProfile.requireOnReturn } })}
                                className={`p-2 rounded-lg text-sm transition-colors 
                                    ${auditProfile.requireOnReturn ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-600 dark:text-gray-300 '}`}
                            >
                                Audit on Return
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-2 font-medium text-axiom-textLight dark:text-axiom-textDark">Shift Audit Options</label>

                        <div className="relative">
                            <select
                                value={auditProfile.periodicFrequencyHours || 0}
                                onChange={e => handleUpdateToolbox({
                                    auditProfile: {
                                        ...auditProfile,
                                        shiftAuditType: parseInt(e.target.value) === 0 ? 'at-will' : 'periodic',
                                        periodicFrequencyHours: parseInt(e.target.value)
                                    }
                                })}
                                className="w-full rounded-lg p-2 text-sm bg-white dark:bg-black/50 dark:text-white border border-gray-300 dark:border-gray-500 appearance-none cursor-pointer"
                            >
                                <option value={0}>No Period (At Will)</option>
                                <option value={2}>Every 2 hours</option>
                                <option value={4}>Every 4 hours</option>
                                <option value={6}>Every 6 hours</option>
                                <option value={8}>Every 8 hours</option>
                            </select>

                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center gap-2">
                                <ChevronDown className="text-gray-400" size={14} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700" />

                {drawers?.map((drawer) => {
                    const drawerTools = tools?.filter(tool => tool.drawerId === drawer.drawerId) || [];

                    return (
                        <div key={drawer.drawerId} className="bg-gray-200 dark:bg-gray-700 mt-5 p-5 space-y-5 rounded-lg">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium text-axiom-textLight dark:text-axiom-textDark">{drawer.drawerName}</h4>
                                <span className="text-xs text-gray-400">{drawerTools.length} items</span>
                            </div>

                            <div className="space-y-2 pl-2">
                                {drawer.templateId ? (
                                    <TemplateDisplay templateId={drawer.templateId} />
                                ) :
                                    drawerTools.length > 0 ? (
                                        drawerTools.map((tool) => (
                                            <div key={tool.toolId} className="flex items-center gap-3">
                                                <div className="w-1 h-1 rounded-full bg-gray-500"></div>
                                                <AutosaveInput
                                                    value={tool.toolName}
                                                    onSave={(val) => handleUpdateToolName(tool.toolId, val)}
                                                    placeholder="Tool Name"
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400 italic pl-4">No tools configured</p>
                                    )
                                }
                            </div>
                        </div>
                    );
                })}

                <div className="border-t border-gray-200 dark:border-gray-700" />

                <button
                    onClick={() => {
                        if (confirm('Are you sure you want to delete this toolbox?')) handleDeleteToolbox();
                    }}
                    className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                    Delete Toolbox
                </button>
            </div>
        </>
    );
};

const ToolboxCard: React.FC<ToolBox> = (toolbox) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <ToolboxDetailView toolbox={toolbox} />
            </DialogTrigger>
            <DialogContent
                className="bg-axiom-surfaceLight dark:bg-axiom-surfaceDark rounded-lg p-6 max-h-[85vh] overflow-y-auto w-full"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <ToolboxEditDialog toolbox={toolbox} />
            </DialogContent>
        </Dialog>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, orgId }) => {
    const [toolboxes, setToolboxes] = useState<ToolBox[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const toolboxesRef = collection(db, 'toolboxes');

        const q = query(toolboxesRef, where("organizationId", "==", orgId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tbs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ToolBox));
            setToolboxes(tbs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching toolboxes: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [orgId]);

    return (
        <div className="animate-in fade-in duration-500 space-y-10">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-4xl font-black text-axiom-headingLight dark:text-white">Toolbox Overview</h2>
                    <p className="text-axiom-textLight dark:text-axiom-textDark">An overview of all your tracked tool inventories.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="bg-axiom-cyan text-black px-6 py-3 rounded-full font-bold flex items-center gap-2"
                        onClick={() => onNavigate(AppView.TOOLBOX_WIZARD)}
                    >
                        <Plus />
                        Add New Toolbox
                    </button>
                    <button className="w-12 h-12 rounded-full bg-axiom-surfaceLight dark:bg-axiom-surfaceDark border border-axiom-borderLight dark:border-axiom-borderDark flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                        <User />
                    </button>
                </div>
            </div>

            {loading ? (
                <div>Loading toolboxes...</div>
            ) : toolboxes.length === 0 ? (
                <div>No toolboxes found. Click "Add New Toolbox" to create one.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {toolboxes.map((tb) => (
                        <ToolboxCard key={tb.id} {...tb} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;