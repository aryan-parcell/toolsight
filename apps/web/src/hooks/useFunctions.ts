import { useState, useCallback } from 'react';
import { FunctionsRepository } from '../repositories/FunctionsRepository';
import type { Detection } from '@shared/types';

export const useFunctions = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const discoverTools = useCallback(async (imageDataUrl: string): Promise<{ tools: Detection[] } | null> => {
        setLoading(true);
        setError(null);
        try {
            const result = await FunctionsRepository.discoverTools(imageDataUrl);
            return result;
        } catch (err: any) {
            const message = err.message || 'Failed to discover tools';
            setError(message);
            console.error('Error in discoverTools:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createCheckoutSession = useCallback(async (orgId: string): Promise<{ url: string } | null> => {
        setLoading(true);
        setError(null);
        try {
            const result = await FunctionsRepository.createCheckoutSession(orgId);
            return result;
        } catch (err: any) {
            const message = err.message || 'Failed to create checkout session';
            setError(message);
            console.error('Error in createCheckoutSession:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createPortalSession = useCallback(async (orgId: string): Promise<{ url: string } | null> => {
        setLoading(true);
        setError(null);
        try {
            const result = await FunctionsRepository.createPortalSession(orgId);
            return result;
        } catch (err: any) {
            const message = err.message || 'Failed to create portal session';
            setError(message);
            console.error('Error in createPortalSession:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        discoverTools,
        createCheckoutSession,
        createPortalSession,
    };
};
