import { getFirebaseStorageInstance } from './firebase-admin';
import { put, del } from '@vercel/blob';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export interface UploadOptions {
    folder?: string;
    filename?: string;
    contentType?: string;
    useFirebase?: boolean; // 기본값 true로 설정 예정
}

export class StorageService {
    private static get bucket() {
        try {
            const storage = getFirebaseStorageInstance();
            if (!storage) throw new Error('Firebase Admin Storage 인스턴스를 가져올 수 없습니다.');
            return storage.bucket();
        } catch (error: any) {
            console.error('[StorageService] Bucket 획득 실패:', error.message);
            throw error;
        }
    }

    /**
     * 이미지를 WebP로 변환하고 업로드합니다.
     */
    static async uploadImage(
        buffer: Buffer,
        options: UploadOptions = {}
    ): Promise<{ url: string; filename: string; size: number }> {
        const {
            folder = 'uploads',
            filename = `${uuidv4()}.webp`,
            useFirebase = true
        } = options;

        // 1. Sharp를 이용한 WebP 변환 및 최적화
        let optimizedBuffer: Buffer;
        try {
            if (!buffer || buffer.length === 0) throw new Error('업로드할 이미지 데이터가 비어 있습니다.');

            optimizedBuffer = await sharp(buffer)
                .webp({ quality: 85, effort: 6 })
                .toBuffer();
        } catch (sharpError: any) {
            console.error('[StorageService] Sharp 최적화 실패:', sharpError.message);
            // Sharp 실패 시 원본 버퍼 사용 시도
            optimizedBuffer = buffer;
        }

        const finalFilename = filename.endsWith('.webp') ? filename : `${filename.split('.')[0]}.webp`;
        const filePath = `${folder}/${finalFilename}`;

        if (useFirebase) {
            // 2. Firebase Storage 업로드
            const file = this.bucket.file(filePath);
            const downloadToken = uuidv4(); // 고유 다운로드 토큰 생성 (uuidv4로 통일)

            // 파일 저장 시 메타데이터(다운로드 토큰)를 한 번에 설정
            await file.save(optimizedBuffer, {
                metadata: {
                    contentType: 'image/webp',
                    cacheControl: 'public, max-age=31536000',
                    metadata: {
                        firebaseStorageDownloadTokens: downloadToken
                    }
                }
            });

            // 파일을 공개 상태로 전환 시도 (Uniform Access 정책에 따라 실패할 수 있음)
            try {
                await file.makePublic();
            } catch (publicError) {
                console.warn('[StorageService] makePublic 실패 (무시하고 진행):', (publicError as any).message);
            }

            // Firebase Storage 정식 URL 반환 (토큰 포함하여 CORS 에러 방지)
            const url = `https://firebasestorage.googleapis.com/v0/b/${this.bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${downloadToken}`;

            return {
                url,
                filename: finalFilename,
                size: optimizedBuffer.length
            };
        } else {
            // 3. Fallback: Vercel Blob 업로드 (이전용)
            const blob = await put(filePath, optimizedBuffer, {
                access: 'public',
                token: process.env.BLOB_READ_WRITE_TOKEN,
            });

            return {
                url: blob.url,
                filename: finalFilename,
                size: optimizedBuffer.length
            };
        }
    }

    /**
     * 파일 삭제 (URL 또는 경로)
     */
    static async deleteFile(urlOrPath: string | null | undefined): Promise<void> {
        if (!urlOrPath) return;

        try {
            if (urlOrPath.includes('firebasestorage.googleapis.com')) {
                // 1. Firebase Storage URL에서 경로 추출
                // 예: .../o/snaps%2Fuser123%2Frhythm.webp?alt=media...
                const parts = urlOrPath.split('/o/');
                if (parts.length < 2) {
                    console.warn('[StorageService] 잘못된 Firebase URL 형식:', urlOrPath);
                    return;
                }

                const pathPart = parts[1].split('?')[0];
                const decodedPath = decodeURIComponent(pathPart);

                console.log(`[StorageService] Firebase 파일 삭제 시도: ${decodedPath}`);
                await this.bucket.file(decodedPath).delete();
                console.log(`[StorageService] Firebase 파일 삭제 성공: ${decodedPath}`);

            } else if (urlOrPath.includes('public.blob.vercel-storage.com')) {
                // 2. Vercel Blob 삭제
                await del(urlOrPath, {
                    token: process.env.BLOB_READ_WRITE_TOKEN,
                });
                console.log(`[StorageService] Vercel Blob 삭제 성공: ${urlOrPath}`);
            }
        } catch (error: any) {
            // 파일이 이미 없거나 권한 문제일 경우
            if (error.code === 404) {
                console.warn('[StorageService] 삭제할 파일이 이미 존재하지 않습니다:', urlOrPath);
            } else {
                console.error('[StorageService] 파일 삭제 실패:', error.message);
            }
        }
    }
}
