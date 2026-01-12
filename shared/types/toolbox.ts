export interface Drawer {
  drawerId: string;
  drawerName: string;
}

export interface Tool {
  toolId: string;
  drawerId: string;
  toolName: string;
}

export interface AuditProfile {
  requireOnCheckout: boolean;
  requireOnReturn: boolean;
  shiftAuditType: "periodic" | "at-will" | string;

  // Only relevant if shiftAuditType == 'periodic'
  periodicFrequencyHours: number;
}

export interface ToolBox {
  id?: string;
  name: string;
  organization_id: string;
  drawers: Drawer[];
  tools: Tool[];
  type: string;
  foamColors: {
    primary: string;
    secondary: string;
  };
  auditProfile: AuditProfile;
  lastAuditId: string | null;

  // Denormalized Fields
  status: "maintenance" | "available" | "checked_out" | string;
  currentUserId: string | null;
  currentCheckoutId: string | null;
}
