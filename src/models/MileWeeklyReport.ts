import mongoose, { Document, Schema } from 'mongoose';

export interface IMileWeeklyReport extends Document {
    userId: mongoose.Types.ObjectId;
    teamId: mongoose.Types.ObjectId;
    weekStartDate: string; // YYYY-MM-DD
    weekEndDate: string; // YYYY-MM-DD
    averageWellnessScore: number;
    highestAcwr: number;
    lowestAcwr: number;
    aiSummary: string; // Youniqle 엔진이 생성한 3-4문장 요약
    aiRecommendations: string[]; // Youniqle 엔진이 제안하는 훈련 및 회복 방향
    createdAt: Date;
    updatedAt: Date;
}

const MileWeeklyReportSchema = new Schema<IMileWeeklyReport>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        teamId: { type: Schema.Types.ObjectId, ref: 'MileTeam', required: true },
        weekStartDate: { type: String, required: true },
        weekEndDate: { type: String, required: true },
        averageWellnessScore: { type: Number, required: true },
        highestAcwr: { type: Number, required: true },
        lowestAcwr: { type: Number, required: true },
        aiSummary: { type: String, required: true },
        aiRecommendations: [{ type: String }],
    },
    { timestamps: true }
);

MileWeeklyReportSchema.index({ userId: 1, weekStartDate: 1 }, { unique: true });
MileWeeklyReportSchema.index({ teamId: 1, weekStartDate: 1 });

export default mongoose.models.MileWeeklyReport || mongoose.model<IMileWeeklyReport>('MileWeeklyReport', MileWeeklyReportSchema);
