import type { Detection } from '@shared/types';
import { httpsCallable, getFunctions } from 'firebase/functions';

const functions = getFunctions();

export const FunctionsRepository = {
    /**
     * Calls the 'discoverTools' cloud function to analyze an image for tool templates.
     */
    discoverTools: async (imageDataUrl: string): Promise<{ tools: Detection[] }> => {
        const mimeType = imageDataUrl.split(';')[0].split(':')[1] || 'image/png';

        const discoverTools = httpsCallable(functions, 'discoverTools');
        const result = await discoverTools({ image: imageDataUrl, mimeType: mimeType });
        return result.data as { tools: Detection[] };
    },

    /**
     * Calls the 'createCheckoutSession' cloud function.
     */
    createCheckoutSession: async (orgId: string): Promise<{ url: string }> => {
        const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
        const result = await createCheckoutSession({ orgId });
        return result.data as { url: string };
    },

    /**
     * Calls the 'createPortalSession' cloud function.
     */
    createPortalSession: async (orgId: string): Promise<{ url: string }> => {
        const createPortalSession = httpsCallable(functions, 'createPortalSession');
        const result = await createPortalSession({ orgId });
        return result.data as { url: string };
    },

    /**
     * Calls the 'createAdminAndOrganization' cloud function.
     */
    createAdminAndOrganization: async (displayName: string, organizationName: string): Promise<{ success?: boolean }> => {
        const createAdminAndOrganization = httpsCallable(functions, 'createAdminAndOrganization');
        const result = await createAdminAndOrganization({ displayName, organizationName });
        return result.data as { success?: boolean };
    },

    /**
     * Calls the 'assignTemplateToDrawer' cloud function.
     */
    assignTemplateToDrawer: async (toolboxId: string, drawerId: string, templateId: string): Promise<{ success?: boolean }> => {
        const assignTemplateToDrawer = httpsCallable(functions, 'assignTemplateToDrawer');
        const result = await assignTemplateToDrawer({ toolboxId, drawerId, templateId });
        return result.data as { success?: boolean };
    }
};
