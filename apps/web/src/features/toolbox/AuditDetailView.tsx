import type { Audit, Detection, ToolBox } from '@shared/types';
import { format } from 'date-fns';
import { AlertCircle, ArrowLeft, ChevronDown, ChevronUp, ImageIcon, Package } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AuditRepository } from '../../repositories/AuditRepository';
import ToolDetection from '@/components/ToolDetection';

interface AuditDetailViewProps {
    audit: Audit;
    toolbox: ToolBox;
    onBack: () => void;
}

function AuditImage({ storagePath, results }: { storagePath: string, results: Record<string, Detection> | null }) {
    const [url, setUrl] = useState<string | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [imageRect, setImageRect] = useState<{ width: number, height: number, top: number, left: number } | null>(null);
    
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const calculateImageRect = () => {
        if (!imageRef.current || !containerRef.current) return;

        const img = imageRef.current;
        const container = containerRef.current;
        
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const imageWidth = img.naturalWidth;
        const imageHeight = img.naturalHeight;

        if (!imageWidth || !imageHeight) return;

        const containerRatio = containerWidth / containerHeight;
        const imageRatio = imageWidth / imageHeight;

        let finalWidth, finalHeight, top, left;

        if (imageRatio > containerRatio) {
            // Image is wider than container ratio (pillarboxing)
            finalWidth = containerWidth;
            finalHeight = containerWidth / imageRatio;
            left = 0;
            top = (containerHeight - finalHeight) / 2;
        } else {
            // Image is taller than container ratio (letterboxing)
            finalHeight = containerHeight;
            finalWidth = containerHeight * imageRatio;
            top = 0;
            left = (containerWidth - finalWidth) / 2;
        }

        setImageRect({
            width: finalWidth,
            height: finalHeight,
            top: top,
            left: left
        });
    };

    useEffect(() => {
        AuditRepository.getAuditImageUrl(storagePath)
            .then(u => setUrl(u))
            .catch((err) => setError(true))
    }, [storagePath]);

    if (error) {
        return (
            <div className="w-full aspect-video bg-gray-100 dark:bg-white/5 rounded-xl flex flex-col items-center justify-center text-gray-400 gap-2 border border-gray-200 dark:border-gray-800">
                <AlertCircle size={24} className="opacity-50" />
                <p className="text-xs italic">Failed to load audit image</p>
            </div>
        );
    }

    const toolDetections = results ? Object.values(results) : [];

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs uppercase font-bold text-gray-400 tracking-wider">
                    <ImageIcon size={14} />
                    Audit Capture
                </div>
                <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors text-gray-400"
                >
                    {isMinimized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
            </div>

            {!isMinimized && (
                <div 
                    ref={containerRef}
                    className="relative w-full bg-black rounded-xl overflow-hidden aspect-video group"
                >
                    {/* Persistent Loading Overlay */}
                    {!imageLoaded && (
                        <div className="absolute inset-0 bg-gray-100 dark:bg-white/5 flex flex-col items-center justify-center gap-3">
                            <ImageIcon size={24} className="text-gray-300 animate-bounce" />
                            <p className="text-xs text-gray-400 font-medium font-mono">Resolving Image...</p>
                        </div>
                    )}
                    
                    {url && (
                        <>
                            <img
                                ref={imageRef}
                                src={url}
                                onLoad={() => {
                                    setImageLoaded(true);
                                    calculateImageRect();
                                }}
                                alt="Audit"
                                className="w-full h-full object-contain"
                            />
                            
                            {imageLoaded && toolDetections.length > 0 && imageRect && (
                                <div 
                                    className="absolute z-20 pointer-events-none"
                                    style={{
                                        top: imageRect.top,
                                        left: imageRect.left,
                                        width: imageRect.width,
                                        height: imageRect.height
                                    }}
                                >
                                    <ToolDetection 
                                        toolPositions={toolDetections}
                                        isEditMode={false}
                                        containerClassName="w-full h-full"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
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
                                    <AuditImage storagePath={state.imageStoragePath} results={state.results} />
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
