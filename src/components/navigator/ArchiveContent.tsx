'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Target, 
  Zap, 
  HelpCircle, 
  Lightbulb, 
  MessageSquare, 
  Star,
  Quote,
  Clock,
  MapPin,
  Plane,
  HeartHandshake,
  X,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  PieChart,
  LifeBuoy,
  Coins,
  Activity,
  UserPlus,
  Calendar,
  UserCheck,
  Search,
  Languages,
  ShieldAlert,
  Stethoscope,
  Moon,
  Frown,
  Heart,
  Hourglass,
  AlertCircle,
  ListChecks,
  ClipboardList,
  Users,
  Ban,
  FileText,
  Briefcase,
  Bell
} from 'lucide-react';

const ArchiveContent = () => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedSubTopic, setSelectedSubTopic] = useState<string | null>(null);

  const subTopics = [
    {
      id: 'info-barrier',
      title: "정보의 장벽 (Information Barrier)",
      icon: Search,
      details: {
        title: "🌫️ 정보의 장벽: \"그것은 진짜 정보입니까, 아니면 광고입니까?\"",
        intro: "고객들은 인터넷에 정보가 너무 많아서 오히려 진짜 믿을 수 있는 정보가 무엇인지 몰라 안개 속을 걷는 기분이 듭니다. 네비게이터들이 이 안개를 어떻게 걷어내야 할지 정리했습니다.",
        points: [
          {
            title: "1. \"어디가 진짜 맛집인가요?\" (선택의 어려움)",
            items: [
              "진짜 정보의 부족: 광고성 실력이 아닌, 진짜 실력과 광고를 구분하기가 불가능합니다.",
              "나와의 어울림: 내 얼굴과 몸에 이 시술이 진짜 가능한지에 대한 답을 찾기 힘듭니다.",
              "브로커의 공포: 나를 도와주는 사람이 나쁜 마음을 먹은 브로커일지 모른다는 의심이 듭니다."
            ],
            icon: Search
          },
          {
            title: "2. \"시술 후 내 모습은 어떻게 변할까요?\" (데이터의 부재)",
            items: [
              "예측할 수 없는 고통: 얼마나 아픈지, 붓기가 언제 빠질지 정확한 숫자가 없습니다.",
              "멈춰버린 일상: 확실한 날짜를 알려주지 않아 계획을 세울 수 없는 답답함을 느낍니다.",
              "사진의 배신: 예쁜 후기 사진이 나에게도 똑같이 일어날 거라는 보장이 없어 불안해합니다."
            ],
            icon: Activity
          },
          {
            title: "3. \"말이 안 통해서 너무 답답해요\" (설명의 부족)",
            items: [
              "어려운 의학 용어: 의사의 설명은 너무 어렵고, 내가 궁금한 건 속 시원히 답해 주지 않습니다.",
              "통역과 예약의 장벽: 가는 길부터 내 마음을 전해줄 통역까지 모든 게 복잡한 숙제입니다.",
              "비용의 불투명성: 명확한 총비용을 알 수 없어서 지갑을 열기가 무섭습니다."
            ],
            icon: Languages
          },
          {
            title: "4. \"나중에 문제 생기면 어쩌죠?\" (책임의 공백)",
            items: [
              "버려진 기분: 시술 후 몸이 이상할 때 누구에게 조언을 구해야 할지 아무도 알려주지 않습니다.",
              "분쟁의 무서움: 부작용이 생겼을 때 나를 위해 싸워줄 사람이 있는지 몰라 밤잠을 설치기도 합니다."
            ],
            icon: ShieldAlert
          }
        ],
        summaryText: "고객님, 인터넷에 정보는 많지만 정작 고객님께 필요한 '진짜 회복 정보'는 찾기 힘드셨죠? gleemile은 그 안개 같은 정보의 장벽을 허물고, 과정을 숫자로 투명하게 보여드릴게요."
      }
    },
    {
      id: 'post-care-gap',
      title: "사후관리 공백 (Post-care Gap)",
      icon: Clock,
      details: {
        title: "🕳️ 사후관리 공백: \"병원 문을 나선 뒤의 외로운 싸움\"",
        intro: "병원은 주사를 놓고 수술하는 데는 최고지만, 고객이 집에 간 뒤에 일어나는 일들까지 다 챙기기는 참 어렵습니다. 그래서 고객들은 집에서 혼자 끙끙 앓으며 불안해하게 됩니다. 이 '텅 빈 시간'이 왜 위험한지 정리했습니다.",
        points: [
          {
            title: "1. \"이게 맞는 건가요?\" (증상 판별의 어려움)",
            items: [
              "정상과 부작용의 혼동: 붓기나 멍이 정상인지 부작용인지 몰라 무서워합니다.",
              "심리적 고립: 통증이 심해질 때 누구에게 물어봐야 할지 몰라 밤잠을 설치기도 합니다.",
              "병원 연락의 부담: 바빠 보이는 병원에 자꾸 전화하기 미안해하며 불안을 키웁니다."
            ],
            icon: Stethoscope
          },
          {
            title: "2. \"어떻게 씻고 자야 하죠?\" (일상 관리의 혼란)",
            items: [
              "주의사항 망각: 병원 설명은 집에 오면 다 잊어버리고 세안/취침 자세 등에서 실수를 합니다.",
              "셀프 케어 포기: 약 복용이나 식이 조절을 챙겨주는 사람이 없어 관리가 소홀해집니다.",
              "해외 유저의 장벽: 본국으로 돌아가는 외국인 유저들은 병원과 연락이 끊겨 더 큰 공백을 느낍니다."
            ],
            icon: Moon
          },
          {
            title: "3. \"왜 이렇게 안 예뻐지죠?\" (결과에 대한 오해)",
            items: [
              "회복 속도에 대한 실망: 즉각적인 효과가 나타나지 않아 결과가 잘못된 것으로 오해합니다.",
              "후회와 분노: 붓기가 덜 빠진 상태에서 결과에 대해 부정적인 감정이 커집니다.",
              "병원과의 분쟁: 상태에 대한 실시간 안심이 부족하면 병원과 불필요한 마찰이 생깁니다."
            ],
            icon: Frown
          },
          {
            title: "4. \"다 나으면 끝인가요?\" (지속적인 관리 부족)",
            items: [
              "일회성 관계의 한계: 병원은 시술 후 관계를 끝내려 하지만, 고객은 이후의 관리가 더 필요합니다.",
              "방향성 상실: 회복 종료 후 어떤 제품을 쓰고 다음엔 무엇을 해야 할지 몰라 길을 잃습니다.",
              "낮은 재방문율: 사후 공백을 느끼면 고객은 병원을 잊어버리고 다시는 찾지 않게 됩니다."
            ],
            icon: Heart
          }
        ],
        summaryText: "고객님, 시술보다 더 중요한 건 '시술 후의 90일'입니다. 병원이 챙기지 못하는 그 외로운 회복의 시간을 gleemile이 24시간 함께하며, 불안함 없이 완벽하게 일상으로 돌아가도록 지켜드릴게요."
      }
    },
    {
      id: 'unpredictability',
      title: "예측 불가능 (Unpredictability)",
      icon: Clock,
      details: {
        title: "🌫️ 예측 불가능: \"깜깜한 터널을 걷는 것 같은 답답함\"",
        intro: "사람들은 어떤 일을 할 때 '언제 끝날지', '어떻게 변할지' 미리 알고 싶어 합니다. 병원 시술은 이 미래를 알기 힘들어 손님들이 무척 불안해합니다. 네비게이터들이 이 안개를 어떻게 설명해야 할지 정리했습니다.",
        points: [
          {
            title: "1. \"언제 일상으로 돌아갈 수 있나요?\" (시간의 안개)",
            items: [
              "일정 수립의 불가: \"내일 출근할까?\" 등의 질문에 확답을 얻지 못해 일상 계획이 무너집니다.",
              "기다림의 지루함: 끝이 보이지 않는 회복 기간은 사람을 심리적으로 지치게 만듭니다.",
              "불확실한 약속: 병원의 모호한 답변은 고객에게 신뢰 대신 불안감을 심어줍니다."
            ],
            icon: Hourglass
          },
          {
            title: "2. \"이 모습이 정상인가요?\" (증상의 안개)",
            items: [
              "부종과 멍의 공포: 거울을 볼 때마다 \"망한 거 아냐?\"라는 극심한 공포를 느낍니다.",
              "자의적 판단의 위험: 전문가의 피드백이 없으면 자신의 상태를 잘못 판단해 엉뚱한 걱정을 키웁니다.",
              "안전장치의 부재: 모든 사소한 신체 변화가 위협으로 다가오는 구간입니다."
            ],
            icon: AlertCircle
          },
          {
            title: "3. \"왜 생각보다 오래 걸리죠?\" (기대의 안개)",
            items: [
              "회복 속도의 괴리: 3일이면 된다는 설명과 달리 일주일이 넘어도 그대로면 병원에 분노를 느낍니다.",
              "시술 후의 후회: 미리 정확한 회복 속도를 조절 받지 못하면 선택 자체를 후회하게 됩니다."
            ],
            icon: TrendingUp
          },
          {
            title: "4. \"무엇을 조심해야 하죠?\" (행동의 안개)",
            items: [
              "가이드라인의 부재: 세안, 식사, 취침 자세 등 매 순간이 스트레스가 되는 선택의 연속입니다.",
              "관리 소홀의 악순환: 명확한 지침이 없으면 관리를 포기하게 되고 회복이 더 늦어집니다."
            ],
            icon: ListChecks
          }
        ],
        summaryText: "고객님, 시술 후의 시간이 깜깜한 터널처럼 느껴지시죠? gleemile은 고객님의 회복 과정을 숫자로 미리 보여드리는 '회복 예측표'를 제공하여 불안함 없는 일상을 계획하게 도와드릴게요."
      }
    },
    {
      id: 'recovery-diagnosis',
      title: "3분 상태정리 (Recovery Summary)",

      icon: ClipboardList,
      details: {
        title: "🧭 3분 상태정리: \"나만을 위한 맞춤형 회복 지도 그리기\"",

        intro: "이 과정은 단순히 질문 몇 개 던지는 게 아닙니다. 손님의 불안함을 '데이터'로 바꾸고, '우리가 당신의 회복을 책임질게요'라고 약속하는 '회복 설계도'를 그리는 과정입니다.",

        points: [
          {
            title: "1. \"당신을 먼저 이해합니다\" (15개의 마법 질문)",
            items: [
              "변화의 크기: 얼마나 많이 달라지고 싶으신지(Small/Mid/Big) 우선 파악합니다.",
              "복귀 시간: 일상 복귀까지 허용된 정확한 시간(1~14일 이상)을 확인합니다.",
              "불안 요소: 통증, 붓기, 흉터 중 고객이 가장 공포를 느끼는 지점을 찾아냅니다."
            ],
            icon: ClipboardList
          },
          {
            title: "2. \"당신의 회복 이름을 찾아드려요\" (5가지 유형 분류)",
            items: [
              "A형(빠른 복귀): 당장 내일 출근해야 하는 바쁜 비즈니스 유저 대상.",
              "B형(확실한 변화): 결과의 완성도를 위해 기꺼이 붓기를 감수하는 유저 대상.",
              "C/D/E형: 프라이버시 보호, 해외 방문 케어, 극심한 불안 케어 등 맞춤형 분류."
            ],
            icon: Users
          },
          {
            title: "3. \"안전하지 않은 길은 미리 막아드려요\" (위험 차단)",
            items: [
              "무리한 기대 방지: 회복 기간과 맞지 않는 무리한 시술 요청을 gleemile이 미리 조절합니다.",
              "솔직한 가이드: 지금 시술을 받으면 안 되는 상황(중요 일정 등)은 단호히 알려줍니다.",
              "분쟁 예방: 사전에 위험을 고지하는 '차단 장치' 역할로 병원과의 마찰을 방지합니다."
            ],
            icon: Ban
          },
          {
            title: "4. \"회복 설계 제안서를 드립니다\" (진정한 설계자)",
            items: [
              "회복 예측표 제공: 가격표 대신 언제 출근 가능한지 숫자로 적힌 지도를 드립니다.",
              "신뢰의 전환: 단순한 소개자가 아닌, 인생에서 가장 안전한 '회복 설계자'로 인정받습니다."
            ],
            icon: FileText
          }
        ],
        summaryText: "고객님, 시술을 정하기 전에 먼저 '3분 상태정리'부터 받아보세요. 고객님의 예산과 일정, 무서워하시는 부분까지 모두 고려해서 세상에 하나뿐인 안전한 회복 지도를 그려드릴게요."

      },
    },
    {
      id: 'recovery-prediction',
      title: "회복 예측표 (Recovery Prediction)",
      icon: Clock,
      details: {
        title: "📅 회복 예측표: \"내일의 나를 미리 만나는 마법의 지도\"",
        intro: "손님들은 시술을 받기 전 '내일 회사를 갈 수 있을까?', '언제쯤 얼굴이 예뻐질까?' 하고 앞날을 아주 궁금해합니다. gleemile은 단순히 '금방 나아요'라고 말하지 않고, 숫자와 표로 정확한 미래를 보여줍니다.",
        points: [
          {
            title: "1. \"이번 회복은 얼마나 힘들까요?\" (회복 난이도)",
            items: [
              "난이도 시각화: 시술 전 과정의 신체적 부담을 낮음/중간/높음으로 파악합니다.",
              "심리적 대비: 손님이 미리 마음의 준비를 하고 충분한 휴식 일정을 잡게 돕습니다.",
              "정보의 투명성: 막연한 걱정을 구체적인 준비 과정으로 바꾸어 줍니다."
            ],
            icon: Activity
          },
          {
            title: "2. \"언제 사람들을 만날 수 있을까요?\" (노출 부담 기간)",
            items: [
              "사회적 복귀 지점: 남들에게 보이기 쑥스러운 시기를 정확히 예측(1일~일주일)합니다.",
              "모임 일정 관리: 친구를 만나거나 중요한 약속을 잡을 수 있는 최적의 날짜를 정해줍니다.",
              "대인관계 자신감: 회복 중 외모 변화에 대한 불안을 데이터로 잠재워 드립니다."
            ],
            icon: Users
          },
          {
            title: "3. \"언제 다시 일터로 돌아갈까요?\" (출근 가능 시점)",
            items: [
              "경제적 일상 복귀: 연차 사용이나 주말 시술 후 월요일 출근 가능 여부를 계산합니다.",
              "현실적인 조언: '다시 일할 수 있는 날짜'를 알려주는 가장 고마운 정보가 됩니다.",
              "일정 최적화: 유저의 직업과 업무 강도에 맞춘 맞춤형 복귀일을 제안합니다."
            ],
            icon: Briefcase
          },
          {
            title: "4. \"병원에는 몇 번 더 와야 하나요?\" (재방문 횟수)",
            items: [
              "사후 일정 투명성: 실밥 제거 등 추후 방문 횟수를 미리 고지하여 일정을 꼬이지 않게 합니다.",
              "해외 유저 필수 정보: 비행기 표 예매를 위해 체류 기간을 확정 짓는 핵심 데이터입니다.",
              "과정의 예측 가능성: 전체 회복 사이클을 한눈에 보게 하여 막연함을 없앱니다."
            ],
            icon: RefreshCw
          },
          {
            title: "5. \"첫 일주일 동안 조심할 것들\" (1주 차 행동 가이드)",
            items: [
              "금기 사항 고지: 음주, 운동 등 회복을 방해하는 행동을 사전에 엄격히 안내합니다.",
              "결과 완성도 향상: 주의사항 준수를 유도하여 시술 결과가 최고로 나오도록 돕습니다.",
              "일상의 시스템화: 시술 후 첫 일주일을 하나의 케어 시스템으로 운영합니다."
            ],
            icon: ShieldAlert
          }
        ],
        summaryText: "손님, 가격표보다 중요한 것은 고객님의 소중한 일상입니다. gleemile은 고객님이 언제 다시 웃으며 출근할 수 있는지 숫자로 먼저 약속드립니다."
      }
    },
    {
      id: 'intensive-care-72h',
      title: "72시간 밀착케어 (72-Hour Intensive Care)",
      icon: ShieldCheck,
      details: {
        title: "🛡️ 72시간 밀착케어: \"당신의 가장 떨리는 3일을 지키는 보디가드\"",
        intro: "시술 후 딱 3일(72시간)은 우리 몸이 \"어라? 나 지금 변하고 있나 봐!\"라며 깜짝 놀라는 시간입니다. 이때 gleemile이 어떻게 손님을 지켜주는지 4가지 마법으로 정리했습니다.",
        points: [
          {
            title: "1. \"내 몸의 신호등을 확인해요\" (증상 정상/비정상 판별)",
            items: [
              "공포의 증상 판별: 붓기나 멍이 정상적으로 나아가고 있는 과정인지 전문가가 즉시 확인합니다.",
              "실시간 안심 케어: 증상 사진 전송 시 \"잘 낫고 있다\"라는 확답을 통해 심리적 공포를 즉시 해소합니다.",
              "데이터 기반 판단: 주관적인 느낌이 아닌, 유사 데이터 비교를 통해 객관적인 상태를 리듬체크합니다."
            ],
            icon: Activity
          },
          {
            title: "2. \"세 가지 색깔의 약속\" (신호등 분기 시스템)",
            items: [
              "초록(🟢): 정상 회복 중. 집에서 편안한 휴식을 권장합니다.",
              "노랑(🟡): 관찰 필요. 추가 사진 요청 및 전문가 밀착 모니터링을 시작합니다.",
              "빨강(🔴): 집중 케어. 병원 연계 및 즉각적인 조치를 gleemile이 직접 돕습니다."
            ],
            icon: Zap
          },
          {
            title: "3. \"깜빡하지 않게 챙겨드려요\" (복용 및 생활 알림)",
            items: [
              "친절한 비서: 약 복용 시간, 수분 섭취, 권장 수면 자세 등을 정기적으로 푸시 알림합니다.",
              "맞춤형 가이드: 고객의 시술 종류에 특화된 일상 행동 지침을 하나하나 챙겨줍니다.",
              "고민 없는 회복: 무엇을 해야 할지 스스로 고민할 필요 없는 '자동화된 회복 환경'을 제공합니다."
            ],
            icon: Bell
          },
          {
            title: "4. \"병원과 손님 사이의 다리가 돼요\" (안전감의 완성)",
            items: [
              "소통의 장벽 제거: 병원에 묻기 미미한 사소한 질문들을 gleemile이 먼저 파악해 해결합니다.",
              "책임의 확장: 시술은 병원이, 회복은 gleemile이 끝까지 책임진다는 강력한 신뢰 관계를 형성합니다.",
              "최상의 결과 보장: 시술 후 72시간의 골든타임을 완벽히 관리하여 부작용을 원천 차단합니다."
            ],
            icon: HeartHandshake
          }
        ],
        summaryText: "고객님, 시술 직후 3일이 가장 무서우시죠? gleemile의 '72시간 밀착케어'는 고객님의 통증과 붓기를 24시간 감시합니다. 우리 몸의 신호등을 초록색으로 유지할 수 있게, gleemile이 당신의 곁을 지키겠습니다."
      }
    }
  ];

  const topics = [
    {
      id: 'real-product',
      title: "진짜 상품",
      summary: "불안을 확신으로 바꾸는 회복 운영체제(OS)",
      desc: "시술 브로커가 아닌, 사용자가 불안해하지 않게 돕는 '회복 운영 시스템(OS)'",
      icon: Target,
      details: {
        title: "📦 우리의 진짜 상품: \"불안을 확신으로 바꾸는 회복 운영체제(OS)\"",
        intro: "우리가 파는 것은 주사나 수술이 아닙니다. 유저가 시술을 결정하는 순간부터 일상으로 완벽하게 돌아갈 때까지, 그 모든 과정을 안전하게 지켜주는 시스템을 파는 겁니다.",
        points: [
          {
            title: "1. 시술이 아니라 '통제권'을 팝니다",
            items: [
              "우리는 단순히 병원을 소개해 주는 곳이 아닙니다.",
              "우리가 파는 진짜 상품은 시술 그 자체가 아니라, 유저가 시술 전후에 느끼는 '불안 없는 회복의 통제권'입니다.",
              "\"어디서 시술받을까?\"라는 고민을 넘어, \"누가 내 회복을 끝까지 책임져 줄까?\"라는 질문에 답을 주는 시스템입니다."
            ],
            icon: ShieldCheck
          },
          {
            title: "2. 병원 밖의 '텅 빈 시간'을 채워줍니다",
            items: [
              "대부분의 사람들은 병원을 나서는 순간 \"이제 나 혼자구나\"라는 불안함을 느낍니다.",
              "우리의 상품은 병원이 챙기지 못하는 시술 전의 불안함과 시술 후의 공백을 꼼꼼하게 메워주는 운영체제(OS)입니다.",
              "병원은 치료를 담당하고, 우리는 그 치료가 효과를 보일 때까지 손님의 관계, 데이터, 그리고 마음을 관리해 줍니다."
            ],
            icon: Clock
          },
          {
            title: "3. 보이지 않는 회복을 '숫자'로 보여줍니다",
            items: [
              "\"기분이 어떠세요?\"라고 묻는 대신, 유저의 회복 상태를 데이터와 그래프로 그려서 눈에 보이게 만들어 줍니다.",
              "'회복 예측표'가 바로 우리의 핵심 상품 중 하나입니다. 언제 출근 가능한지를 숫자로 보여줍니다.",
              "시술 직후 가장 무서운 72시간 동안 상태를 녹색, 황색, 적색으로 판별해 주는 안전장치를 제공합니다."
            ],
            icon: TrendingUp
          },
          {
            title: "4. 손님을 '환자'가 아닌 '성장하는 멤버'로 대합니다",
            items: [
              "우리는 아픈 사람을 치료하는 딱딱한 병원 서비스가 아닙니다.",
              "고객이 더 아름다워지고 건강해지는 과정을 함께 걷는 '회복 가이드'이자 '성장 파트너'의 역할을 팝니다.",
              "시술 후에도 홈케어와 멤버십을 통해 지속적인 소통과 관리를 받을 수 있는 관계를 만듭니다."
            ],
            icon: UserPlus
          }
        ],
        summaryText: "우리는 시술을 파는 브로커가 아닙니다. 병원이 해결하지 못하는 '시술 전후의 공백'을 데이터와 관리로 완벽하게 채워주는 회복 전문 운영 시스템입니다."
      }
    },
    {
      id: 'real-value',
      title: "우리가 파는 가치",
      summary: "불안 없는 회복의 통제권",
      desc: "시술 전의 불안함과 시술 후의 공백을 채워주는 '안전한 회복의 통제권'",
      icon: ShieldCheck,
      details: {
        title: "💎 우리가 파는 진짜 가치: \"불안 없는 회복의 통제권\"",
        intro: "손님들은 시술을 사고 싶어 하는 게 아니야. 시술 후에 내 몸과 마음이 어떻게 될지 내가 '직접 알고 조절할 수 있는 힘'을 사고 싶어 하는 거란다.",
        points: [
          {
            title: "1. \"딱딱 정해진 미래\"를 선물합니다 (예측 가능성)",
            items: [
              "고객들은 \"언제쯤 얼굴이 안 부을까?\", \"내일 회사 갈 수 있을까?\"를 제일 궁금해합니다.",
              "우리는 단순히 기다리라고 하지 않고, 데이터로 정확한 날짜를 알려줘서 불안함을 없애줍니다.",
              "보이지 않는 회복 과정을 숫자로 보여주기 때문에, 고객은 자기 미래를 미리 계획할 수 있게 됩니다."
            ],
            icon: Calendar
          },
          {
            title: "2. \"절대 혼자 두지 않는 안전함\"을 드립니다 (안전감)",
            items: [
              "시술이 끝나하고 병원 문을 나서는 순간, 손님은 \"갑자기 아프면 어쩌지?\" 하고 가장 무서워합니다.",
              "gleemile은 시술 직후 가장 떨리는 72시간 동안 gleemile 전문가가 24시간 내내 곁에서 상태를 확인해 줍니다.",
              "문제가 생기기 전에 미리 찾아내고 끝까지 책임져 준다는 심리적인 안전 기지가 되어줍니다."
            ],
            icon: ShieldCheck
          },
          {
            title: "3. \"나만을 위한 특별한 길\"을 만들어 드립니다 (초개인화)",
            items: [
              "모든 사람의 몸과 마음은 다 다르기 때문에, 똑같은 관리를 받으면 안 됩니다.",
              "우리는 문진표를 통해 손님을 '회복 유형'으로 나누고, 그 사람에게만 딱 맞는 1:1 회복 지도를 그려줍니다.",
              "\"나를 정말 잘 이해해 주는 전문가가 나만 바라보고 있구나\"라는 귀한 대접(VIP 경험)을 받게 해줍니다."
            ],
            icon: UserCheck
          },
          {
            title: "4. \"병원 밖에서도 이어지는 회복\"을 완성합니다 (지속성)",
            items: [
              "시술은 한순간이지만, 진짜 예뻐지고 건강해지는 건 병원 밖에서 보내는 시간에 달려 있습니다.",
              "gleemile은 병원 밖의 수면, 식사, 휴식 등을 운영 시스템(OS)처럼 모두 관리해 줍니다.",
              "한 번의 시술로 끝나는 게 아니라, 계속해서 건강해지는 과정을 관리받는 지속 가능한 플랫폼을 제공합니다."
            ],
            icon: RefreshCw
          }
        ],
        summaryText: "손님, 시술을 받는 건 시작일 뿐입니다. 진짜 가치는 '누가 당신의 회복을 끝까지 설계하고 보호하는가'에 있습니다. gleemile은 당신에게 불안이 없는 완벽한 회복의 통제권을 드립니다."
      }
    },
    {
      id: 'our-secret',
      title: "우리의 비결",
      summary: "보이지 않는 것을 보석으로 바꾸는 기술",
      desc: "수술은 원장님이, 회복은 우리가. 집에 가서 완전히 나을 때까지 곁을 지키는 존재",
      icon: HeartHandshake,
      details: {
        title: "🪄 gleemile만의 필살기: \"우리의 비결\"",
        intro: "우리는 단순히 '관리'를 하는 게 아닙니다. 고객이 느끼지 못했던 가치를 발견하고, 병원이 포기했던 시간을 장악하며, 모두가 행복해지는 새로운 수익 구조를 만듭니다.",
        points: [
          {
            title: "1. \"보이지 않는 것을 보석으로 바꾸기\" (유형화)",
            items: [
              "숫자로 말해요: \"회복 에너지가 20% 올라갔어요\"라고 숫자로 확신을 줍니다.",
              "그림으로 그려요: 붓기 상태나 기분을 무지개 그래프나 날씨 대시보드로 시각화합니다.",
              "리포트를 선물해요: '회복 리포트'를 통해 고객이 쓴 돈의 가치를 눈으로 확인시켜 줍니다."
            ],
            icon: PieChart
          },
          {
            title: "2. \"병원이 놓친 공백을 장악하기\" (회복 OS)",
            items: [
              "72시간의 마법: 시술 직후 가장 무서운 3일 동안 24시간 모니터링으로 곁을 지킵니다.",
              "불안 제거 프로세스: gleemile이 녹색/황색/적색으로 즉시 상태를 판별해 안심을 선사합니다.",
              "예측 가능한 미래: '회복 예측표'를 통해 고객이 자신의 삶을 스스로 통제하게 돕습니다."
            ],
            icon: LifeBuoy
          },
          {
            title: "3. \"배분이 아니라 재창출\" (파트너십)",
            items: [
              "기존 매출 불가침: 병원이 원래 벌던 진료비나 시술비에는 절대 손대지 않습니다.",
              "새로운 수익 정산: '회복 멤버십' 등 gleemile이 새로 창출한 수익만 나누는 구조입니다.",
              "다시 오게 만드는 힘: 높은 만족도로 재방문을 유도하여 병원을 더 부자로 만듭니다."
            ],
            icon: Coins
          }
        ],
        summaryText: "우리는 병원의 경쟁자가 아닙니다. 병원의 전문성에 우리의 관리 역량을 보태어, 환자가 가장 행복하게 회복되는 세상을 만드는 든든한 파트너입니다."
      }
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const activeTopic = topics.find(t => t.id === selectedTopic) || subTopics.find(t => t.id === selectedSubTopic);

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8 px-4 md:px-0 space-y-8 md:space-y-24 pb-20 md:pb-32">
      {/* Intro Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center space-y-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-chapter-accent/10 text-chapter-accent text-[10px] font-black uppercase tracking-[0.2em] mb-4">
          <Star className="w-3.5 h-3.5 fill-current" />
          Navigator Core Philosophy
        </div>
        <h2 className="text-lg md:text-3xl font-serif text-obsidian tracking-tighter leading-[1.1]">
          &quot;우리는 주사를 파는 게 <span className="italic text-slate">아닙니다</span>&quot;
        </h2>
        <p className="text-slate/60 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
          여러분들이 가장 먼저 알아야 할 것은 gleemile의 정체성입니다.<br />
          우리는 브로커가 아니라, 사용자의 불안을 해소하고 회복하는 시스템입니다.
        </p>

        <div className="grid md:grid-cols-3 gap-2.5 md:gap-6 pt-6 md:pt-12">
          {topics.map((card, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              onClick={() => card.id && setSelectedTopic(card.id)}
              className={`px-4 py-3 md:p-8 rounded-[16px] md:rounded-[32px] border text-left transition-all group relative overflow-hidden ${
                card.id 
                  ? 'bg-white border-chapter-accent shadow-sm shadow-chapter-accent/5 cursor-pointer hover:border-chapter-accent' 
                  : 'bg-mist/30 border-line shadow-sm'
              }`}
            >
              <div className="flex flex-col md:space-y-4">
                <div className="flex items-center gap-2.5 mb-1.5 md:mb-0">
                  <div className={`w-7 h-7 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center border shrink-0 transition-all ${
                    card.id ? 'bg-chapter-accent text-white border-chapter-accent' : 'bg-white text-obsidian border-line shadow-sm'
                  }`}>
                    <card.icon className="w-3.5 h-3.5 md:w-6 md:h-6" />
                  </div>
                  <h3 className="text-[15px] md:text-xl font-black text-obsidian tracking-tight">{card.title}</h3>
                </div>
                
                <p className="text-[11px] md:text-sm text-slate/70 font-medium leading-snug md:leading-relaxed">
                  {card.desc}
                </p>
              </div>

              {card.id && (
                <div className="pt-2 flex items-center gap-2 text-chapter-accent font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-chapter-accent/10 px-2 py-1 rounded-md">Click to Deep Dive</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              )}

              {/* Hover Summary Overlay for ID-ed cards */}
              {card.id && (
                <div className="absolute inset-0 bg-obsidian/95 p-8 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-center translate-y-full group-hover:translate-y-0 duration-500">
                   <p className="text-[10px] font-black text-mist/70 uppercase tracking-[0.2em] mb-2 items-center flex gap-2">
                     <Quote className="w-3 h-3" /> Quick Summary
                   </p>
                   <p className="text-mist text-lg font-serif italic leading-relaxed">
                     &quot;{card.summary}&quot;
                   </p>
                   <div className="mt-6 flex items-center gap-2 text-mist/80 text-[10px] font-black uppercase tracking-widest">
                     Double Click for Full Details <Activity className="w-3 h-3 animate-pulse" />
                   </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Detail Overlay Overlay (Generic Modal) */}
      <AnimatePresence>
        {activeTopic && activeTopic.details && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-obsidian/40 backdrop-blur-xl"
            onClick={() => {
              setSelectedTopic(null);
              setSelectedSubTopic(null);
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="w-full max-w-5xl bg-white rounded-[48px] overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-5 md:px-12 md:py-10 bg-mist/30 border-b border-line flex items-start justify-between shrink-0">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-chapter-accent/10 text-chapter-accent text-[10px] font-black uppercase tracking-widest">
                    {activeTopic.icon && <activeTopic.icon className="w-3 h-3" />} Navigator Deep Dive
                  </div>
                  <h3 className="text-base md:text-xl font-serif text-obsidian tracking-tighter">
                    {activeTopic.details.title}
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    setSelectedTopic(null);
                    setSelectedSubTopic(null);
                  }}
                  title="닫기"
                  className="w-12 h-12 rounded-2xl bg-white border border-line flex items-center justify-center text-obsidian hover:bg-obsidian hover:text-white transition-all shadow-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar space-y-6 md:space-y-12">
                <p className="font-serif text-slate/80 leading-relaxed italic border-l-4 border-chapter-accent pl-4 md:pl-8 text-xl md:text-2xl">
                  &quot;{activeTopic.details.intro}&quot;
                </p>

                <div className="grid md:grid-cols-2 gap-4 md:gap-8">
                  {activeTopic.details.points.map((point, i) => (
                    <div key={i} className="p-5 md:p-8 rounded-[24px] md:rounded-[40px] bg-mist/20 border border-line space-y-4 md:space-y-6 group hover:bg-white hover:shadow-xl transition-all">
                      <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center text-chapter-accent group-hover:scale-110 transition-transform">
                         {/* @ts-ignore */}
                        <point.icon className="w-7 h-7" />
                      </div>
                      <h4 className="font-black text-obsidian text-xl">
                        {point.title}
                      </h4>
                      <ul className="space-y-3">
                        {point.items.map((bullet, j) => (
                          <li key={j} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-chapter-accent mt-2 shrink-0" />
                            <p className="text-sm text-slate font-medium leading-relaxed">{bullet}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Final Summary Box in Modal */}
                <div className="p-6 md:p-12 rounded-[24px] md:rounded-[48px] bg-obsidian text-white space-y-4 md:space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 text-white/5 pointer-events-none">
                    <HelpCircle className="w-40 h-40" />
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-mist text-[10px] font-black uppercase tracking-[0.2em] relative z-10">
                    <Lightbulb className="w-4 h-4" /> 💡 네비게이터들을 위한 한마디
                  </div>
                  <p className="text-2xl font-serif leading-relaxed italic relative z-10">
                    &quot;{activeTopic.details.summaryText}&quot;
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4-Step Guide Section */}
      <section className="space-y-4 md:space-y-16">
        <div className="space-y-1.5 md:space-y-4 text-center">
          <h3 className="text-[10px] md:text-xs font-black text-obsidian tracking-[0.3em] uppercase opacity-30">Sales Master Guide</h3>
          <h2 className="font-serif text-obsidian text-xl md:text-3xl">영업 자료의 4단계 구성 (초보자용)</h2>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="space-y-4 md:space-y-12"
        >
          {/* Step 1 */}
          <motion.div variants={item} className="group relative grid md:grid-cols-12 gap-4 md:gap-8 items-center bg-white border border-line p-6 md:p-10 rounded-[24px] md:rounded-[40px] shadow-sm hover:shadow-xl transition-all">
             <div className="md:col-span-1 font-serif italic text-line group-hover:text-chapter-accent/20 transition-colors text-4xl md:text-4xl">01</div>
             <div className="md:col-span-5 space-y-2 md:space-y-4">
                <h4 className="font-black text-obsidian tracking-tight text-xl md:text-2xl">"사람들은 왜 무서워할까요?"</h4>
                <p className="text-xs md:text-sm text-slate/60 font-medium">고객의 마음을 열기 위해 가장 먼저 알아야 할 '불편한 진실' (문제 정의)</p>
             </div>
             <div className="md:col-span-6 grid grid-cols-1 gap-3 md:gap-4 mt-2 md:mt-0">
                {[
                  { id: 'info-barrier', label: "정보의 장벽", sub: "내게 맞는 곳이 어디인지, 상담이 진짜인지 구분하기 힘듦" },
                  { id: 'post-care-gap', label: "사후관리 공백", sub: "시술 후 통증/붓기가 생겨도 물어볼 곳이 없어 불안함" },
                  { id: 'unpredictability', label: "예측 불가능", sub: "언제 일상으로 돌아갈 수 있는지 아무도 알려주지 않음" }
                ].map((point, k) => (
                  <button 
                    key={k} 
                    disabled={!point.id}
                    onClick={() => point.id && setSelectedSubTopic(point.id)}
                    className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all group/point ${
                      point.id 
                        ? 'bg-white border-chapter-accent shadow-sm hover:shadow-md cursor-pointer' 
                        : 'bg-mist/20 border-line/10 cursor-default opacity-60'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 transition-all ${
                      point.id ? 'bg-chapter-accent group-hover/point:scale-150' : 'bg-chapter-accent'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-black text-obsidian">{point.label}</p>
                        {point.id && <ChevronRight className="w-3 h-3 text-chapter-accent opacity-0 group-hover/point:opacity-100 transition-opacity" />}
                      </div>
                      <p className="text-xs text-slate/60 font-bold">{point.sub}</p>
                    </div>
                  </button>
                ))}
             </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div variants={item} className="group relative grid md:grid-cols-12 gap-4 md:gap-8 items-center bg-white border border-line p-6 md:p-10 rounded-[24px] md:rounded-[40px] shadow-sm hover:shadow-xl transition-all">
             <div className="md:col-span-1 font-serif italic text-line group-hover:text-chapter-accent/20 transition-colors text-4xl md:text-4xl">02</div>
             <div className="md:col-span-5 space-y-2 md:space-y-4">
                <h4 className="font-black text-obsidian tracking-tight text-xl md:text-2xl">"gleemile은 이렇게 해결합니다"</h4>
                <p className="text-xs md:text-sm text-slate/60 font-medium">우리가 가진 무기(기술)를 아주 쉽게 설명하기 (해결책)</p>
             </div>
             <div className="md:col-span-6 grid grid-cols-1 gap-4">
                {[
                  { id: 'recovery-diagnosis', icon: Zap, label: "3분 상태정리", sub: "몇 번의 질문으로 고객의 '회복 유형'을 즉시 파악" },

                  { id: 'recovery-prediction', icon: Clock, label: "회복 예측표", sub: "가격표보다 먼저 '언제 출근 가능할지' 숫자로 안심 유도" },
                  { id: 'intensive-care-72h', icon: ShieldCheck, label: "72시간 밀착 케어", sub: "시술 직후 가장 불안한 3일 동안 전문가 동행 관리" }
                ].map((point, k) => (
                  <button 
                    key={k} 
                    disabled={!point.id}
                    onClick={() => point.id && setSelectedSubTopic(point.id)}
                    className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all group/sol ${
                      point.id 
                        ? 'bg-obsidian text-white border-white/10 hover:bg-white hover:text-obsidian hover:border-chapter-accent hover:shadow-xl' 
                        : 'bg-obsidian/80 text-white/70 border-white/5 opacity-50'
                    }`}
                  >
                    <point.icon className={`w-5 h-5 mt-0.5 transition-colors ${
                      point.id ? 'text-mist group-hover/sol:text-chapter-accent' : 'text-mist/60'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-black">{point.label}</p>
                        {point.id && <ChevronRight className="w-3 h-3 text-chapter-accent opacity-0 group-hover/sol:opacity-100 transition-opacity" />}
                      </div>
                      <p className={`text-xs font-bold transition-colors ${
                        point.id ? 'text-mist/70 group-hover/sol:text-slate' : 'text-mist/50'
                      }`}>{point.sub}</p>
                    </div>
                  </button>
                ))}
             </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div variants={item} className="bg-white border border-line p-6 md:p-10 rounded-[24px] md:rounded-[40px] shadow-sm space-y-4 md:space-y-8">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="font-serif italic text-line text-4xl md:text-4xl">03</div>
                  <h4 className="font-black text-obsidian tracking-tight text-xl md:text-2xl">"상대방에 따라 다르게 말해요"</h4>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-mist text-[10px] font-black uppercase text-slate/60 tracking-widest">맞춤형 화법</div>
             </div>
             <div className="grid md:grid-cols-3 gap-3 md:gap-6">
                {[
                  { type: "일반 유저", text: "병원은 치료만 하지만, 우리는 당신이 다시 웃을 때까지 '회복'을 완성해 드립니다.", icon: MessageSquare },
                  { type: "줄기세포 VIP", text: "비싼 시술을 받으셨으니, 효과를 200%로 만드는 '프리미엄 회복 관리'가 필요합니다.", icon: Zap },
                  { type: "해외 유저", text: "비행기 타고 돌아가셔도 끝이 아닙니다. 원격 시스템이 당신을 끝까지 보호합니다.", icon: Plane }
                ].map((pitch, k) => (
                  <div key={k} className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-mist/10 border border-line/40 space-y-2 md:space-y-4">
                    <div className="flex items-center gap-3 mb-1 md:mb-0">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white flex items-center justify-center text-obsidian border border-line shrink-0">
                        <pitch.icon className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <p className="text-[10px] font-black text-chapter-accent uppercase tracking-widest">{pitch.type}</p>
                    </div>
                    <p className="text-[11px] md:text-sm text-obsidian/80 font-bold leading-relaxed italic">&quot;{pitch.text}&quot;</p>
                  </div>
                ))}
             </div>
          </motion.div>

          {/* Step 4 */}
          <motion.div variants={item} className="bg-obsidian p-6 md:p-10 rounded-[24px] md:rounded-[40px] shadow-2xl text-white space-y-4 md:space-y-8">
             <div className="flex items-center gap-3 md:gap-4">
                <div className="font-serif italic text-white/10 text-4xl md:text-4xl">04</div>
                <h4 className="font-black tracking-tight text-xl md:text-2xl">"우리는 병원과 싸우지 않아요"</h4>
             </div>
             <div className="grid md:grid-cols-2 gap-4 md:gap-8">
                <div className="space-y-4 border-l-2 border-chapter-accent/40 pl-6">
                   <h5 className="text-[10px] font-black uppercase text-mist/70 tracking-[0.2em]">기존 매출 불가침</h5>
                   <p className="text-lg font-bold">"원장님의 진료 수익은 건드리지 않습니다. 우리는 새로 만든 '비의료 가치'만 나눕니다."</p>
                </div>
                <div className="space-y-4 border-l-2 border-chapter-accent/40 pl-6">
                   <h5 className="text-[10px] font-black uppercase text-mist/70 tracking-[0.2em]">배분이 아니라 재창출</h5>
                   <p className="text-lg font-bold">"고객이 더 만족해서 병원을 다시 찾게 만드는 '재방문 구조'를 함께 만듭니다."</p>
                </div>
             </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Magic Sentence */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative z-10 w-full"
      >
        <div className="max-w-3xl mx-auto">
           <div className="p-6 md:p-12 rounded-[24px] md:rounded-[40px] bg-white text-obsidian shadow-2xl border border-line/50 space-y-4 md:space-y-6 text-center relative overflow-hidden">
              <div className="relative z-10 flex flex-col items-center justify-center space-y-3 md:space-y-4 mb-4 md:mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-chapter-accent/10 text-chapter-accent text-[10px] font-black uppercase tracking-[0.2em]">
                  <Lightbulb className="w-3 h-3 md:w-4 md:h-4 text-chapter-accent" />
                   The Magic Sentence
                </div>
                <h2 className="font-serif leading-snug text-xl md:text-3xl">
                  초보 네비게이터를 위한 '필살' 문장
                </h2>
              </div>

              <p className="text-[15px] md:text-2xl font-black leading-relaxed relative z-10">
                "고객님, 어디서 시술받을지 고민하시죠? <br className="hidden md:block" />
                하지만 진짜 중요한 건 <span className="text-chapter-accent font-bold">'누가 내 회복을 끝까지 책임져 주는가'</span>입니다. <br className="hidden md:block" />
                gleemile이 당신의 회복을 설계하고 보호하겠습니다."
              </p>
              
              <div className="pt-2 md:pt-4 relative z-10">
                <span className="text-[10px] md:text-xs font-bold text-slate/40 italic">이 한 문장이 고객의 마음을 절반은 열어줄 것입니다.</span>
              </div>
           </div>
        </div>
      </motion.section>

      {/* Footer */}
      <div className="text-center pt-12">
         <p className="text-[10px] font-black text-slate/20 uppercase tracking-[0.4em]">Navigator Education Material © Youniqle</p>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default ArchiveContent;
