import { Timestamp, FieldValue } from 'firebase/firestore';

export interface IFirestoreFCMToken {
  token: string;
  deviceInfo?: string;
  createdAt: Timestamp | FieldValue;
  lastUpdatedAt: Timestamp | FieldValue;
}
