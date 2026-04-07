import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { Checkout } from '@shared/types';

export const CheckoutRepository = {
    /**
     * Subscribes to checkouts for a specific toolbox.
     */
    subscribeToToolboxCheckouts: (
        orgId: string,
        toolboxId: string,
        onUpdate: (checkouts: Checkout[]) => void,
        onError: (err: Error) => void
    ) => {
        const q = query(
            collection(db, 'checkouts'),
            where('organizationId', '==', orgId),
            where('toolboxId', '==', toolboxId),
            orderBy('checkoutTime', 'desc')
        );

        return onSnapshot(
            q,
            (snapshot) => {
                const checkouts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Checkout));
                onUpdate(checkouts);
            },
            onError,
        );
    }
};
