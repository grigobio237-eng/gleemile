import { Timestamp, FieldValue, DocumentData, QueryDocumentSnapshot, SnapshotOptions, serverTimestamp, FirestoreDataConverter, PartialWithFieldValue } from 'firebase/firestore';

// ==========================================
// 1. 역할 기반 권한 체계 (Role-based Access Control)
// ==========================================
export type TeamRole = 'owner' | 'manager' | 'member' | 'guest'; // 방장 | 임원 | 방원 | 참관인

// ==========================================
// 2. 도큐먼트 스펙 (Document Schemas)
// ==========================================

// 경로: teams/{teamId}
export interface TeamDocument {
  id?: string;
  name: string;
  inviteCode: string; // 6자리 난수 영문+숫자 혼합
  createdAt: number;
}

// 경로: team_codes/{6자리난수코드} (고속 룩업 최상위 컬렉션)
export interface TeamCodeDocument {
  teamId: string;
  expiredAt: number | null; // null이면 만료 없음, 특정 일자 지정 시 Unix Timestamp
}

// 경로: team_members/{teamId_userId} (합성 ID 기반 가입 멱등성 보장)
export interface TeamMemberDocument {
  id?: string; // 합성 ID: `${teamId}_${userId}`
  teamId: string;
  userId: string;
  role: TeamRole;
  status: 'active' | 'inactive' | 'pending';
  joinedAt: number;
}

// ==========================================
// 3. 파이어스토어 컨버터 (Type-safe Converters)
// ==========================================

export const teamMemberConverter: FirestoreDataConverter<TeamMemberDocument, DocumentData> = {
  toFirestore: (member: PartialWithFieldValue<TeamMemberDocument> | any): DocumentData => {
    return {
      teamId: member.teamId,
      userId: member.userId,
      role: member.role,
      status: member.status,
      joinedAt: member.joinedAt ? member.joinedAt : serverTimestamp()
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): TeamMemberDocument => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id, // 합성 ID 반환
      teamId: data.teamId,
      userId: data.userId,
      role: data.role as TeamRole,
      status: data.status,
      joinedAt: data.joinedAt ? (data.joinedAt as Timestamp).toMillis() : Date.now()
    };
  }
};
