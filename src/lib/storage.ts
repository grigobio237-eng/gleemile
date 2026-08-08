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
    static async uploadImage(buffer: Buffer, options: UploadOptions = {}): Promise<{ url: string; filename: string; size: number }> {
        const { folder = 'uploads', filename = `${uuidv4()}.webp`, useFirebase = true } = options;
        let optimizedBuffer = buffer;
        try {
            optimizedBuffer = await sharp(buffer).webp({ quality: 85, effort: 6 }).toBuffer();
        } catch (e) {}

        const finalFilename = filename.endsWith('.webp') ? filename : `${filename.split('.')[0]}.webp`;
        const filePath = `${folder}/${finalFilename}`;

        if (useFirebase) {
            const base64Data = optimizedBuffer.toString('base64');
            const res = await fetch(`${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/uploadImage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ base64Data, path: filePath })
            });
            const data = await res.json();
            return { url: data.url, filename: finalFilename, size: optimizedBuffer.length };
        } else {
            const blob = await put(filePath, optimizedBuffer, { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN });
            return { url: blob.url, filename: finalFilename, size: optimizedBuffer.length };
        }
    }

    static async uploadBase64Image(base64String: string, options: UploadOptions = {}): Promise<{ url: string; filename: string; size: number }> {
        const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        return this.uploadImage(buffer, options);
    }

    static async uploadPdf(buffer: Buffer, options: Omit<UploadOptions, 'contentType'> = {}): Promise<{ url: string; filename: string; size: number }> {
        const { folder = 'labor-contracts', filename = `${uuidv4()}.pdf`, useFirebase = true } = options;
        const filePath = `${folder}/${filename}`;

        if (useFirebase) {
            const base64Data = buffer.toString('base64');
            const res = await fetch(`${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/uploadPdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ base64Data, path: filePath })
            });
            const data = await res.json();
            return { url: data.url, filename, size: buffer.length };
        } else {
            const blob = await put(filePath, buffer, { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN });
            return { url: blob.url, filename, size: buffer.length };
        }
    }

    static async deleteFile(urlOrPath: string | null | undefined): Promise<void> {
        if (!urlOrPath) return;
        try {
            if (urlOrPath.includes('firebasestorage.googleapis.com')) {
                await fetch(`${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/deleteFile`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ urlOrPath })
                });
            } else if (urlOrPath.includes('public.blob.vercel-storage.com')) {
                await del(urlOrPath, { token: process.env.BLOB_READ_WRITE_TOKEN });
            }
        } catch (error) {}
    }
}
