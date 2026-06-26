import { NavigatorInput, NavigatorOutput, OmakaseInput, OmakaseOutput } from './types';

// Mock AI Engine pretending to be Zenspark LLM
export class MockAIEngine {

    // AI Navigator: Generate daily advice based on recovery scores
    static async generateNavigatorAdvice(input: NavigatorInput): Promise<NavigatorOutput> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const totalScore = Math.round(
            (input.scores.physical + input.scores.mental + input.scores.lifestyle + input.scores.sleep) / 4
        );

        let comment = "";
        let actionItem = "";

        if (totalScore >= 80) {
            comment = "컨디션이 아주 좋습니다! 이 흐름을 유지하는 것이 중요해요.";
            actionItem = "가벼운 산책으로 활력을 유지하세요.";
        } else if (totalScore >= 50) {
            comment = "나쁘지 않은 하루지만, 조금 더 회복에 집중할 필요가 있습니다.";
            actionItem = "자기 전 10분 스트레칭을 실천해보세요.";
        } else {
            comment = "휴식이 절실히 필요한 상태입니다. 무리하지 마세요.";
            actionItem = "오늘 저녁은 스마트폰을 끄고 일찍 잠자리에 드세요.";
        }

        // Customized logic based on specific low scores
        if (input.scores.sleep < 40) { // low sleep
            comment += " 수면 부족이 전반적인 회복을 방해하고 있어요.";
            actionItem = "따뜻한 우유 한 잔과 함께 수면 환경을 점검해보세요.";
        } else if (input.scores.mental < 40) { // low mood
            comment += " 마음의 여유를 찾는 것이 우선순위입니다.";
            actionItem = "좋아하는 음악을 들으며 5분간 명상해보세요.";
        }

        return {
            comment,
            actionItem,
            recoveryScore: totalScore
        };
    }

    // Omakase: Generate 3-tier recovery plans
    static async generateOmakasePlans(input: OmakaseInput): Promise<OmakaseOutput> {
        await new Promise(resolve => setTimeout(resolve, 2500));

        const analysis = `${input.goal}을(를) 목표로 하시는군요. 현재 ${input.painPoint} 문제와 ${input.symptoms.join(', ')} 증상을 해결하기 위해, 3단계 맞춤형 회복 플랜을 설계했습니다.`;

        return {
            analysis,
            plans: {
                planA: {
                    planId: 'plan-a-basic',
                    title: 'Plan A: 기초 회복 (Reset)',
                    description: '부담 없이 시작할 수 있는 생활 밀착형 회복 플랜입니다.',
                    duration: '4주',
                    priceEstimate: '약 30만원',
                    focusArea: '기초 체력 및 수면 패턴 정상화',
                    routine: ['매일 아침 미온수 1잔', '취침 전 마그네슘 섭취', '주 2회 가벼운 유산소']
                },
                planB: {
                    planId: 'plan-b-standard',
                    title: 'Plan B: 집중 균형 (Reborn)',
                    description: '가장 추천하는 밸런스형 플랜으로, 확실한 변화를 유도합니다.',
                    duration: '8주',
                    priceEstimate: '약 60만원',
                    focusArea: '호르몬 밸런스 및 만성 피로 해결',
                    routine: ['개인 맞춤 영양제 패키지', '주 1회 순환 테라피', '수면 패턴 코칭']
                },
                planC: {
                    planId: 'plan-c-premium',
                    title: 'Plan C: 완전한 재설계 (Restart)',
                    description: '단기간 내에 최상의 컨디션으로 끌어올리는 인텐시브 코스입니다.',
                    duration: '12주',
                    priceEstimate: '약 120만원',
                    focusArea: '전신 해독 및 세포 재생',
                    routine: ['1:1 전담 총무/조장 배정', '프리미엄 디톡스 프로그램', '심리 상담 및 명상 세션']
                }
            }
        };
    }
}
