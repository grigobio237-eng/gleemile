import { Timestamp } from 'firebase/firestore';

export interface ExpenseParticipant {
  userId: string;
  userName: string;
  amount: number;
  isPaid: boolean;
}

export interface ExpenseData {
  id?: string;
  title: string;
  totalAmount: number;
  receiptUrl: string;
  remittanceInfo: string;
  createdAt: Timestamp | null;
  createdBy: string;
  participants: ExpenseParticipant[];
}
