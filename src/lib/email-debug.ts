import nodemailer from 'nodemailer';

// 하이웍스 메일 디버깅용 설정
async function testHiworksConnection() {
  console.log('하이웍스 메일 연결 테스트 시작...');
  
  // 설정 1: SSL 포트 465
  const transporter1 = nodemailer.createTransport({
    host: 'smtps.hiworks.com',
    port: 465,
    secure: true,
    auth: {
      user: 'suchwawa@sapienet.com',
      pass: 'BOWThAvYpjArHiqoTTNk',
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // 설정 2: STARTTLS 포트 587
  const transporter2 = nodemailer.createTransport({
    host: 'smtps.hiworks.com',
    port: 587,
    secure: false,
    auth: {
      user: 'suchwawa@sapienet.com',
      pass: 'BOWThAvYpjArHiqoTTNk',
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // 설정 3: 일반 smtp 서버
  const transporter3 = nodemailer.createTransport({
    host: 'smtp.hiworks.com',
    port: 587,
    secure: false,
    auth: {
      user: 'suchwawa@sapienet.com',
      pass: 'BOWThAvYpjArHiqoTTNk',
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const configs = [
    { name: 'SSL 465', transporter: transporter1 },
    { name: 'STARTTLS 587', transporter: transporter2 },
    { name: '일반 SMTP 587', transporter: transporter3 }
  ];

  for (const config of configs) {
    try {
      console.log(`\n${config.name} 설정 테스트 중...`);
      await config.transporter.verify();
      console.log(`✅ ${config.name} 연결 성공!`);
      
      // 실제 메일 발송 테스트
      const info = await config.transporter.sendMail({
        from: 'suchwawa@sapienet.com',
        to: 'test@example.com',
        subject: '테스트 메일',
        text: '하이웍스 메일 테스트입니다.'
      });
      
      console.log(`✅ ${config.name} 메일 발송 성공!`, info.messageId);
      return config;
      
    } catch (error) {
      console.log(`❌ ${config.name} 실패:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  console.log('\n모든 설정이 실패했습니다. 하이웍스 메일 설정을 다시 확인해주세요.');
}

testHiworksConnection();

