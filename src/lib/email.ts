import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // 465 포트는 SSL 사용
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Gmail 등 표준 SMTP 서버는 아래 tls 설정 없이도 잘 작동합니다.
});

export async function sendVerificationEmail(email: string, token: string, name: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Youniqle 이메일 인증',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #3B82F6, #10B981); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Youniqle</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">프리미엄을 더 공정하게</p>
        </div>
        
        <div style="padding: 40px; background: #ffffff;">
          <h2 style="color: #1F2937; margin: 0 0 20px 0; font-size: 24px;">이메일 인증이 필요합니다</h2>
          
          <p style="color: #6B7280; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            안녕하세요, ${name}님!<br>
            Youniqle 회원가입을 완료하려면 이메일 인증이 필요합니다.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              이메일 인증하기
            </a>
          </div>
          
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
            위 버튼이 작동하지 않는다면 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
            <a href="${verificationUrl}" style="color: #3B82F6; word-break: break-all;">${verificationUrl}</a>
          </p>
          
          <div style="margin-top: 30px; padding: 20px; background: #F9FAFB; border-radius: 8px;">
            <p style="color: #6B7280; font-size: 12px; margin: 0;">
              ⚠️ 이 링크는 24시간 후에 만료됩니다.<br>
              만약 회원가입을 요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다.
            </p>
          </div>
        </div>
        
        <div style="background: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #6B7280; font-size: 12px; margin: 0;">
            © 2024 Youniqle. All rights reserved.<br>
            서울특별시 강동구 고덕비즈밸리로 26 | 1577-0729
          </p>
        </div>
      </div>
    `,
  };

  // 개발 환경에서는 실제 이메일 발송을 스킵하고 성공으로 처리
  if (process.env.NODE_ENV === 'development') {
    console.log('[DEV] Verification Email Skipped. URL:', verificationUrl);
    return { success: true };
  }

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: '이메일 발송에 실패했습니다.' };
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Youniqle에 오신 것을 환영합니다!',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #3B82F6, #10B981); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Youniqle</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">프리미엄을 더 공정하게</p>
        </div>
        
        <div style="padding: 40px; background: #ffffff;">
          <h2 style="color: #1F2937; margin: 0 0 20px 0; font-size: 24px;">환영합니다! 🎉</h2>
          
          <p style="color: #6B7280; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            안녕하세요, ${name}님!<br>
            Youniqle 회원가입이 완료되었습니다.
          </p>
          
          <div style="background: #F0F9FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1E40AF; margin: 0 0 10px 0; font-size: 18px;">🎁 신규 회원 혜택</h3>
            <ul style="color: #1E40AF; margin: 0; padding-left: 20px;">
              <li>10% 할인 쿠폰 (첫 구매 시 사용 가능)</li>
              <li>무료 배송 (3만원 이상 구매 시)</li>
              <li>멤버십 포인트 적립</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/products" 
               style="display: inline-block; background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              쇼핑 시작하기
            </a>
          </div>
        </div>
        
        <div style="background: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #6B7280; font-size: 12px; margin: 0;">
            © 2024 Youniqle. All rights reserved.<br>
            서울특별시 강동구 고덕비즈밸리로 26 | 1577-0729
          </p>
        </div>
      </div>
    `,
  };

  // 개발 환경에서는 실제 이메일 발송을 스킵하고 성공으로 처리
  if (process.env.NODE_ENV === 'development') {
    console.log('[DEV] Welcome Email Skipped for:', email);
    return { success: true };
  }

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Welcome email sending error:', error);
    return { success: false, error: '환영 이메일 발송에 실패했습니다.' };
  }
}

// 뉴스레터 인증 이메일 발송
export async function sendNewsletterVerificationEmail(email: string, token: string, name: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/newsletter/verify?token=${token}&email=${encodeURIComponent(email)}`;
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/newsletter/unsubscribe?token=${token}&email=${encodeURIComponent(email)}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Youniqle 뉴스레터 구독 인증',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #3B82F6, #10B981); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Youniqle</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">프리미엄을 더 공정하게</p>
        </div>
        
        <div style="padding: 40px; background: #ffffff;">
          <h2 style="color: #1F2937; margin: 0 0 20px 0; font-size: 24px;">뉴스레터 구독 인증</h2>
          
          <p style="color: #6B7280; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            안녕하세요, ${name}님!<br>
            Youniqle 뉴스레터 구독을 완료하려면 이메일 인증이 필요합니다.
          </p>
          
          <div style="background: #F0F9FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1E40AF; margin: 0 0 10px 0; font-size: 18px;">📧 뉴스레터 혜택</h3>
            <ul style="color: #1E40AF; margin: 0; padding-left: 20px;">
              <li>신상품 소식 및 특별 할인 정보</li>
              <li>회원 전용 이벤트 및 프로모션</li>
              <li>브랜드 스토리 및 트렌드 정보</li>
              <li>파트너 업체 소식 (선택사항)</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              구독 인증하기
            </a>
          </div>
          
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
            위 버튼이 작동하지 않는다면 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
            <a href="${verificationUrl}" style="color: #3B82F6; word-break: break-all;">${verificationUrl}</a>
          </p>
          
          <div style="margin-top: 30px; padding: 20px; background: #F9FAFB; border-radius: 8px;">
            <p style="color: #6B7280; font-size: 12px; margin: 0;">
              ⚠️ 이 링크는 24시간 후에 만료됩니다.<br>
              구독을 원하지 않으신다면 <a href="${unsubscribeUrl}" style="color: #3B82F6;">여기</a>를 클릭하세요.
            </p>
          </div>
        </div>
        
        <div style="background: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #6B7280; font-size: 12px; margin: 0;">
            © 2024 Youniqle. All rights reserved.<br>
            서울특별시 강동구 고덕비즈밸리로 26 | 1577-0729
          </p>
        </div>
      </div>
    `,
  };

  // 개발 환경에서는 실제 이메일 발송을 스킵하고 성공으로 처리
  if (process.env.NODE_ENV === 'development') {
    console.log('[DEV] Newsletter Verification Email Skipped. URL:', verificationUrl);
    return { success: true };
  }

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Newsletter verification email sending error:', error);
    return { success: false, error: '뉴스레터 인증 이메일 발송에 실패했습니다.' };
  }
}

// 뉴스레터 발송
export async function sendNewsletterEmail(
  email: string,
  name: string,
  subject: string,
  content: string,
  unsubscribeToken?: string
) {
  const unsubscribeUrl = unsubscribeToken
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/newsletter/unsubscribe?token=${unsubscribeToken}&email=${encodeURIComponent(email)}`
    : `${process.env.NEXT_PUBLIC_SITE_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `[Youniqle 뉴스레터] ${subject}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #3B82F6, #10B981); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Youniqle</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">프리미엄을 더 공정하게</p>
        </div>
        
        <div style="padding: 40px; background: #ffffff;">
          <h2 style="color: #1F2937; margin: 0 0 20px 0; font-size: 24px;">${subject}</h2>
          
          <div style="color: #6B7280; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            ${content}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/products" 
               style="display: inline-block; background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              쇼핑하러 가기
            </a>
          </div>
        </div>
        
        <div style="background: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #6B7280; font-size: 12px; margin: 0 0 10px 0;">
            © 2024 Youniqle. All rights reserved.<br>
            서울특별시 강동구 고덕비즈밸리로 26 | 1577-0729
          </p>
          <p style="color: #9CA3AF; font-size: 11px; margin: 0;">
            <a href="${unsubscribeUrl}" style="color: #9CA3AF; text-decoration: none;">구독 해지</a>
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Newsletter email sending error:', error);
    return { success: false, error: '뉴스레터 발송에 실패했습니다.' };
  }
}

// 범용 이메일 전송 함수
export async function sendEmail(to: string, subject: string, html: string, text?: string) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}
