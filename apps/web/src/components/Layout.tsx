import React, { useEffect, useState } from 'react';
import {
    LayoutGrid,
    Settings,
    Menu,
    X,
    LogOut,
    Package,
    FileText,
    Sun,
    Moon,
    Hammer
} from 'lucide-react';
import { AppView } from '../App';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const ParcellLogo = () => (
    <svg width="32" height="32" viewBox="0 0 1113.57 1295.11" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-axiom-headingLight dark:text-white">
        <g transform="translate(-91.34 -216.37)">
            <path d="M648.14,1050.6c183.38,0,350.48,70.73,475.71,186.23l81.06-46.82C1061.72,1048.36,865,960.71,648.14,960.71S234.55,1048.36,91.34,1190l81.08,46.81C297.64,1121.33,464.76,1050.6,648.14,1050.6Z" fill="currentColor" />
            <path d="M648.14,1234.15A516,516,0,0,1,954.49,1334.6l83.81-48.39c-105.72-88.54-241.8-142-390.16-142s-284.46,53.42-390.18,142l83.82,48.39A516,516,0,0,1,648.14,1234.15Z" fill="currentColor" />
            <path d="M841.63,1399.76a403,403,0,0,0-387,0l193.5,111.72Z" fill="currentColor" />
            <path d="M172.94,1089.27V584.32L648.13,310l475.2,274.34v504.95a802.08,802.08,0,0,1,78.21,67.16h2.86V537.51L648.13,216.37,91.86,537.51v618.92h2.88A800.79,800.79,0,0,1,172.94,1089.27Z" fill="currentColor" />
            <path d="M648.14,930.31a787.27,787.27,0,0,1,441.91,135.16v-462L648.13,347.14V930.31Z" fill="currentColor" />
        </g>
    </svg>
);

const ParcellHeader = () => (
    <div className="flex items-center py-3">
        <div className="mr-3">
            <ParcellLogo />
        </div>
        <div className="text-xl font-bold text-axiom-headingLight dark:text-white">
            Parcell <span className="text-axiom-cyan">ToolSight</span>
        </div>
    </div>
);

const getInitialTheme = (): boolean => {
    if (typeof window === "undefined") return false;

    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

interface LayoutProps {
    children: React.ReactNode;
    currentView: AppView;
    onNavigate: (view: AppView) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate }) => {
    const [isDark, setIsDark] = useState(getInitialTheme());
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // State for user profile
    const [displayName, setDisplayName] = useState<string>('Loading...');
    const [userInitials, setUserInitials] = useState<string>('...');
    const [orgName, setOrgName] = useState<string>('Loading...');

    const toggleTheme = () => setIsDark((d) => !d);

    useEffect(() => {
        const fetchUserProfile = async () => {
            const user = auth.currentUser;
            if (user) {
                try {
                    const userRef = doc(db, 'users', user.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        const name = userData.displayName || user.email || 'Admin User';
                        setDisplayName(name);

                        const initials = name
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .toUpperCase()
                            .substring(0, 2);
                        setUserInitials(initials);

                        if (userData.organizationId) {
                            const orgRef = doc(db, 'organizations', userData.organizationId);
                            const orgSnap = await getDoc(orgRef);
                            if (orgSnap.exists()) {
                                setOrgName(orgSnap.data().name);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    setDisplayName("Error Loading");
                }
            }
        };

        fetchUserProfile();
    }, []);

    useEffect(() => {
        const html = document.documentElement;

        html.classList.toggle("dark", isDark);
        html.classList.toggle("light", !isDark);
        localStorage.setItem("theme", isDark ? "dark" : "light");
    }, [isDark]);

    const NavItem = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => (
        <button
            onClick={() => {
                onNavigate(view);
                setIsMobileMenuOpen(false);
            }}
            className={`
                flex items-center w-full px-3 py-3 my-3 rounded-full transition-all duration-200 font-medium text-axiom-dark dark:text-axiom-light 
                ${currentView === view ? 'bg-axiom-cyan/20' : 'hover:bg-axiom-borderLight dark:hover:bg-axiom-surfaceDark'}
            `}
        >
            <Icon className="mr-3" />
            {label}
        </button>
    );

    const NavItems = () => (
        <div className="flex flex-col">
            <NavItem view={AppView.TOOLBOX_OVERVIEW} icon={LayoutGrid} label="Toolbox Overview" />
            {/* <NavItem view={AppView.SHADOWBOARD} icon={Layers} label="Shadowboard" /> */}
            <NavItem view={AppView.TEMPLATE_BUILDER} icon={Hammer} label="Template Builder" />
            <NavItem view={AppView.INVENTORY} icon={Package} label="Template Inventory" />
            {/* <NavItem view={AppView.AUDIT_SCHEDULING} icon={Calendar} label="Audit Scheduling" /> */}
            {/* <NavItem view={AppView.CALIBRATION} icon={Target} label="Calibration" /> */}
            <NavItem view={AppView.REPORTS} icon={FileText} label="Reports" />
            <NavItem view={AppView.SETTINGS} icon={Settings} label="Settings" />
        </div>
    );

    return (
        <div className="min-h-screen bg-axiom-light dark:bg-axiom-dark text-axiom-textLight dark:text-axiom-textDark font-sans transition-colors duration-300 flex">

            {/* Sidebar - Desktop */}
            <div className="hidden lg:flex flex-col w-72 bg-axiom-surfaceLight dark:bg-axiom-dark p-6 fixed h-full z-30">
                <ParcellHeader />

                <NavItems />

                <div className="mt-auto pt-6 border-t border-axiom-borderLight dark:border-axiom-borderDark">
                    {/* Theme Toggle */}
                    <div className="flex items-center px-3 py-3 gap-3">
                        <div className="w-full flex items-center font-bold">Theme</div>
                        <button onClick={toggleTheme} className="ml-auto opacity-50 hover:opacity-100">
                            {isDark ? <Sun /> : <Moon />}
                        </button>
                    </div>

                    {/* User Profile */}
                    <div className="flex items-center px-3 py-3 gap-3">
                        <div className="w-full flex items-center hover:bg-axiom-borderLight dark:hover:bg-axiom-surfaceDark">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-700 text-white">{userInitials}</div>
                            <div className="ml-3">
                                <div className="font-bold text-axiom-dark dark:text-white">{displayName}</div>
                                <div className="text-xs opacity-70">{orgName}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => signOut(auth)}
                            className="ml-auto opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                            title="Sign out"
                        >
                            <LogOut />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between fixed top-0 left-0 right-0 h-16 px-6 z-30 bg-axiom-surfaceLight dark:bg-axiom-surfaceDark border-b">
                <ParcellHeader />

                <div className="flex items-center gap-4">
                    <button onClick={toggleTheme}>
                        {isDark ? <Sun /> : <Moon />}
                    </button>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 bg-axiom-surfaceLight dark:bg-axiom-dark px-6 py-20 z-20">
                    <NavItems />
                </div>
            )}

            {/* Main Content */}
            <div className="px-6 py-20 w-full h-full lg:ml-72 lg:pt-6 ">
                {children}
            </div>
        </div>
    );
};

export default Layout;
