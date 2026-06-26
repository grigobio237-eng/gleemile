import mongoose, { Schema, Document } from 'mongoose';

export interface IPushSubscription extends Document {
    userId: mongoose.Types.ObjectId;
    endpoint: string;
    expirationTime?: number | null;
    keys: {
        p256dh: string;
        auth: string;
    };
    userAgent?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PushSubscriptionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    expirationTime: { type: Number, default: null },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
    },
    userAgent: { type: String }
}, {
    timestamps: true
});

// 동일 유저의 여러 디바이스 구독 지원을 위해 userId와 endpoint 기반 인덱스
PushSubscriptionSchema.index({ userId: 1 });

export default mongoose.models.PushSubscription || mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);
