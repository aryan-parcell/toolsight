export interface Toolbox {
  id: string;
  name: string;
  eid: string;
  status: 'active' | 'maintenance' | 'critical' | 'setup_complete' | 'calibration_pending';
  location: string;
  lastScan: string;
  itemCount: number;
}

export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface Template {
  id: string;
  name: string;
  imageUrl: string;
  tools: BoundingBox[];
  createdAt: string;
}

export interface DashboardStats {
  totalToolboxes: number;
  activeCheckouts: number;
  criticalDiscrepancies: number;
  recentActivity: { time: string; action: string; user: string }[];
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
  points?: {x: number, y: number}[];
  cx?: number; // center x for circle
  cy?: number; // center y for circle
  radius?: number;
  confidence?: number;
  autoDetected?: boolean;
}