import { useState, useEffect } from 'react';
import { CheckoutRepository } from '../repositories/CheckoutRepository';
import { AuditRepository } from '../repositories/AuditRepository';
import type { Audit, Checkout } from '@shared/types';
import { useAuth } from '@/contexts/AuthContext';

export function useToolboxHistory(toolboxId: string | undefined) {
    const { organization } = useAuth();

    const [checkouts, setCheckouts] = useState<Checkout[]>([]);
    const [checkoutsLoaded, setCheckoutsLoaded] = useState(false);

    const [audits, setAudits] = useState<Audit[]>([]);
    const [auditsLoaded, setAuditsLoaded] = useState(false);

    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!toolboxId || !organization?.id) {
            setCheckouts([]);
            setCheckoutsLoaded(true);

            setAudits([]);
            setAuditsLoaded(true);

            setError(null);
            return;
        }

        setCheckoutsLoaded(false);
        setAuditsLoaded(false);
        setError(null);

        const unsubscribeCheckouts = CheckoutRepository.subscribeToToolboxCheckouts(
            organization!.id,
            toolboxId,
            (data) => {
                setCheckouts(data);
                setCheckoutsLoaded(true);
            },
            (err) => {
                console.error("Error fetching checkouts:", err);
                setError(err);
                setCheckoutsLoaded(true);
            }
        );

        const unsubscribeAudits = AuditRepository.subscribeToToolboxAudits(
            organization!.id,
            toolboxId,
            (data) => {
                setAudits(data);
                setAuditsLoaded(true);
            },
            (err) => {
                console.error("Error fetching audits:", err);
                setError(err);
                setAuditsLoaded(true);
            }
        );

        return () => {
            unsubscribeCheckouts();
            unsubscribeAudits();
        };
    }, [toolboxId, organization?.id]);

    const loading = !(checkoutsLoaded && auditsLoaded);

    return { checkouts, audits, loading, error };
}
