import { useState } from "react";
import Layout from "./components/Layout";
import { useAuth } from "./contexts/AuthContext";
import { CalibrationManagement } from "./features/CalibrationManagement";
import Dashboard from "./features/Dashboard";
import LandingPage from "./features/LandingPage";
import { Login } from "./features/Login";
import { PaymentGate } from "./features/PaymentGate";
import { Reports } from "./features/Reports";
import Settings from "./features/Settings";
import TemplateBuilder from "./features/TemplateBuilder";
import TemplateInventory from "./features/TemplateInventory";
import ToolboxWizard from "./features/ToolboxWizard";

export enum AppView {
    TOOLBOX_OVERVIEW = 'TOOLBOX_OVERVIEW',
    TOOLBOX_WIZARD = 'TOOLBOX_WIZARD',
    SHADOWBOARD = 'SHADOWBOARD',
    AUDIT_SCHEDULING = 'AUDIT_SCHEDULING',
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
    const { authUser, appUser, organization, loading } = useAuth();

    const [currentView, setCurrentView] = useState<AppView>(AppView.TOOLBOX_OVERVIEW);
    const [showAuth, setShowAuth] = useState(false);

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
                return <TemplateInventory />;
            case AppView.REPORTS:
                return <Reports />;
            case AppView.SETTINGS:
                return <Settings />;
            default:
                return <Dashboard onNavigate={setCurrentView} />;
        }
    };

    return (
        <>
            {loading ? (
                <div className="min-h-screen flex items-center justify-center bg-axiom-light dark:bg-axiom-dark">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-axiom-cyan"></div>
                </div>
            ) : authUser && appUser && organization ? (
                organization.subscriptionStatus !== 'active' ? (
                    <PaymentGate orgId={organization.id} orgName={organization.name} />
                ) : (
                    // Logged In Flow (Active Subscription)
                    <Layout currentView={currentView} onNavigate={setCurrentView}>
                        {renderContent()}
                    </Layout>
                )
            ) : showAuth ? (
                // Auth Flow (Login / Sign Up)
                <Login onBack={() => setShowAuth(false)} />
            ) : (
                // Default Public Flow
                <LandingPage onLogin={() => setShowAuth(true)} />
            )}
        </>
    );
}