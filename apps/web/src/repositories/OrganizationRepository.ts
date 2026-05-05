import type { Organization } from '@shared/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const OrganizationRepository = {
    /**
     * Subscribes to an organization document in real-time.
     */
    subscribeToOrganization: (
        orgId: string,
        onUpdate: (org: Organization | null) => void,
        onError: (err: Error) => void
    ) => {
        const orgRef = doc(db, 'organizations', orgId);
        return onSnapshot(
            orgRef,
            (orgDoc) => {
                if (orgDoc.exists()) {
                    const orgData = { id: orgDoc.id, ...orgDoc.data() } as Organization;
                    onUpdate(orgData);
                } else {
                    onUpdate(null);
                }
            },
            onError,
        );
    },
};
