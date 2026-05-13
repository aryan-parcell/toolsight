import { useState, useEffect } from 'react';
import { InvitationRepository } from '../repositories/InvitationRepository';
import type { Invitation } from '@shared/types';

export function useInvitations(orgId: string | undefined) {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!orgId) {
            setInvitations([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const unsubscribe = InvitationRepository.subscribeToOrgInvitations(
            orgId,
            (data) => {
                setInvitations(data);
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching invitations:", err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [orgId]);

    const deleteInvitation = async (invitationId: string) => {
        try {
            await InvitationRepository.deleteInvitation(invitationId);
        } catch (err: any) {
            console.error("Error deleting invitation:", err);
            setError(err.message);
        }
    };

    return { invitations, loading, error, deleteInvitation };
}
