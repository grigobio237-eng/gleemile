import mongoose, { Schema, Document } from 'mongoose';

export interface IPreConsultation extends Document {
  user: mongoose.Types.ObjectId;
  navigator: string; // 추천인 코드
  medicalCategory?: string; // PLASTIC, ORTHOPEDIC, INTERNAL, GENERAL, REGENERATIVE

  // Step 1: 내원 목적 및 주요 증상
  chiefComplaint: {
    symptom: string;
    duration: string; // 며칠 전, 몇 주 전, 수개월 이상 만성 등
    vasScore: number; // 1~10
  };

  // Step 2: 과별 특화 동적 분기 답변
  dynamicAnswers: {
    q1: string;
    a1: string;
    q2: string;
    a2: string;
  };

  // Step 3: 필수 건강 정보 및 병력
  medicalHistory: {
    pastSurgery: { has: boolean; details?: string };
    currentMedication: { taking: boolean; details?: string };
    allergies: { has: boolean; details?: string };
  };

  // Step 4: 라이프스타일 및 컨디션
  lifestyle: {
    dailyImpact: string; // 일상생활 지장 정도
    conditionDrops: string; // 최근 컨디션 저하 요소
  };

  // Step 5: 치료 기대치 및 우려 사항
  expectation: {
    preferredTreatment: string; // 대증치료 vs 근본치료
    concerns: string[]; // 부작용, 기간, 통증 등
  };

  // Step 6: 내원 환경 및 특별 요청 사항
  visitPlan: {
    companion: { has: boolean; details?: string };
    specialRequest?: string; // 진료실 전달 사항 (자유 기재)
  };

  // 프리미엄 예산 (공통)
  investment: {
    premiumBudget: string; // ESSENCE, SIGNATURE, MIRACLE, COUNSELING
  };

  aiGuide?: {
    analysis: string;
    mustAskQuestions: { question: string; rationale: string; }[];
    hospitalTips: string[];
  };

  createdAt: Date;
  updatedAt: Date;
}

const PreConsultationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    navigator: { type: String, default: '' },
    medicalCategory: { type: String },

    chiefComplaint: {
      symptom: { type: String, required: true },
      duration: { type: String, required: true },
      vasScore: { type: Number, required: true, min: 1, max: 10 },
    },

    dynamicAnswers: {
      q1: { type: String },
      a1: { type: String },
      q2: { type: String },
      a2: { type: String },
    },

    medicalHistory: {
      pastSurgery: { has: { type: Boolean, required: true }, details: { type: String } },
      currentMedication: { taking: { type: Boolean, required: true }, details: { type: String } },
      allergies: { has: { type: Boolean, required: true }, details: { type: String } },
    },

    lifestyle: {
      dailyImpact: { type: String, required: true },
      conditionDrops: { type: String, required: true },
    },

    expectation: {
      preferredTreatment: { type: String, required: true },
      concerns: [{ type: String }],
    },

    visitPlan: {
      companion: { has: { type: Boolean, required: true }, details: { type: String } },
      specialRequest: { type: String },
    },

    investment: {
      premiumBudget: { type: String, required: true },
    },

    aiGuide: {
      analysis: { type: String },
      mustAskQuestions: [{
        question: { type: String },
        rationale: { type: String }
      }],
      hospitalTips: [{ type: String }]
    },
  },
  { timestamps: true }
);

// Prevent overwrite in development, but force recreate if schema changed
if (mongoose.models.PreConsultation) {
  delete mongoose.models.PreConsultation;
}
const PreConsultation = mongoose.model<IPreConsultation>('PreConsultation', PreConsultationSchema);

export default PreConsultation;
