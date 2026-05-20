import type { ToolInfo } from "./template";

export interface Detection {
    toolId: string;
    status: "present" | "absent";
    confidence: number;
    toolInfo: ToolInfo;
}
