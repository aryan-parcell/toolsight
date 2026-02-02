import Dashboard from "./features/Dashboard";
import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import ToolboxWizard from "./features/ToolboxWizard";
import TemplateBuilder from "./features/TemplateBuilder";
import { Reports } from "./features/Reports";
import { Settings } from "./features/Settings";
import { CalibrationManagement } from "./features/CalibrationManagement";
import { ShadowboardSetup } from "./features/Shadowboard";
import { AuditScheduling } from "./features/AuditScheduling";
import { Login } from "./features/Login";
import { auth, db } from "./firebase";
import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import type { User as AppUser } from "@shared/types/user";

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
    const [currentView, setCurrentView] = useState<AppView>(AppView.TOOLBOX_OVERVIEW);
    const [user, setUser] = useState<User | null>(null);
    const [orgId, setOrgId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                try {
                    const user = await getDoc(doc(db, 'users', currentUser.uid));
                    if (user.exists()) {
                        const userData = user.data() as AppUser;
                        console.log('User data:', userData);
                        setOrgId(userData.organizationId);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            } else {
                setOrgId(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const renderContent = () => {
        switch (currentView) {
            case AppView.TOOLBOX_OVERVIEW:
                return <Dashboard onNavigate={setCurrentView} orgId={orgId!} />;
            case AppView.TOOLBOX_WIZARD:
                return <ToolboxWizard onNavigate={setCurrentView} orgId={orgId!} />;
            case AppView.SHADOWBOARD:
                return <ShadowboardSetup />;
            case AppView.TEMPLATE_BUILDER:
                return <TemplateBuilder />;
            case AppView.AUDIT_SCHEDULING:
                return <AuditScheduling />;
            case AppView.CALIBRATION:
                return <CalibrationManagement />;
            case AppView.INVENTORY:
                return <PlaceholderView />;
            case AppView.REPORTS:
                return <Reports />;
            case AppView.SETTINGS:
                return <Settings />;
            default:
                return <Dashboard onNavigate={setCurrentView} orgId={orgId!} />;
        }
    };

    return (
        <>
            {loading ? (
                <div className="min-h-screen flex items-center justify-center bg-axiom-light dark:bg-axiom-dark">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-axiom-cyan"></div>
                </div>
            ) : user ? (
                <Layout currentView={currentView} onNavigate={setCurrentView}>
                    {renderContent()}
                </Layout>
            ) : (
                <Login onLoginSuccess={() => setUser(auth.currentUser)} />
            )}
        </>
    );
}
