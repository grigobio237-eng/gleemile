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

// 관리자 알림 타입
export type AdminNotificationType = 
  | 'urgent_order'
  | 'payment_failed'
  | 'refund_request'
  | 'low_stock'
  | 'high_volume_order'
  | 'system_error';

// 관리자 알림 메시지 템플릿
const ADMIN_NOTIFICATION_TEMPLATES = {
  urgent_order: {
    subject: '🚨 긴급 처리 필요 - 장시간 미처리 주문',
    template: (data: any) => `
긴급 처리 필요 알림

주문번호: ${data.orderNumber}
고객: ${data.customerName} (${data.customerEmail})
주문 시간: ${data.orderTime}
처리 대기 시간: ${data.waitingTime}시간

이 주문은 2시간 이상 처리되지 않았습니다.
즉시 확인하여 처리해주세요.

주문 상세: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders
    `.trim()
  },
  payment_failed: {
    subject: '💳 결제 실패 알림',
    template: (data: any) => `
결제 실패 알림

주문번호: ${data.orderNumber}
고객: ${data.customerName} (${data.customerEmail})
결제 금액: ₩${data.amount.toLocaleString()}
실패 사유: ${data.reason || '알 수 없음'}

고객에게 연락하여 결제 방법을 안내해주세요.

주문 상세: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders
    `.trim()
  },
  refund_request: {
    subject: '💰 환불 요청 알림',
    template: (data: any) => `
환불 요청 알림

주문번호: ${data.orderNumber}
고객: ${data.customerName} (${data.customerEmail})
환불 금액: ₩${data.amount.toLocaleString()}
환불 사유: ${data.reason || '고객 요청'}

환불 처리를 진행해주세요.

주문 상세: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders
    `.trim()
  },
  low_stock: {
    subject: '📦 재고 부족 알림',
    template: (data: any) => `
재고 부족 알림

상품명: ${data.productName}
현재 재고: ${data.currentStock}개
최소 재고: ${data.minStock}개
파트너: ${data.partnerName}

재고를 보충하거나 상품을 비활성화해주세요.

상품 관리: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/products
    `.trim()
  },
  high_volume_order: {
    subject: '📈 대량 주문 알림',
    template: (data: any) => `
대량 주문 알림

주문번호: ${data.orderNumber}
고객: ${data.customerName} (${data.customerEmail})
주문 금액: ₩${data.amount.toLocaleString()}
상품 수: ${data.itemCount}개

대량 주문이 발생했습니다. 재고 및 배송 준비를 확인해주세요.

주문 상세: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders
    `.trim()
  },
  system_error: {
    subject: '⚠️ 시스템 오류 알림',
    template: (data: any) => `
시스템 오류 알림

오류 유형: ${data.errorType}
오류 메시지: ${data.errorMessage}
발생 시간: ${data.timestamp}
영향받은 기능: ${data.affectedFeature}

시스템을 점검하고 문제를 해결해주세요.

관리자 대시보드: ${process.env.NEXT_PUBLIC_SITE_URL}/admin
    `.trim()
  }
};

// 관리자 알림 발송
export async function sendAdminNotification(
  type: AdminNotificationType,
  data: any,
  adminEmails: string[] = []
) {
  try {
    // 기본 관리자 이메일 (환경변수에서 가져오거나 하드코딩)
    const defaultAdminEmails = [
      process.env.ADMIN_EMAIL || 'admin@youniqle.com'
    ];
    
    const recipients = adminEmails.length > 0 ? adminEmails : defaultAdminEmails;
    const template = ADMIN_NOTIFICATION_TEMPLATES[type];
    
    if (!template) {
      console.error(`알림 템플릿이 정의되지 않은 타입: ${type}`);
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: recipients.join(', '),
      subject: `[Youniqle 관리자] ${template.subject}`,
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
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              관리자 대시보드로 이동
            </a>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`관리자 알림 발송 완료: ${type}`);
    return true;
  } catch (error) {
    console.error('관리자 알림 발송 실패:', error);
    return false;
  }
}

// 주기적 알림 체크 (예: 5분마다 실행)
export async function checkAndSendPeriodicNotifications() {
  try {
    // 긴급 처리 필요한 주문 체크
    const urgentOrders = await checkUrgentOrders();
    if (urgentOrders.length > 0) {
      for (const order of urgentOrders) {
        await sendAdminNotification('urgent_order', {
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          orderTime: order.createdAt,
          waitingTime: Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60))
        });
      }
    }

    // 결제 실패 주문 체크
    const failedPayments = await checkFailedPayments();
    if (failedPayments.length > 0) {
      for (const payment of failedPayments) {
        await sendAdminNotification('payment_failed', {
          orderNumber: payment.orderNumber,
          customerName: payment.customerName,
          customerEmail: payment.customerEmail,
          amount: payment.amount,
          reason: payment.failureReason
        });
      }
    }

    // 재고 부족 상품 체크
    const lowStockProducts = await checkLowStockProducts();
    if (lowStockProducts.length > 0) {
      for (const product of lowStockProducts) {
        await sendAdminNotification('low_stock', {
          productName: product.name,
          currentStock: product.stock,
          minStock: product.minStock || 10,
          partnerName: product.partnerName
        });
      }
    }

  } catch (error) {
    console.error('주기적 알림 체크 실패:', error);
  }
}

// 긴급 처리 필요한 주문 조회
async function checkUrgentOrders(): Promise<Array<{
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
}>> {
  // 실제 구현에서는 데이터베이스에서 조회
  return [];
}

// 결제 실패 주문 조회
async function checkFailedPayments(): Promise<Array<{
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  failureReason?: string;
}>> {
  // 실제 구현에서는 데이터베이스에서 조회
  return [];
}

// 재고 부족 상품 조회
async function checkLowStockProducts(): Promise<Array<{
  name: string;
  stock: number;
  minStock?: number;
  partnerName: string;
}>> {
  // 실제 구현에서는 데이터베이스에서 조회
  return [];
}
