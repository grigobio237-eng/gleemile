import { GeminiCore } from './engine/core';
import { RoutineService } from './services/routine-service';
import { MedicalService } from './services/medical-service';
import { ContentService } from './services/content-service';
import * as types from './types';

/**
 * GeminiAIEngine (Facade)
 * 
 * This class maintains backward compatibility while offloading logic
 * to specialized domain services.
 */
export class GeminiAIEngine {
    // Core Delegation
    static async generateWithFallback(prompt: string | any[], systemInstruction?: string, temperature: number = 0.7) {
        return GeminiCore.generateWithFallback(prompt, systemInstruction, temperature);
    }

    // Routine & Check-in Services
    static generateDailyCheckInQuestion = RoutineService.generateDailyCheckInQuestion;
    static generateDailyQuestions = RoutineService.generateDailyQuestions;
    static generateDailyRoutines = RoutineService.generateDailyRoutines;
    static generateNavigatorAdvice = RoutineService.generateNavigatorAdvice;
    static paraphrasePrecisionQuestions = RoutineService.paraphrasePrecisionQuestions;
    static analyzeRecoveryTrend = RoutineService.analyzeRecoveryTrend;

    // Medical Services
    static generateDiagnosisSolution = MedicalService.generateDiagnosisSolution;
    static generateMedicalInterviewGuide = MedicalService.generateMedicalInterviewGuide;
    static generatePostCareRoadmap = MedicalService.generatePostCareRoadmap;
    static analyzeSymptom = MedicalService.analyzeSymptom;
    static generateRecoveryAdvice = MedicalService.generateRecoveryAdvice;
    static generateDynamicQuestions = MedicalService.generateDynamicQuestions;
    
    static async generateRecoveryChatResponse(message: string, context: any) {
        return MedicalService.generateRecoveryAdvice({ message, context });
    }

    // Content Services
    static generateDetailImage = ContentService.generateDetailImage;
    static generateOmakasePlans = ContentService.generateOmakasePlans;
    static generateRecoveryWebtoonScript = ContentService.generateRecoveryWebtoonScript;
    static generateManagerResponse = ContentService.generateManagerResponse;
    static planDetailPage = ContentService.planDetailPage;

    static async generateImageAndSave(
        prompt: string,
        outputPath: string,
        referenceImages?: string | string[],
        aspectRatio: "9:16" | "4:3" | "1:1" = "9:16"
    ): Promise<string> {
        // Fallback placeholder to maintain compatibility with AssetGenNode
        console.log(`[GeminiAIEngine] generateImageAndSave called for: ${outputPath}`);
        return outputPath;
    }

    // Utility
    static async paraphraseQuestion(input: { question: string; context?: any }) {
        const prompt = `질문을 gleemile 브랜드 톤에 맞춰 다듬어주세요: ${input.question}`;
        return GeminiCore.generateWithFallback(prompt, "AI 문구 교정 모드", 0.8);
    }
}

export default GeminiAIEngine;
