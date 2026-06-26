import mongoose, { Schema, Document, Model } from 'mongoose';

// 환불/교환 타입
export type RefundType = 'refund' | 'exchange';

// 환불/교환 사유
export type RefundReason =
  | 'change_of_mind'        // 단순 변심
  | 'defective_product'     // 상품 불량
  | 'wrong_product'         // 오배송
  | 'size_mismatch'         // 사이즈 불일치
  | 'different_from_image'  // 상품 상이
  | 'delivery_delay'        // 배송 지연
  | 'other';                // 기타

// 환불/교환 상태
export type RefundStatus =
  | 'pending'       // 신청 대기
  | 'approved'      // 승인됨
  | 'rejected'      // 거부됨
  | 'pickup_requested'  // 수거 요청
  | 'pickup_completed'  // 수거 완료
  | 'inspecting'    // 검수중
  | 'completed'     // 완료
  | 'cancelled';    // 취소

// 환불 방법
export type RefundMethod = 'credit_card' | 'bank_transfer' | 'point';

// 환불/교환 모델 인터페이스 (static 메서드용)
export interface IRefundModel extends Model<IRefund> {
  generateRefundNumber(type: RefundType): Promise<string>;
}

// 환불/교환 인터페이스
export interface IRefund extends Document {
  // 기본 정보
  refundNumber: string;          // 환불/교환 번호
  type: RefundType;

  // 메서드
  updateStatus(
    newStatus: RefundStatus,
    userId?: mongoose.Types.ObjectId,
    reason?: string
  ): Promise<IRefund>;

  // 주문 정보
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;

  // 파트너 정보
  partnerId?: mongoose.Types.ObjectId;
  partnerName?: string;

  // 상품 정보
  items: {
    productId: mongoose.Types.ObjectId;
    productName: string;
    quantity: number;
    price: number;
    totalPrice: number;
    imageUrl?: string;
  }[];

  // 환불/교환 사유
  reason: RefundReason;
  reasonDetail: string;          // 상세 사유
  images?: string[];             // 증빙 이미지

  // 교환 정보 (교환인 경우)
  exchangeInfo?: {
    newProductId?: mongoose.Types.ObjectId;
    newProductName?: string;
    newSize?: string;
    newColor?: string;
    additionalPayment?: number;  // 추가 결제 금액
  };

  // 금액 정보
  totalAmount: number;           // 총 금액
  refundAmount: number;          // 환불 금액
  shippingFee: number;           // 배송비
  refundShippingFee: number;     // 반품 배송비
  deductionAmount: number;       // 차감 금액
  finalRefundAmount: number;     // 최종 환불 금액

  // 환불 방법
  refundMethod: RefundMethod;
  bankAccount?: {                // 계좌 환불 시
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };

  // 수거 정보
  pickupAddress: {
    zipCode: string;
    address1: string;
    address2: string;
    phone: string;
  };
  pickupDate?: Date;             // 수거 예정일
  pickupCompletedAt?: Date;      // 수거 완료일
  courierCompany?: string;       // 택배사
  trackingNumber?: string;       // 송장번호

  // 처리 정보
  status: RefundStatus;
  requestedAt: Date;             // 신청일
  approvedAt?: Date;             // 승인일
  rejectedAt?: Date;             // 거부일
  completedAt?: Date;            // 완료일
  cancelledAt?: Date;            // 취소일

  // 승인/거부 정보
  approvedBy?: mongoose.Types.ObjectId;  // 승인자
  rejectedBy?: mongoose.Types.ObjectId;  // 거부자
  rejectionReason?: string;      // 거부 사유

  // 검수 정보
  inspectionResult?: {
    isPassed: boolean;           // 검수 통과 여부
    notes: string;               // 검수 메모
    inspector: mongoose.Types.ObjectId;
    inspectedAt: Date;
  };

  // 메모
  adminNotes?: string;           // 관리자 메모
  partnerNotes?: string;         // 파트너 메모

  // 알림
  notificationSent: boolean;     // 알림 전송 여부

  createdAt: Date;
  updatedAt: Date;
}

const RefundSchema = new Schema<IRefund>(
  {
    refundNumber: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['refund', 'exchange'],
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    orderNumber: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    partnerName: String,
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        productName: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        totalPrice: {
          type: Number,
          required: true,
        },
        imageUrl: String,
      },
    ],
    reason: {
      type: String,
      enum: [
        'change_of_mind',
        'defective_product',
        'wrong_product',
        'size_mismatch',
        'different_from_image',
        'delivery_delay',
        'other',
      ],
      required: true,
    },
    reasonDetail: {
      type: String,
      required: true,
    },
    images: [String],
    exchangeInfo: {
      newProductId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
      newProductName: String,
      newSize: String,
      newColor: String,
      additionalPayment: Number,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    refundAmount: {
      type: Number,
      required: true,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    refundShippingFee: {
      type: Number,
      default: 0,
    },
    deductionAmount: {
      type: Number,
      default: 0,
    },
    finalRefundAmount: {
      type: Number,
      required: true,
    },
    refundMethod: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'point'],
      required: true,
    },
    bankAccount: {
      bankName: String,
      accountNumber: String,
      accountHolder: String,
    },
    pickupAddress: {
      zipCode: {
        type: String,
        required: true,
      },
      address1: {
        type: String,
        required: true,
      },
      address2: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
    },
    pickupDate: Date,
    pickupCompletedAt: Date,
    courierCompany: String,
    trackingNumber: String,
    status: {
      type: String,
      enum: [
        'pending',
        'approved',
        'rejected',
        'pickup_requested',
        'pickup_completed',
        'inspecting',
        'completed',
        'cancelled',
      ],
      default: 'pending',
      required: true
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: Date,
    rejectedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: String,
    inspectionResult: {
      isPassed: Boolean,
      notes: String,
      inspector: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      inspectedAt: Date,
    },
    adminNotes: String,
    partnerNotes: String,
    notificationSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스 설정
RefundSchema.index({ userId: 1, createdAt: -1 });
RefundSchema.index({ status: 1, createdAt: -1 });
RefundSchema.index({ partnerId: 1, status: 1 });

// 환불/교환 번호 자동 생성
RefundSchema.statics.generateRefundNumber = async function (
  this: Model<IRefund>,
  type: RefundType
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = type === 'refund' ? 'RF' : 'EX';
  const fullPrefix = `${prefix}-${year}${month}`;

  const lastRefund = await this.findOne({
    refundNumber: new RegExp(`^${fullPrefix}`),
  }).sort({ refundNumber: -1 });

  let sequence = 1;
  if (lastRefund) {
    const lastSequence = parseInt(
      lastRefund.refundNumber.split('-')[2],
      10
    );
    sequence = lastSequence + 1;
  }

  return `${fullPrefix}-${String(sequence).padStart(4, '0')}`;
};

// 상태 변경 메서드
RefundSchema.methods.updateStatus = async function (
  this: IRefund,
  newStatus: RefundStatus,
  userId?: mongoose.Types.ObjectId,
  reason?: string
): Promise<IRefund> {
  const now = new Date();
  this.status = newStatus;

  switch (newStatus) {
    case 'approved':
      this.approvedAt = now;
      this.approvedBy = userId;
      break;
    case 'rejected':
      this.rejectedAt = now;
      this.rejectedBy = userId;
      this.rejectionReason = reason;
      break;
    case 'pickup_completed':
      this.pickupCompletedAt = now;
      break;
    case 'completed':
      this.completedAt = now;
      break;
    case 'cancelled':
      this.cancelledAt = now;
      break;
  }

  return this.save();
};

const Refund = (mongoose.models.Refund as IRefundModel) ||
  mongoose.model<IRefund, IRefundModel>('Refund', RefundSchema);

export default Refund;

