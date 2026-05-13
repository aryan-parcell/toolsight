import type { Invitation } from '@shared/types';
import { doc, onSnapshot, deleteDoc, query, collection, where } from 'firebase/firestore';
import { db } from '../firebase';

export const InvitationRepository = {
    subscribeToOrgInvitations: (
        orgId: string,
        onUpdate: (invitations: Invitation[]) => void,
        onError: (err: Error) => void
    ) => {
        const invitationsQuery = query(
            collection(db, 'invitations'),
            where('organizationId', '==', orgId)
        );

        return onSnapshot(
            invitationsQuery,
            (snapshot) => {
                const invitations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation));
                onUpdate(invitations);
            },
            onError,
        );
    },

    deleteInvitation: async (invitationId: string) => {
        const inviteRef = doc(db, 'invitations', invitationId);
        await deleteDoc(inviteRef);
    }
};
