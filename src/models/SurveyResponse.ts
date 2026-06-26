import mongoose, { Document, Schema } from 'mongoose';

export interface ISurveyResponse extends Document {
  shopId?: mongoose.Types.ObjectId; // 업소 ID (Shop 모델 참조)
  navigatorId: mongoose.Types.ObjectId; // 담당 네비게이터 ID (User 모델 참조)
  shopCode: string; // 유입 업소 코드
  partnerCode?: string; // (선택) 개별 파트너/전달자 코드
  version?: string; // 설문/문구 버전

  // 고객 정보 (비회원/가입유도용)
  clientName?: string;
  clientPhone?: string;
  userId?: mongoose.Types.ObjectId; // 가입 시 연동될 사용자 ID

  // 10가지 핵심 문항 (상품 만들기.docx 기반)
  answers: {
    stressPoint: string; // 1. 가장 스트레스 받는 변화
    stressPointNote?: string;
    priority: string; // 2. 가장 먼저 바꾸고 싶은 것
    priorityNote?: string;
    interestArea: string; // 3. 가장 관심 가는 방향
    interestAreaNote?: string;
    disappointment: string; // 4. 기존 관리의 아쉬운 이유
    disappointmentNote?: string;
    startMethod: string; // 5. 가장 끌리는 시작 방식
    benefitPreference: string; // 6. 가장 선호하는 혜택
    benefitPreferenceNote?: string;
    budget: string; // 7. 실제 결제 가능 가격대
    budgetNote?: string;
    highEndCondition: string; // 8. 고가 프로그램 고려 조건
    highEndConditionNote?: string;
    desiredCombination: string; // 9. 가장 받아보고 싶은 조합
    desiredCombinationNote?: string;
    entryCondition: string; // 10. 바로 시작해볼 수 있는 요소 (주관식/장문)
    additionalInfo?: string; // 기타 추가 의견
  };

  status: 'new' | 'analyzed' | 'proposed' | 'converted' | 'closed';
  proposalId?: string; // 제안된 상품/패키지 ID 연동

  createdAt: Date;
  updatedAt: Date;
}

const SurveyResponseSchema = new Schema<ISurveyResponse>({
  shopId: {
    type: Schema.Types.ObjectId,
    ref: 'Shop',
  },
  navigatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  shopCode: {
    type: String,
    required: true,
    uppercase: true,
  },
  partnerCode: String,
  version: String,
  clientName: String,
  clientPhone: String,
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  answers: {
    stressPoint: { type: String, required: true },
    stressPointNote: String,
    priority: { type: String, required: true },
    priorityNote: String,
    interestArea: { type: String, required: true },
    interestAreaNote: String,
    disappointment: { type: String, required: true },
    disappointmentNote: String,
    startMethod: { type: String, required: true },
    benefitPreference: { type: String, required: true },
    benefitPreferenceNote: String,
    budget: { type: String, required: true },
    budgetNote: String,
    highEndCondition: { type: String, required: true },
    highEndConditionNote: String,
    desiredCombination: { type: String, required: true },
    desiredCombinationNote: String,
    entryCondition: { type: String },
    additionalInfo: String,
  },
  status: {
    type: String,
    enum: ['new', 'analyzed', 'proposed', 'converted', 'closed'],
    default: 'new',
  },
  proposalId: String,
}, {
  timestamps: true,
});

// 검색 및 통계를 위한 인덱스
SurveyResponseSchema.index({ shopCode: 1 });
SurveyResponseSchema.index({ navigatorId: 1 });
SurveyResponseSchema.index({ status: 1 });
SurveyResponseSchema.index({ createdAt: -1 });

export default mongoose.models.SurveyResponse || mongoose.model<ISurveyResponse>('SurveyResponse', SurveyResponseSchema);
