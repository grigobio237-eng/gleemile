import nodemailer from 'nodemailer';

// 이메일 설정
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 파트너 알림 타입
export type PartnerNotificationType = 
  | 'low_stock'
  | 'out_of_stock'
  | 'new_order'
  | 'order_cancelled'
  | 'payment_received'
  | 'inventory_adjustment';

// 파트너 알림 메시지 템플릿
const PARTNER_NOTIFICATION_TEMPLATES = {
  low_stock: {
    subject: '⚠️ 재고 부족 알림',
    template: (data: any) => `
재고 부족 알림

상품명: ${data.productName}
현재 재고: ${data.currentStock}개
최소 재고: ${data.minStock}개
가용 재고: ${data.availableStock}개

재고를 보충하거나 최소 재고 수준을 조정해주세요.

상품 관리: ${process.env.NEXT_PUBLIC_SITE_URL}/partner/inventory
    `.trim()
  },
  out_of_stock: {
    subject: '🚨 품절 알림',
    template: (data: any) => `
품절 알림

상품명: ${data.productName}
현재 재고: ${data.currentStock}개

상품이 품절되었습니다. 재고를 보충하거나 상품을 비활성화해주세요.

상품 관리: ${process.env.NEXT_PUBLIC_SITE_URL}/partner/inventory
    `.trim()
  },
  new_order: {
    subject: '🛒 새 주문 알림',
    template: (data: any) => `
새 주문 알림

주문번호: ${data.orderNumber}
고객: ${data.customerName}
주문 금액: ₩${data.totalAmount.toLocaleString()}
상품 수: ${data.itemCount}개

새로운 주문이 들어왔습니다. 확인 후 처리해주세요.

주문 관리: ${process.env.NEXT_PUBLIC_SITE_URL}/partner/orders
    `.trim()
  },
  order_cancelled: {
    subject: '❌ 주문 취소 알림',
    template: (data: any) => `
주문 취소 알림

주문번호: ${data.orderNumber}
고객: ${data.customerName}
취소 사유: ${data.reason || '고객 요청'}

주문이 취소되었습니다. 재고가 자동으로 복구됩니다.

주문 관리: ${process.env.NEXT_PUBLIC_SITE_URL}/partner/orders
    `.trim()
  },
  payment_received: {
    subject: '💰 결제 완료 알림',
    template: (data: any) => `
결제 완료 알림

주문번호: ${data.orderNumber}
고객: ${data.customerName}
결제 금액: ₩${data.amount.toLocaleString()}
예상 수수료: ₩${data.commission.toLocaleString()}

결제가 완료되었습니다. 상품 준비를 시작해주세요.

주문 관리: ${process.env.NEXT_PUBLIC_SITE_URL}/partner/orders
    `.trim()
  },
  inventory_adjustment: {
    subject: '📦 재고 조정 알림',
    template: (data: any) => `
재고 조정 알림

상품명: ${data.productName}
조정량: ${data.adjustment > 0 ? '+' : ''}${data.adjustment}개
조정 사유: ${data.reason}
조정 후 재고: ${data.newStock}개

재고가 조정되었습니다.

재고 관리: ${process.env.NEXT_PUBLIC_SITE_URL}/partner/inventory
    `.trim()
  }
};

// 파트너 알림 발송
export async function sendPartnerNotification(
  type: PartnerNotificationType,
  data: any,
  partnerEmail: string
) {
  try {
    const template = PARTNER_NOTIFICATION_TEMPLATES[type];
    
    if (!template) {
      console.error(`파트너 알림 템플릿이 정의되지 않은 타입: ${type}`);
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: partnerEmail,
      subject: `[Youniqle 파트너] ${template.subject}`,
      text: template.template(data),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-bottom: 20px;">${template.subject}</h2>
            <div style="background-color: white; padding: 20px; border-radius: 4px; border-left: 4px solid #007bff;">
              <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; line-height: 1.6; margin: 0;">${template.template(data)}</pre>
            </div>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/partner" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              파트너 대시보드로 이동
            </a>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`파트너 알림 발송 완료: ${type} - ${partnerEmail}`);
    return true;
  } catch (error) {
    console.error('파트너 알림 발송 실패:', error);
    return false;
  }
}

// 재고 부족 알림 발송
export async function sendLowStockNotification(
  productId: string,
  productName: string,
  currentStock: number,
  minStock: number,
  availableStock: number,
  partnerEmail: string
) {
  return await sendPartnerNotification('low_stock', {
    productName,
    currentStock,
    minStock,
    availableStock
  }, partnerEmail);
}

// 품절 알림 발송
export async function sendOutOfStockNotification(
  productId: string,
  productName: string,
  currentStock: number,
  partnerEmail: string
) {
  return await sendPartnerNotification('out_of_stock', {
    productName,
    currentStock
  }, partnerEmail);
}

// 새 주문 알림 발송
export async function sendNewOrderNotification(
  orderNumber: string,
  customerName: string,
  totalAmount: number,
  itemCount: number,
  partnerEmail: string
) {
  return await sendPartnerNotification('new_order', {
    orderNumber,
    customerName,
    totalAmount,
    itemCount
  }, partnerEmail);
}

// 주문 취소 알림 발송
export async function sendOrderCancelledNotification(
  orderNumber: string,
  customerName: string,
  reason: string,
  partnerEmail: string
) {
  return await sendPartnerNotification('order_cancelled', {
    orderNumber,
    customerName,
    reason
  }, partnerEmail);
}

// 결제 완료 알림 발송
export async function sendPaymentReceivedNotification(
  orderNumber: string,
  customerName: string,
  amount: number,
  commission: number,
  partnerEmail: string
) {
  return await sendPartnerNotification('payment_received', {
    orderNumber,
    customerName,
    amount,
    commission
  }, partnerEmail);
}

// 재고 조정 알림 발송
export async function sendInventoryAdjustmentNotification(
  productName: string,
  adjustment: number,
  reason: string,
  newStock: number,
  partnerEmail: string
) {
  return await sendPartnerNotification('inventory_adjustment', {
    productName,
    adjustment,
    reason,
    newStock
  }, partnerEmail);
}


