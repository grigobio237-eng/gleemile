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

// 주문 상태별 알림 메시지
const STATUS_MESSAGES = {
  confirmed: {
    subject: '주문이 확인되었습니다',
    template: (orderNumber: string, customerName: string) => `
안녕하세요 ${customerName}님,

주문번호 ${orderNumber}의 주문이 확인되었습니다.
곧 상품 준비를 시작하겠습니다.

감사합니다.
Youniqle 팀
    `.trim()
  },
  preparing: {
    subject: '상품 준비를 시작했습니다',
    template: (orderNumber: string, customerName: string) => `
안녕하세요 ${customerName}님,

주문번호 ${orderNumber}의 상품 준비를 시작했습니다.
곧 배송 준비가 완료되면 배송을 시작하겠습니다.

감사합니다.
Youniqle 팀
    `.trim()
  },
  shipped: {
    subject: '배송이 시작되었습니다',
    template: (orderNumber: string, customerName: string) => `
안녕하세요 ${customerName}님,

주문번호 ${orderNumber}의 배송이 시작되었습니다.
배송 추적을 통해 상품 위치를 확인하실 수 있습니다.

감사합니다.
Youniqle 팀
    `.trim()
  },
  delivered: {
    subject: '배송이 완료되었습니다',
    template: (orderNumber: string, customerName: string) => `
안녕하세요 ${customerName}님,

주문번호 ${orderNumber}의 배송이 완료되었습니다.
상품을 받아보시고 만족스러우시다면 리뷰를 남겨주세요.

감사합니다.
Youniqle 팀
    `.trim()
  },
  cancelled: {
    subject: '주문이 취소되었습니다',
    template: (orderNumber: string, customerName: string) => `
안녕하세요 ${customerName}님,

주문번호 ${orderNumber}의 주문이 취소되었습니다.
환불 처리는 영업일 기준 3-5일 소요됩니다.

감사합니다.
Youniqle 팀
    `.trim()
  }
};

// 주문 상태 변경 알림 발송
export async function sendOrderStatusNotification(
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  status: keyof typeof STATUS_MESSAGES
) {
  try {
    const message = STATUS_MESSAGES[status];
    
    if (!message) {
      console.error(`알림 메시지가 정의되지 않은 상태: ${status}`);
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: customerEmail,
      subject: `[Youniqle] ${message.subject}`,
      text: message.template(orderNumber, customerName),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${message.subject}</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; line-height: 1.6;">${message.template(orderNumber, customerName).replace(/\n/g, '<br>')}</p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/orders" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              주문 내역 확인하기
            </a>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`주문 상태 알림 발송 완료: ${orderNumber} - ${status}`);
    return true;
  } catch (error) {
    console.error('주문 상태 알림 발송 실패:', error);
    return false;
  }
}

// 주문 취소 시 환불 알림
export async function sendRefundNotification(
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  refundAmount: number
) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: customerEmail,
      subject: '[Youniqle] 환불 처리 안내',
      text: `
안녕하세요 ${customerName}님,

주문번호 ${orderNumber}의 환불이 처리되었습니다.
환불 금액: ₩${refundAmount.toLocaleString()}

환불은 영업일 기준 3-5일 내에 원래 결제 수단으로 입금됩니다.

감사합니다.
Youniqle 팀
      `.trim(),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">환불 처리 안내</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>안녕하세요 ${customerName}님,</p>
            <p>주문번호 <strong>${orderNumber}</strong>의 환불이 처리되었습니다.</p>
            <p><strong>환불 금액: ₩${refundAmount.toLocaleString()}</strong></p>
            <p>환불은 영업일 기준 3-5일 내에 원래 결제 수단으로 입금됩니다.</p>
            <p>감사합니다.<br>Youniqle 팀</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`환불 알림 발송 완료: ${orderNumber}`);
    return true;
  } catch (error) {
    console.error('환불 알림 발송 실패:', error);
    return false;
  }
}
