import { useState, useEffect } from 'react';
import { UserRepository } from '../repositories/UserRepository';
import type { User as AppUser } from '@shared/types';

export function useUsers(orgId: string | undefined) {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!orgId) {
            setUsers([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const unsubscribe = UserRepository.subscribeToOrgUsers(
            orgId,
            (data) => {
                setUsers(data);
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching users:", err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [orgId]);

    return { users, loading, error };
}
