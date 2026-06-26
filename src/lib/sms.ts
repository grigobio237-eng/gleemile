// SMS 서비스 (실제 구현에서는 SMS API 사용)
// 예: AWS SNS, Twilio, 네이버 클라우드 플랫폼 등

export interface SMSData {
  to: string;
  message: string;
  from?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// SMS 전송
export async function sendSMS(data: SMSData): Promise<SMSResult> {
  try {
    // 실제 구현에서는 SMS API 호출
    // 예시: AWS SNS 사용
    /*
    const sns = new AWS.SNS({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });

    const params = {
      Message: data.message,
      PhoneNumber: data.to
    };

    const result = await sns.publish(params).promise();
    return {
      success: true,
      messageId: result.MessageId
    };
    */

    // 개발 환경에서는 콘솔에 출력
    console.log(`SMS to ${data.to}: ${data.message}`);
    
    return {
      success: true,
      messageId: `dev-${Date.now()}`
    };

  } catch (error) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SMS 전송에 실패했습니다.'
    };
  }
}

// SMS 템플릿
export const SMSTemplates = {
  orderConfirmed: (orderNumber: string, customerName: string) => ({
    to: '', // 실제로는 고객 전화번호
    message: `[Youniqle] ${customerName}님, 주문번호 ${orderNumber}이 확인되었습니다. 감사합니다.`
  }),

  orderShipped: (orderNumber: string, trackingNumber: string, customerName: string) => ({
    to: '', // 실제로는 고객 전화번호
    message: `[Youniqle] ${customerName}님, 주문번호 ${orderNumber}이 배송되었습니다. 운송장번호: ${trackingNumber}`
  }),

  orderDelivered: (orderNumber: string, customerName: string) => ({
    to: '', // 실제로는 고객 전화번호
    message: `[Youniqle] ${customerName}님, 주문번호 ${orderNumber}이 배송 완료되었습니다. 리뷰를 남겨주세요!`
  }),

  paymentReceived: (orderNumber: string, amount: number, customerName: string) => ({
    to: '', // 실제로는 고객 전화번호
    message: `[Youniqle] ${customerName}님, 주문번호 ${orderNumber}의 결제가 완료되었습니다. (${amount.toLocaleString()}원)`
  }),

  paymentFailed: (orderNumber: string, customerName: string) => ({
    to: '', // 실제로는 고객 전화번호
    message: `[Youniqle] ${customerName}님, 주문번호 ${orderNumber}의 결제에 실패했습니다. 다시 시도해주세요.`
  }),

  urgentAlert: (message: string, customerName: string) => ({
    to: '', // 실제로는 고객 전화번호
    message: `[Youniqle 긴급] ${customerName}님, ${message}`
  }),

  systemMaintenance: (startTime: string, endTime: string, customerName: string) => ({
    to: '', // 실제로는 고객 전화번호
    message: `[Youniqle] ${customerName}님, 시스템 점검으로 ${startTime}~${endTime} 서비스가 일시 중단됩니다.`
  }),

  promotionAlert: (promotionName: string, customerName: string) => ({
    to: '', // 실제로는 고객 전화번호
    message: `[Youniqle] ${customerName}님, ${promotionName} 프로모션이 시작되었습니다! 지금 확인해보세요.`
  }),

  securityAlert: (action: string, customerName: string) => ({
    to: '', // 실제로는 고객 전화번호
    message: `[Youniqle 보안] ${customerName}님, 계정에서 ${action}이 감지되었습니다. 본인이 아닌 경우 고객센터에 문의하세요.`
  })
};

// SMS 발송 함수들
export async function sendOrderConfirmationSMS(
  phone: string,
  orderNumber: string,
  customerName: string
): Promise<SMSResult> {
  const template = SMSTemplates.orderConfirmed(orderNumber, customerName);
  return await sendSMS({ ...template, to: phone });
}

export async function sendOrderShippedSMS(
  phone: string,
  orderNumber: string,
  trackingNumber: string,
  customerName: string
): Promise<SMSResult> {
  const template = SMSTemplates.orderShipped(orderNumber, trackingNumber, customerName);
  return await sendSMS({ ...template, to: phone });
}

export async function sendOrderDeliveredSMS(
  phone: string,
  orderNumber: string,
  customerName: string
): Promise<SMSResult> {
  const template = SMSTemplates.orderDelivered(orderNumber, customerName);
  return await sendSMS({ ...template, to: phone });
}

export async function sendPaymentReceivedSMS(
  phone: string,
  orderNumber: string,
  amount: number,
  customerName: string
): Promise<SMSResult> {
  const template = SMSTemplates.paymentReceived(orderNumber, amount, customerName);
  return await sendSMS({ ...template, to: phone });
}

export async function sendPaymentFailedSMS(
  phone: string,
  orderNumber: string,
  customerName: string
): Promise<SMSResult> {
  const template = SMSTemplates.paymentFailed(orderNumber, customerName);
  return await sendSMS({ ...template, to: phone });
}

export async function sendUrgentAlertSMS(
  phone: string,
  message: string,
  customerName: string
): Promise<SMSResult> {
  const template = SMSTemplates.urgentAlert(message, customerName);
  return await sendSMS({ ...template, to: phone });
}

export async function sendSystemMaintenanceSMS(
  phone: string,
  startTime: string,
  endTime: string,
  customerName: string
): Promise<SMSResult> {
  const template = SMSTemplates.systemMaintenance(startTime, endTime, customerName);
  return await sendSMS({ ...template, to: phone });
}

export async function sendPromotionAlertSMS(
  phone: string,
  promotionName: string,
  customerName: string
): Promise<SMSResult> {
  const template = SMSTemplates.promotionAlert(promotionName, customerName);
  return await sendSMS({ ...template, to: phone });
}

export async function sendSecurityAlertSMS(
  phone: string,
  action: string,
  customerName: string
): Promise<SMSResult> {
  const template = SMSTemplates.securityAlert(action, customerName);
  return await sendSMS({ ...template, to: phone });
}
