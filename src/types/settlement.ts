import { Timestamp, QueryDocumentSnapshot, SnapshotOptions, FirestoreDataConverter, serverTimestamp } from 'firebase/firestore';

export interface SettlementParticipant {
  userId: string;
  name: string;
  avatar?: string;
  isDeposited: boolean;
  depositedAt?: Timestamp | Date | any;
  amount?: number; // 1/N 단수 보정 후 개별 청구액
}

export interface GuestDeposit {
  id: string;
  amount: number;
  memo: string;
  createdAt: Timestamp | Date | any;
}

export interface TeamSettlement {
  id?: string;
  title: string;          // 예: "6월 24일 회식 비용"
  targetCount: number;    // 목표 인원수
  totalAmount: number;    // 총 예상 금액 (1인당 금액 * 목표 인원수)
  perPersonAmount: number;// 1인당 금액
  bankInfo: string;       // 입금 계좌 정보
  status: 'IN_PROGRESS' | 'COMPLETED';
  participants: SettlementParticipant[];
  guestDeposits?: GuestDeposit[]; // 기타 외부 입금 내역
  authorId: { name: string; avatar?: string };
  createdAt: Timestamp | Date | any;
}

export interface ExpenseRecord {
  id?: string;
  title: string;          // 지출 항목명
  amount: number;         // 지출 금액
  expenseDate: string;    // 지출 일자 (YYYY-MM-DD 형식)
  receiptUrl?: string;    // 영수증 이미지 URL (WebP 변환된 이미지 스토리지 링크)
  authorId: { name: string; avatar?: string };
  createdAt: Timestamp | Date | any;
}

export const settlementConverter: FirestoreDataConverter<TeamSettlement> = {
  toFirestore(settlement: TeamSettlement) {
    const { id, ...data } = settlement;
    return {
      ...data,
      createdAt: data.createdAt instanceof Date ? Timestamp.fromDate(data.createdAt) : data.createdAt,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): TeamSettlement {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      title: data.title || '',
      targetCount: data.targetCount || 0,
      totalAmount: data.totalAmount || 0,
      perPersonAmount: data.perPersonAmount || 0,
      bankInfo: data.bankInfo || '',
      status: data.status || 'IN_PROGRESS',
      participants: data.participants || [],
      guestDeposits: data.guestDeposits || [],
      authorId: data.authorId || { name: '알 수 없음' },
      createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    };
  }
};

export const expenseConverter: FirestoreDataConverter<ExpenseRecord> = {
  toFirestore(expense: ExpenseRecord) {
    const { id, ...data } = expense;
    return {
      ...data,
      createdAt: data.createdAt instanceof Date ? Timestamp.fromDate(data.createdAt) : data.createdAt,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): ExpenseRecord {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      title: data.title || '',
      amount: data.amount || 0,
      expenseDate: data.expenseDate || '',
      receiptUrl: data.receiptUrl || '',
      authorId: data.authorId || { name: '알 수 없음' },
      createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    };
  }
};
