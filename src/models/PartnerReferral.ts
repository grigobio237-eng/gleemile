import mongoose, { Document, Schema } from 'mongoose';

export interface IPartnerReferral extends Document {
  partnerId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  commission: number;
  status: 'pending' | 'approved' | 'paid';
  createdAt: Date;
  updatedAt: Date;
}

const PartnerReferralSchema = new Schema<IPartnerReferral>({
  partnerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  commission: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// Index for efficient queries
PartnerReferralSchema.index({ partnerId: 1, status: 1 });
PartnerReferralSchema.index({ orderId: 1 });

export default mongoose.models.PartnerReferral || mongoose.model<IPartnerReferral>('PartnerReferral', PartnerReferralSchema);


