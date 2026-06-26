import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const body = await req.json();
    const { templateType, memberName, mentalStrainIndex, volume, zoneLabel } = body;

    if (!templateType || !memberName) {
      return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 });
    }

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let systemPrompt = '';
    switch (templateType) {
      case 'business':
        systemPrompt = `당신은 비즈니스 및 프로젝트 TF팀의 조직 심리 전문가입니다. 
타겟: ${memberName}
현재 번아웃 위험도: ${zoneLabel} (피로지수: ${mentalStrainIndex}/5.0, 업무 볼륨: ${volume}/3.0)
업무 진척을 방해하는 요소(과도한 승인 절차, 잦은 회의, 불확실한 목표 등)를 맥락적으로 파악하고, 업무 로드 조절을 권고하는 2~3문장의 짧은 개입 질문(Probing Question)을 작성해 주세요.`;
        break;
      case 'hobby':
        systemPrompt = `당신은 취미 및 문화 클래스의 호스트 매니저입니다.
타겟: ${memberName}
현재 활동 이탈 위험도: ${zoneLabel} (피로지수: ${mentalStrainIndex}/5.0, 참여 볼륨: ${volume}/3.0)
오늘 세션 중 조율이 필요한 부분(실습 시간 부족, 강의 장소 상태, 커리큘럼 난이도 등)을 부드럽게 묻고, 참여 의욕을 돋우는 2~3문장의 짧은 개입 질문(Probing Question)을 작성해 주세요.`;
        break;
      case 'study':
        systemPrompt = `당신은 학업 스터디 모임의 멘토입니다.
타겟: ${memberName}
현재 학업 번아웃 위험도: ${zoneLabel} (피로지수: ${mentalStrainIndex}/5.0, 과제 볼륨: ${volume}/3.0)
공부량 분배가 너무 무거웠는지, 혹은 스터디원들의 준비성 등 어떤 조율이 필요한지 묻고, 페이스 조절을 권고하는 2~3문장의 짧은 개입 질문(Probing Question)을 작성해 주세요.`;
        break;
      case 'sports':
      default:
        systemPrompt = `당신은 아마추어 스포츠 팀의 피지컬 코치입니다.
타겟: ${memberName}
현재 부상 위험도: ${zoneLabel} (근육긴장도: ${mentalStrainIndex}/5.0, 훈련 볼륨: ${volume}/3.0)
최근 신체적/정신적 긴장감이 높음을 언급하고, 부상 방지를 위해 출전 시간이나 훈련 강도 조절을 권장하는 2~3문장의 짧은 개입 질문(Probing Question)을 작성해 주세요.`;
        break;
    }

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ success: true, probingMessage: text });
  } catch (error: any) {
    console.error('[Dynamic Probing POST Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
