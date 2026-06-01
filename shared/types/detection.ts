import type { ToolInfo } from "./template";

export interface Detection {
    toolId: string;
    status: "present" | "absent";
    confidence: "low" | "medium" | "high";
    toolInfo: ToolInfo;
}
