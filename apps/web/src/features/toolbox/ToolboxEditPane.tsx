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

    return (
        <div className="space-y-5 h-full overflow-y-auto pr-4 custom-scrollbar">
            <div className="bg-gray-200 dark:bg-gray-700 p-5 rounded-lg space-y-4">
                <div>
                    <label className="block mb-2 font-medium text-axiom-textLight dark:text-axiom-textDark">Toolbox Name</label>
                    <AutosaveInput value={name} onSave={(val) => updateToolbox(id!, { name: val })} />
                </div>

                <div>
                    <label className="block mb-2 font-medium text-axiom-textLight dark:text-axiom-textDark">Toolbox Type</label>
                    <select
                        value={type}
                        onChange={e => updateToolbox(id!, { type: e.target.value })}
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
                                onChange={e => updateToolbox(id!, { foamColors: { ...toolboxFoamColors, primary: e.target.value } })}
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
                                onChange={e => updateToolbox(id!, { foamColors: { ...toolboxFoamColors, secondary: e.target.value } })}
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
                            onClick={() => updateToolbox(id!, { auditProfile: { ...auditProfile, requireOnCheckout: !auditProfile.requireOnCheckout } })}
                            className={`p-2 rounded-lg text-sm transition-colors 
                                ${auditProfile.requireOnCheckout ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-600 dark:text-gray-300'}`}
                        >
                            Audit on Checkout
                        </button>
                        <button
                            onClick={() => updateToolbox(id!, { auditProfile: { ...auditProfile, requireOnReturn: !auditProfile.requireOnReturn } })}
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
                            onChange={e => updateToolbox(id!, {
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
                    <div key={drawer.drawerId} className="bg-gray-200 dark:bg-gray-700 p-5 space-y-5 rounded-lg">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-axiom-textLight dark:text-axiom-textDark">{drawer.drawerName}</h4>
                            <span className="text-xs text-gray-400">{drawerTools.length} items</span>
                        </div>
                        <div className="space-y-2">
                            {drawer.templateId ? (
                                <div className="space-y-2">
                                    <TemplateDisplay templateId={drawer.templateId} />
                                    <button
                                        onClick={() => handleUnlinkDrawerTemplate(drawer.drawerId)}
                                        className="w-full p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
                                    >
                                        Unlink Template
                                    </button>
                                </div>
                            ) :
                                drawerTools.length > 0 ? (
                                    drawerTools.map((tool) => (
                                        <div key={tool.toolId} className="flex items-center gap-3">
                                            <div className="w-1 h-1 rounded-full bg-gray-500"></div>
                                            <AutosaveInput
                                                value={tool.toolInfo.name}
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
                    if (confirm('Are you sure you want to delete this toolbox?')) deleteToolbox(id!);
                }}
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
                Delete Toolbox
            </button>
        </div>
    );
}
