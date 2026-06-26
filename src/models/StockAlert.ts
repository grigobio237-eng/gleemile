import mongoose, { Document, Schema } from 'mongoose';

export interface IStockAlert extends Document {
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  notified: boolean;
  notifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StockAlertSchema = new Schema<IStockAlert>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    notified: {
      type: Boolean,
      default: false,
    },
    notifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// 중복 알림 방지 인덱스
StockAlertSchema.index({ userId: 1, productId: 1 }, { unique: true });

// 알림 전송 대상 조회를 위한 인덱스
StockAlertSchema.index({ productId: 1, notified: 1 });

const StockAlert = mongoose.models.StockAlert || mongoose.model<IStockAlert>('StockAlert', StockAlertSchema);

export default StockAlert;

