import AutosaveInput from '@/components/AutosaveInput';
import type { ToolBox } from '@shared/types';
import { ChevronDown } from 'lucide-react';
import TemplateDisplay from '@/components/TemplateDisplay';

const foamColors = [
    { name: 'Black', value: 'Black', hex: '#18181B' },
    { name: 'Red', value: 'Red', hex: '#DC2626' },
    { name: 'Blue', value: 'Blue', hex: '#2563EB' },
    { name: 'Grey', value: 'Grey', hex: '#4B5563' },
    { name: 'Yellow', value: 'Yellow', hex: '#CA8A04' },
];

interface ToolboxEditPaneProps {
    toolbox: ToolBox;
    updateToolbox: (id: string, data: Partial<ToolBox>) => Promise<void>;
    deleteToolbox: (id: string) => Promise<void>;
}

export function ToolboxEditPane({ toolbox, updateToolbox, deleteToolbox }: ToolboxEditPaneProps) {
    const { id, name, drawers, tools, type, foamColors: toolboxFoamColors, auditProfile } = toolbox;

    const getHexColor = (colorName: string) => {
        return foamColors.find(c => c.value === colorName)?.hex || '#000000';
    };

    const handleUpdateToolName = async (toolId: string, newName: string) => {
        // Firestore requires us to write back the entire array to update an object inside it
        const updatedTools = tools.map(t =>
            t.toolId === toolId ? { ...t, toolInfo: { ...t.toolInfo, name: newName } } : t
        );

        await updateToolbox(id!, { tools: updatedTools });
    };

    const handleUnlinkDrawerTemplate = async (drawerId: string) => {
        // Firestore requires us to write back the entire array to update an object inside it
        const updatedDrawers = drawers.map(d => {
            if (d.drawerId === drawerId) {
                const { templateId, ...rest } = d;
                return rest;
            }
            return d;
        });

        await updateToolbox(id!, { drawers: updatedDrawers });
    };

    function Label({ label }: { label: string }) {
        return <label className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 font-bold mb-2 block">
            {label}
        </label>;
    }

    return (
        <div className="space-y-5 h-full overflow-y-auto pr-4 custom-scrollbar">
            <h3 className="text-lg font-black dark:text-white mb-6">Edit Toolbox</h3>

            <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800 p-5 rounded-xl space-y-5">
                <div>
                    <Label label="Toolbox Name" />
                    <AutosaveInput value={name} onSave={(val) => updateToolbox(id!, { name: val })} />
                </div>

                <div>
                    <Label label="Toolbox Type" />
                    <div className="relative group">
                        <select
                            value={type}
                            onChange={e => updateToolbox(id!, { type: e.target.value })}
                            className="w-full rounded-lg p-2 text-sm bg-gray-50 dark:bg-white/5 dark:text-white border border-gray-200 dark:border-gray-800 appearance-none cursor-pointer hover:border-axiom-cyan/30 transition-colors"
                        >
                            <option>Rolling Tool Cart</option>
                            <option>Dispatchable Toolbox</option>
                            <option>Handheld Toolbox</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-axiom-cyan transition-colors" size={14} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label label="Primary Color" />
                        <div className="relative group">
                            <select
                                value={toolboxFoamColors.primary}
                                onChange={e => updateToolbox(id!, { foamColors: { ...toolboxFoamColors, primary: e.target.value } })}
                                className="w-full rounded-lg p-2 text-sm bg-gray-50 dark:bg-white/5 dark:text-white border border-gray-200 dark:border-gray-800 appearance-none cursor-pointer hover:border-axiom-cyan/30 transition-colors"
                            >
                                {foamColors.map(c => (
                                    <option key={c.value} value={c.value}>{c.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getHexColor(toolboxFoamColors.primary) }} />
                                <ChevronDown className="text-gray-400 group-hover:text-axiom-cyan transition-colors" size={14} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label label="Secondary Color" />
                        <div className="relative group">
                            <select
                                value={toolboxFoamColors.secondary}
                                onChange={e => updateToolbox(id!, { foamColors: { ...toolboxFoamColors, secondary: e.target.value } })}
                                className="w-full rounded-lg p-2 text-sm bg-gray-50 dark:bg-white/5 dark:text-white border border-gray-200 dark:border-gray-800 appearance-none cursor-pointer hover:border-axiom-cyan/30 transition-colors"
                            >
                                {foamColors.map(c => (
                                    <option key={c.value} value={c.value}>{c.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getHexColor(toolboxFoamColors.secondary) }} />
                                <ChevronDown className="text-gray-400 group-hover:text-axiom-cyan transition-colors" size={14} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800 p-5 rounded-xl space-y-5">
                <div>
                    <Label label="Event-Based Audits" />
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => updateToolbox(id!, { auditProfile: { ...auditProfile, requireOnCheckout: !auditProfile.requireOnCheckout } })}
                            className={`p-2 rounded-lg text-xs font-bold transition-all border
                                ${auditProfile.requireOnCheckout
                                    ? 'bg-axiom-cyan/10 text-axiom-cyan border-axiom-cyan/30'
                                    : 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:border-white/10'}`}
                        >
                            AUDIT ON CHECKOUT
                        </button>
                        <button
                            onClick={() => updateToolbox(id!, { auditProfile: { ...auditProfile, requireOnReturn: !auditProfile.requireOnReturn } })}
                            className={`p-2 rounded-lg text-xs font-bold transition-all border
                                ${auditProfile.requireOnReturn
                                    ? 'bg-axiom-cyan/10 text-axiom-cyan border-axiom-cyan/30'
                                    : 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:border-white/10'}`}
                        >
                            AUDIT ON RETURN
                        </button>
                    </div>
                </div>

                <div>
                    <Label label="Shift Audits" />
                    <div className="relative group">
                        <select
                            value={auditProfile.periodicFrequencyHours || 0}
                            onChange={e => updateToolbox(id!, {
                                auditProfile: {
                                    ...auditProfile,
                                    shiftAuditType: parseInt(e.target.value) === 0 ? 'at-will' : 'periodic',
                                    periodicFrequencyHours: parseInt(e.target.value)
                                }
                            })}
                            className="w-full rounded-lg p-2 text-sm bg-gray-50 dark:bg-white/5 dark:text-white border border-gray-200 dark:border-gray-800 appearance-none cursor-pointer hover:border-axiom-cyan/30 transition-colors"
                        >
                            <option value={0}>At Will (No Schedule)</option>
                            <option value={2}>Every 2 hours</option>
                            <option value={4}>Every 4 hours</option>
                            <option value={6}>Every 6 hours</option>
                            <option value={8}>Every 8 hours</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-axiom-cyan transition-colors" size={14} />
                    </div>
                </div>
            </div>

            {drawers?.map((drawer) => {
                const drawerTools = tools?.filter(tool => tool.drawerId === drawer.drawerId) || [];
                return (
                    <div key={drawer.drawerId} className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800 p-5 space-y-5 rounded-xl">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest">{drawer.drawerName}</h4>
                            <span className="text-xs bg-gray-100 dark:bg-white/5 p-2 rounded text-gray-500 uppercase font-bold tracking-tighter">
                                {drawerTools.length} ITEMS
                            </span>
                        </div>
                        <div className="space-y-2">
                            {drawer.templateId ? (
                                <div className="space-y-2">
                                    <TemplateDisplay templateId={drawer.templateId} />
                                    <button
                                        onClick={() => handleUnlinkDrawerTemplate(drawer.drawerId)}
                                        className="w-full p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-lg text-xs font-bold transition-all uppercase tracking-widest"
                                    >
                                        Unlink Template
                                    </button>
                                </div>
                            ) :
                                drawerTools.length > 0 ? (
                                    drawerTools.map((tool) => (
                                        <div key={tool.toolId} className="flex items-center gap-3">
                                            <div className="w-1 h-1 rounded-full bg-axiom-cyan/40" />
                                            <AutosaveInput
                                                value={tool.toolInfo.name}
                                                onSave={(val) => handleUpdateToolName(tool.toolId, val)}
                                                placeholder="Tool Name"
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 italic py-2 text-center bg-gray-50 dark:bg-white/5 rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
                                        No tools configured
                                    </p>
                                )
                            }
                        </div>
                    </div>
                );
            })}

            <button
                onClick={() => {
                    if (confirm('Are you sure you want to delete this toolbox?')) deleteToolbox(id!);
                }}
                className="w-full p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl font-bold transition-all uppercase tracking-widest text-xs"
            >
                Delete Toolbox
            </button>
        </div>
    );
}
