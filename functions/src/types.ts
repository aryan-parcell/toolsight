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

export interface Detection {
  name: string;
  toolId: string;
  status: "present" | "absent" | "unserviceable";
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AuditToolStatus = "present" | "absent" | "unserviceable";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VisualDetection {
  name: string;
  confidence: number;
  boundingBox: BoundingBox;
}

export interface Template {
  id: string;
  name: string;
  imageUrl: string;
  tools: BoundingBox[];
  createdAt: string;
}
