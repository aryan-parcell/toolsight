
import React, { useState, useRef } from 'react';
import { Upload, Save, Scan, ArrowRight, Trash2, Target, Crosshair, Plus, Image as ImageIcon, Camera, X } from 'lucide-react';
import ToolDetection from './ToolDetection';
import AnchorPointOverlay from './AnchorPointManager';
import type { Detection, AnchorPoint } from '@shared/types';

// Workflow Steps
enum BuilderStep {
    UPLOAD = 0,
    ANALYSIS = 1,
    VERIFICATION = 2,
    ASSIGNMENT = 3
}

const TemplateBuilder: React.FC = () => {
    const [currentStep, setCurrentStep] = useState<BuilderStep>(BuilderStep.UPLOAD);
    const [image, setImage] = useState<string | null>(null);

    // Data State
    const [tools, setTools] = useState<Detection[]>([]);
    const [anchors, setAnchors] = useState<AnchorPoint[]>([]);

    // Editor State
    const [editorMode, setEditorMode] = useState<'tools' | 'anchors'>('tools');
    const [selectedToolIndex, setSelectedToolIndex] = useState<number | null>(null);
    const [selectedAnchorId, setSelectedAnchorId] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const [showCamera, setShowCamera] = useState(false);

    // Assignment State
    const [selectedDrawer, setSelectedDrawer] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // --- Step 1: Upload ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setImage(ev.target?.result as string);
                setTools([]);
                setAnchors([]);
                setCurrentStep(BuilderStep.ANALYSIS);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingFile(true);
    };

    const handleDragLeave = () => {
        setIsDraggingFile(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingFile(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setImage(ev.target?.result as string);
                setTools([]);
                setAnchors([]);
                setCurrentStep(BuilderStep.ANALYSIS);
            };
            reader.readAsDataURL(file);
        }
    };

    const startCamera = async () => {
        setShowCamera(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera");
            setShowCamera(false);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const video = videoRef.current;
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg');

            // Stop stream
            const stream = video.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());

            setImage(dataUrl);
            setShowCamera(false);
            setTools([]);
            setAnchors([]);
            setCurrentStep(BuilderStep.ANALYSIS);
        }
    };

    const closeCamera = () => {
        if (videoRef.current) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
        }
        setShowCamera(false);
    };

    // --- Step 2: Analysis (Actual Gemini) ---
    const runAnalysis = async () => {
        if (!image) return;
        setIsAnalyzing(true);
        try {
            // Call robust Gemini utility
            // const detectedTools = await analyzeToolImage(image);
            const detectedTools: Detection[] = []; // Placeholder for Gemini response

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
            setCurrentStep(BuilderStep.VERIFICATION);
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

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-8 space-x-4">
            {[
                { id: BuilderStep.UPLOAD, icon: Upload, label: "Upload" },
                { id: BuilderStep.ANALYSIS, icon: Scan, label: "Analyze" },
                { id: BuilderStep.VERIFICATION, icon: Target, label: "Verify" },
                { id: BuilderStep.ASSIGNMENT, icon: Save, label: "Assign" }
            ].map((s, idx) => (
                <div key={s.id} className="flex items-center">
                    <div className={`flex flex-col items-center ${currentStep === s.id ? 'text-axiom-cyan' : currentStep > s.id ? 'text-green-500' : 'text-gray-500'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep === s.id ? 'border-axiom-cyan bg-axiom-cyan/10' : currentStep > s.id ? 'border-green-500 bg-green-500/10' : 'border-gray-600 bg-gray-800'}`}>
                            <s.icon size={18} />
                        </div>
                        <span className="text-xs mt-2 font-medium">{s.label}</span>
                    </div>
                    {idx < 3 && <div className={`w-12 h-0.5 mx-2 ${currentStep > s.id ? 'bg-green-500' : 'bg-gray-700'}`} />}
                </div>
            ))}
        </div>
    );

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-500 relative">
            {/* Camera Overlay */}
            {showCamera && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
                    <div className="relative w-full max-w-4xl aspect-video bg-gray-900">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <button
                            onClick={closeCamera}
                            className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/80"
                        >
                            <X size={24} />
                        </button>
                        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                            <button
                                onClick={capturePhoto}
                                className="w-20 h-20 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 flex items-center justify-center"
                            >
                                <div className="w-16 h-16 rounded-full bg-white"></div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <h2 className="text-3xl font-bold text-axiom-headingLight dark:text-white tracking-tight">Template Builder</h2>
                <p className="text-axiom-textLight dark:text-gray-400">Create and configure tool templates.</p>
            </div>

            {renderStepIndicator()}

            <div className="flex-1 min-h-0 flex flex-col">
                {/* STEP 1: UPLOAD */}
                {currentStep === BuilderStep.UPLOAD && (
                    <div className="flex-1 flex flex-col gap-6">
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`flex-1 flex flex-col items-center justify-center bg-axiom-surfaceLight dark:bg-axiom-surfaceDark border-2 border-dashed rounded-xl p-12 transition-colors ${isDraggingFile ? 'border-axiom-cyan bg-axiom-cyan/5' : 'border-axiom-borderLight dark:border-axiom-borderDark'}`}
                        >
                            <div className="w-24 h-24 bg-axiom-borderLight dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <ImageIcon size={48} className="text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold dark:text-white mb-2">Upload Reference Image</h3>
                            <p className="text-gray-500 mb-8 max-w-md text-center">
                                Drag & Drop an image here, or use one of the options below.
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-axiom-cyan text-black px-8 py-4 rounded-full font-bold hover:bg-[#00ccff] transition-colors shadow-lg hover:shadow-axiom-cyan/20 flex items-center gap-2"
                                >
                                    <Upload size={20} />
                                    Select File
                                </button>
                                <button
                                    onClick={startCamera}
                                    className="bg-gray-800 text-white border border-gray-700 px-8 py-4 rounded-full font-bold hover:bg-gray-700 transition-colors shadow-lg flex items-center gap-2"
                                >
                                    <Camera size={20} />
                                    Use Camera
                                </button>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                    </div>
                )}

                {/* STEP 2: ANALYSIS */}
                {currentStep === BuilderStep.ANALYSIS && (
                    <div className="flex-1 flex flex-col items-center justify-center bg-axiom-surfaceLight dark:bg-axiom-surfaceDark border border-axiom-borderLight dark:border-axiom-borderDark rounded-xl relative overflow-hidden">
                        {image && <img src={image} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm" />}
                        <div className="relative z-10 flex flex-col items-center">
                            {isAnalyzing ? (
                                <>
                                    <div className="w-20 h-20 border-4 border-axiom-cyan border-t-transparent rounded-full animate-spin mb-6"></div>
                                    <h3 className="text-2xl font-bold dark:text-white animate-pulse">Analyzing Image...</h3>
                                    <p className="text-gray-400 mt-2">Detecting tools and features via Gemini AI</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-24 h-24 bg-axiom-cyan/10 rounded-full flex items-center justify-center mb-6 text-axiom-cyan">
                                        <Scan size={48} />
                                    </div>
                                    <h3 className="text-xl font-bold dark:text-white mb-6">Image Loaded</h3>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setCurrentStep(BuilderStep.UPLOAD)}
                                            className="px-8 py-4 rounded-full font-bold text-gray-400 hover:text-white transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={runAnalysis}
                                            className="bg-axiom-cyan text-black px-10 py-4 rounded-full font-bold hover:bg-[#00ccff] transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(0,229,255,0.3)]"
                                        >
                                            Run AI Detection
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 3: VERIFICATION (EDITOR) */}
                {currentStep === BuilderStep.VERIFICATION && (
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
                                        onClick={() => setCurrentStep(BuilderStep.UPLOAD)}
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
                                            setCurrentStep(BuilderStep.ASSIGNMENT);
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
                {currentStep === BuilderStep.ASSIGNMENT && (
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
                                    onClick={() => setCurrentStep(BuilderStep.VERIFICATION)}
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
