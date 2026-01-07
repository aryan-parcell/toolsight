import type { Timestamp } from "firebase/firestore";

export interface Drawer {
  drawerId: string;
  drawerName: string;
}

export interface Tool {
  toolId: string;
  drawerId: string;
  toolName: string;
}

export interface ToolBox {
  id?: string;
  name: string;
  organization_id: string;
  drawers: Drawer[];
  tools: Tool[];
  status: 'maintenance' | 'available' | 'checked_out' | string;
  currentUserId: string | null;
  currentCheckoutId: string | null;
  lastAuditId: string | null;
  type: string;
  auditFrequencyInHours: number;
  foamColors: {
    primary: string;
    secondary: string;
  };
}

export type ToolPresence = 'present' | 'missing' | 'unserviceable';

export interface DrawerState {
  drawerStatus: 'pending' | 'ai-completed' | 'user-validated';
  imageStoragePath: string | null;
  results: Record<string, ToolPresence> | null;
}

export interface Audit {
  id?: string;
  checkoutId: string | null;
  startTime: Timestamp;
  endTime: Timestamp | null;
  drawerStates: Record<string, DrawerState>;
}

export enum AppView {
  TOOLBOX_OVERVIEW = 'TOOLBOX_OVERVIEW',
  TEMPLATE_BUILDER = 'TEMPLATE_BUILDER',
  CALIBRATION = 'CALIBRATION',
  INVENTORY = 'INVENTORY',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS',
  TOOLBOX_WIZARD = 'TOOLBOX_WIZARD'
}

// New Types for Template Builder

export interface AnchorPoint {
  id: string;
  x: number;
  y: number;
  label: string;
  description?: string;
}

export interface ToolPosition {
  name: string;
  position: string;
  x: number;
  y: number;
  width: number;
  height: number;
  status: "present" | "missing";
  angle?: number;
  shapeType?: 'rectangle' | 'circle' | 'polygon';
  points?: { x: number, y: number }[];
  cx?: number; // center x for circle
  cy?: number; // center y for circle
  radius?: number;
  confidence?: number;
  autoDetected?: boolean;
}