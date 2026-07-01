import { Timestamp, DocumentData, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';

export interface GleemileUser {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  avatar?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  address?: string;
  provider: 'local' | 'google' | 'kakao' | 'naver';
  providerId?: string;
  globalRole: 'member' | 'admin' | 'superadmin';
  gender?: 'male' | 'female' | 'none';
  ageGroup?: string; // e.g. "10", "20", ... "60+"
  recommender?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const userConverter = {
  toFirestore(user: Partial<GleemileUser>): DocumentData {
    return {
      ...user,
      createdAt: user.createdAt ? Timestamp.fromDate(user.createdAt) : Timestamp.now(),
      updatedAt: user.updatedAt ? Timestamp.fromDate(user.updatedAt) : Timestamp.now(),
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): GleemileUser {
    const data = snapshot.data(options)!;
    return {
      id: snapshot.id,
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      avatar: data.avatar || '',
      avatarUrl: data.avatarUrl,
      phoneNumber: data.phoneNumber,
      address: data.address,
      provider: data.provider || 'local',
      providerId: data.providerId,
      globalRole: data.globalRole || 'member',
      gender: data.gender,
      ageGroup: data.ageGroup,
      recommender: data.recommender,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    };
  }
};
