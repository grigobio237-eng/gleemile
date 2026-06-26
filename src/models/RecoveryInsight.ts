import mongoose, { Document, Schema } from 'mongoose';

export interface IRecoveryInsight extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'daily' | 'weekly' | 'personality' | 'scanner';
    content: string;
    lastAnalyzedAt: Date; // The timestamp of the latest source data used for this analysis
    createdAt: Date;
    updatedAt: Date;
}

const RecoveryInsightSchema = new Schema<IRecoveryInsight>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['daily', 'weekly', 'personality', 'scanner'],
        index: true
    },
    content: {
        type: String,
        required: true
    },
    lastAnalyzedAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// Compound index to quickly find the latest insight of a specific type for a user
RecoveryInsightSchema.index({ userId: 1, type: 1, createdAt: -1 });

export default mongoose.models.RecoveryInsight || mongoose.model<IRecoveryInsight>('RecoveryInsight', RecoveryInsightSchema);
