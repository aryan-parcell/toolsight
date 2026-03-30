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
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [appUser, setAppUser] = useState<AppUser | null>(null);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeDoc: (() => void) | null = null;

        const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
            setAuthUser(currentUser);

            if (unsubscribeDoc) {
                unsubscribeDoc();
                unsubscribeDoc = null;
            }

            if (currentUser) {
                const userRef = doc(db, 'users', currentUser.uid);
                unsubscribeDoc = onSnapshot(userRef, (userDoc) => {
                    if (userDoc.exists()) {
                        const userData = userDoc.data() as AppUser;
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
                setOrganization(orgData);
                setLoading(false);
            }
        }, (error) => {
            console.error('Error fetching org data:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [appUser?.organizationId]);

    const logout = () => auth.signOut();

    return (
        <AuthContext.Provider value={{ authUser, appUser, organization, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");

    return context;
};
