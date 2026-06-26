import mongoose, { Document, Schema } from 'mongoose';

export interface ITodoTask {
    id: string;
    text: string;
    completed: boolean;
    completedAt?: Date;
    category?: string;
}

export interface ITodoLog extends Document {
    userId: mongoose.Types.ObjectId;
    date: string; // YYYY-MM-DD
    tasks: ITodoTask[];
    summary?: string;
    createdAt: Date;
    updatedAt: Date;
}

const TodoLogSchema = new Schema<ITodoLog>({
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
    tasks: [{
        id: { type: String, required: true },
        text: { type: String, required: true },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
        category: { type: String }
    }],
    summary: { type: String },
}, {
    timestamps: true
});

// One todo log per user per day
TodoLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.TodoLog || mongoose.model<ITodoLog>('TodoLog', TodoLogSchema);
