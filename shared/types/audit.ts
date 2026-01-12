export type AuditToolStatus = "present" | "absent" | "unserviceable";

export type AuditDrawerStatus = 'pending' | 'ai-completed' | 'user-validated';

export interface DrawerState {
    drawerStatus: AuditDrawerStatus;
    imageStoragePath: string | null;
    results: Record<string, AuditToolStatus> | null;
}

export interface Audit {
    id?: string;
    checkoutId: string | null;
    startTime: Date;
    endTime: Date | null;
    drawerStates: Record<string, DrawerState>;
}
