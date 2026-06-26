import mongoose, { Document, Schema } from 'mongoose';

export type SnapCategory = 'MEAL' | 'HYDRATION' | 'SKIN' | 'SLEEP' | 'ACTIVITY' | 'ROUTINE' | 'BODY' | 'MEDICAL_DOC' | 'OTHER';

export interface ILifeSnap extends Document {
    userId?: mongoose.Types.ObjectId; // 로그인한 유저
    sessionId?: string; // 비로그인 유저의 세션 식별자
    category: SnapCategory; // 스냅 종류 (9가지)
    imageUrl: string; // 업로드/스캔된 원본 또는 압축된 이미지 URL
    
    // Youniqle 엔진 분석 결과
    score?: number; // 건강/매칭 점수 (0-100)
    summary?: string; // 한 줄 요약 문구
    metrics?: Record<string, any>; // 카테고리별 세부 데이터 (예: 영양소, 수면 시간, 피부 톤 등)
    rawAiResult?: Record<string, any>; // AI의 원본 JSON 응답 (디버깅 및 추후 확장용)

    // 보안 및 플래그
    isMasked?: boolean; // 병원 서류 등 개인정보가 마스킹 처리되었는지 여부
    
    createdAt: Date;
    updatedAt: Date;
}

const LifeSnapSchema = new Schema<ILifeSnap>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false // 비로그인 유저도 타임라인에 임시 저장할 수 있도록 optional 처리
    },
    sessionId: {
        type: String,
        required: false
    },
    category: {
        type: String,
        enum: ['MEAL', 'HYDRATION', 'SKIN', 'SLEEP', 'ACTIVITY', 'ROUTINE', 'BODY', 'MEDICAL_DOC', 'OTHER'],
        required: true,
        index: true
    },
    imageUrl: {
        type: String,
        required: false
    },
    score: {
        type: Number
    },
    summary: {
        type: String
    },
    metrics: {
        type: Schema.Types.Mixed // 다양한 카테고리의 구조화되지 않은 데이터를 수용하기 위해 Mixed 사용
    },
    rawAiResult: {
        type: Schema.Types.Mixed
    },
    isMasked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// 빠른 조회를 위한 복합 인덱스 설정
LifeSnapSchema.index({ userId: 1, createdAt: -1 });
LifeSnapSchema.index({ sessionId: 1, createdAt: -1 });

export default mongoose.models.LifeSnap || mongoose.model<ILifeSnap>('LifeSnap', LifeSnapSchema);
