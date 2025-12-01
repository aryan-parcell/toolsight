import React, { useState, useEffect } from 'react';
import { Plus, User } from 'lucide-react';
import { AppView } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import type { ToolBox } from '@/types';

interface DashboardProps {
    onNavigate: (view: AppView) => void;
}

const ToolboxCard: React.FC<ToolBox> = (toolbox) => {
    const { id, name, drawers, tools, status } = toolbox;

    const statusColor = status === 'available' ? "bg-green-500" : "bg-yellow-500";
    const drawerCount = drawers?.length || 0;
    const toolCount = tools?.length || 0;

    return (
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