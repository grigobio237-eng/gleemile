import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  items: Array<{
    productId: any; // mongoose.Types.ObjectId or string
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
    partnerId?: mongoose.Types.ObjectId; // 각 상품의 파트너 ID
  }>;
  total: number;
  totalAmount: number; // 총 주문 금액 (total과 동일하지만 명시적)
  addressSnapshot: {
    label: string;
    recipient: string;
    phone: string;
    zip: string;
    addr1: string;
    addr2?: string;
  };
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    label: string;
    recipient: string;
    phone: string;
    zip: string;
    addr1: string;
    addr2?: string;
  };
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  // 배송 추적 정보
  trackingNumber?: string;
  courierCompany?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  // 포인트 및 쿠폰 관련 필드
  usedPoints?: number; // 사용한 포인트
  couponDiscount?: number; // 쿠폰 할인 금액
  couponCode?: string; // 사용한 쿠폰 코드
  // 파트너 관련 필드
  partnerOrders: Array<{
    partnerId: mongoose.Types.ObjectId;
    partnerName: string;
    items: Array<{
      productId: mongoose.Types.ObjectId;
      name: string;
      price: number;
      quantity: number;
    }>;
    subtotal: number;
    commission: number;
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    trackingNumber?: string;
    shippedAt?: Date;
    deliveredAt?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [{
    productId: { type: Schema.Types.Mixed, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    imageUrl: { type: String },
    partnerId: { type: Schema.Types.ObjectId, ref: 'User' }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  shippingAddress: {
    label: { type: String, required: true },
    recipient: { type: String, required: true },
    phone: { type: String, required: true },
    zip: { type: String, required: true },
    addr1: { type: String, required: true },
    addr2: { type: String },
  },
  paymentMethod: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  // 포인트 및 쿠폰 관련 필드
  usedPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  couponDiscount: {
    type: Number,
    default: 0,
    min: 0
  },
  couponCode: {
    type: String
  },
  // 배송 추적 정보
  trackingNumber: {
    type: String
  },
  courierCompany: {
    type: String
  },
  shippedAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  // 파트너 관련 필드
  partnerOrders: [{
    partnerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    partnerName: { type: String, required: true },
    items: [{
      productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true }
    }],
    subtotal: { type: Number, required: true },
    commission: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    trackingNumber: { type: String },
    shippedAt: { type: Date },
    deliveredAt: { type: Date }
  }],
}, {
  timestamps: true,
});

// Index for efficient queries
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ partnerId: 1 });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

