import React from 'react';
import { Plus, User } from 'lucide-react';
import { AppView } from '../App';
import { toolboxes } from '../data/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardProps {
    onNavigate: (view: AppView) => void;
}

interface ToolboxCardProps {
    id: string;
    name: string;
    numDrawers: number;
    numTools: number;
    status: string;
    currentUserId: string | null;
    currentCheckoutId: string | null;
    lastAuditId: string | null;
}

const ToolboxCard: React.FC<ToolboxCardProps> = ({ id, name, numDrawers, numTools, status }) => {
    const statusColor = status === 'available' ? "bg-green-500" : "bg-yellow-500";

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
                    <div>{numDrawers}</div>
                </div>
                <div className="flex justify-between items-center">
                    <div># Tools</div>
                    <div>{numTools}</div>
                </div>
            </CardContent>
        </Card>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {toolboxes.map((tb, idx) => (
                    <ToolboxCard key={idx} id={tb.id} name={tb.name} numDrawers={tb.drawers.length} numTools={tb.tools.length} status={tb.status} currentUserId={tb.currentUserId} currentCheckoutId={tb.currentCheckoutId} lastAuditId={tb.lastAuditId} />
                ))}
            </div>
        </div>
    );
};

export default Dashboard;