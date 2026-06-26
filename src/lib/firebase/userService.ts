import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function updateNotificationSettings(
  userId: string,
  settings: {
    isAllEnabled: boolean;
    chatEnabled: boolean;
    announcementEnabled: boolean;
  }
) {
  if (!userId) throw new Error("User ID is required");

  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    notificationSettings: settings,
    updatedAt: serverTimestamp()
  });
}
