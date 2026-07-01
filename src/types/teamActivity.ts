import { Timestamp, QueryDocumentSnapshot, SnapshotOptions, FirestoreDataConverter } from 'firebase/firestore';

export interface TeamAnnouncement {
  id?: string;
  title: string;
  content: string;
  type: 'notice' | 'schedule' | 'urgent';
  isPinned: boolean;
  authorId: { name: string; avatar?: string };
  authorRole?: string;
  createdAt: Timestamp | Date | any;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventType?: string;
}

export const announcementConverter: FirestoreDataConverter<TeamAnnouncement> = {
  toFirestore(announcement: TeamAnnouncement) {
    const { id, ...data } = announcement;
    return {
      ...data,
      createdAt: data.createdAt instanceof Date ? Timestamp.fromDate(data.createdAt) : data.createdAt
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): TeamAnnouncement {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      title: data.title || '',
      content: data.content || '',
      type: data.type || 'notice',
      isPinned: !!data.isPinned,
      authorId: data.authorId || { name: '알 수 없음' },
      authorRole: data.authorRole || '',
      createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
      eventDate: data.eventDate || '',
      eventTime: data.eventTime || '',
      eventLocation: data.eventLocation || '',
      eventType: data.eventType || '',
    };
  }
};

export interface TeamSchedule {
  id?: string;
  title: string;
  description: string;
  location: string;
  startTime: Timestamp | Date | any;
  endTime: Timestamp | Date | any;
  type: 'TRAINING' | 'MATCH' | 'EVENT' | 'OTHER' | string;
  authorId?: { name: string; avatar?: string };
  createdAt?: Timestamp | Date | any;
}

export const scheduleConverter: FirestoreDataConverter<TeamSchedule> = {
  toFirestore(schedule: TeamSchedule) {
    const { id, ...data } = schedule;
    return {
      ...data,
      startTime: data.startTime instanceof Date ? Timestamp.fromDate(data.startTime) : data.startTime,
      endTime: data.endTime instanceof Date ? Timestamp.fromDate(data.endTime) : data.endTime,
      createdAt: data.createdAt instanceof Date ? Timestamp.fromDate(data.createdAt) : data.createdAt,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): TeamSchedule {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      title: data.title || '',
      description: data.description || '',
      location: data.location || '',
      startTime: data.startTime ? (data.startTime as Timestamp).toDate() : new Date(),
      endTime: data.endTime ? (data.endTime as Timestamp).toDate() : new Date(),
      type: data.type || 'TRAINING',
      authorId: data.authorId || { name: '알 수 없음' },
      createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    };
  }
};
