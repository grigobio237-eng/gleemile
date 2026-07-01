import { Timestamp, serverTimestamp, FieldValue, DocumentData, QueryDocumentSnapshot, SnapshotOptions, FirestoreDataConverter, PartialWithFieldValue } from 'firebase/firestore';

// ==========================================
// 1. 채팅 메시지 스펙 정의
// ==========================================
export interface ChatMessage {
  id: string; // 메시지 고유 ID (Firestore 문서 ID)
  senderId: string;
  senderRole: 'owner' | 'manager' | 'member' | 'guest'; // 방장/임원/방원/참관인
  content: string;
  createdAt: number; // 밀리초(ms) 단위의 Unix Timestamp (낙관적 UI 및 프론트 렌더링 최적화)
  attachmentUrl?: string; // (선택) Storage 이미지/미디어 다운로드 URL
}

// Firestore에 저장될 원본 데이터 형태
export interface ChatMessageFirestore {
  senderId: string;
  senderRole: 'owner' | 'manager' | 'member' | 'guest';
  content: string;
  createdAt: FieldValue | Timestamp; 
  attachmentUrl?: string;
}

// ==========================================
// 2. Firestore Custom Converter (낙관적 UI 및 Timestamp 방어벽)
// ==========================================
export const chatBlockConverter: FirestoreDataConverter<ChatMessage, DocumentData> = {
  // 클라이언트 -> Firestore 직렬화
  toFirestore: (message: PartialWithFieldValue<ChatMessage> | any): DocumentData => {
    // ⚠️ 순서 뒤틀림 방지: 클라이언트 시간 저장을 금지하고 serverTimestamp 강제 바인딩
    return {
      senderId: message.senderId,
      senderRole: message.senderRole,
      content: message.content,
      createdAt: serverTimestamp(),
      ...(message.attachmentUrl && { attachmentUrl: message.attachmentUrl })
    };
  },
  
  // Firestore -> 클라이언트 역직렬화
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): ChatMessage => {
    const data = snapshot.data(options);
    
    // ⚠️ 낙관적 UI (Optimistic UI) Null 방어벽
    // 메시지 전송 직후 로컬 캐시(Snapshot)에서는 serverTimestamp가 아직 서버에 도달하지 않아 null로 떨어짐.
    // 이 짧은 순간에 화면이 깨지거나 순서가 엉키는 것을 막기 위해 Date.now() 로컬 시간을 Fallback으로 꽂아줌.
    const createdAt = data.createdAt 
      ? (data.createdAt as Timestamp).toMillis() 
      : Date.now();

    return {
      id: snapshot.id,
      senderId: data.senderId,
      senderRole: data.senderRole,
      content: data.content,
      createdAt,
      attachmentUrl: data.attachmentUrl
    };
  }
};

// ==========================================
// 3. Storage 미디어 파이프라인 유틸리티
// ==========================================

/**
 * 이미지/파일 업로드 시 Storage 저장 경로를 안전하게 생성합니다.
 * 경로: teams/{teamId}/chat/{randomString}_{fileName}
 */
export const generateChatMediaStoragePath = (teamId: string, fileName: string): string => {
  const randomString = Math.random().toString(36).substring(2, 10);
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, ''); // 특수문자 방어
  return `teams/${teamId}/chat/${randomString}_${cleanFileName}`;
};
