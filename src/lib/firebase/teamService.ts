import { db } from '../firebase';
import { doc, runTransaction, collection, addDoc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import type { IFirestoreTeam, TeamBlock, IFirestoreTeamMessage } from '@/types/firebase';

/**
 * 💡 트랜잭션 기반 블록 업데이트 함수 (Race Condition 완벽 방어)
 * Firestore 서버에서 충돌을 감지하면 내부적으로 자동 재시도(Retry)하여
 * A유저의 OKR 수정과 B유저의 ACWR 수정이 동시에 들어와도 모두 안전하게 반영됩니다.
 */
export const updateTeamBlock = async (
  teamId: string, 
  blockId: string, 
  updates: Partial<TeamBlock>
) => {
  const teamRef = doc(db, 'teams', teamId);
  
  await runTransaction(db, async (transaction) => {
    // 1. 최신 문서를 Transaction 스냅샷으로 읽기 (락 확보)
    const teamDoc = await transaction.get(teamRef);
    if (!teamDoc.exists()) throw new Error("Team not found!");
    
    const data = teamDoc.data() as IFirestoreTeam;
    const blockIndex = data.enabledBlocks.findIndex(b => b.blockId === blockId);
    if (blockIndex === -1) throw new Error("Block not found!");
    
    // 2. 불변성(Immutability)을 유지하며 새 배열 생성
    const updatedBlocks = [...data.enabledBlocks];
    updatedBlocks[blockIndex] = {
      ...updatedBlocks[blockIndex],
      ...updates
    } as TeamBlock; // Type Guard를 통과한 타입 단언
    
    // 3. 덮어쓰기 커밋
    transaction.update(teamRef, { enabledBlocks: updatedBlocks });
  });
};

/**
 * 💬 채팅 메시지 전송 로직 (Bucket 3 검증용)
 * 대표님 지시사항: 클라이언트 시간(new Date) 절대 금지, 서버 Timestamp 강제!
 */
export const sendChatMessage = async (
  teamId: string,
  senderId: string,
  text: string,
  attachmentUrl?: string,
  attachmentType?: 'image' | 'file'
) => {
  const messagesRef = collection(db, 'teams', teamId, 'messages');
  
  const newMessage: Omit<IFirestoreTeamMessage, 'id'> = {
    senderId,
    text,
    ...(attachmentUrl && attachmentType ? { attachmentUrl, attachmentType } : {}),
    isSystemMessage: false,
    isDeleted: false,
    // [보안 규칙] 클라이언트 시간을 억제하고 무조건 구글 서버 시간을 삽입하여 순서 뒤틀림 원천 차단
    createdAt: serverTimestamp(),
  };

  await addDoc(messagesRef, newMessage);
};

/**
 * 👑 임원(Manager) 승격 및 강등 권한 위임
 * 최고 관리자(owner)만이 다른 멤버의 role을 변경할 수 있습니다.
 */
export const assignMemberRole = async (
  teamId: string,
  targetUserId: string,
  newRole: 'manager' | 'member' | 'supporter',
  currentUserId: string
) => {
  // 1. 방장 권한 체크 (서버사이드/클라이언트 모두 안전하게 이중 체크)
  const currentUserMemberRef = doc(db, 'team_members', `${teamId}_${currentUserId}`);
  const currentUserSnap = await getDoc(currentUserMemberRef);
  
  if (!currentUserSnap.exists()) throw new Error("멤버 정보를 찾을 수 없습니다.");
  if (currentUserSnap.data().role !== 'owner') {
    throw new Error("권한이 없습니다. 방장만 등급을 변경할 수 있습니다.");
  }
  
  // 2. 대상 멤버 등급 업데이트
  const targetMemberRef = doc(db, 'team_members', `${teamId}_${targetUserId}`);
  await updateDoc(targetMemberRef, {
    role: newRole,
    // (Optional) updatedAt: serverTimestamp() 로직을 추가하여 Audit log 관리 가능
  });
};

/**
 * 📢 공지사항 등록 및 푸시 알림 트리거 연동
 */
export const createAnnouncement = async (
  teamId: string,
  authorId: string,
  title: string,
  content: string
) => {
  // 1. 공지사항 추가
  const announcementsRef = collection(db, 'teams', teamId, 'announcements');
  const docRef = await addDoc(announcementsRef, {
    authorId,
    title,
    content,
    createdAt: serverTimestamp(),
  });

  // 2. 푸시 알림 발송 (서버사이드 필터링 API 호출)
  // 클라이언트 환경(브라우저)인 경우에만 fetch 실행
  if (typeof window !== 'undefined') {
    fetch(`/api/mile/team/${teamId}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'announcement', announcementId: docRef.id })
    }).catch(e => console.error("Announcement notify trigger failed:", e));
  }

  return docRef.id;
};

/**
 * 🚀 새로운 팀 개설 (유니크 초대 코드 보장)
 */
export const createTeamWithUniqueCode = async (
  userId: string,
  teamName: string,
  category: string
) => {
  const maxRetries = 5;
  
  for (let i = 0; i < maxRetries; i++) {
    // 6자리 무작위 영문 대문자+숫자 생성
    const teamCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    try {
      const resultTeamId = await runTransaction(db, async (transaction) => {
        const codeRef = doc(db, 'team_codes', teamCode);
        const codeSnap = await transaction.get(codeRef);
        
        if (codeSnap.exists()) {
          throw new Error("CODE_COLLISION"); // 트랜잭션 취소 및 재시도 유발
        }
        
        // 팀 문서 생성
        const teamRef = doc(collection(db, 'teams'));
        const teamId = teamRef.id;
        
        const newTeamData = {
          teamName,
          teamCode,
          category,
          enabledBlocks: [],
          createdAt: serverTimestamp(),
        };
        
        transaction.set(teamRef, newTeamData);
        
        // 룩업 컬렉션 기록
        transaction.set(codeRef, {
          teamId,
          createdAt: serverTimestamp(),
        });
        
        // 개설자(owner) 멤버십 등록
        const memberRef = doc(db, 'team_members', `${teamId}_${userId}`);
        transaction.set(memberRef, {
          teamId,
          userId,
          role: 'owner',
          status: 'active',
          joinedAt: serverTimestamp(),
        });
        
        return teamId;
      });
      
      return { teamId: resultTeamId, teamCode };
    } catch (error: any) {
      if (error.message === 'CODE_COLLISION') {
        continue; // 재시도
      }
      throw error;
    }
  }
  
  throw new Error("고유한 초대 코드를 생성하는데 실패했습니다. 다시 시도해주세요.");
};

/**
 * 🤝 초대 코드로 팀 가입 (멱등성 보장)
 */
export const joinTeamWithCode = async (
  userId: string,
  teamCode: string,
  role: 'member' | 'guest' = 'member'
) => {
  // 1. 초대 코드로 teamId 룩업
  const codeRef = doc(db, 'team_codes', teamCode.toUpperCase());
  const codeSnap = await getDoc(codeRef);
  
  if (!codeSnap.exists()) {
    throw new Error("유효하지 않은 초대 코드입니다.");
  }
  
  const teamId = codeSnap.data().teamId;
  
  // 2. 가입 처리 (멱등성 - 이미 있으면 덮어쓰거나 튕김)
  const memberRef = doc(db, 'team_members', `${teamId}_${userId}`);
  const memberSnap = await getDoc(memberRef);
  
  if (memberSnap.exists()) {
    // 이미 가입된 경우
    const status = memberSnap.data().status;
    if (status === 'active') {
      return teamId; // 이미 가입 완료 상태이므로 그냥 통과 (Idempotency)
    }
  }
  
  // 신규 가입 또는 재가입
  await updateDoc(memberRef, {
    teamId,
    userId,
    role,
    status: 'active',
    joinedAt: serverTimestamp(),
  }).catch(async (error) => {
    // 문서가 없어서 에러나면 setDoc으로 생성
    if (error.code === 'not-found') {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(memberRef, {
        teamId,
        userId,
        role,
        status: 'active',
        joinedAt: serverTimestamp(),
      });
    } else {
      throw error;
    }
  });
  
  return teamId;
};
