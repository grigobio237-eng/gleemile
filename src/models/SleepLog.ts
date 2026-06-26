import mongoose, { Document, Schema } from 'mongoose';

export interface ISleepLog extends Document {
    userId: mongoose.Types.ObjectId;
    date: string; // YYYY-MM-DD
    bedTime: string; // HH:mm
    wakeTime: string; // HH:mm
    duration: number; // minutes
    quality: number; // 1-5 or 0-100
    efficiency: number; // percentage
    aiAnalysis?: string;
    createdAt: Date;
    updatedAt: Date;
}

const SleepLogSchema = new Schema<ISleepLog>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    date: {
        type: String,
        required: true,
        index: true
    },
    bedTime: { type: String, required: true },
    wakeTime: { type: String, required: true },
    duration: { type: Number, required: true },
    quality: { type: Number, required: true },
    efficiency: { type: Number, required: true },
    aiAnalysis: { type: String },
}, {
    timestamps: true
});

// One sleep log per user per day
SleepLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.SleepLog || mongoose.model<ISleepLog>('SleepLog', SleepLogSchema);
