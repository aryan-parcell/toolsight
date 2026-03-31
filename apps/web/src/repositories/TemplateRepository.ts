import { collection, doc, query, where, onSnapshot, getDoc, setDoc, deleteDoc, getDocs, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import type { Template, ToolBox, ToolInfo } from '@shared/types';

export const TemplateRepository = {
    /**
     * Subscribes to all templates for a specific organization in real-time.
     */
    subscribeToOrgTemplates: (
        orgId: string,
        onUpdate: (templates: Template[]) => void,
        onError: (err: Error) => void
    ) => {
        return onSnapshot(
            query(collection(db, 'templates'), where('organizationId', '==', orgId)),
            (snapshot) => {
                const templates = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Template));
                onUpdate(templates);
            },
            onError
        );
    },

    /**
     * Fetches a single template by ID.
     */
    getTemplate: async (templateId: string): Promise<Template | null> => {
        const docRef = doc(db, 'templates', templateId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Template;
        }
        return null;
    },

    /**
     * Creates a new template, including uploading the image to Storage.
     */
    createTemplate: async (orgId: string, name: string, imageDataUrl: string, tools: ToolInfo[]): Promise<string> => {
        const templateId = `${name}-${Date.now()}`;
        const storagePath = `organizations/${orgId}/templates/${templateId}.jpg`;
        const storageRef = ref(storage, storagePath);

        // Upload image
        await uploadString(storageRef, imageDataUrl, 'data_url');
        const downloadUrl = await getDownloadURL(storageRef);

        // Save metadata
        const templateData: Template = {
            name: name,
            organizationId: orgId,
            storagePath: storagePath,
            imageUrl: downloadUrl,
            tools: tools,
        };

        await setDoc(doc(db, 'templates', templateId), templateData);
        return templateId;
    },

    /**
     * Deletes a template, its image, and unlinks it from all toolboxes in the organization.
     */
    deleteTemplate: async (orgId: string, templateId: string): Promise<void> => {
        // 1. Find all toolboxes that might contain this template and unlink it
        const q = query(collection(db, 'toolboxes'), where('organizationId', '==', orgId));
        const snapshot = await getDocs(q);

        const updatePromises = snapshot.docs.map(async (docSnap) => {
            const toolbox = docSnap.data() as ToolBox;
            let needsUpdate = false;

            const updatedDrawers = toolbox.drawers.map(d => {
                if (d.templateId === templateId) {
                    needsUpdate = true;
                    const { templateId, ...rest } = d;
                    return rest;
                }
                return d;
            });

            if (needsUpdate) {
                return updateDoc(doc(db, 'toolboxes', docSnap.id), {
                    drawers: updatedDrawers
                });
            }
        });

        await Promise.all(updatePromises);

        // 2. Delete template image and document
        const templateRef = doc(db, 'templates', templateId);
        const templateSnap = await getDoc(templateRef);

        if (templateSnap.exists()) {
            const data = templateSnap.data() as Template;
            if (data.storagePath) {
                const imageRef = ref(storage, data.storagePath);
                await deleteObject(imageRef).catch(err => console.warn("Failed to delete image", err));
            }
        }

        await deleteDoc(templateRef);
    }
};
