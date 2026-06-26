import mongoose, { Document, Schema } from 'mongoose';

export interface IDiagnosis extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'PRECISION'; // 정밀 리듬체크 구분
    totalScore: number;
    categoryScores: {
        physical: number;
        mental: number;
        lifestyle: number;
        sleep: number;
    };
    answers: Array<{
        questionId: string;
        category: string;
        question: string;
        answer: string;
        score: number;
    }>;
    resultTitle: string;
    resultDescription: string;
    recommendations: string[];
    aiSolution?: {
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
        audioScript?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const DiagnosisSchema = new Schema<IDiagnosis>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        default: 'PRECISION'
    },
    totalScore: {
        type: Number,
        required: true
    },
    categoryScores: {
        physical: { type: Number, required: true },
        mental: { type: Number, required: true },
        lifestyle: { type: Number, required: true },
        sleep: { type: Number, required: true }
    },
    answers: [{
        questionId: { type: String, required: true },
        category: { type: String, required: true },
        question: { type: String, required: true },
        answer: { type: String, required: true },
        score: { type: Number, required: true }
    }],
    resultTitle: {
        type: String,
        required: true
    },
    resultDescription: {
        type: String,
        required: true
    },
    recommendations: [{
        type: String
    }],
    aiSolution: {
        analysis: String,
        exercise: String,
        nutrition: String,
        mindset: String,
        sleep: String,
        productConcept: {
            name: String,
            reason: String,
            ingredients: [String]
        },
        audioScript: String
    }
}, {
    timestamps: true
});

export default mongoose.models.Diagnosis || mongoose.model<IDiagnosis>('Diagnosis', DiagnosisSchema);
