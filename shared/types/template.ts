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

export interface AnchorPoint {
    id: string;
    x: number;
    y: number;
    label: string;
    description?: string;
}
