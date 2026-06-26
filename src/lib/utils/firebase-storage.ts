import sharp from 'sharp';
import { getFirebaseStorageInstance } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

/**
 * Base64 이미지를 WebP로 변환하여 Firebase Storage에 업로드합니다.
 * 
 * @param base64Data - Base64 인코딩된 이미지 데이터 (data: 접두사 포함 가능)
 * @param path - 저장 경로 (예: 'characters/userId/filename.webp')
 * @returns 업로드된 이미지의 공개 URL
 */
export async function uploadImageToFirebase(
    base64Data: string,
    path: string
): Promise<string> {
    try {
        const storage = getFirebaseStorageInstance();
        const bucket = storage.bucket();

        // data:image/... 접두사 제거
        const base64Content = base64Data.includes(',')
            ? base64Data.split(',')[1]
            : base64Data;

        // Base64를 Buffer로 변환
        const imageBuffer = Buffer.from(base64Content, 'base64');

        // Sharp로 WebP 변환
        const webpBuffer = await sharp(imageBuffer)
            .webp({ quality: 85 })
            .toBuffer();

        // Firebase Storage에 업로드
        const file = bucket.file(path);
        const downloadToken = uuidv4();
        
        await file.save(webpBuffer, {
            metadata: {
                contentType: 'image/webp',
                cacheControl: 'public, max-age=31536000', // 1년 캐시
                metadata: {
                    firebaseStorageDownloadTokens: downloadToken
                }
            }
        });

        // 공개 URL 생성 (실패해도 토큰 URL 반환)
        try {
            await file.makePublic();
        } catch (e) {
            console.warn('[Firebase Storage] makePublic failed, using token url fallback');
        }
        
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;

        console.log(`[Firebase Storage] Image uploaded: ${publicUrl}`);
        return publicUrl;

    } catch (error: any) {
        console.error('[Firebase Storage] Upload failed:', error);
        throw new Error(`이미지 업로드 실패: ${error.message}`);
    }
}

/**
 * URL 이미지를 가져와 WebP로 변환 후 Firebase Storage에 업로드합니다.
 */
export async function uploadImageFromUrl(
    imageUrl: string,
    path: string
): Promise<string> {
    try {
        // URL에서 이미지 다운로드
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error('이미지 다운로드 실패');

        const arrayBuffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);

        // Sharp로 WebP 변환
        const webpBuffer = await sharp(imageBuffer)
            .webp({ quality: 85 })
            .toBuffer();

        const storage = getFirebaseStorageInstance();
        const bucket = storage.bucket();

        // Firebase Storage에 업로드
        const file = bucket.file(path);
        const downloadToken = uuidv4();
        
        await file.save(webpBuffer, {
            metadata: {
                contentType: 'image/webp',
                cacheControl: 'public, max-age=31536000',
                metadata: {
                    firebaseStorageDownloadTokens: downloadToken
                }
            }
        });

        try {
            await file.makePublic();
        } catch (e) {
            console.warn('[Firebase Storage] makePublic failed, using token url fallback');
        }
        
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;

        console.log(`[Firebase Storage] Image from URL uploaded: ${publicUrl}`);
        return publicUrl;

    } catch (error: any) {
        console.error('[Firebase Storage] URL upload failed:', error);
        throw new Error(`URL 이미지 업로드 실패: ${error.message}`);
    }
}
