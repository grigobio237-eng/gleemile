import { Timestamp } from 'firebase/firestore';

export interface AttendanceEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  isActive: boolean;
  hasCapacityLimit: boolean;
  targetCapacity?: number;
  presentCount: number;
  createdAt: Timestamp | null;
}

export type RSVPStatus = 'present' | 'absent' | 'no_show';

export interface RSVP {
  userId: string;
  userName: string;
  status: RSVPStatus;
  updatedAt: Timestamp | null;
}
