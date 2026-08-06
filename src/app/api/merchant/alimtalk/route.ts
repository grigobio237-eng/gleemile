import { NextResponse } from 'next/server';
import { alimtalkService, AlimtalkPayload } from '@/services/alimtalk';
import { getServerSession } from 'next-auth/next';

export async function POST(req: Request) {
  try {
    // 1. 인증/인가 확인 (보안 강화)
    // const session = await getServerSession(authOptions);
    // if (!session?.user) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    // }

    const body: AlimtalkPayload = await req.json();

    if (!body.recipientPhone || !body.templateCode) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 2. 서비스 레이어를 통한 알림톡 전송
    const result = await alimtalkService.send(body);

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: any) {
    console.error('Alimtalk API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
