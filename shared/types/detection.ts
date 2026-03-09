import type { ToolInfo } from "./template";

export interface Detection {
    toolId: string;
    status: AuditToolStatus;
    confidence: number;
    toolInfo: ToolInfo;
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
