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

export interface TemplateTool {
    toolName: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
}

export interface Template {
    id?: string;
    name: string;
    organizationId: string;
    storagePath: string;
    imageUrl: string;
    tools: TemplateTool[];
}

// For Template Builder

export interface AnchorPoint {
    id: string;
    x: number;
    y: number;
    label: string;
    description?: string;
}
