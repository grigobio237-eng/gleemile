export interface NavigatorInput {
    userId: string;
    date: string;
    scores: {
        physical: number;
        mental: number;
        lifestyle: number;
        sleep: number;
    };
    yesterdayScore?: number;
}

export interface NavigatorOutput {
    comment: string;
    actionItem: string;
    recoveryScore: number;
    tomorrowForecast?: {
        status: string;
        description: string;
        energyLevel: number;
    };
}

export interface OmakaseInput {
    userId: string;
    painPoint: string;
    goal: string;
    budget: '30' | '50' | '100+' | string;
    symptoms: string[];
}

export interface OmakasePlan {
    planId: string;
    title: string;
    description: string;
    duration: string;
    priceEstimate: string;
    focusArea: string;
    routine: string[];
}

export interface OmakaseOutput {
    analysis: string;
    plans: {
        planA: OmakasePlan;
        planB: OmakasePlan;
        planC: OmakasePlan;
    };
}

export interface RecoveryCaseInput {
    symptom: string;
    age?: string;
    gender?: string;
}

export interface RecoveryCaseOutput {
    title: string;
    category: string;
    period: string;
    emotion: string;
    summary: string;
    habitChanges?: string[];
    graphData: { name: string; score: number }[];
    tags: string[];
    productRecommendation: {
        name: string;
        price: string;
        reason: string;
    };
}

export interface DailyCheckInInput {
    userName: string;
    dayOfWeek: string;
    timeOfDay: string;
    recentContext?: string;
}

export interface DailyCheckInOutput {
    greeting: string;
    question: string;
    options: {
        label: string;
        value: string;
        emoji: string;
    }[];
}

export interface DiagnosisInput {
    scores: {
        physical: number;
        mental: number;
        lifestyle: number;
        sleep: number;
    };
    tScores?: {
        domains: any;
        facets: any;
    };
    userInfo?: {
        name: string;
        age?: string;
        gender?: string;
    };
}

export interface DiagnosisOutput {
    analysis: string;
    exercise: string;
    nutrition: string;
    mindset: string;
    sleep: string;
    productConcept: {
        name: string;
        reason: string;
        ingredients: string[];
    };
    audioScript: string;
}

export interface MedicalInterviewGuideOutput {
    analysis: string;
    mustAskQuestions: {
        question: string;
        rationale: string;
    }[];
    hospitalTips: string[];
}

export interface PostCareRoadmapOutput {
    statusAnalysis: string;
    isEmergency: boolean;
    recoveryPhase: string;
    timeline: {
        period: string;
        goal: string;
        instructions: string[];
    }[];
    expertAdvice: string[];
}
