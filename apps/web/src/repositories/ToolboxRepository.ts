import { collection, doc, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import type { ToolBox, DrawerState, Drawer, Tool } from '@shared/types';

const createInitialAuditFromToolbox = (tb: ToolBox) => {
    // Use drawer and tool data to create initial audit state
    const drawerStates: Record<string, DrawerState> = {};
    tb.drawers.forEach((drawer: Drawer) => {
        drawerStates[drawer.drawerId] = {
            drawerStatus: "user-validated",
            imageStoragePath: null,
            results: {}
        };
    });
    tb.tools.forEach((tool: Tool) => {
        drawerStates[tool.drawerId].results![tool.toolId] = {
            toolId: tool.toolId,
            status: "present",
            confidence: 1,
            toolInfo: tool.toolInfo,
        };
    });

    return {
        organizationId: tb.organizationId,
        checkoutId: null,
        startTime: serverTimestamp(),
        endTime: serverTimestamp(),
        drawerStates: drawerStates,
    };
}

export const ToolboxRepository = {
    /**
     * Subscribes to all toolboxes for a specific organization in real-time.
     */
    subscribeToOrgToolboxes: (
        orgId: string,
        onUpdate: (toolboxes: ToolBox[]) => void,
        onError: (err: Error) => void
    ) => {
        return onSnapshot(
            query(collection(db, 'toolboxes'), where('organizationId', '==', orgId)),
            (snapshot) => {
                const toolboxes = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as ToolBox));
                onUpdate(toolboxes);
            },
            onError
        );
    },

    /**
     * Creates a new toolbox
     */
    createToolbox: async (toolboxId: string, data: Omit<ToolBox, 'id'>) => {
        // Create an initial audit document that captures the starting state of the toolbox.
        const initialAudit = createInitialAuditFromToolbox(data);

        const batch = writeBatch(db);

        const newToolboxRef = doc(db, 'toolboxes', toolboxId);
        const newAuditRef = doc(collection(db, 'audits'));

        // Link the toolbox to its initial audit
        data.lastAuditId = newAuditRef.id;

        batch.set(newAuditRef, initialAudit);
        batch.set(newToolboxRef, data);

        await batch.commit();
    },

    /**
     * Updates an existing toolbox
     */
    updateToolbox: async (toolboxId: string, data: Partial<ToolBox>) => {
        const ref = doc(db, 'toolboxes', toolboxId);
        await updateDoc(ref, data);
    },

    /**
     * Deletes a toolbox
     */
    deleteToolbox: async (toolboxId: string) => {
        const ref = doc(db, 'toolboxes', toolboxId);
        await deleteDoc(ref);
    }
};