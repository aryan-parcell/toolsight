
import React, { useState } from 'react';
import { ArrowRight, Trash2, Target, Crosshair } from 'lucide-react';
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
    const [selectedDrawer, setSelectedDrawer] = useState<string>('');

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

    // --- Step 3: Verification (Editor Logic) ---

    const handleToolMoved = (index: number, newX: number, newY: number) => {
        const updated = [...tools];
        updated[index] = { ...updated[index], x: newX, y: newY };
        setTools(updated);
    };

    const handleToolResized = (index: number, w: number, h: number) => {
        const updated = [...tools];
        updated[index] = { ...updated[index], width: w, height: h };
        setTools(updated);
    };

    // const handleToolRotated = (index: number, angle: number) => {
    //     const updated = [...tools];
    //     updated[index] = { ...updated[index], angle };
    //     setTools(updated);
    // };

    // const handleAddTool = (x: number = 50, y: number = 50) => {
    //     const newTool: Detection = {
    //         name: `New Tool ${tools.length + 1}`,
    //         position: 'Unknown',
    //         x: x - 5,
    //         y: y - 5,
    //         width: 10,
    //         height: 10,
    //         status: 'present',
    //         shapeType: 'rectangle'
    //     };
    //     setTools([...tools, newTool]);
    //     setSelectedToolIndex(tools.length);
    // };

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

    // --- Step 4: Assignment ---
    const handleSaveTemplate = () => {
        const action = selectedDrawer ? `assigned to ${selectedDrawer}` : 'saved to library';
        console.log("Saving Template:", {
            drawer: selectedDrawer || 'Unassigned',
            image,
            tools,
            anchors
        });
        alert(`Template Successfully ${selectedDrawer ? 'Saved & Assigned' : 'Saved to Library'}!`);
        // Reset or Navigate away
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

                {/* STEP 3: VERIFICATION (EDITOR) */}
                {step === BuilderStep.VERIFICATION && (
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
                        {/* Main Editor Canvas */}
                        <div className="lg:col-span-3 flex flex-col gap-2">
                            {/* Toolbar moved above canvas */}
                            <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 flex justify-between items-center">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setEditorMode('tools'); setSelectedAnchorId(null); }}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center ${editorMode === 'tools' ? 'bg-axiom-cyan text-black' : 'text-gray-300 hover:bg-white/10'}`}
                                    >
                                        <Crosshair size={16} className="mr-2" />
                                        Edit Tools
                                    </button>
                                    <button
                                        onClick={() => { setEditorMode('anchors'); setSelectedToolIndex(null); }}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center ${editorMode === 'anchors' ? 'bg-axiom-cyan text-black' : 'text-gray-300 hover:bg-white/10'}`}
                                    >
                                        <Target size={16} className="mr-2" />
                                        Edit Anchors
                                    </button>
                                </div>
                                {/* <div className="flex gap-2">
                                    {editorMode === 'tools' && (
                                        <button onClick={() => handleAddTool()} className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 text-sm hover:bg-gray-700 flex items-center">
                                            <Plus size={16} className="mr-1" /> Add Tool
                                        </button>
                                    )}
                                </div> */}
                            </div>

                            {/* Canvas */}
                            <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl relative overflow-hidden flex items-center justify-center">
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
                                                onToolMoved={handleToolMoved}
                                                onToolResized={handleToolResized}
                                                // onToolRotated={handleToolRotated}
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

                            <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg flex justify-between items-center">
                                <span className="text-gray-500 text-sm">
                                    {editorMode === 'tools' ? 'Drag to move/resize tools. Click "Add Tool" to create new.' : 'Click 4 distinct points to serve as anchors.'}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setStep(BuilderStep.UPLOAD)}
                                        className="px-4 py-2 rounded-full font-medium text-gray-400 hover:text-white transition-colors"
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
                                        className="bg-green-600 text-white px-6 py-2 rounded-full font-medium hover:bg-green-500 transition-colors"
                                    >
                                        Finish Verification <ArrowRight size={16} className="inline ml-2" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Properties Panel */}
                        <div className="bg-axiom-surfaceLight dark:bg-axiom-surfaceDark border border-axiom-borderLight dark:border-axiom-borderDark rounded-xl p-4 flex flex-col overflow-hidden">
                            <h3 className="font-bold dark:text-white mb-4 border-b border-gray-700 pb-2">
                                {editorMode === 'tools' ? 'Tool Properties' : 'Anchor Properties'}
                            </h3>

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {editorMode === 'tools' ? (
                                    selectedToolIndex !== null && tools[selectedToolIndex] ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Name</label>
                                                <input
                                                    type="text"
                                                    value={tools[selectedToolIndex].name}
                                                    onChange={(e) => {
                                                        const upd = [...tools];
                                                        upd[selectedToolIndex].name = e.target.value;
                                                        setTools(upd);
                                                    }}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white text-sm"
                                                />
                                            </div>
                                            {/* <div>
                                                <label className="block text-xs text-gray-500 mb-1">Position ID</label>
                                                <input
                                                    type="text"
                                                    value={tools[selectedToolIndex].position}
                                                    onChange={(e) => {
                                                        const upd = [...tools];
                                                        upd[selectedToolIndex].position = e.target.value;
                                                        setTools(upd);
                                                    }}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white text-sm"
                                                />
                                            </div> */}
                                            <button
                                                onClick={() => {
                                                    const upd = tools.filter((_, i) => i !== selectedToolIndex);
                                                    setTools(upd);
                                                    setSelectedToolIndex(null);
                                                }}
                                                className="w-full text-red-500 border border-red-900/50 bg-red-900/10 py-2 rounded hover:bg-red-900/30 text-sm"
                                            >
                                                Delete Tool
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500 py-10 text-sm">Select a tool to edit</div>
                                    )
                                ) : (
                                    <div className="space-y-2">
                                        {anchors.map((anchor, idx) => (
                                            <div key={anchor.id} className={`p-3 rounded border cursor-pointer ${selectedAnchorId === anchor.id ? 'border-axiom-cyan bg-axiom-cyan/10' : 'border-gray-700 bg-gray-800'}`} onClick={() => setSelectedAnchorId(anchor.id)}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold text-sm dark:text-white">Anchor {idx + 1}</span>
                                                    <button onClick={(e) => { e.stopPropagation(); setAnchors(anchors.filter(a => a.id !== anchor.id)); }} className="text-gray-500 hover:text-red-500"><Trash2 size={14} /></button>
                                                </div>
                                                <input
                                                    value={anchor.label}
                                                    onChange={(e) => {
                                                        const upd = [...anchors];
                                                        upd[idx].label = e.target.value;
                                                        setAnchors(upd);
                                                    }}
                                                    className="w-full bg-transparent border-none text-xs text-gray-400 focus:text-white p-0 focus:ring-0"
                                                    placeholder="Enter label..."
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        ))}
                                        {anchors.length === 0 && <div className="text-gray-500 text-sm text-center">No anchors defined. Click image to add.</div>}
                                        {anchors.length < 4 && anchors.length > 0 && (
                                            <div className="text-yellow-500 text-xs text-center mt-2">Need {4 - anchors.length} more anchors</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 4: ASSIGNMENT */}
                {step === BuilderStep.ASSIGNMENT && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="bg-axiom-surfaceLight dark:bg-axiom-surfaceDark border border-axiom-borderLight dark:border-axiom-borderDark rounded-xl p-8 max-w-md w-full shadow-2xl">
                            <h3 className="text-2xl font-bold dark:text-white mb-6">Save Template</h3>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-400 mb-2">Assign to Drawer (Optional)</label>
                                <select
                                    value={selectedDrawer}
                                    onChange={(e) => setSelectedDrawer(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-axiom-cyan"
                                >
                                    <option value="">No Assignment (Save to Library)</option>
                                    <option value="drawer-1">Main Cabinet - Drawer 1</option>
                                    <option value="drawer-2">Main Cabinet - Drawer 2</option>
                                    <option value="cart-1">Mobile Cart - Top Tray</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-2">
                                    Select a drawer to assign immediately, or leave blank to save to Template Inventory.
                                </p>
                            </div>

                            <div className="space-y-2 mb-8 bg-gray-900/50 p-4 rounded-lg">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Total Tools</span>
                                    <span className="text-white font-mono">{tools.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Anchors</span>
                                    <span className="text-white font-mono">{anchors.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Resolution</span>
                                    <span className="text-white font-mono">High Res</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep(BuilderStep.VERIFICATION)}
                                    className="flex-1 py-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-white/5 transition-colors font-medium"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSaveTemplate}
                                    className="flex-1 py-3 rounded-lg bg-axiom-cyan text-black font-bold hover:bg-[#00ccff] transition-colors"
                                >
                                    {selectedDrawer ? 'Save & Assign' : 'Save to Library'}
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
