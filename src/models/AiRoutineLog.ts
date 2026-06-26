import mongoose, { Document, Schema } from 'mongoose';

export interface IAiRoutineLog extends Document {
    userId: mongoose.Types.ObjectId;
    date: string; // YYYY-MM-DD
    routines: Array<{
        slot: 'DAWN' | 'MORNING' | 'LUNCH' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
        title: string;
        tasks: Array<{
            id: string;
            title: string;
            desc: string;
            icon: string;
        }>;
        completedTasks: string[];
        generatedAt: Date;
    }>;
    aiComment?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AiRoutineLogSchema = new Schema<IAiRoutineLog>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String,
        required: true
    },
    routines: [{
        slot: {
            type: String,
            enum: ['DAWN', 'MORNING', 'LUNCH', 'AFTERNOON', 'EVENING', 'NIGHT'],
            required: true
        },
        title: { type: String, required: true },
        tasks: [{
            id: { type: String, required: true },
            title: { type: String, required: true },
            desc: { type: String, required: true },
            icon: { type: String, required: true }
        }],
        completedTasks: [{ type: String }],
        generatedAt: { type: Date, default: Date.now }
    }],
    aiComment: {
        type: String,
    }
}, {
    timestamps: true,
});

// Ensure one routine log per user per day
AiRoutineLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.AiRoutineLog || mongoose.model<IAiRoutineLog>('AiRoutineLog', AiRoutineLogSchema);
