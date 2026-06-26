import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
    senderId: mongoose.Types.ObjectId;
    receiverId?: mongoose.Types.ObjectId; // 1:1 채팅 리시버 (원장님 or 유저)
    content: string;
    type: 'text' | 'image';
    read: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'image'], default: 'text' },
    read: { type: Boolean, default: false },
}, {
    timestamps: true,
});

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
