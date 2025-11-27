import React from 'react';
import { Plus, User } from 'lucide-react';
import { AppView } from '../App';

interface DashboardProps {
    onNavigate: (view: AppView) => void;
}

const toolboxes = [
    { name: 'Service Bay 3 Roller Cabinet', status: 'setup_complete', label: 'Setup Complete' },
    { name: 'Mobile Technician Cart', status: 'setup_complete', label: 'Setup Complete' },
    { name: 'Main Workshop Wall', status: 'setup_complete', label: 'Setup Complete' },
    { name: 'Inspection Bench Drawer', status: 'calibration_pending', label: 'Calibration Pending' },
    { name: 'Field Service Kit #1', status: 'setup_complete', label: 'Setup Complete' },
    { name: 'CNC Machine Cabinet', status: 'calibration_pending', label: 'Calibration Pending' },
];

interface ToolboxCardProps {
    name: string;
    status: string;
    label: string;
}

const ToolboxCard: React.FC<ToolboxCardProps> = ({ name, status, label }) => {
    const statusColor = status === 'setup_complete' ? 'bg-green-500' : 'bg-yellow-500';
    const statusText = status === 'setup_complete' ? 'text-green-600' : 'text-yellow-600';

    return (
        <div className="bg-axiom-surfaceLight dark:bg-axiom-surfaceDark border border-axiom-borderLight dark:border-axiom-borderDark p-6 rounded-lg hover:border-axiom-cyan/50 transition-all duration-300 cursor-pointer group">
            <h3 className="text-base font-medium text-axiom-headingLight dark:text-white group-hover:text-axiom-cyan transition-colors">{name}</h3>
            <div className="flex items-center gap-2 mt-2">
                <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
                <span className={`text-sm ${statusText} dark:text-opacity-90`}>{label}</span>
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-4xl font-black text-axiom-headingLight dark:text-white tracking-tight mb-1">Toolbox Overview</h2>
                    <p className="text-axiom-textLight dark:text-gray-400">An overview of all your tracked tool inventories.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onNavigate(AppView.TOOLBOX_WIZARD)}
                        className="bg-axiom-cyan text-black px-6 py-3 rounded-full font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={20} />
                        Add New Toolbox
                    </button>
                    <button className="w-12 h-12 rounded-full bg-axiom-surfaceLight dark:bg-axiom-surfaceDark border border-axiom-borderLight dark:border-axiom-borderDark flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                        <User size={20} className="text-axiom-textLight dark:text-gray-400" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {toolboxes.map((tb, idx) => (
                    <ToolboxCard key={idx} name={tb.name} status={tb.status} label={tb.label} />
                ))}
            </div>
        </div>
    );
};

export default Dashboard;