import { ExecutionContext, TrendNodeConfig, WorkflowNode } from '@/lib/video-workflow/types';
import { GeminiAIEngine } from '../../ai/gemini-engine';
import { TrendStrategyRegistry } from '../strategies/TrendStrategies';
import VideoProject from '@/models/VideoProject';

export class TrendAnalysisNode {
    static async execute(node: WorkflowNode, context: ExecutionContext): Promise<any> {
        const config = node.data as TrendNodeConfig;
        const topic = config.topic;

        // Get project type to select strategy
        const project = await VideoProject.findById(context.projectId);
        const projectType = (project as any)?.projectType || 'shortform';

        console.log(`[TrendNode] Analyzing trend for topic: ${topic}, type: ${projectType}`);

        const strategy = TrendStrategyRegistry.getStrategy(projectType);
        const prompt = strategy.getPrompt(topic, context);

        try {
            const resultText = await GeminiAIEngine.generateWithFallback(prompt);
            const result = strategy.parseResponse(resultText);

            return {
                concepts: result.concepts || [`${topic} 챌린지`],
                styling: result.styling || "빠른 템포의 컷 편집",
                hooks: result.hooks || [`${topic} 확인해보세요`],
                analysis: result.analysis || "분석 완료"
            };

        } catch (error: any) {
            console.error('Trend analysis failed:', error);
            // Fallback
            return {
                concepts: [`${topic} 챌린지`, `${topic} 꿀팁`, `${topic} 비하인드`],
                styling: "빠른 템포의 컷 편집과 자막 강조",
                hooks: [`${topic}, 아직도 모르시나요?`, `3초 만에 ${topic} 마스터하기`],
                analysis: `${topic} 키워드는 최근 시각적인 정보 전달과 결합되어 높은 조회수를 기록하고 있습니다.`
            };
        }
    }
}
