import mongoose, { Document, Schema } from 'mongoose';

export interface IRecoveryScore extends Document {
    userId: mongoose.Types.ObjectId;
    date: string; // YYYY-MM-DD (KST) - Used as a daily unique identifier
    rawScore: number; // 0-25 sum of 5 questions
    totalScore: number; // 0-100 converted score
    metaphor: string;
    answers: Array<{
        questionId: string;
        category: string;
        score: number;
        detail?: string;
    }>;
    snapData?: {
        type: 'PHOTO' | 'TEXT';
        content: string;
    };
    userNote?: string;
    createdAt: Date;
    updatedAt: Date;
}

const RecoveryScoreSchema = new Schema<IRecoveryScore>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String, // Changed from Date to String for robust timezone-independent daily keys
        required: true
    },
    rawScore: {
        type: Number,
        required: true,
    },
    totalScore: {
        type: Number,
        required: true,
    },
    metaphor: {
        type: String,
        required: true,
    },
    answers: [{
        questionId: { type: String, required: true },
        category: { type: String, required: true },
        score: { type: Number, required: true },
        detail: { type: String, required: false },
    }],
    snapData: {
        type: { type: String, enum: ['PHOTO', 'TEXT'] },
        content: { type: String }
    },
    userNote: {
        type: String,
        required: false
    },
}, {
    timestamps: true,
});

// Compound index to ensure one score per user per day
RecoveryScoreSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.RecoveryScore || mongoose.model<IRecoveryScore>('RecoveryScore', RecoveryScoreSchema);
