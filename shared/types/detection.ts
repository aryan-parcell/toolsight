import type { AuditToolStatus } from "./audit";

export interface Detection {
    name: string;
    toolId: string;
    status: AuditToolStatus;
    confidence: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

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

// For Template Builder

export interface AnchorPoint {
    id: string;
    x: number;
    y: number;
    label: string;
    description?: string;
}
