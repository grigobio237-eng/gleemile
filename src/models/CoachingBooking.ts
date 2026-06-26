import mongoose, { Document, Schema } from 'mongoose';

export interface ICoachingBooking extends Document {
    bookingId: string;
    orderNumber: string;
    coachId: string; // FloorOwner ID
    coachName: string;
    userId: mongoose.Types.ObjectId;
    userEmail: string;
    userName: string;
    programId: string;
    programTitle: string;
    amount: number;
    date: string; // YYYY-MM-DD
    time?: string; // HH:mm
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    nicepayData?: any; // 결제 로그 데이터
    createdAt: Date;
    updatedAt: Date;
}

const CoachingBookingSchema = new Schema<ICoachingBooking>({
    bookingId: { type: String, required: true, unique: true },
    orderNumber: { type: String, required: true, unique: true },
    coachId: { type: String, required: true },
    coachName: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    programId: { type: String, required: true },
    programTitle: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: String, required: true },
    time: { type: String },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    nicepayData: { type: Schema.Types.Mixed }
}, {
    timestamps: true
});

// 인덱스 설정 (unique: true 필드는 자동으로 인덱스가 생성되므로 제외)
CoachingBookingSchema.index({ coachId: 1, date: 1 });
CoachingBookingSchema.index({ userId: 1 });

export default mongoose.models.CoachingBooking || mongoose.model<ICoachingBooking>('CoachingBooking', CoachingBookingSchema);
