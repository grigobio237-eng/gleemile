import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number; // 구매 시점의 가격 (상품 가격이 변경되어도 장바구니 가격 유지)
  addedAt: Date;
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  totalItems: number; // 총 상품 개수
  totalAmount: number; // 총 금액
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 99, // 최대 99개까지
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const CartSchema = new Schema<ICart>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [CartItemSchema],
  totalItems: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// 장바구니 업데이트 시 총 개수와 총 금액 자동 계산
CartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalAmount = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  next();
});

// 인덱스 설정 (unique 인덱스로 한 사용자당 하나의 장바구니 보장)
CartSchema.index({ userId: 1 }, { unique: true });
CartSchema.index({ 'items.productId': 1 });

export default mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);









