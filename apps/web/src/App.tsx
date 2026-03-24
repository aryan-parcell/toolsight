import Dashboard from "./features/Dashboard";
import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import ToolboxWizard from "./features/ToolboxWizard";
import TemplateBuilder from "./features/TemplateBuilder";
import { Reports } from "./features/Reports";
import { Settings } from "./features/Settings";
import { CalibrationManagement } from "./features/CalibrationManagement";
import { Login } from "./features/Login";
import LandingPage from "./features/LandingPage";
import { auth, db } from "./firebase";
import type { User as AuthUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import TemplateInventory from "./features/TemplateInventory";
import type { Organization, User as AppUser } from "@shared/types";
import { PaymentGate } from "./features/PaymentGate";

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

    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [appUser, setAppUser] = useState<AppUser | null>(null);
    const [organization, setOrganization] = useState<Organization | null>(null);

    const [loading, setLoading] = useState(true);
    const [showAuth, setShowAuth] = useState(false);

    useEffect(() => {
        let unsubscribeDoc: (() => void) | null = null;

        const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
            setAuthUser(currentUser);

            // Cleanup any active user doc listeners if the auth state changes rapidly
            if (unsubscribeDoc) {
                unsubscribeDoc();
                unsubscribeDoc = null;
            }

            if (currentUser) {
                const userRef = doc(db, 'users', currentUser.uid);

                unsubscribeDoc = onSnapshot(userRef, (userDoc) => {
                    if (userDoc.exists()) {
                        const userData = userDoc.data() as AppUser;
                        console.log('User data:', userData);

                        if (!userData.organizationId) {
                            console.error('User does not have an organizationId:', userData);
                            auth.signOut();
                            return;
                        }

                        setAppUser(userData);
                    }
                }, (error) => {
                    console.error('Error fetching user data:', error);
                    setLoading(false);
                });
            } else {
                setAppUser(null);
                setOrganization(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeDoc) unsubscribeDoc();
        };
    }, []);

    useEffect(() => {
        if (!appUser?.organizationId) return;

        const orgRef = doc(db, 'organizations', appUser.organizationId);
        const unsubscribe = onSnapshot(orgRef, (orgDoc) => {
            if (orgDoc.exists()) {
                const orgData = { id: orgDoc.id, ...orgDoc.data() } as Organization;
                console.log('Organization data:', orgData);

                setOrganization(orgData);

                // Once we have evaluated the org document, we are done loading the core app state
                setLoading(false);
            }
        }, (error) => {
            console.error('Error fetching org data:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [appUser?.organizationId]);

    const renderContent = () => {
        const orgId = appUser?.organizationId ?? '';

        switch (currentView) {
            case AppView.TOOLBOX_OVERVIEW:
                return <Dashboard onNavigate={setCurrentView} orgId={orgId!} />;
            case AppView.TOOLBOX_WIZARD:
                return <ToolboxWizard onNavigate={setCurrentView} orgId={orgId!} />;
            case AppView.TEMPLATE_BUILDER:
                return <TemplateBuilder orgId={orgId!} />;
            case AppView.CALIBRATION:
                return <CalibrationManagement />;
            case AppView.INVENTORY:
                return <TemplateInventory orgId={orgId!} />;
            case AppView.REPORTS:
                return <Reports />;
            case AppView.SETTINGS:
                return <Settings orgId={orgId!} />;
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
            ) : authUser && appUser && organization ? (
                organization.subscriptionStatus !== 'active' ? (
                    <PaymentGate orgId={organization.id} orgName={organization.name} />
                ) : (
                    // Logged In Flow (Active Subscription)
                    <Layout currentView={currentView} user={appUser} onNavigate={setCurrentView}>
                        {renderContent()}
                    </Layout>
                )
            ) : showAuth ? (
                // Auth Flow (Login / Sign Up)
                <Login onLoginSuccess={() => setAuthUser(auth.currentUser)} onBack={() => setShowAuth(false)} />
            ) : (
                // Default Public Flow
                <LandingPage onLogin={() => setShowAuth(true)} />
            )}
        </>
    );
}