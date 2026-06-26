import mongoose, { Schema, Document, Model } from 'mongoose';

// 정산 상태 타입
export type SettlementStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// 정산 타입
export type SettlementType = 'monthly' | 'manual' | 'adjustment';

// 정산 상세 항목 인터페이스
export interface ISettlementItem {
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  productName: string;
  quantity: number;
  orderAmount: number;      // 주문 금액
  commissionRate: number;    // 수수료율 (%)
  commissionAmount: number;  // 수수료 금액
  settlementAmount: number;  // 정산 금액 (주문금액 - 수수료)
  orderDate: Date;
  orderStatus: string;
}

// 정산 모델 인터페이스 (static 메서드용)
export interface ISettlementModel extends Model<ISettlement> {
  generateSettlementNumber(): Promise<string>;
}

// 정산 인터페이스
export interface ISettlement extends Document {
  partnerId: mongoose.Types.ObjectId;
  partnerName: string;
  partnerEmail: string;

  // 메서드
  updateStatus(
    newStatus: SettlementStatus,
    adminId?: mongoose.Types.ObjectId,
    reason?: string
  ): Promise<ISettlement>;

  // 정산 기본 정보
  settlementNumber: string;  // 정산 번호 (예: STL-202501-001)
  type: SettlementType;
  status: SettlementStatus;

  // 정산 기간
  periodStart: Date;
  periodEnd: Date;

  // 정산 금액 정보
  items: ISettlementItem[];
  totalOrders: number;           // 총 주문 건수
  totalOrderAmount: number;      // 총 주문 금액
  totalCommissionAmount: number; // 총 수수료 금액
  totalSettlementAmount: number; // 총 정산 금액 (실제 지급액)

  // 추가 비용 및 조정
  additionalFees?: {
    name: string;
    amount: number;
    reason?: string;
  }[];
  adjustmentAmount?: number;     // 조정 금액 (양수: 추가, 음수: 차감)
  adjustmentReason?: string;     // 조정 사유

  // 정산 계좌 정보 (스냅샷)
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };

  // 세금 정보
  taxInfo?: {
    vatAmount?: number;           // 부가세
    incomeTaxAmount?: number;     // 소득세
    residentTaxAmount?: number;   // 주민세
  };

  // 정산 처리 정보
  requestedAt?: Date;            // 정산 요청 일시
  approvedAt?: Date;             // 승인 일시
  approvedBy?: mongoose.Types.ObjectId; // 승인자 (관리자 ID)
  processedAt?: Date;            // 처리 완료 일시 (입금 완료)
  completedAt?: Date;            // 정산 완료 일시

  // 취소/실패 정보
  cancelledAt?: Date;
  cancelReason?: string;
  failedAt?: Date;
  failReason?: string;

  // 메모 및 첨부
  adminNotes?: string;           // 관리자 메모
  partnerNotes?: string;         // 파트너 메모
  attachments?: string[];        // 첨부 파일 (증빙 서류 등)

  // 알림 상태
  notificationSent: boolean;     // 정산 완료 알림 전송 여부

  createdAt: Date;
  updatedAt: Date;
}

const SettlementSchema = new Schema<ISettlement>(
  {
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    partnerName: {
      type: String,
      required: true,
    },
    partnerEmail: {
      type: String,
      required: true,
    },
    settlementNumber: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['monthly', 'manual', 'adjustment'],
      default: 'monthly',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      required: true
    },
    periodStart: {
      type: Date,
      required: true
    },
    periodEnd: {
      type: Date,
      required: true
    },
    items: [
      {
        orderId: {
          type: Schema.Types.ObjectId,
          ref: 'Order',
          required: true,
        },
        orderNumber: String,
        productName: String,
        quantity: Number,
        orderAmount: Number,
        commissionRate: Number,
        commissionAmount: Number,
        settlementAmount: Number,
        orderDate: Date,
        orderStatus: String,
      },
    ],
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalOrderAmount: {
      type: Number,
      default: 0,
    },
    totalCommissionAmount: {
      type: Number,
      default: 0,
    },
    totalSettlementAmount: {
      type: Number,
      default: 0,
    },
    additionalFees: [
      {
        name: String,
        amount: Number,
        reason: String,
      },
    ],
    adjustmentAmount: Number,
    adjustmentReason: String,
    bankAccount: {
      bankName: {
        type: String,
        required: true,
      },
      accountNumber: {
        type: String,
        required: true,
      },
      accountHolder: {
        type: String,
        required: true,
      },
    },
    taxInfo: {
      vatAmount: Number,
      incomeTaxAmount: Number,
      residentTaxAmount: Number,
    },
    requestedAt: Date,
    approvedAt: Date,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    processedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancelReason: String,
    failedAt: Date,
    failReason: String,
    adminNotes: String,
    partnerNotes: String,
    attachments: [String],
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
SettlementSchema.index({ partnerId: 1, periodStart: -1 });
SettlementSchema.index({ status: 1, createdAt: -1 });

// 정산 번호 자동 생성 메서드
SettlementSchema.statics.generateSettlementNumber = async function (
  this: Model<ISettlement>
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `STL-${year}${month}`;

  // 이번 달의 마지막 정산 번호 찾기
  const lastSettlement = await this.findOne({
    settlementNumber: new RegExp(`^${prefix}`),
  }).sort({ settlementNumber: -1 });

  let sequence = 1;
  if (lastSettlement) {
    const lastSequence = parseInt(
      lastSettlement.settlementNumber.split('-')[2],
      10
    );
    sequence = lastSequence + 1;
  }

  return `${prefix}-${String(sequence).padStart(3, '0')}`;
};

// 가상 필드: 최종 지급액 (정산금액 + 조정금액 - 추가비용 - 세금)
SettlementSchema.virtual('finalPaymentAmount').get(function (this: ISettlement) {
  let amount = this.totalSettlementAmount;

  // 조정 금액 반영
  if (this.adjustmentAmount) {
    amount += this.adjustmentAmount;
  }

  // 추가 비용 차감
  if (this.additionalFees && this.additionalFees.length > 0) {
    const totalFees = this.additionalFees.reduce((sum, fee) => sum + fee.amount, 0);
    amount -= totalFees;
  }

  // 세금 차감
  if (this.taxInfo) {
    if (this.taxInfo.vatAmount) amount -= this.taxInfo.vatAmount;
    if (this.taxInfo.incomeTaxAmount) amount -= this.taxInfo.incomeTaxAmount;
    if (this.taxInfo.residentTaxAmount) amount -= this.taxInfo.residentTaxAmount;
  }

  return Math.max(0, amount); // 음수 방지
});

// 정산 상태 변경 메서드
SettlementSchema.methods.updateStatus = async function (
  this: ISettlement,
  newStatus: SettlementStatus,
  adminId?: mongoose.Types.ObjectId,
  reason?: string
): Promise<ISettlement> {
  const now = new Date();

  this.status = newStatus;

  switch (newStatus) {
    case 'processing':
      if (!this.approvedAt) {
        this.approvedAt = now;
        this.approvedBy = adminId;
      }
      break;
    case 'completed':
      this.completedAt = now;
      this.processedAt = now;
      break;
    case 'failed':
      this.failedAt = now;
      this.failReason = reason;
      break;
    case 'cancelled':
      this.cancelledAt = now;
      this.cancelReason = reason;
      break;
  }

  return this.save();
};

// JSON 변환 시 가상 필드 포함
SettlementSchema.set('toJSON', { virtuals: true });
SettlementSchema.set('toObject', { virtuals: true });

const Settlement = (mongoose.models.Settlement as ISettlementModel) ||
  mongoose.model<ISettlement, ISettlementModel>('Settlement', SettlementSchema);

export default Settlement;

