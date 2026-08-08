// Replaced due to Cloudflare 25MB limits. Do not use firebase-admin here.
export const adminDb = () => { throw new Error("Use Cloud Functions instead of adminDb") };
export const adminAuth = () => { throw new Error("Use Cloud Functions instead of adminAuth") };
export const getFirebaseStorageInstance = () => { throw new Error("Use Cloud Functions instead of getFirebaseStorageInstance") };
