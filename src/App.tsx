import Dashboard from "./features/Dashboard";
import { useState } from "react";
import Layout from "./components/Layout";
import ToolboxWizard from "./features/ToolboxWizard";
import TemplateBuilder from "./features/TemplateBuilder";
import { Reports } from "./features/Reports";
import { Settings } from "./features/Settings";
import { CalibrationManagement } from "./features/CalibrationManagement";

export enum AppView {
    TOOLBOX_OVERVIEW = 'TOOLBOX_OVERVIEW',
    TOOLBOX_WIZARD = 'TOOLBOX_WIZARD',
    TEMPLATE_BUILDER = 'TEMPLATE_BUILDER',
    CALIBRATION = 'CALIBRATION',
    INVENTORY = 'INVENTORY',
    REPORTS = 'REPORTS',
    SETTINGS = 'SETTINGS',
}

const PlaceholderView = () => (
    <div className="flex flex-col items-center justify-center h-full animate-in fade-in text-center max-w-md mx-auto">
        <h2 className="text-2xl font-bold dark:text-white">Placeholder View</h2>
        <p>This module is currently under development.</p>
    </div>
);

export default function App() {
    const [currentView, setCurrentView] = useState<AppView>(AppView.TOOLBOX_OVERVIEW);

    const renderContent = () => {
        switch (currentView) {
            case AppView.TOOLBOX_OVERVIEW:
                return <Dashboard onNavigate={setCurrentView} />;
            case AppView.TOOLBOX_WIZARD:
                return <ToolboxWizard onNavigate={setCurrentView} />;
            case AppView.TEMPLATE_BUILDER:
                return <TemplateBuilder />;
            case AppView.CALIBRATION:
                return <CalibrationManagement />;
            case AppView.INVENTORY:
                return <PlaceholderView />;
            case AppView.REPORTS:
                return <Reports />;
            case AppView.SETTINGS:
                return <Settings />;
            default:
                return <Dashboard onNavigate={setCurrentView} />;
        }
    };

    return (
        <Layout currentView={currentView} onNavigate={setCurrentView}>
            {renderContent()}
        </Layout>
    );
}
