import type { Audit } from '@shared/types';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export const AuditRepository = {
    /**
     * Subscribes to audits for a specific toolbox.
     */
    subscribeToToolboxAudits: (
        orgId: string,
        toolboxId: string,
        onUpdate: (audits: Audit[]) => void,
        onError: (err: Error) => void
    ) => {
        const q = query(
            collection(db, 'audits'),
            where('organizationId', '==', orgId),
            where('toolboxId', '==', toolboxId),
            orderBy('startTime', 'desc')
        );

        return onSnapshot(
            q,
            (snapshot) => {
                const audits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Audit));
                onUpdate(audits);
            },
            onError,
        );
    },
};
