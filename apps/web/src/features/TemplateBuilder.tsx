
import React, { useState } from 'react';
import { ArrowRight, Trash2, Plus, Edit, Anchor } from 'lucide-react';
import ToolDetection from './ToolDetection';
import AnchorPointOverlay from './AnchorPointManager';
import type { Detection, AnchorPoint } from '@shared/types';
import { ImageUploadDropzone } from '@/components/ImageUploadDropzone';
import { ImageAnalysisStep } from '@/components/ImageAnalysisStep';
import { httpsCallable, getFunctions } from "firebase/functions";

// Workflow Steps
enum BuilderStep {
    UPLOAD = 0,
    ANALYSIS = 1,
    VERIFICATION = 2,
    ASSIGNMENT = 3
}

const TemplateBuilder: React.FC = () => {
    const [step, setStep] = useState(BuilderStep.UPLOAD);
    const [image, setImage] = useState<string | null>(null);

    // Data State
    const [tools, setTools] = useState<Detection[]>([]);
    const [anchors, setAnchors] = useState<AnchorPoint[]>([]);

    // Editor State
    const [editorMode, setEditorMode] = useState<'tools' | 'anchors'>('tools');
    const [selectedToolIndex, setSelectedToolIndex] = useState<number | null>(null);
    const [selectedAnchorId, setSelectedAnchorId] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Assignment State
    const [selectedDrawer, setSelectedDrawer] = useState('');
    const [templateName, setTemplateName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleImageSelected = (dataUrl: string) => {
        setImage(dataUrl);
        setTools([]);
        setAnchors([]);
        setStep(BuilderStep.ANALYSIS);
    };

    const runAnalysis = async () => {
        if (!image) return;
        setIsAnalyzing(true);
        try {
            const mimeType = image.split(';')[0].split(':')[1] || "image/png";

            const functions = getFunctions();
            const discoverTools = httpsCallable(functions, 'discoverTools');
            const response = await discoverTools({ image: image, mimeType: mimeType });
            const data = response.data as { tools: Detection[] };
            const detectedTools: Detection[] = data.tools || [];

            if (detectedTools.length > 0) {
                setTools(detectedTools);
            } else {
                alert("No tools detected by AI. Please add tools manually.");
            }
        } catch (error: any) {
            console.error("Analysis failed:", error);
            alert(`AI Analysis failed: ${error.message || "Unknown error"}`);
        } finally {
            setIsAnalyzing(false);
            setStep(BuilderStep.VERIFICATION);
            setEditorMode('tools');
        }
    };

    const handleToolUpdated = (index: number, updates: Partial<Detection>) => {
        setTools(prevTools => {
            const updated = [...prevTools];
            updated[index] = { ...updated[index], ...updates };
            return updated;
        });
    };

    const handleAddTool = (x: number = 50, y: number = 50) => {
        const newTool: Detection = {
            name: `New Tool ${tools.length + 1}`,
            toolId: '',
            status: 'present',
            confidence: 1,
            x: x - 5,
            y: y - 5,
            width: 10,
            height: 10,
        };
        setTools([...tools, newTool]);
        setSelectedToolIndex(tools.length);
    };

    const handleAddAnchor = (x: number, y: number) => {
        if (anchors.length >= 4) return;
        const newAnchor: AnchorPoint = {
            id: `anchor-${Date.now()}`,
            x,
            y,
            label: `Point ${anchors.length + 1}`
        };
        setAnchors([...anchors, newAnchor]);
    };

    const handleCanvasClick = (x: number, y: number) => {
        if (editorMode === 'anchors') {
            handleAddAnchor(x, y);
        } else {
            // Deselect tool if clicking empty space
            setSelectedToolIndex(null);
        }
    };

    const handleSaveTemplate = async () => {
        if (!templateName && !selectedDrawer) return;

        setIsSaving(true);

        console.log("Saving Template:", {
            image,
            tools,
            anchors
        });

        setIsSaving(false);
    };

    // --- Render Helpers ---

    const Step: React.FC<{ n: number; label: string; filled: boolean; first: boolean }> = ({ n, label, filled, first }) => (
        <>
            {!first && <div className={`flex-1 h-0.5 mx-4 mb-6 transition-colors duration-300 ${filled ? 'bg-axiom-cyan' : 'bg-gray-200'}`} />}
            <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${filled ? 'bg-axiom-cyan text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {n}
                </div>
                <span className={`text-xs mt-2 font-medium ${filled ? 'text-axiom-cyan' : 'text-gray-400'}`}>{label}</span>
            </div>
        </>
    )

    const StepIndicator = () => (
        <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-12 px-4">
            <Step n={1} filled={step >= 0} label="Upload" first={true} />
            <Step n={2} filled={step >= 1} label="Analysis" first={false} />
            <Step n={3} filled={step >= 2} label="Verify" first={false} />
            <Step n={4} filled={step >= 3} label="Assign" first={false} />
        </div>
    );

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-500 relative space-y-10">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-4xl font-black text-axiom-headingLight dark:text-white">Template Builder</h2>
                    <p className="text-axiom-textLight dark:text-axiom-textDark">Create and configure tool templates.</p>
                </div>
            </div>

            <StepIndicator />

            <div className="flex-1 min-h-0 flex flex-col">
                {step === BuilderStep.UPLOAD && (
                    <ImageUploadDropzone onImageSelected={handleImageSelected} />
                )}

                {step === BuilderStep.ANALYSIS && image && (
                    <ImageAnalysisStep
                        image={image}
                        isAnalyzing={isAnalyzing}
                        onBack={() => setStep(BuilderStep.UPLOAD)}
                        onRunAnalysis={runAnalysis}
                    />
                )}

                {step === BuilderStep.VERIFICATION && (
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
                        {/* LEFT COLUMN: Canvas & Toolbar */}
                        <div className="lg:col-span-3 flex flex-col gap-2">
                            {/* Toolbar */}
                            <div className=" 
                                bg-axiom-surfaceLight dark:bg-axiom-surfaceDark 
                                border border-axiom-borderLight dark:border-axiom-borderDark 
                                rounded-lg p-2 flex justify-between items-center
                            ">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditorMode('tools');
                                            setSelectedAnchorId(null);
                                        }}
                                        className={`p-2 rounded-md text-sm font-medium flex items-center ${editorMode === 'tools' ? 'bg-axiom-cyan text-black' : ''}`}
                                    >
                                        <Edit size={16} className="mr-2" />
                                        Edit Tools
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditorMode('anchors');
                                            setSelectedToolIndex(null);
                                        }}
                                        className={`p-2 rounded-md text-sm font-medium flex items-center ${editorMode === 'anchors' ? 'bg-axiom-cyan text-black' : ''}`}
                                    >
                                        <Anchor size={16} className="mr-2" />
                                        Edit Anchors
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    {editorMode === 'tools' && (
                                        <button
                                            onClick={() => handleAddTool()}
                                            className="p-2 rounded-md text-sm font-medium bg-axiom-cyan text-black flex items-center"
                                        >
                                            <Plus size={16} className="mr-2" />
                                            Add Tool
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Canvas */}
                            <div className="flex-1 rounded-lg relative overflow-hidden flex items-center justify-center">
                                <div className="relative inline-block w-full h-full">
                                    {image && (
                                        <>
                                            <img
                                                src={image}
                                                alt="Workspace"
                                                className="w-full h-full object-contain select-none pointer-events-none"
                                            />

                                            {/* Tool Overlay */}
                                            <ToolDetection
                                                toolPositions={tools}
                                                isEditMode={editorMode === 'tools'}
                                                onCanvasClick={handleCanvasClick}
                                                onToolUpdated={handleToolUpdated}
                                                selectedToolId={selectedToolIndex}
                                                onSelectTool={setSelectedToolIndex}
                                                // Pass dynamic classes to control stacking context. 
                                                // If editing tools, z-20 and interactive. If editing anchors, z-10 and non-interactive.
                                                containerClassName={`absolute inset-0 ${editorMode === 'tools' ? 'z-20 pointer-events-auto' : 'z-10 pointer-events-none opacity-50'}`}
                                            />

                                            {/* Anchor Overlay */}
                                            <AnchorPointOverlay
                                                anchorPoints={anchors}
                                                onAnchorPointsChange={setAnchors}
                                                isEditMode={editorMode === 'anchors'}
                                                onCanvasClick={handleCanvasClick}
                                                selectedAnchorId={selectedAnchorId}
                                                onSelectAnchor={setSelectedAnchorId}
                                                // Pass dynamic classes to control stacking context.
                                                // If editing anchors, z-30 (above tools) and interactive.
                                                className={`${editorMode === 'anchors' ? 'z-30 pointer-events-auto' : 'z-10 pointer-events-none'}`}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className=" 
                                bg-axiom-surfaceLight dark:bg-axiom-surfaceDark 
                                border border-axiom-borderLight dark:border-axiom-borderDark 
                                rounded-lg p-2 flex justify-between items-center
                            ">
                                <span className="text-gray-500 text-sm">
                                    {editorMode === 'tools' ? 'Drag to move/resize tools. Click "Add Tool" to create new.' : 'Click 4 distinct points to serve as anchors.'}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setStep(BuilderStep.UPLOAD)}
                                        className="p-2 text-gray-500 text-sm"
                                    >
                                        Restart
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (anchors.length < 4) {
                                                alert("Please define exactly 4 anchor points before proceeding.");
                                                setEditorMode('anchors');
                                                return;
                                            }
                                            setStep(BuilderStep.ASSIGNMENT);
                                        }}
                                        className="bg-green-600 text-white px-6 py-2 rounded-full text-sm flex items-center justify-center gap-1"
                                    >
                                        Finish Verification
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Properties Panel */}
                        <div className="
                            bg-axiom-surfaceLight dark:bg-axiom-surfaceDark 
                            border border-axiom-borderLight dark:border-axiom-borderDark 
                            rounded-lg p-2 flex flex-col overflow-hidden
                        ">
                            <h3 className="font-bold dark:text-white mb-4 border-b border-gray-700 pb-2">
                                {editorMode === 'tools' ? 'Tool Properties' : 'Anchor Properties'}
                            </h3>

                            <div className="flex-1">
                                {editorMode === 'tools' ? (
                                    selectedToolIndex !== null && tools[selectedToolIndex] ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm mb-2">Name</label>
                                                <input
                                                    type="text"
                                                    value={tools[selectedToolIndex].name}
                                                    onChange={(e) => {
                                                        const upd = [...tools];
                                                        upd[selectedToolIndex].name = e.target.value;
                                                        setTools(upd);
                                                    }}
                                                    className='w-full rounded-lg p-2 text-sm border dark:bg-white/10 dark:border-axiom-borderDark dark:text-white'
                                                />
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const upd = tools.filter((_, i) => i !== selectedToolIndex);
                                                    setTools(upd);
                                                    setSelectedToolIndex(null);
                                                }}
                                                className="w-full text-red-500 border border-red-500 bg-red-500/10 py-2 rounded hover:bg-red-500/20 text-sm"
                                            >
                                                Delete Tool
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wider">
                                                Detected Tools ({tools.length})
                                            </p>
                                            {tools.map((tool, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setSelectedToolIndex(idx)}
                                                    className="group flex items-center justify-between p-3 rounded-lg bg-white dark:bg-axiom-dark border border-gray-500"
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <span className="flex-shrink-0 w-6 h-6 rounded bg-gray-500 text-white text-xs flex items-center justify-center font-mono">
                                                            {idx + 1}
                                                        </span>
                                                        <span className="text-sm">
                                                            {tool.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {tools.length === 0 && (
                                                <div className="text-center py-10 text-gray-500 text-sm">
                                                    No tools yet.
                                                </div>
                                            )}
                                        </div>
                                    )
                                ) : (
                                    <div className="space-y-2">
                                        {anchors.length === 0 && <div className="text-gray-500 text-sm text-center">No anchors defined. </div>}
                                        {anchors.map((anchor, idx) => (
                                            <div
                                                key={anchor.id}
                                                onClick={() => setSelectedAnchorId(anchor.id)}
                                                className={`
                                                    w-full rounded-lg
                                                    ${selectedAnchorId === anchor.id ? ' bg-axiom-cyan' : 'bg-axiom-surfaceLight dark:bg-axiom-surfaceDark'}
                                                `}
                                            >
                                                <div className="flex justify-between items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={anchor.label}
                                                        onChange={(e) => {
                                                            const upd = [...anchors];
                                                            upd[idx].label = e.target.value;
                                                            setAnchors(upd);
                                                        }}
                                                        className='w-full rounded-lg p-2 text-xs border dark:bg-white/10'
                                                        placeholder="Enter label..."
                                                        onClick={(e) => e.stopPropagation()}
                                                    />

                                                    <button
                                                        className="text-gray-500 hover:text-red-500"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setAnchors(anchors.filter(a => a.id !== anchor.id));
                                                        }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                            </div>
                                        ))}
                                        {anchors.length < 4 && anchors.length > 0 && (
                                            <div className="text-gray-500 text-xs text-center">Need {4 - anchors.length} more anchors</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {step === BuilderStep.ASSIGNMENT && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="bg-axiom-surfaceLight dark:bg-axiom-surfaceDark border border-axiom-borderLight dark:border-axiom-borderDark rounded-xl p-8 max-w-md w-full shadow-2xl space-y-6">
                            <h3 className="text-xl font-bold dark:text-white">Save Template</h3>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-500">Template Name</label>
                                <input
                                    type="text"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    placeholder="e.g. B737 Engine Maintenance Kit"
                                    className="w-full border border-gray-500 rounded-lg p-3 focus:border-axiom-cyan "
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-500">Assign to Drawer (Optional)</label>
                                <select
                                    value={selectedDrawer}
                                    onChange={(e) => setSelectedDrawer(e.target.value)}
                                    className="w-full rounded-lg p-3 bg-axiom-surfaceLight dark:bg-axiom-surfaceDark text-black dark:text-white border border-gray-500"
                                >
                                    <option value="">No Assignment (Save to Library)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Total Tools</span>
                                    <span className="text-black dark:text-white">{tools.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Anchors</span>
                                    <span className="text-black dark:text-white">{anchors.length}</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep(BuilderStep.VERIFICATION)}
                                    disabled={isSaving}
                                    className="flex-1 py-3 rounded-lg border border-gray-500 text-black dark:text-white"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSaveTemplate}
                                    disabled={isSaving}
                                    className="flex-1 py-3 rounded-lg bg-axiom-cyan text-black font-bold"
                                >
                                    {isSaving ? (
                                        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></span>
                                    ) : null}
                                    {isSaving ? 'Saving...' : 'Save Template'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TemplateBuilder;
