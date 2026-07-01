import * as dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// .env.local 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const testUsers = [
  { email: 'test@gleemile.com', name: 'Test User' },
  { email: 'test1@gleemile.com', name: 'Test User 1' },
  { email: 'test2@gleemile.com', name: 'Test User 2' },
  { email: 'test3@gleemile.com', name: 'Test User 3' },
];

async function seedUsers() {
  console.log('Firebase 테스트 계정 생성을 시작합니다...');
  
  // dotenv가 로드된 이후에 adminDb를 동적으로 임포트합니다.
  const { adminDb } = await import('./src/lib/firebase/admin');
  
  try {
    const passwordHash = await bcrypt.hash('test123', 12);
    
    for (const userData of testUsers) {
      const usersRef = adminDb.collection('users');
      // 기존에 이메일이 있는지 확인
      const snapshot = await usersRef.where('email', '==', userData.email).limit(1).get();
      
      if (!snapshot.empty) {
        console.log(`[SKIP] ${userData.email} 계정이 이미 존재합니다.`);
        continue;
      }

      // 새 문서 생성
      const newUserRef = usersRef.doc();
      await newUserRef.set({
        email: userData.email,
        name: userData.name,
        passwordHash,
        provider: 'local',
        globalRole: 'member',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`[SUCCESS] ${userData.email} 계정 생성 완료 (ID: ${newUserRef.id})`);
    }
    
    console.log('모든 테스트 계정 생성이 완료되었습니다!');
  } catch (error) {
    console.error('계정 생성 중 오류 발생:', error);
  }
}

seedUsers().then(() => process.exit(0));
