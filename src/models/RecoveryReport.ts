import mongoose, { Schema, Document } from 'mongoose';

export interface IRecoveryReport extends Document {
    userId: mongoose.Types.ObjectId;
    startDate: Date;
    endDate: Date;
    summary: string;
    status: string;
    recommendations: string[];
    insight: string;
    percentileFeedback?: string; // New field for social proof
    createdAt: Date;
    updatedAt: Date;
}

const RecoveryReportSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    summary: { type: String, required: true },
    status: { type: String },
    recommendations: [{ type: String }],
    insight: { type: String },
    percentileFeedback: { type: String },
    createdAt: { type: Date, default: Date.now },
}, {
    timestamps: true
});

// 복합 인덱스
RecoveryReportSchema.index({ userId: 1, startDate: 1 }, { unique: true });

export default mongoose.models.RecoveryReport || mongoose.model<IRecoveryReport>('RecoveryReport', RecoveryReportSchema);
