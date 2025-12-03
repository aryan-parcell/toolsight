import React, { useState, useEffect } from 'react';
import { Plus, User } from 'lucide-react';
import { AppView } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { db } from '../firebase';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import type { ToolBox } from '@/types';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { Input } from '@/components/ui/input';

interface DashboardProps {
    onNavigate: (view: AppView) => void;
}

const AutosaveInput: React.FC<{
    value: string;
    onSave: (val: string) => void;
    placeholder?: string;
}> = ({ value: initialValue, onSave, placeholder }) => {
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


const ToolboxCard: React.FC<ToolBox> = (toolbox) => {
    const { id, name, drawers, tools, status } = toolbox;

    const toolboxRef = doc(db, 'toolboxes', id as string);

    const statusColor = status === 'available' ? "bg-green-500" : "bg-yellow-500";
    const drawerCount = drawers?.length || 0;
    const toolCount = tools?.length || 0;

    const handleUpdateToolboxName = async (newName: string) => {
        if (newName.trim().length === 0) return;

        try {
            await updateDoc(toolboxRef, { name: newName });
        } catch (error) {
            console.error("Error updating toolbox name:", error);
        }
    };

    const handleUpdateToolName = async (toolId: string, newName: string) => {
        if (newName.trim().length === 0) return;

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

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Card className="bg-axiom-surfaceLight dark:bg-axiom-surfaceDark border border-axiom-borderLight dark:border-axiom-borderDark rounded-lg hover:border-axiom-cyan/50 transition-all duration-300 cursor-pointer group">
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
            </DialogTrigger>
            <DialogContent
                className="bg-axiom-surfaceLight dark:bg-axiom-surfaceDark rounded-lg p-6 max-h-[85vh] overflow-y-auto w-full"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogTitle className="text-xl font-bold dark:text-white">Edit Toolbox</DialogTitle>

                <div className="space-y-5">
                    <div className="flex justify-between items-center bg-gray-200 dark:bg-gray-700 p-5 rounded-lg">
                        <label className="w-full font-medium text-axiom-textLight dark:text-axiom-textDark">Toolbox Name</label>
                        <AutosaveInput
                            value={name}
                            onSave={handleUpdateToolboxName}
                        />
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700" />

                    {drawers?.map((drawer, index) => {
                        const drawerTools = tools?.filter(tool => tool.drawerId === drawer.drawerId) || [];

                        return (
                            <div key={index} className="bg-gray-200 dark:bg-gray-700 mt-5 p-5 space-y-5 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-axiom-textLight dark:text-axiom-textDark">{drawer.drawerName}</h4>
                                    <span className="text-xs text-gray-400">{drawerTools.length} items</span>
                                </div>

                                <div className="space-y-2 pl-2">
                                    {drawerTools.length > 0 ? (
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
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
    const [toolboxes, setToolboxes] = useState<ToolBox[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const toolboxesRef = collection(db, 'toolboxes');

        const unsubscribe = onSnapshot(toolboxesRef, (snapshot) => {
            const tbs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ToolBox));
            setToolboxes(tbs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching toolboxes: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

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