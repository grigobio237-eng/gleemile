const fs = require('fs');
const path = require('path');

const filesToRefactor = [
  {
    path: 'src/app/api/cron/cleanup-chat/route.ts',
    content: `import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    
    const res = await fetch(\`\${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/cleanupChat?key=\${key || ''}\`, {
      headers: { 'Authorization': authHeader || '' }
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}`
  },
  {
    path: 'src/app/api/cron/sync-wage/route.ts',
    content: `import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    
    const res = await fetch(\`\${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/syncWage?key=\${key || ''}\`, {
      headers: { 'Authorization': authHeader || '' }
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}`
  },
  {
    path: 'src/app/api/merchant/webhook/payment/route.ts',
    content: `import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(\`\${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/webhookPayment\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}`
  },
  {
    path: 'src/app/api/mile/team/[teamId]/route.ts',
    content: `import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = await params;
    
    const res = await fetch(\`\${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/deleteTeam\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, userId: session.user.id })
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}`
  },
  {
    path: 'src/app/api/notify/route.ts',
    content: `import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(\`\${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/notify\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}`
  },
  {
    path: 'src/lib/labor-service.ts',
    content: `"use server";
import { StorageService } from '@/lib/storage';
import { sendLaborContractLinkSMS } from '@/lib/sms';

export interface LaborContractData {
  employerName: string;
  employerAddress: string;
  employeeName: string;
  employeePhone: string;
  startDate: string;
  endDate?: string;
  workPlace: string;
  workDescription: string;
  workDays: string;
  workHours: string;
  restHours: string;
  hourlyWage: number;
  contractType: string;
  weeklyHours: number;
  weeklyHolidayAllowance: number;
}

export async function createLaborContract(teamId: string, contractData: LaborContractData, employerSignatureBase64: string) {
  try {
    const signatureUpload = await StorageService.uploadBase64Image(employerSignatureBase64, {
      folder: \`labor-contracts/\${teamId}/signatures\`,
      filename: \`employer_\${Date.now()}.png\`
    });

    const res = await fetch(\`\${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/createLaborContract\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, contractData, signatureUrl: signatureUpload.url })
    });
    const data = await res.json();
    
    if (data.success) {
      const contractUrl = \`\${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/mile/\${teamId}/labor-shield/\${data.contractId}\`;
      await sendLaborContractLinkSMS(contractData.employeePhone, contractData.employeeName, contractData.employerName, contractUrl);
    }
    return data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getLaborContract(contractId: string) {
  try {
    const res = await fetch(\`\${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/getLaborContract?contractId=\${contractId}\`);
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function completeLaborContract(contractId: string, employeeSignatureBase64: string, pdfBase64: string) {
  try {
    const res = await fetch(\`\${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/completeLaborContract\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractId, employeeSignatureBase64, pdfBase64 })
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTeamLaborContracts(teamId: string) {
  try {
    const res = await fetch(\`\${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/getTeamLaborContracts?teamId=\${teamId}\`);
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
`
  },
  {
    path: 'src/lib/services/teamService.ts',
    content: `// stubbed team service without firebase-admin
export const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const createTeam = async (teamData: any) => {
  const res = await fetch(\`\${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/createTeam\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamData)
  });
  return await res.json();
};

export const inviteMember = async (teamId: string, email: string) => {
  const res = await fetch(\`\${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/inviteMember\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, email })
  });
  return await res.json();
};
`
  },
  {
    path: 'src/lib/wage-sync-service.ts',
    content: `"use server";

export async function syncMinimumWage() {
  try {
    const res = await fetch(\`\${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/cronSyncWage\`);
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
`
  },
  {
    path: 'src/lib/utils/firebase-storage.ts',
    content: `export async function uploadImageToFirebase(base64Data: string, path: string): Promise<string> {
    const res = await fetch(\`\${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/uploadImage\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, path })
    });
    const data = await res.json();
    return data.url;
}
`
  },
  {
    path: 'src/lib/firebase-admin.ts',
    content: `// Replaced due to Cloudflare 25MB limits. Do not use firebase-admin here.
export const adminDb = () => { throw new Error("Use Cloud Functions instead of adminDb") };
export const adminAuth = () => { throw new Error("Use Cloud Functions instead of adminAuth") };
export const getFirebaseStorageInstance = () => { throw new Error("Use Cloud Functions instead of getFirebaseStorageInstance") };
`
  },
  {
    path: 'src/lib/firebase/admin.ts',
    content: `// Replaced due to Cloudflare 25MB limits. Do not use firebase-admin here.
export const adminDb = {} as any;
export const adminStorage = {} as any;
export const adminAuth = {} as any;
`
  },
  {
    path: 'src/lib/storage.ts',
    content: `import { put, del } from '@vercel/blob';
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
        const { folder = 'uploads', filename = \`\${uuidv4()}.webp\`, useFirebase = true } = options;
        let optimizedBuffer = buffer;
        try {
            optimizedBuffer = await sharp(buffer).webp({ quality: 85, effort: 6 }).toBuffer();
        } catch (e) {}

        const finalFilename = filename.endsWith('.webp') ? filename : \`\${filename.split('.')[0]}.webp\`;
        const filePath = \`\${folder}/\${finalFilename}\`;

        if (useFirebase) {
            const base64Data = optimizedBuffer.toString('base64');
            const res = await fetch(\`\${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/uploadImage\`, {
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
        const base64Data = base64String.replace(/^data:image\\/\\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        return this.uploadImage(buffer, options);
    }

    static async uploadPdf(buffer: Buffer, options: Omit<UploadOptions, 'contentType'> = {}): Promise<{ url: string; filename: string; size: number }> {
        const { folder = 'labor-contracts', filename = \`\${uuidv4()}.pdf\`, useFirebase = true } = options;
        const filePath = \`\${folder}/\${filename}\`;

        if (useFirebase) {
            const base64Data = buffer.toString('base64');
            const res = await fetch(\`\${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/uploadPdf\`, {
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
                await fetch(\`\${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/deleteFile\`, {
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
`
  }
];

filesToRefactor.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file.path))) {
    fs.writeFileSync(path.join(process.cwd(), file.path), file.content);
  }
});
console.log('Files refactored!');
