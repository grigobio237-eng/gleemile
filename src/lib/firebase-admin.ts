import * as admin from 'firebase-admin';

/**
 * Firebase Admin SDK 초기화 및 반환
 * Version: 1.1.3 (Ultimate URL-Safe & Space Repair)
 */
const getApp = () => {
    if (admin.apps.length) return admin.app();

    const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        console.error('[Firebase Admin] 필수 정보(ProjectID, ClientEmail, PrivateKey)가 누락되었습니다.');
        return null;
    }

    try {
        // 환경 변수에서 개행 문자(\n)가 문자열 그대로 들어오는 경우 대응
        privateKey = privateKey.replace(/\\n/g, '\n');

        // 이미 따옴표가 포함되어 있는 경우 제거
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.substring(1, privateKey.length - 1);
        }

        console.log('[Firebase Admin] 표준 환경 변수 모드로 초기화를 시도합니다.');
        console.log(` - Project ID: ${projectId}`);
        console.log(` - Client Email: ${clientEmail}`);

        return admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || `${projectId}.firebasestorage.app`
        });
    } catch (error: any) {
        console.error('[Firebase Admin] 초기화 에러:', error.message);
        return null;
    }
};

export const getAdminApp = () => getApp();
export const adminDb = () => {
    const app = getApp();
    if (!app) throw new Error('Firebase Admin App 초기화 실패 (DB)');
    return app.firestore();
};
export const adminAuth = () => {
    const app = getApp();
    if (!app) throw new Error('Firebase Admin App 초기화 실패 (Auth)');
    return app.auth();
};
export const getFirebaseStorageInstance = () => {
    const app = getApp();
    if (!app) throw new Error('Firebase Admin App 초기화 실패 (Storage)');
    return app.storage();
};
