import React, { useState } from 'react';
import { ChevronRight, Check, Box, Layers, Settings, ChevronLeft } from 'lucide-react';
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
    drawers: 5,
    primaryColor: 'Black',
    secondaryColor: 'Red',
    toolCounts: Array(10).fill(10) // Initialize with default 10 tools per drawer
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleCreate = () => {
    // In a real application, you would save the data here
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

  const StepIndicator = () => (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-12 px-4">
      <div className="flex flex-col items-center relative z-10">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= 1 ? 'bg-axiom-cyan text-white' : 'bg-gray-200 text-gray-500'}`}>
            {step > 1 ? <Check size={16} /> : '1'}
        </div>
        <span className={`text-xs mt-2 font-medium ${step >= 1 ? 'text-axiom-cyan' : 'text-gray-400'}`}>Basic Info</span>
      </div>
      <div className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${step >= 2 ? 'bg-axiom-cyan' : 'bg-gray-200'}`} />
      
      <div className="flex flex-col items-center relative z-10">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= 2 ? 'bg-axiom-cyan text-white' : 'bg-gray-200 text-gray-500'}`}>
             {step > 2 ? <Check size={16} /> : '2'}
        </div>
        <span className={`text-xs mt-2 font-medium ${step >= 2 ? 'text-axiom-cyan' : 'text-gray-400'}`}>Configuration</span>
      </div>
      <div className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${step >= 3 ? 'bg-axiom-cyan' : 'bg-gray-200'}`} />

      <div className="flex flex-col items-center relative z-10">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= 3 ? 'bg-axiom-cyan text-white' : 'bg-gray-200 text-gray-500'}`}>
            3
        </div>
        <span className={`text-xs mt-2 font-medium ${step >= 3 ? 'text-axiom-cyan' : 'text-gray-400'}`}>Review</span>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white dark:bg-axiom-surfaceDark rounded-xl shadow-lg p-8 md:p-12 mb-20">
        <div className="flex items-start gap-4 mb-8">
            <div className="p-2 bg-axiom-cyan/10 rounded-full text-axiom-cyan">
                <Settings size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-axiom-headingLight dark:text-white tracking-tight">Create New Toolbox</h2>
                <p className="text-axiom-textLight dark:text-gray-400">Set up a new toolbox for inventory management</p>
            </div>
        </div>

        <StepIndicator />

        <div className="min-h-[400px]">
            
            {/* Step 1: Basic Info */}
            {step === 1 && (
                <div className="space-y-8 animate-in fade-in">
                    <h3 className="text-lg font-bold text-axiom-cyan border-b border-gray-100 dark:border-gray-800 pb-2">
                        Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Toolbox Type</label>
                            <div className="relative">
                                <select 
                                    value={formData.type}
                                    onChange={e => setFormData({...formData, type: e.target.value})}
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-axiom-borderDark rounded-lg px-4 py-4 text-axiom-headingLight dark:text-white focus:ring-2 focus:ring-axiom-cyan focus:border-transparent outline-none transition-all appearance-none"
                                >
                                    <option>Rolling Tool Cart</option>
                                    <option>Dispatchable Toolbox</option>
                                    <option>Handheld Toolbox</option>
                                </select>
                                <Box className="absolute right-4 top-4 text-gray-400 pointer-events-none" size={20} />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Mobile toolbox with wheels</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Toolbox Name</label>
                            <input 
                                type="text" 
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-axiom-borderDark rounded-lg px-4 py-4 text-axiom-headingLight dark:text-white focus:ring-2 focus:ring-axiom-cyan focus:border-transparent outline-none transition-all"
                                placeholder="e.g., Main Repair Kit"
                            />
                            <p className="text-xs text-gray-500 mt-2">A descriptive name for this toolbox</p>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Equipment ID (EID)</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={formData.eid}
                                    onChange={e => setFormData({...formData, eid: e.target.value})}
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-axiom-borderDark rounded-lg px-4 py-4 text-axiom-headingLight dark:text-white focus:ring-2 focus:ring-axiom-cyan focus:border-transparent outline-none transition-all"
                                    placeholder="Enter equipment ID"
                                />
                                <div className="absolute right-4 top-4">
                                    {/* QR icon placeholder */}
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Unique identifier for this toolbox</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Configuration */}
            {step === 2 && (
                <div className="space-y-8 animate-in fade-in">
                    <h3 className="text-lg font-bold text-axiom-cyan border-b border-gray-100 dark:border-gray-800 pb-2">
                        Configuration
                    </h3>
                    
                    <div>
                        <div className="flex justify-between items-center mb-4">
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Number of Drawers</label>
                             <span className="font-bold text-xl dark:text-white">{formData.drawers}</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" 
                            max="10" 
                            value={formData.drawers} 
                            onChange={e => setFormData({...formData, drawers: parseInt(e.target.value)})}
                            className="w-full h-2 bg-gray-200 dark:bg-axiom-borderDark rounded-lg appearance-none cursor-pointer accent-axiom-cyan"
                        />
                        <p className="text-xs text-gray-500 mt-2">Select the number of drawers in your toolbox</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Primary Foam Color</label>
                            <div className="relative z-20">
                                <select 
                                    value={formData.primaryColor}
                                    onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-axiom-borderDark rounded-lg px-4 py-3 text-axiom-headingLight dark:text-white focus:ring-2 focus:ring-axiom-cyan focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                                >
                                    {foamColors.map(c => (
                                        <option key={c.value} value={c.value} className="text-black bg-white">{c.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: getHexColor(formData.primaryColor) }}></div>
                                    <ChevronRight className="text-gray-400 rotate-90" size={16} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Secondary Foam Color</label>
                            <div className="relative z-20">
                                <select 
                                    value={formData.secondaryColor}
                                    onChange={e => setFormData({...formData, secondaryColor: e.target.value})}
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-axiom-borderDark rounded-lg px-4 py-3 text-axiom-headingLight dark:text-white focus:ring-2 focus:ring-axiom-cyan focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                                >
                                    {foamColors.map(c => (
                                        <option key={c.value} value={c.value} className="text-black bg-white">{c.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: getHexColor(formData.secondaryColor) }}></div>
                                    <ChevronRight className="text-gray-400 rotate-90" size={16} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tool Count Configuration */}
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h4 className="text-md font-bold text-axiom-headingLight dark:text-white mb-4">Tool Configuration</h4>
                        <p className="text-sm text-gray-500 mb-4">Configure the approximate number of tools per drawer.</p>
                        
                        {/* Drawer Tabs */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {Array.from({ length: formData.drawers }).map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setActiveDrawer(i)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                                        activeDrawer === i 
                                        ? 'bg-axiom-cyan text-black border-axiom-cyan' 
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    Drawer {i + 1}
                                </button>
                            ))}
                        </div>

                        {/* Selected Drawer Config */}
                        <div className="bg-gray-50 dark:bg-black/20 rounded-lg p-6 border border-gray-200 dark:border-axiom-borderDark">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Tools in Drawer {activeDrawer + 1}
                                </label>
                                <span className="font-bold text-2xl text-axiom-cyan">{formData.toolCounts[activeDrawer] || 0}</span>
                            </div>
                            
                            <input 
                                type="range" 
                                min="0" 
                                max="50" 
                                value={formData.toolCounts[activeDrawer] || 0}
                                onChange={e => updateToolCount(activeDrawer, parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 dark:bg-axiom-borderDark rounded-lg appearance-none cursor-pointer accent-axiom-cyan mb-6"
                            />
                            
                            <div 
                                className="rounded-lg p-4 min-h-[120px] flex items-center justify-center border border-gray-300 dark:border-gray-800 transition-colors duration-300"
                                style={{ backgroundColor: getHexColor(formData.primaryColor) }}
                            >
                                {formData.toolCounts[activeDrawer] > 0 ? (
                                    <div className="flex flex-wrap gap-1 justify-center max-w-full">
                                         {Array.from({ length: Math.min(formData.toolCounts[activeDrawer] || 0, 50) }).map((_, i) => (
                                             <div 
                                                key={i} 
                                                className="w-2 h-4 rounded-[1px] shadow-sm"
                                                style={{ backgroundColor: getHexColor(formData.secondaryColor) }}
                                             ></div>
                                         ))}
                                         {formData.toolCounts[activeDrawer] > 50 && (
                                             <span className="text-xs text-white bg-black/50 px-1 rounded self-center ml-2">+{formData.toolCounts[activeDrawer] - 50} more</span>
                                         )}
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
                <div className="space-y-8 animate-in fade-in">
                    <h3 className="text-lg font-bold text-axiom-cyan border-b border-gray-100 dark:border-gray-800 pb-2">
                        Review & Create
                    </h3>
                    
                    <div className="bg-gray-900 rounded-xl p-6 text-white grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <p className="text-gray-400 text-sm">Type</p>
                            <div className="inline-block bg-gray-700 rounded px-2 py-1 text-sm">{formData.type}</div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-gray-400 text-sm">Name</p>
                            <p className="font-medium">{formData.name || 'Untitled'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-gray-400 text-sm">EID</p>
                            <p className="font-medium font-mono">{formData.eid || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-gray-400 text-sm">Drawers</p>
                            <p className="font-medium text-axiom-cyan">{formData.drawers}</p>
                        </div>
                        <div className="space-y-1">
                             <p className="text-gray-400 text-sm">Primary Color</p>
                             <div className="inline-flex items-center gap-2">
                                <div className="w-3 h-3 border border-gray-500" style={{ backgroundColor: getHexColor(formData.primaryColor) }}></div> {formData.primaryColor}
                             </div>
                        </div>
                        <div className="space-y-1">
                             <p className="text-gray-400 text-sm">Secondary Color</p>
                             <div className="inline-flex items-center gap-2">
                                <div className="w-3 h-3 border border-gray-500" style={{ backgroundColor: getHexColor(formData.secondaryColor) }}></div> {formData.secondaryColor}
                             </div>
                        </div>
                        <div className="md:col-span-2 space-y-1 border-t border-gray-700 pt-4 mt-2">
                             <p className="text-gray-400 text-sm mb-2">Tool Configuration</p>
                             <div className="grid grid-cols-5 gap-2">
                                {Array.from({ length: formData.drawers }).map((_, idx) => (
                                    <div key={idx} className="text-center bg-gray-800 p-2 rounded-md border border-gray-700">
                                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">Drawer {idx + 1}</div>
                                        <div className="font-bold text-axiom-cyan">{formData.toolCounts[idx]}</div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Capture Reference Image (Optional)</h4>
                        <p className="text-sm text-gray-500 mb-4">Capture a reference image of your toolbox to make it easier to identify later.</p>
                        <button type="button" className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg py-8 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <span className="material-icons-outlined mb-2">photo_camera</span>
                            Capture Image
                        </button>
                    </div>
                </div>
            )}
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center z-50 relative">
            <button 
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
                <ChevronLeft size={18} />
                Previous
            </button>
            <button 
                type="button"
                onClick={step === 3 ? handleCreate : nextStep}
                className="flex items-center gap-2 bg-axiom-cyan text-black px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity shadow-lg z-50 cursor-pointer"
            >
                {step === 3 ? 'Create Toolbox' : 'Next'}
                {step !== 3 && <ChevronRight size={18} />}
            </button>
        </div>
    </div>
  );
};

export default ToolboxWizard;