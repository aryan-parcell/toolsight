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

    const createAdminAndOrganization = useCallback(async (displayName: string, organizationName: string): Promise<{ success?: boolean } | null> => {
        setLoading(true);
        setError(null);
        try {
            const result = await FunctionsRepository.createAdminAndOrganization(displayName, organizationName);
            return result;
        } catch (err: any) {
            const message = err.message || 'Failed to create admin and organization';
            setError(message);
            console.error('Error in createAdminAndOrganization:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const assignTemplateToDrawer = useCallback(async (toolboxId: string, drawerId: string, templateId: string): Promise<{ success?: boolean } | null> => {
        setLoading(true);
        setError(null);
        try {
            const result = await FunctionsRepository.assignTemplateToDrawer(toolboxId, drawerId, templateId);
            return result;
        } catch (err: any) {
            const message = err.message || 'Failed to assign template to drawer';
            setError(message);
            console.error('Error in assignTemplateToDrawer:', err);
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
        createAdminAndOrganization,
        assignTemplateToDrawer,
    };
};
