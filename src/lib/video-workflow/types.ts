export interface WorkflowNode {
    id: string;
    type: string; // 'trend' | 'script' | 'asset' | 'video' | 'synthesis'
    data: any; // Node specific configuration
    position?: { x: number; y: number };
}

export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
}

export interface ExecutionContext {
    projectId: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    results: Record<string, any>; // Store output of each node by ID
    status: 'idle' | 'running' | 'completed' | 'failed';
    currentStep?: string;
    errors?: string[];
}

// Node Configuration Types
export interface TrendNodeConfig {
    topic: string;
}

export interface ScriptNodeConfig {
    trendContext: string; // Result from TrendNode
    sceneCount?: number;
}

export interface AssetNodeConfig {
    scriptContext: any; // Result from ScriptNode
    type: 'image' | 'audio';
}

export interface VideoNodeConfig {
    imageAssetId: string; // URL or ID from AssetNode
    audioAssetId?: string; // URL or ID from AssetNode
    duration?: number;
}

export interface SynthesisNodeConfig {
    videoClips: string[]; // List of video file paths
    backgroundMusic?: string;
    transitionType?: string; // e.g. 'fade', 'dissolve', 'wipeleft', 'wiperight', etc.
    transitionDuration?: number; // seconds
}

// Workflow Templates
export interface StepDefinition {
    id: string;
    title: string;
    description: string;
    nodeType: string;
}

export interface WorkflowTemplate {
    type: string;
    name: string;
    description: string;
    steps: StepDefinition[];
}
