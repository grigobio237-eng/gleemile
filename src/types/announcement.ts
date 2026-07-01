import { Timestamp } from "firebase/firestore";

export interface Announcement {
  id?: string;
  title: string;
  content: string;
  isImportant: boolean;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
}

export interface UserTeamMetadata {
  lastReadAnnouncementAt?: Timestamp | null;
}
