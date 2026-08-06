import { PaymentLinkOptions } from '@/lib/merchant-service';

export interface PaymentProvider {
  createLink(options: PaymentLinkOptions): Promise<{ paymentLinkUrl: string; orderId: string; expiresAt: Date }>;
  validateWebhook(payload: any): Promise<boolean>;
}

// ---------------------------------------------------------
// PortOne Provider 구현체 (Mock)
// ---------------------------------------------------------
class PortOneProvider implements PaymentProvider {
  private apiSecret: string;
  private storeId: string;

  constructor() {
    this.apiSecret = process.env.PORTONE_API_SECRET || '';
    this.storeId = process.env.PORTONE_STORE_ID || '';
  }

  async createLink(options: PaymentLinkOptions): Promise<{ paymentLinkUrl: string; orderId: string; expiresAt: Date }> {
    // 실제 포트원 V2 결제창(Checkout) 호출을 위한 파라미터 생성 준비
    // 백엔드에서 미리 결제 정보를 등록(Register)하거나, 프론트에 보낼 데이터를 포맷팅할 수 있습니다.
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + (options.expiresInMinutes ?? 15));

    // MVP 시나리오에서는 포트원 연동 전 가짜 링크를 생성합니다.
    const paymentLinkUrl = `https://gleemile.com/pay/${options.orderId}?amount=${options.amount}&name=${encodeURIComponent(options.orderName)}&provider=portone`;

    return {
      paymentLinkUrl,
      orderId: options.orderId,
      expiresAt,
    };
  }

  async validateWebhook(payload: any): Promise<boolean> {
    // 포트원 웹훅 검증 로직 구현
    // 헤더의 Webhook Signature 검증, 또는 결제내역 단건조회 API를 호출하여 상태 확인
    
    // [Mock] 간이 검증: Payload에 status === 'PAID' 이면 성공으로 간주
    if (payload && payload.status === 'PAID') {
      return true;
    }
    return false;
  }
}

// ---------------------------------------------------------
// Service Factory
// ---------------------------------------------------------
export class PaymentService {
  private provider: PaymentProvider;

  constructor(vendor: 'portone' | 'toss' = 'portone') {
    if (vendor === 'portone') {
      this.provider = new PortOneProvider();
    } else {
      // this.provider = new TossProvider();
      this.provider = new PortOneProvider();
    }
  }

  async createLink(options: PaymentLinkOptions) {
    return await this.provider.createLink(options);
  }

  async validateWebhook(payload: any) {
    return await this.provider.validateWebhook(payload);
  }
}

export const paymentService = new PaymentService('portone');
