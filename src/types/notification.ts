import { Timestamp, FieldValue, DocumentData, QueryDocumentSnapshot, SnapshotOptions, serverTimestamp } from 'firebase/firestore';

// ==========================================
// 1. FCM 푸시 토큰 스펙 (users/{userId}/fcmTokens/{tokenString})
// ==========================================
export interface FCMTokenDocument {
  token: string;
  deviceInfo?: string; // 예: "iOS 16, iPhone 14 Pro" 또는 브라우저 UA
  createdAt: number;   // 밀리초(ms) 단위 Timestamp
  lastUpdatedAt: number;
}

export interface FCMTokenFirestore {
  token: string;
  deviceInfo?: string;
  createdAt: Timestamp | FieldValue;
  lastUpdatedAt: Timestamp | FieldValue;
}

// ==========================================
// 2. FCM Token Firestore Converter
// ==========================================
export const fcmTokenConverter = {
  // 클라이언트 -> Firestore (토큰 등록/업데이트 시)
  toFirestore: (tokenDoc: Partial<FCMTokenDocument> | any): DocumentData => {
    return {
      token: tokenDoc.token,
      ...(tokenDoc.deviceInfo && { deviceInfo: tokenDoc.deviceInfo }),
      createdAt: tokenDoc.createdAt ? tokenDoc.createdAt : serverTimestamp(),
      lastUpdatedAt: serverTimestamp() // 등록/갱신 시마다 업데이트
    };
  },
  
  // Firestore -> 클라이언트 (조회 시)
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): FCMTokenDocument => {
    const data = snapshot.data(options);
    
    return {
      token: snapshot.id, // 문서 ID가 곧 토큰 스트링
      deviceInfo: data.deviceInfo,
      createdAt: data.createdAt ? (data.createdAt as Timestamp).toMillis() : Date.now(),
      lastUpdatedAt: data.lastUpdatedAt ? (data.lastUpdatedAt as Timestamp).toMillis() : Date.now(),
    };
  }
};

// ==========================================
// 3. 유저별 알림 설정 (Opt-out) 메타데이터 타입
// ==========================================
export interface NotificationSettings {
  isAllEnabled: boolean; // 전체 알림 마스터 스위치
  chatEnabled: boolean;  // 채팅 알림
  announcementEnabled: boolean; // 공지사항 알림
  marketingEnabled: boolean; // 마케팅 알림
}
