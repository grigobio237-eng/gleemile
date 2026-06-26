import mongoose, { Document, Schema } from 'mongoose';

export interface IUserMood extends Document {
    userId?: mongoose.Types.ObjectId;
    sessionId?: string; 
    moodScore: number; // 1 (worst) to 5 (best)
    timeOfDay: string; 
    createdAt: Date;
    updatedAt: Date;
}

const UserMoodSchema = new Schema<IUserMood>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    sessionId: {
        type: String,
        required: false
    },
    moodScore: {
        type: Number,
        required: true,
    },
    timeOfDay: {
        type: String,
        required: true,
    }
}, {
    timestamps: true,
});

export default mongoose.models.UserMood || mongoose.model<IUserMood>('UserMood', UserMoodSchema);
