import { ExecutionContext, ScriptNodeConfig, WorkflowNode } from '@/lib/video-workflow/types';
import { GeminiAIEngine } from '../../ai/gemini-engine';
import { ScriptStrategyRegistry } from '../strategies/ScriptStrategies';
import VideoProject from '@/models/VideoProject';

export interface Scene {
    id: number;
    visualPrompt: string; // 이미지 생성 프롬프트
    audioScript: string;  // 나레이션 텍스트
    duration: number;     // 예상 길이 (초)
    mainCharacter?: string; // 추가: 씬별로 캐릭터 정보 전달
}

export interface ScriptOutput {
    title: string;
    mainCharacter?: string; // 캐릭터 묘사 추가
    recommendedVoice?: string; // 추천 목소리 추가
    scenes: Scene[];
}

export class ScriptingNode {
    static async execute(node: WorkflowNode, context: ExecutionContext): Promise<ScriptOutput> {
        const config = node.data as ScriptNodeConfig;

        // Find input from previous node (TrendNode)
        const inputEdge = context.edges.find(e => e.target === node.id);
        const trendContext = inputEdge ? context.results[inputEdge.source] : config.trendContext;

        if (!trendContext) {
            throw new Error('Trend context is missing for ScriptingNode');
        }

        // Get project type
        const project = await VideoProject.findById(context.projectId);
        const projectType = (project as any)?.projectType || 'shortform';

        console.log(`[ScriptNode] Generating script for type: ${projectType}`);

        const strategy = ScriptStrategyRegistry.getStrategy(projectType);
        const productName = (project as any)?.productName || "";
        const prompt = strategy.getPrompt(trendContext, projectType, productName);

        try {
            const resultText = await GeminiAIEngine.generateWithFallback(prompt);
            const output = strategy.parseResponse(resultText);

            // Fail-safe: gleemile 엔진이 실수로 [상품명] 플레이스홀더를 남겼을 경우 실제 상품명으로 치환
            const finalProductName = productName || "우리 상품";
            const processedScenes = (output.scenes || []).map((s: any, idx: number) => {
                let script = s.audioScript || "내레이션 없음";
                if (productName) {
                    script = script.replace(/\[상품명\]/g, finalProductName);
                    script = script.replace(/\[Product Name\]/gi, finalProductName);
                }
                return {
                    id: s.id || idx + 1,
                    visualPrompt: s.visualPrompt || "A generic scene",
                    audioScript: script,
                    duration: s.duration || 5,
                    mainCharacter: output.mainCharacter || "A generic character"
                };
            });

            return {
                title: output.title || "자동 생성 영상",
                mainCharacter: output.mainCharacter,
                recommendedVoice: output.recommendedVoice,
                scenes: processedScenes
            };

        } catch (error: any) {
            console.error('[ScriptingNode] Generation Error Details:', {
                message: error.message,
                stack: error.stack,
                projectType,
                projectId: context.projectId
            });
            // Fallback
            return {
                title: "자동 생성된 영상 테스트 (Fallback)",
                scenes: [
                    { id: 1, visualPrompt: "A futuristic city skyline at sunset", audioScript: "미래 도시의 모습, 상상해보셨나요?", duration: 5 }
                ]
            };
        }
    }
}
