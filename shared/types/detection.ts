import type { ToolInfo } from "./template";

export interface Detection {
    toolId: string;
    status: "present" | "absent" | "unserviceable";
    confidence: number;
    toolInfo: ToolInfo;
}
