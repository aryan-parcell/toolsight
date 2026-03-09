export interface ToolInfo {
    name: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    shape?: 'rectangle' | 'ellipse';
    angle?: number;
}

export interface Template {
    id?: string;
    name: string;
    organizationId: string;
    storagePath: string;
    imageUrl: string;
    tools: ToolInfo[];
}

export interface AnchorPoint {
    id: string;
    x: number;
    y: number;
    label: string;
    description?: string;
}
