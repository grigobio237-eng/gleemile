import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db';
import MileSubscription, { PLAN_CONFIG } from '@/models/MileSubscription';
import MileTeamMember from '@/models/MileTeamMember';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        
        // formData 파싱
        const formData = await request.formData();
        const authResultCode = formData.get('AuthResultCode') as string;
        const authResultMsg = formData.get('AuthResultMsg') as string;
        const txTid = formData.get('TxTid') as string;
        const authToken = formData.get('AuthToken') as string;
        const mid = formData.get('MID') as string;
        const amt = formData.get('Amt') as string;
        const nextAppURL = formData.get('NextAppURL') as string;
        const moid = formData.get('Moid') as string; // FSUB_{plan}_{userId}_{timestamp}

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        
        if (authResultCode !== '0000') {
            console.error('Nicepay Auth Failed:', authResultMsg);
            return NextResponse.redirect(`${baseUrl}/mile/subscription?error=auth_failed`);
        }

        const merchantKey = process.env.NICEPAY_MERCHANT_KEY || '';
        
        // 데이터 위변조 방지 (승인 요청 검증용 SignData 생성)
        const ediDate = new Date().toISOString()
            .replace(new RegExp('[-:T' + '.]', 'g'), '')
            .substring(0, 14);
        
        const signData = crypto.createHash('sha256')
            .update(`${authToken}${mid}${amt}${ediDate}${merchantKey}`)
            .digest('hex');

        // 승인 API 호출 (Server-to-Server)
        const approveParams = new URLSearchParams({
            TID: txTid,
            AuthToken: authToken,
            MID: mid,
            Amt: amt,
            EdiDate: ediDate,
            SignData: signData,
            CharSet: 'utf-8',
        });

        const approveResponse = await fetch(nextAppURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: approveParams,
        });

        const approveResult = await approveResponse.text();
        // 응답이 euc-kr 일 수도 있고 utf-8일 수도 있으나, 보통 utf-8로 요청하면 JSON으로 옴
        // 나이스페이 응답 파싱
        const resultJson = JSON.parse(approveResult);

        if (resultJson.ResultCode !== '3001') { // 3001이 승인 성공 (버전에 따라 다를 수 있으나 보통 3001)
            // 카드 승인 실패
            console.error('Nicepay Approve Failed:', resultJson.ResultMsg);
            return NextResponse.redirect(`${baseUrl}/mile/subscription?error=approve_failed`);
        }

        // --- 승인 완료 처리 ---
        // moid = FSUB_{plan}_{userId}_{timestamp}
        const parts = moid.split('_');
        const plan = parts[1];
        const userId = parts[2];

        const membership = await MileTeamMember.findOne({
            userId,
            status: 'active',
            role: { $in: ['director', 'leader'] },
        });

        if (membership && PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG]) {
            const planConfig = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG];
            const now = new Date();
            const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30일(1개월)

            // 기존 활성 구독이 있다면 취소(만료) 처리 후 신규 생성하거나, 
            // 여기서는 단순 신규 결제로 처리
            await MileSubscription.updateMany(
                { teamId: membership.teamId, status: { $in: ['trial', 'active'] } },
                { $set: { status: 'cancelled', cancelledAt: now, cancelReason: '새로운 결제로 인한 종료' } }
            );

            await MileSubscription.create({
                userId,
                teamId: membership.teamId,
                plan,
                status: 'active',
                paymentMethod: 'nicepay',
                amount: parseInt(amt),
                billingKey: resultJson.BID || '', // 만약 빌링키라면 BID 수신
                startDate: now,
                endDate,
                lastPaymentAt: now,
                nextPaymentDate: endDate,
                maxPlayers: planConfig.maxPlayers,
            });
        }

        return NextResponse.redirect(`${baseUrl}/mile/subscription?success=true`);
        
    } catch (error) {
        console.error('Subscription Payment Result Error:', error);
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/mile/subscription?error=server_error`);
    }
}
