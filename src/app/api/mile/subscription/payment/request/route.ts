import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import MileTeamMember from '@/models/MileTeamMember';
import { PLAN_CONFIG } from '@/models/MileSubscription';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { plan } = body;

        if (!plan || !PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG]) {
            return NextResponse.json({ error: '유효하지 않은 플랜입니다.' }, { status: 400 });
        }

        const planConfig = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG];
        const amount = planConfig.price;
        const productName = `모임 플랫폼 ${planConfig.label} 플랜 구독`;

        const membership = await MileTeamMember.findOne({
            userId: session.user.id,
            status: 'active',
            role: { $in: ['director', 'leader'] },
        });

        if (!membership) {
            return NextResponse.json({ error: '팀 관리자 권한이 없습니다.' }, { status: 403 });
        }

        // 나이스페이 설정
        const merchantId = process.env.NICEPAY_MERCHANT_ID || 'grigobio1m';
        const merchantKey = process.env.NICEPAY_MERCHANT_KEY || '';

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const returnUrl = `${baseUrl}/api/mile/subscription/payment/result`;

        // 주문 고유 번호 생성 (FSUB_플랜_유저ID_타임스탬프)
        const orderId = `FSUB_${plan}_${session.user.id}_${Date.now()}`;

        // 나이스페이 파라미터
        const ediDate = new Date().toISOString()
            .replace(new RegExp('[-:T' + '.]', 'g'), '')
            .substring(0, 14);

        const signatureData = `${ediDate}${merchantId}${amount}${merchantKey}`;
        const signature = crypto.createHash('sha256').update(signatureData).digest('hex');

        // 빌링키 발급 결제 요청 (혹은 일반 결제)
        // 빌링키 발급 시 PayMethod=BILL 등의 추가 파라미터가 필요할 수 있으나,
        // 기존 V3 스탠다드 결제창 모듈을 그대로 사용합니다.
        const authParams = {
            MID: merchantId,
            Moid: orderId,
            Amt: amount.toString(),
            GoodsName: productName,
            EdiDate: ediDate,
            SignData: signature,
            BuyerName: session.user.name || '팀 관리자',
            BuyerEmail: session.user.email || '',
            BuyerTel: '01000000000',
            ReturnURL: returnUrl,
            PayMethod: 'CARD', // 기본 카드 결제
            GoodsCl: '0', 
            TransType: '0',
            CharSet: 'utf-8',
        };

        return NextResponse.json({
            success: true,
            authUrl: 'https://web.nicepay.co.kr/v3/v3Payment.jsp',
            formData: authParams,
        });

    } catch (error) {
        console.error('Mile Subscription Payment Request Error:', error);
        return NextResponse.json(
            { error: '결제 요청 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
