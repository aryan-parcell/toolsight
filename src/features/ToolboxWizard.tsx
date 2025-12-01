import React, { useState } from 'react';
import { ChevronRight, Settings, ChevronLeft, ChevronDown } from 'lucide-react';
import { AppView } from '../types';

interface ToolboxWizardProps {
    onNavigate: (view: AppView) => void;
}

const foamColors = [
    { name: 'Black', value: 'Black', hex: '#18181B' },
    { name: 'Red', value: 'Red', hex: '#DC2626' },
    { name: 'Blue', value: 'Blue', hex: '#2563EB' },
    { name: 'Grey', value: 'Grey', hex: '#4B5563' },
    { name: 'Yellow', value: 'Yellow', hex: '#CA8A04' },
];

const ToolboxWizard: React.FC<ToolboxWizardProps> = ({ onNavigate }) => {
    const [step, setStep] = useState(1);
    const [activeDrawer, setActiveDrawer] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        eid: '',
        type: 'Rolling Tool Cart',
        primaryColor: 'Black',
        secondaryColor: 'Red',
        drawers: 5,
        toolCounts: Array(5).fill(0),
    });

    const nextStep = () => setStep(s => Math.min(s + 1, 3));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const handleCreate = () => {
        console.log("Creating toolbox:", formData);

        onNavigate(AppView.TOOLBOX_OVERVIEW);
    };

    const updateToolCount = (drawerIndex: number, count: number) => {
        const newCounts = [...formData.toolCounts];
        newCounts[drawerIndex] = count;
        setFormData({ ...formData, toolCounts: newCounts });
    };

    const getHexColor = (colorName: string) => {
        return foamColors.find(c => c.value === colorName)?.hex || '#000000';
    };

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
            <Step n={1} filled={step >= 1} label="Basic Info" first={true} />
            <Step n={2} filled={step >= 2} label="Configuration" first={false} />
            <Step n={3} filled={step >= 3} label="Review" first={false} />
        </div>
    );

    return (
        <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 bg-axiom-surfaceLight dark:bg-axiom-surfaceDark rounded-xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-8">
                <div className="p-2 bg-axiom-cyan/10 rounded-full text-axiom-cyan">
                    <Settings />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-axiom-headingLight dark:text-white tracking-tight">Create New Toolbox</h2>
                    <p className="text-axiom-textLight dark:text-axiom-textDark">Set up a new toolbox for inventory management</p>
                </div>
            </div>

            <StepIndicator />

            <div className="min-h-[250px]">

                {/* Step 1: Basic Info */}
                {step === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        <div>
                            <label className="block mb-2">Toolbox Type</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full rounded-lg p-4 border transition-all dark:bg-black/20 dark:border-axiom-borderDark dark:text-white appearance-none cursor-pointer"
                            >
                                <option>Rolling Tool Cart</option>
                                <option>Dispatchable Toolbox</option>
                                <option>Handheld Toolbox</option>
                            </select>
                        </div>

                        <div>
                            <label className="block mb-2">Toolbox Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full rounded-lg p-4 border transition-all dark:bg-black/20 dark:border-axiom-borderDark dark:text-white "
                                placeholder="e.g., Main Repair Kit"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block mb-2">Equipment ID (EID)</label>
                            <input
                                type="text"
                                value={formData.eid}
                                onChange={e => setFormData({ ...formData, eid: e.target.value })}
                                className="w-full rounded-lg p-4 border transition-all dark:bg-black/20 dark:border-axiom-borderDark dark:text-white "
                                placeholder="Enter Equipment ID"
                            />
                        </div>

                    </div>
                )}

                {/* Step 2: Configuration */}
                {step === 2 && (
                    <div className="space-y-8">

                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <label className="">Number of Drawers</label>
                                <span className="dark:text-white">{formData.drawers}</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={formData.drawers}
                                onChange={e => setFormData({ ...formData, drawers: parseInt(e.target.value) })}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-axiom-cyan"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block mb-2">Primary Foam Color</label>
                                <div className="relative z-20">

                                    <select
                                        value={formData.primaryColor}
                                        onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                                        className="w-full rounded-lg p-4 border transition-all dark:bg-black/20 dark:border-axiom-borderDark dark:text-white appearance-none cursor-pointer"
                                    >
                                        {foamColors.map(c => (
                                            <option key={c.value} value={c.value} className="text-black bg-white">{c.name}</option>
                                        ))}
                                    </select>


                                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getHexColor(formData.primaryColor) }}></div>
                                        <ChevronDown className="text-gray-400" size={16} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2">Secondary Foam Color</label>
                                <div className="relative z-20">
                                    <select
                                        value={formData.secondaryColor}
                                        onChange={e => setFormData({ ...formData, secondaryColor: e.target.value })}
                                        className="w-full rounded-lg p-4 border transition-all dark:bg-black/20 dark:border-axiom-borderDark dark:text-white appearance-none cursor-pointer"
                                    >
                                        {foamColors.map(c => (
                                            <option key={c.value} value={c.value} className="text-black bg-white">{c.name}</option>
                                        ))}
                                    </select>

                                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getHexColor(formData.secondaryColor) }}></div>
                                        <ChevronDown className="text-gray-400" size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tool Count Configuration */}
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <p className="mb-4">Configure the approximate number of tools per drawer.</p>

                            {/* Drawer Tabs */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {Array.from({ length: formData.drawers }).map((_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setActiveDrawer(i)}
                                        className={`px-3 py-1.5 rounded-md transition-colors ${activeDrawer === i
                                            ? 'bg-axiom-cyan text-white'
                                            : ' dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        Drawer {i + 1}
                                    </button>
                                ))}
                            </div>

                            {/* Selected Drawer Config */}
                            <div className="bg-gray-50 dark:bg-black/20 rounded-lg p-6 border border-axiom-borderLight dark:border-axiom-borderDark">

                                <div className="flex justify-between items-center mb-4">
                                    <label className="">Tools in Drawer {activeDrawer + 1}</label>
                                    <span className="dark:text-white">{formData.toolCounts[activeDrawer] || 0}</span>
                                </div>

                                <input
                                    type="range"
                                    min="0"
                                    max="25"
                                    value={formData.toolCounts[activeDrawer] || 0}
                                    onChange={e => updateToolCount(activeDrawer, parseInt(e.target.value))}
                                    className="w-full h-2 mb-6 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-axiom-cyan"
                                />

                                <div
                                    className="rounded-lg p-4 min-h-[120px] flex items-center justify-center border border-gray-300 dark:border-gray-700 transition-colors duration-300"
                                    style={{ backgroundColor: getHexColor(formData.primaryColor) }}
                                >
                                    {formData.toolCounts[activeDrawer] > 0 ? (
                                        <div className="flex flex-wrap gap-1 justify-center max-w-full">
                                            {Array.from({ length: formData.toolCounts[activeDrawer] }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="w-2 h-4 rounded-[1px]"
                                                    style={{ backgroundColor: getHexColor(formData.secondaryColor) }}
                                                ></div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-white/50 text-sm italic">No tools configured for this drawer</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* Step 3: Review */}
                {step === 3 && (
                    <div className="space-y-10 animate-in fade-in">


                        <div className="bg-gray-50 dark:bg-black/20 rounded-lg p-6 border border-axiom-borderLight dark:border-axiom-borderDark grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-gray-400 text-sm">Type</p>
                                <p className="dark:text-white">{formData.type}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Name</p>
                                <p className="dark:text-white">{formData.name}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">EID</p>
                                <p className="dark:text-white">{formData.eid}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Drawers</p>
                                <p className="dark:text-white">{formData.drawers}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Primary Color</p>
                                <div className="inline-flex items-center gap-2">
                                    <div className="w-3 h-3 border border-gray-500" style={{ backgroundColor: getHexColor(formData.primaryColor) }}></div>
                                    <p className="dark:text-white">{formData.primaryColor}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Secondary Color</p>
                                <div className="inline-flex items-center gap-2">
                                    <div className="w-3 h-3 border border-gray-500" style={{ backgroundColor: getHexColor(formData.secondaryColor) }}></div>
                                    <p className="dark:text-white">{formData.secondaryColor}</p>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-gray-400 text-sm mb-2">Tool Configuration</p>
                                <div className="grid grid-cols-5 gap-2">
                                    {Array.from({ length: formData.drawers }).map((_, idx) => (
                                        <div key={idx} className="text-center p-2 rounded-md bg-gray-200 dark:bg-gray-700">
                                            <div className="text-[10px] dark:text-white">Drawer {idx + 1}</div>
                                            <div className="font-bold dark:text-white">{formData.toolCounts[idx]} Tools</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-6 flex justify-between items-center">
                <button
                    type="button"
                    onClick={prevStep}
                    disabled={step === 1}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                    <ChevronLeft />
                    Previous
                </button>
                <button
                    type="button"
                    onClick={step === 3 ? handleCreate : nextStep}
                    disabled={formData.name.trim().length === 0 || formData.eid.trim().length === 0}
                    className="flex items-center gap-3 p-3 rounded-lg bg-axiom-cyan text-black font-bold hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                    {step === 3 ? 'Create Toolbox' : 'Next'}
                    {step !== 3 && <ChevronRight />}
                </button>
            </div>
        </div>
    );
};

export default ToolboxWizard;