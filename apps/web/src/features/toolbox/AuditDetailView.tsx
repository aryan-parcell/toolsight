import type { Audit, ToolBox } from '@shared/types';
import { format } from 'date-fns';
import { AlertCircle, ArrowLeft, ImageIcon, Package } from 'lucide-react';

interface AuditDetailViewProps {
    audit: Audit;
    toolbox: ToolBox;
    onBack: () => void;
}

export function AuditDetailView({ audit, toolbox, onBack }: AuditDetailViewProps) {
    const formatTimestamp = (date: any) => {
        if (!date) return 'In Progress';
        const d = date instanceof Date ? date : date.toDate?.() || new Date(date);
        return format(d, 'MMM d, h:mm a');
    };

    const getDrawerName = (drawerId: string) => {
        return toolbox.drawers.find(d => d.drawerId === drawerId)?.drawerName || `Drawer ${drawerId}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present': return 'text-green-500';
            case 'absent': return 'text-red-500';
            case 'unserviceable': return 'text-yellow-500';
            default: return 'text-gray-500';
        }
    };

    const drawerEntries = Object.entries(audit.drawerStates);

    return (
        <div className="flex flex-col h-full animate-in slide-in-from-right duration-300 space-y-5">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-axiom-cyan transition-colors group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to History
            </button>

            <div>
                <h3 className="text-xl font-black dark:text-white">Audit Details</h3>

                <div className='text-sm text-gray-500 font-mono mt-2'>
                    <p>Started: {formatTimestamp(audit.startTime)}</p>
                    <p>{audit.endTime ? `Ended: ${formatTimestamp(audit.endTime)}` : 'Audit In Progress'}</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5">
                {drawerEntries.map(([id, state]) => {
                    const tools = state.results ? Object.values(state.results) : [];

                    return (
                        <div key={id} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                            <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-axiom-cyan/10 rounded-lg text-axiom-cyan">
                                        <Package size={18} />
                                    </div>
                                    <h4 className="font-bold dark:text-white">{getDrawerName(id)}</h4>
                                </div>

                                <p className="text-xs text-gray-500 uppercase font-bold">
                                    {state.drawerStatus.replace('-', ' ')}
                                </p>
                            </div>

                            <div className="p-3">
                                {state.imageStoragePath && (
                                    <div className="p-3 bg-axiom-cyan/5 border border-axiom-cyan/20 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-axiom-cyan font-medium">
                                            <ImageIcon size={14} />
                                            Audit Image Available
                                        </div>
                                        <span className="text-xs text-gray-400 font-mono">{state.imageStoragePath.split('/').slice(2).join('/')}</span>
                                    </div>
                                )}

                                <div className='space-y-3 p-3'>
                                    {tools.length > 0 ? (
                                        tools.map((tool) => (
                                            <div key={tool.toolId} className="flex items-center justify-between">
                                                <p className="text-sm dark:text-gray-300">{tool.toolInfo.name}</p>
                                                <p className={`text-sm font-mono font-bold uppercase ${getStatusColor(tool.status)}`}>{tool.status}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-6 text-gray-500 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-xl">
                                            <AlertCircle size={24} className="mb-2 opacity-20" />
                                            <p className="text-xs italic">No tool detections found for this drawer</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
