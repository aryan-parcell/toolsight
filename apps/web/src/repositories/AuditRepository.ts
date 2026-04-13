import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import type { Audit } from '@shared/types';

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

    /**
     * Gets the download URL for an audit image.
     */
    getAuditImageUrl: async (storagePath: string) => {
        const imageRef = ref(storage, storagePath);
        return await getDownloadURL(imageRef);
    }
};
