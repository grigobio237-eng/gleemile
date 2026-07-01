import { adminDb } from '../firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { TeamRole } from '@/types/team';

// ==========================================
// 1. 유틸: 6자리 영문대문자+숫자 초대 코드 발급기
// ==========================================
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// ==========================================
// 2. 팀 생성 및 초대 코드 발급 트랜잭션
// (무한 재시도 및 고속 룩업 유니크 보장)
// ==========================================
export async function createTeamWithUniqueCode(teamName: string, creatorUserId: string) {
  try {
    // 트랜잭션 진입 전 팀 문서 ID 미리 발급
    const newTeamId = adminDb.collection('teams').doc().id;
    
    // runTransaction을 통해 Read-Modify-Write의 원자성(Atomicity) 보장
    const result = await adminDb.runTransaction(async (transaction) => {
      let code = '';
      let isUnique = false;
      let attempt = 0;
      
      // 트랜잭션 블록 내에서 중복 없는 유니크 코드를 찾을 때까지 재시도
      // (단, 무한 루프 방지를 위해 최대 10회로 제한. 36^6 ≒ 21억 확률이라 충돌 극히 희박)
      while (!isUnique && attempt < 10) {
        code = generateInviteCode();
        attempt++;
        
        // 최상위 컬렉션(team_codes) 단일 조회로 0.01초 고속 룩업
        const codeRef = adminDb.collection('team_codes').doc(code);
        const codeSnap = await transaction.get(codeRef);
        
        // 코드가 존재하지 않으면 (충돌 없음), 유니크 확정
        if (!codeSnap.exists) {
          isUnique = true;
          
          const teamRef = adminDb.collection('teams').doc(newTeamId);
          // 💡 합성 ID (teamId_userId) 구조 강제 적용
          const memberRef = adminDb.collection('team_members').doc(`${newTeamId}_${creatorUserId}`);
          
          // 1) 고속 룩업 맵핑 문서 원자적 생성
          transaction.set(codeRef, {
            teamId: newTeamId,
            expiredAt: null // 만료일 없음 (필요 시 지정 가능)
          });
          
          // 2) 팀 문서 생성
          transaction.set(teamRef, {
            name: teamName,
            inviteCode: code,
            createdAt: FieldValue.serverTimestamp()
          });
          
          // 3) 개설자 권한(owner) 셋업
          transaction.set(memberRef, {
            teamId: newTeamId,
            userId: creatorUserId,
            role: 'owner' as TeamRole,
            status: 'active',
            joinedAt: FieldValue.serverTimestamp()
          });
          
          return { teamId: newTeamId, inviteCode: code };
        }
      }
      
      throw new Error('초대 코드 발급에 실패했습니다. (유니크 충돌 임계치 초과)');
    });
    
    return result;
  } catch (error) {
    console.error('Team Creation Transaction Error:', error);
    throw error;
  }
}

// ==========================================
// 3. 초대 코드를 통한 가입 파이프라인
// (단일 트랜잭션 멱등성 및 원자적 처리)
// ==========================================
export async function joinTeamWithCode(inviteCode: string, userId: string, initialRole: TeamRole = 'member') {
  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      // 1) 입력된 6자리 코드로 팀 맵핑 문서 고속 검증
      const codeRef = adminDb.collection('team_codes').doc(inviteCode.toUpperCase());
      const codeSnap = await transaction.get(codeRef);
      
      if (!codeSnap.exists) {
        throw new Error('유효하지 않은 초대 코드입니다.');
      }
      
      const teamId = codeSnap.data()!.teamId;
      const expiredAt = codeSnap.data()!.expiredAt;
      
      // 만료기한 점검 (있는 경우)
      if (expiredAt && expiredAt < Date.now()) {
        throw new Error('만료된 초대 코드입니다.');
      }
      
      // 2) 가입 멱등성 보장 (Idempotency) 방화벽
      // 💡 합성 ID(`teamId_userId`) 조회를 통해 따닥 클릭이나 중복 가입을 원천 차단
      const syntheticId = `${teamId}_${userId}`;
      const memberRef = adminDb.collection('team_members').doc(syntheticId);
      const memberSnap = await transaction.get(memberRef);
      
      if (memberSnap.exists) {
        throw new Error('이미 가입된 팀입니다.');
      }
      
      // 3) 멱등성 방어벽 통과 시 원자적(Atomic) 멤버 생성
      transaction.set(memberRef, {
        teamId: teamId,
        userId: userId,
        role: initialRole,
        status: 'active',
        joinedAt: FieldValue.serverTimestamp()
      });
      
      return { teamId, syntheticId };
    });
    
    // (이후 가입 성공 시 클라이언트 측에서 update()를 호출하여 Next-Auth 세션 쿠키를 갱신하면 됨)
    return result;
  } catch (error) {
    console.error('Join Team Transaction Error:', error);
    throw error;
  }
}
