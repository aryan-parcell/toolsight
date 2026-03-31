import type { User as AppUser } from '@shared/types';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const UserRepository = {
    /**
     * Subscribes to a user document in real-time.
     */
    subscribeToUser: (
        uid: string,
        onUpdate: (user: AppUser | null) => void,
        onError: (err: Error) => void
    ) => {
        const userRef = doc(db, 'users', uid);
        return onSnapshot(
            userRef,
            (userDoc) => {
                if (userDoc.exists()) {
                    const userData = userDoc.data() as AppUser;
                    onUpdate(userData);
                } else {
                    onUpdate(null);
                }
            },
            onError,
        );
    },

    /**
     * Creates or updates a user document.
     */
    setUser: async (uid: string, data: AppUser) => {
        const userRef = doc(db, 'users', uid);
        return await setDoc(userRef, data);
    }
};
