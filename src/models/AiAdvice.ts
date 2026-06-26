import mongoose, { Document, Schema } from 'mongoose';

export interface IAiAdvice extends Document {
    userId: mongoose.Types.ObjectId;
    date: string; // YYYY-MM-DD
    totalScore: number;
    aiComment: string;
    actionItem: string;
    tomorrowForecast: {
        status: string;
        description: string;
        energyLevel: number;
    };
    adviceItems: Array<{
        id: string;
        category: 'PHYSICAL' | 'MENTAL' | 'LIFESTYLE' | 'SLEEP' | 'NUTRITION';
        content: string;
        isCompleted: boolean;
        completedAt?: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const AiAdviceSchema = new Schema<IAiAdvice>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    totalScore: {
        type: Number,
        required: true,
    },
    aiComment: {
        type: String,
        required: true,
    },
    actionItem: {
        type: String,
        required: true,
    },
    tomorrowForecast: {
        status: { type: String, required: true },
        description: { type: String, required: true },
        energyLevel: { type: Number, required: true }
    },
    adviceItems: [{
        id: { type: String, required: true },
        category: {
            type: String,
            enum: ['PHYSICAL', 'MENTAL', 'LIFESTYLE', 'SLEEP', 'NUTRITION'],
            required: true,
        },
        content: { type: String, required: true },
        isCompleted: { type: Boolean, default: false },
        completedAt: { type: Date },
    }],
}, {
    timestamps: true,
});

// Ensure one advice record per user per day
AiAdviceSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.AiAdvice || mongoose.model<IAiAdvice>('AiAdvice', AiAdviceSchema);
