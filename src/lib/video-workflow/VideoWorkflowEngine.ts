
import { ExecutionContext, WorkflowNode, WorkflowEdge } from './types';

export class VideoWorkflowEngine {
    private context: ExecutionContext;

    constructor(projectId: string, nodes: WorkflowNode[], edges: WorkflowEdge[]) {
        this.context = {
            projectId,
            nodes,
            edges,
            results: {},
            status: 'idle',
            currentStep: 'init',
            errors: []
        };
    }

    // Topological Sort를 사용하여 실행 순서 결정
    private getExecutionOrder(): WorkflowNode[] {
        const { nodes, edges } = this.context;
        const order: WorkflowNode[] = [];
        const visited = new Set<string>();
        const tempVisited = new Set<string>();

        const visit = (nodeId: string) => {
            if (tempVisited.has(nodeId)) {
                throw new Error('Cycle detected in workflow');
            }
            if (visited.has(nodeId)) {
                return;
            }
            tempVisited.add(nodeId);

            // Find dependencies (nodes that point to this node)
            const dependencies = edges.filter(edge => edge.target === nodeId).map(edge => edge.source);
            for (const depId of dependencies) {
                visit(depId);
            }

            tempVisited.delete(nodeId);
            visited.add(nodeId);
            const node = nodes.find(n => n.id === nodeId);
            if (node) {
                order.push(node);
            }
        };

        for (const node of nodes) {
            if (!visited.has(node.id)) {
                visit(node.id);
            }
        }

        return order;
    }

    public async execute(): Promise<ExecutionContext> {
        try {
            this.context.status = 'running';
            const executionOrder = this.getExecutionOrder();

            for (const node of executionOrder) {
                if (this.context.status === 'failed') break;

                this.context.currentStep = node.id;
                console.log(`Executing node: ${node.id} (${node.type})`);

                try {
                    // 각 노드 타입에 맞는 핸들러 실행
                    const result = await this.executeNode(node);
                    this.context.results[node.id] = result;
                } catch (error: any) {
                    console.error(`Error executing node ${node.id}:`, error);
                    this.context.errors?.push(`Node ${node.id}: ${error.message}`);
                    this.context.status = 'failed';
                }
            }

            if (this.context.status !== 'failed') {
                this.context.status = 'completed';
            }

        } catch (error: any) {
            console.error('Workflow execution failed:', error);
            this.context.status = 'failed';
            this.context.errors?.push(`Workflow: ${error.message}`);
        }

        return this.context;
    }

    private async executeNode(node: WorkflowNode): Promise<any> {
        // Dynamic imports to avoid circular dependencies if any, or just for code splitting
        const { TrendAnalysisNode } = await import('./nodes/TrendAnalysisNode');
        const { ScriptingNode } = await import('./nodes/ScriptingNode');
        const { AssetGenNode } = await import('./nodes/AssetGenNode');
        const { VideoGenNode } = await import('./nodes/VideoGenNode');
        const { SynthesisNode } = await import('./nodes/SynthesisNode');

        switch (node.type) {
            case 'trend':
                return TrendAnalysisNode.execute(node, this.context);
            case 'script':
                return ScriptingNode.execute(node, this.context);
            case 'asset':
                return AssetGenNode.execute(node, this.context);
            case 'video':
                return VideoGenNode.execute(node, this.context);
            case 'synthesis':
                return SynthesisNode.execute(node, this.context);
            default:
                console.warn(`Unknown node type: ${node.type}`);
                return {};
        }
    }
}
