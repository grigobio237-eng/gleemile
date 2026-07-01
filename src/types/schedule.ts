import { Timestamp } from "firebase/firestore";

export interface SchedulePost {
  id?: string;
  title: string;
  dateTime: Timestamp;
  location: string;
  description: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
