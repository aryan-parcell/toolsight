import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { User as AuthUser } from 'firebase/auth';
import type { User as AppUser, Organization } from '@shared/types';

interface AuthContextType {
    authUser: AuthUser | null;
    appUser: AppUser | null;
    organization: Organization | null;
    loading: boolean;
    error: string | null;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [appUser, setAppUser] = useState<AppUser | null>(null);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleError = (msg: string, shouldSignOut: boolean = false) => {
        console.error(msg);
        setError(msg);
        setLoading(false);
        if (shouldSignOut) auth.signOut();
    };

    const handleLoggedOutState = () => {
        setAppUser(null);
        setOrganization(null);
        setLoading(false);
    };

    const subscribeToUser = (uid: string) => {
        const userRef = doc(db, 'users', uid);
        return onSnapshot(
            userRef,
            (userDoc) => {
                if (userDoc.exists()) {
                    const userData = userDoc.data() as AppUser;
                    setAppUser(userData);
                } else {
                    handleError('User document not found.', false);
                }
            },
            (err) => handleError(`Error fetching user data: ${err.message}`, false)
        );
    };

    const subscribeToOrganization = (orgId: string) => {
        const orgRef = doc(db, 'organizations', orgId);
        return onSnapshot(
            orgRef,
            (orgDoc) => {
                if (orgDoc.exists()) {
                    const orgData = { id: orgDoc.id, ...orgDoc.data() } as Organization;
                    setOrganization(orgData);
                    setLoading(false);
                } else {
                    handleError('Organization document not found.', false);
                }
            },
            (err) => handleError(`Error fetching org data: ${err.message}`, false)
        );
    };

    // AuthUser & AppUser Subscription
    useEffect(() => {
        let unsubscribeUser: (() => void) | null = null;

        const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
            setAuthUser(currentUser);
            setError(null);

            // Cleanup previous user listener if it exists
            if (unsubscribeUser) {
                unsubscribeUser();
                unsubscribeUser = null;
            }

            if (!currentUser) {
                handleLoggedOutState();
                return;
            }

            // User logged in, subscribe to their user document
            unsubscribeUser = subscribeToUser(currentUser.uid);
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeUser) unsubscribeUser();
        };
    }, []);

    // Organization Subscription
    useEffect(() => {
        if (!appUser) return;
        if (!appUser.organizationId) {
            handleError('User does not have an organizationId.', true);
            return;
        }

        const unsubscribeOrg = subscribeToOrganization(appUser.organizationId);

        return () => unsubscribeOrg();
    }, [appUser]);

    const logout = () => {
        setError(null);
        auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ authUser, appUser, organization, loading, error, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");

    return context;
};
