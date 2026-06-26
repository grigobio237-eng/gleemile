import nodemailer from 'nodemailer';

// 하이웍스 메일 전용 설정
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hiworks.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // 465 포트면 true, 587 포트면 false
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // 하이웍스 메일 서버 인증서 설정
    rejectUnauthorized: false
  }
});

export async function sendVerificationEmail(email: string, token: string, name: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '[Youniqle] 이메일 인증이 필요합니다',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Malgun Gothic', Arial, sans-serif;">
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
            주식회사 사피에넷 | 서울특별시 강동구 고덕비즈밸리로 26 | 1577-0729
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully to:', email);
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
    subject: '[Youniqle] 회원가입을 환영합니다!',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Malgun Gothic', Arial, sans-serif;">
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
            주식회사 사피에넷 | 서울특별시 강동구 고덕비즈밸리로 26 | 1577-0729
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully to:', email);
    return { success: true };
  } catch (error) {
    console.error('Welcome email sending error:', error);
    return { success: false, error: '환영 이메일 발송에 실패했습니다.' };
  }
}

