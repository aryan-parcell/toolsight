import { useState, useEffect } from 'react';
import { ToolboxRepository } from '../repositories/ToolboxRepository';
import type { ToolBox } from '@shared/types';

export function useToolboxes(orgId: string | undefined) {
    const [toolboxes, setToolboxes] = useState<ToolBox[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // If there's no orgId, clear the state and stop loading
        if (!orgId) {
            setToolboxes([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // Set up the real-time listener via the repository
        const unsubscribe = ToolboxRepository.subscribeToOrgToolboxes(
            orgId, 
            (data) => {
                setToolboxes(data);
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching toolboxes:", err);
                setError(err.message);
                setLoading(false);
            }
        );

        // Cleanup listener on unmount
        return () => unsubscribe();
    }, [orgId]);

    const createToolbox = async (orgId: string, toolboxId: string, data: Omit<ToolBox, 'id'>) => {
        try {
            await ToolboxRepository.createToolbox(orgId, toolboxId, data);
        } catch (err) {
            console.error("Error creating toolbox:", err);
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    const updateToolbox = async (id: string, data: Partial<ToolBox>) => {
        try {
            await ToolboxRepository.updateToolbox(id, data);
        } catch (err) {
            console.error("Error updating toolbox:", err);
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    const deleteToolbox = async (id: string) => {
        try {
            await ToolboxRepository.deleteToolbox(id);
        } catch (err) {
            console.error("Error deleting toolbox:", err);
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    return {
        toolboxes,
        loading,
        error,
        createToolbox,
        updateToolbox,
        deleteToolbox
    };
}