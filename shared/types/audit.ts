import type { Detection } from "./detection";

export type AuditDrawerStatus = 
    | 'pending' 
    | 'ai-completed' 
    | 'ai-failed' 
    | 'user-validated';

export interface DrawerState {
    drawerStatus: AuditDrawerStatus;
    imageStoragePath: string | null;
    results: Record<string, Detection> | null;
}

export interface Audit {
    id?: string;
    checkoutId: string | null;
    startTime: Date;
    endTime: Date | null;
    drawerStates: Record<string, DrawerState>;

    // Denormalized User/Toolbox Info
    organizationId: string;
    toolboxId: string;
}
