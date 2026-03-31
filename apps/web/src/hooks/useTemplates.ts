import { useState, useEffect } from 'react';
import { TemplateRepository } from '../repositories/TemplateRepository';
import type { Template, ToolInfo } from '@shared/types';

export function useTemplates(orgId: string | undefined) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // If there's no orgId, clear the state and stop loading
        if (!orgId) {
            setTemplates([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // Set up the real-time listener via the repository
        const unsubscribe = TemplateRepository.subscribeToOrgTemplates(
            orgId, 
            (data) => {
                setTemplates(data);
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching templates:", err);
                setError(err.message);
                setLoading(false);
            }
        );

        // Cleanup listener on unmount
        return () => unsubscribe();
    }, [orgId]);

    const createTemplate = async (orgId: string, name: string, imageDataUrl: string, tools: ToolInfo[]) => {
        try {
            await TemplateRepository.createTemplate(orgId, name, imageDataUrl, tools);
        } catch (err) {
            console.error("Error creating template:", err);
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    const deleteTemplate = async (orgId: string, templateId: string) => {
        try {
            await TemplateRepository.deleteTemplate(orgId, templateId);
        } catch (err) {
            console.error("Error deleting template:", err);
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    const getTemplate = async (templateId: string) => {
        try {
            return await TemplateRepository.getTemplate(templateId);
        } catch (err) {
            console.error("Error fetching template:", err);
            setError(err instanceof Error ? err.message : String(err));
            return null;
        }
    }

    return {
        templates,
        loading,
        error,
        createTemplate,
        deleteTemplate,
        getTemplate
    };
}
