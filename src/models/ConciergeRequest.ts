import mongoose, { Document, Schema } from 'mongoose';

export interface IConciergeRequest extends Document {
    userId: string;
    userName?: string;
    userEmail?: string;
    painPoint: string;
    goal: string;
    budget: string;
    symptoms: string[];
    aiAnalysis: string;
    suggestedPlans: any; // Store the 3 plans from AI
    selectedPlanId?: string;
    status: 'pending' | 'reviewing' | 'approved' | 'rejected';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ConciergeRequestSchema = new Schema<IConciergeRequest>({
    userId: { type: String, required: true },
    userName: { type: String },
    userEmail: { type: String },
    painPoint: { type: String, required: true },
    goal: { type: String, required: true },
    budget: { type: String, required: true },
    symptoms: [{ type: String }],
    aiAnalysis: { type: String },
    suggestedPlans: { type: Schema.Types.Mixed },
    selectedPlanId: { type: String },
    status: {
        type: String,
        enum: ['pending', 'reviewing', 'approved', 'rejected'],
        default: 'pending'
    },
    notes: { type: String }
}, {
    timestamps: true
});

export default mongoose.models.ConciergeRequest || mongoose.model<IConciergeRequest>('ConciergeRequest', ConciergeRequestSchema);
