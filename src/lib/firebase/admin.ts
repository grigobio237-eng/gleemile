import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // privateKey format replacement to handle newlines correctly in env variables
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null as any;
export const adminMessaging = admin.apps.length ? admin.messaging() : null as any;
export const adminStorage = admin.apps.length ? admin.storage() : null as any;
export const adminAuth = admin.apps.length ? admin.auth() : null as any;
