'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import NextImage from 'next/image';
import { doc, getDoc, updateDoc, collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { assignMemberRole } from '@/lib/firebase/teamService';
import { normalizeRole, ROLE_LABELS, type TeamRole } from '@/types/role';
import { 
  Loader2, Settings, ArrowRight, ArrowLeft, Search,
  Megaphone, MessageCircle, Calendar, DollarSign, HeartPulse,
  Activity, PenTool, LayoutTemplate, Users, ShieldAlert,
  GraduationCap, BookOpen, ThumbsUp, Timer, CalendarCheck,
  Target, KanbanSquare, RefreshCw, ActivitySquare, ClipboardList,
  Flame, Image, FileVideo, Scale, Crown, ChevronDown, UserCircle2, Flag,
  GripHorizontal, Briefcase, Shield, CalendarX2, FileText, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const AVAILABLE_MODULES = [
  // 공통
  { id: 'AnnouncementBlock', category: 'common', label: '공지사항', description: '팀의 중요 공지를 띄워줍니다.', icon: Megaphone, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: 'CommunityBlock', category: 'common', label: '커뮤니티', description: '팀 전용 단체 대화방입니다.', icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'ScheduleBlock', category: 'common', label: '일정 관리', description: '팀 캘린더 및 일정 투표 기능.', icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'ExpenseSettlementBlock', category: 'common', label: '회비/비용 정산', description: 'N빵 정산과 회비 내역 공유.', icon: DollarSign, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'WellnessBlock', category: 'common', label: '웰니스 컨디션', description: '멤버들의 피로도와 웰니스 기록.', icon: HeartPulse, color: 'text-rose-500', bg: 'bg-rose-50' },

  // 스포츠
  { id: 'SmartPinFinderBlock', category: 'sports', label: '스마트 핀 파인더', description: '카메라로 깃대를 조준하여 샷 거리와 고저차를 측정합니다.', icon: Flag, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'SmartPuttingAssistantBlock', category: 'sports', label: '스마트 퍼팅 어시스턴트', description: 'AR 화면으로 홀컵을 비추면 보정 거리와 에이밍을 알려줍니다.', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'PhysicalACWRBlock', category: 'sports', label: '부상 위험도 모니터링', description: '부상 방지 및 훈련 부하량 관리.', icon: Activity, color: 'text-red-500', bg: 'bg-red-50' },
  { id: 'TacticalDrawingBlock', category: 'sports', label: '전술 보드', description: '경기 전술을 그리기 및 공유.', icon: PenTool, color: 'text-slate-600', bg: 'bg-slate-100' },
  { id: 'BracketPositionBlock', category: 'sports', label: '전술 보드 및 라인업', description: '실시간 포메이션 전술판 및 라인업.', icon: LayoutTemplate, color: 'text-sky-500', bg: 'bg-sky-50' },
  { id: 'PlayersBlock', category: 'common', label: '회원 명단', description: '우리 모임 회원들의 프로필 관리.', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'SessionDifficultyBlock', category: 'sports', label: '오늘 모임 어땠나요?', description: '당일 모임 체감 난이도 수렴기.', icon: ShieldAlert, color: 'text-orange-500', bg: 'bg-orange-50' },

  // 스터디
  { id: 'ClassAttendanceBlock', category: 'study', label: '참석 예약', description: '독립형 참석 예약(RSVP) 및 모임 인원 관리.', icon: GraduationCap, color: 'text-violet-500', bg: 'bg-violet-50' },

  // 비즈니스
  { id: 'KanbanTaskBlock', category: 'business', label: '업무현황', description: '할 일, 진행 중, 완료 작업 관리.', icon: KanbanSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  
  // 소상공인
  { id: 'LaborShieldBlock', category: 'merchant', label: '노무 방어 (Labor-Shield)', description: '전자근로계약서 · 노무 방어', icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'NoShowZeroBlock', category: 'merchant', label: '예약금/회원권 (NoShow-Zero)', description: '식당, 미용실 등 예약금 · 노쇼 방지 · 회원권', icon: CalendarX2, color: 'text-pink-600', bg: 'bg-pink-50' },
  { id: 'QuickQuoteBlock', category: 'merchant', label: '사진 견적서 (Quick-Quote)', description: '1분 사진 견적서 · AS 방어', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'PayCollectorBlock', category: 'merchant', label: '미수금 청구 (Pay-Collector)', description: '미수금 · 원비 자동 청구', icon: DollarSign, color: 'text-violet-600', bg: 'bg-violet-50' },
  { id: 'MarginGuardBlock', category: 'merchant', label: '마진 계산기 (Margin-Guard)', description: '실질 마진율 · BEP 계산기', icon: Scale, color: 'text-orange-600', bg: 'bg-orange-50' }
];

const CATEGORY_TABS = [
  { id: 'all', label: '전체보기' },
  { id: 'common', label: '공통' },
  { id: 'sports', label: '⚽ 스포츠' },
  { id: 'study', label: '📚 스터디' },
  { id: 'business', label: '💼 비즈니스' },
  { id: 'merchant', label: '🏪 소상공인' }
];

const PREDEFINED_EMOJIS = ['🚀', '⚽', '🎨', '💼', '🏆', '🔥', '💡', '🌟', '📚', '💪'];

const MODULE_DETAILS: Record<string, { title: string; subtitle: string; target: string; purpose: string; usage: string[] }> = {
  AnnouncementBlock: {
    title: '공지사항 (Announcements)',
    subtitle: '팀의 중요 공지를 띄워줍니다.',
    target: '중요한 소식을 팀원(회원) 모두가 놓치지 않고 봐야 하는 팀',
    purpose: '단톡방에서 중요한 메시지가 위로 밀려나 못 보는 일을 방지하고, 필독 사항을 대시보드 최상단에 고정합니다.',
    usage: [
      '관리자(운영진)가 대시보드의 공지사항 블록에서 [새 공지 작성] 버튼을 누릅니다.',
      '제목과 내용을 적어 등록하면 팀원들의 대시보드에 즉시 노출됩니다.',
      '새 공지가 등록되면 팀원들에게 알림톡이나 푸시 알림을 보낼 수도 있습니다.'
    ]
  },
  CommunityBlock: {
    title: '커뮤니티 (Community)',
    subtitle: '팀 전용 단체 대화방입니다.',
    target: '자유로운 의견 교환이나 투표, 일상 공유가 필요한 팀',
    purpose: '카카오톡 단톡방을 대체하거나 보완하는 팀 전용 단체 대화방입니다.',
    usage: [
      '누구나 자유롭게 글을 쓰고 사진을 올릴 수 있습니다.',
      '댓글을 달며 소통하고, 중요한 안건이 있을 때는 투표 기능을 활용해 다수결 의견을 모을 수 있습니다.'
    ]
  },
  ScheduleBlock: {
    title: '일정 관리 (Schedule)',
    subtitle: '팀 캘린더 및 일정 투표 기능',
    target: '정기 모임, 회의, 행사 등 오프라인/온라인 일정이 있는 팀',
    purpose: '캘린더 형태로 팀의 전체 일정을 공유하고, 각 일정별로 참석/불참 투표를 받아 인원을 파악합니다.',
    usage: [
      '운영진이 다가오는 일시, 장소, 회비 정보를 넣어 새 일정을 만듭니다.',
      '팀원들은 캘린더에서 일정을 클릭한 후 [참석] 또는 [불참] 버튼을 눌러 의사를 밝힙니다.',
      '운영진은 누가 오는지, 총 몇 명인지 실시간 명단으로 확인할 수 있습니다.'
    ]
  },
  ExpenseSettlementBlock: {
    title: '회비/비용 정산 (Settlement)',
    subtitle: 'N빵 정산과 회비 내역 공유',
    target: '월정액 회비를 걷거나, 모임 후 1/N로 비용을 정산해야 하는 팀',
    purpose: '시스템으로 자동 기록하고, 미납자에게 정중하게 청구합니다.',
    usage: [
      '전체 회식이나 행사 후, 총 지출 금액과 참석자 명단을 선택하여 정산방을 만듭니다.',
      '시스템이 1/N 금액을 자동 계산하여 카카오톡으로 각자에게 송금 요청을 보냅니다.',
      '입금이 완료된 사람은 [완료] 버튼을 눌러 투명하게 내역을 관리합니다.'
    ]
  },
  WellnessBlock: {
    title: '웰니스 컨디션 (Wellness)',
    subtitle: '멤버들의 피로도와 웰니스 기록',
    target: '팀원들의 현재 기분, 스트레스, 피로도 관리가 중요한 팀',
    purpose: '팀원들이 그날그날의 컨디션을 기록하게 하여, 번아웃이나 부상 위험을 조기에 감지하도록 돕습니다.',
    usage: [
      '팀원들이 매일 아침이나 활동 전, 1~5점 척도로 자신의 피로도, 수면의 질 등을 체크합니다.',
      '리더는 대시보드에서 팀원들의 컨디션 신호등을 한눈에 파악하고 무리한 활동을 조율할 수 있습니다.'
    ]
  },
  PlayersBlock: {
    title: '회원 명단 (Members)',
    subtitle: '우리 모임 회원들의 프로필 관리',
    target: '팀원들의 연락처나 비상 연락망, 프로필 관리가 필요한 모든 팀',
    purpose: '우리 팀에 속한 사람들의 이름, 연락처, 가입일, 등급을 한눈에 조회하는 디지털 주소록입니다.',
    usage: [
      '대시보드에서 회원 명단 블록을 누르면 전체 팀원 리스트가 뜹니다.',
      '각 멤버를 클릭하면 상세 프로필(전화번호 등)을 볼 수 있습니다.',
      '리더는 여기서 멤버를 강퇴하거나, 등급(관리자 권한 부여)을 변경할 수 있습니다.'
    ]
  },
  ClassAttendanceBlock: {
    title: '참석 예약',
    subtitle: '독립형 참석 예약 및 인원 관리',
    target: '정기적인 스터디 모임, 독서 모임, 오프라인 강연 등 인원 파악이 필수적인 모임',
    purpose: '대시보드 화면 안에서 빠르고 직관적으로 모임 참석 인원을 파악하는 독립형 참석 예약(RSVP) 시스템입니다.',
    usage: [
      '리더가 활성 일정을 등록하면 대시보드에 모임 정보가 나타납니다.',
      '멤버들은 [참석 예약] 또는 [불참] 버튼을 눌러 상태를 보고하며, 언제든 자유롭게 상태를 변경할 수 있습니다.',
      '노쇼(No-show) 상태가 별도로 관리되어 불성실한 참석자를 기록할 수 있습니다.'
    ]
  },
  KanbanTaskBlock: {
    title: '업무현황',
    subtitle: '칸반보드 기반 태스크 관리',
    target: '프로젝트를 진행하는 스타트업, 비즈니스 팀, 조별 과제를 수행하는 대학생 팀',
    purpose: '팀의 전체 업무 진행 상황을 칸반보드 형태로 관리하고 대시보드에서 직관적인 요약 수치로 파악합니다.',
    usage: [
      '대시보드 썸네일에 최근 7일 기준의 할 일, 진행 중, 완료 개수가 실시간으로 표시됩니다.',
      '종료일이 2일 이내로 임박한 미완료 업무는 자동으로 [긴급] 뱃지가 깜빡이며 알림을 줍니다.',
      '썸네일을 클릭하면 상세 칸반보드로 이동하여 카드를 드래그 앤 드롭으로 관리할 수 있습니다.'
    ]
  },
  SmartPinFinderBlock: {
    title: '스마트 핀 파인더',
    subtitle: '카메라로 깃대를 조준하여 샷 거리와 고저차 측정',
    target: '골프 모임, 골프 동호회',
    purpose: '필드에서 스마트폰 카메라(AR)를 이용해 깃대까지의 샷 거리와 고저차(경사)를 측정합니다.',
    usage: [
      '모듈을 클릭하면 카메라 기반의 AR 화면이 열립니다.',
      '깃대를 향해 스마트폰을 조준하고, 화면에 표시된 기준선에 깃대의 가장 위쪽과 아래쪽 라인을 정확히 맞춰야 정확한 거리가 산출됩니다.',
      '시스템이 남은 거리와 경사도를 계산하여 화면에 띄워줍니다.'
    ]
  },
  SmartPuttingAssistantBlock: {
    title: '스마트 퍼팅 어시스턴트',
    subtitle: 'AR 화면으로 홀컵을 비추면 보정 거리와 에이밍 안내',
    target: '골프 모임, 골프 동호회',
    purpose: '그린 위에서 AR 화면을 통해 그린의 경사를 읽고 보정된 퍼팅 거리와 에이밍 방향을 시각적으로 가이드합니다.',
    usage: [
      '모듈을 클릭해 AR 카메라를 실행합니다.',
      '화면에 표시된 원형 가이드의 크기와 실제 홀컵의 크기를 정확히 일치시켜야 정확한 거리 측정이 가능합니다.',
      '홀컵 방향을 비추면 화면 위에 실제 퍼팅 궤적이 그려집니다.'
    ]
  },
  PhysicalACWRBlock: {
    title: '부상 위험도 모니터링',
    subtitle: '부상 방지 및 훈련 부하량 관리',
    target: '축구, 야구, 농구 등 부상 위험이 있는 격렬한 팀 스포츠',
    purpose: '팀원들의 최근 훈련 부하량(ACWR) 데이터를 분석하여 부상 위험도를 3단계(안정, 모니터링 필요, 부하 과중)로 알려줍니다.',
    usage: [
      '대시보드에 팀원의 부상 위험도 수치와 상태가 표시됩니다.',
      '감독이나 코치진은 수치가 위험 수준인 선수를 즉시 파악하고, 무리하지 않도록 훈련 강도를 조절하거나 휴식을 부여할 수 있습니다.'
    ]
  },
  TacticalDrawingBlock: {
    title: '전술 보드',
    subtitle: '경기 전술을 그리기 및 공유',
    target: '축구, 농구 등 작전 지시가 필요한 스포츠 팀 또는 태블릿으로 강의를 진행하는 일반 스터디/비즈니스 모임',
    purpose: '칠판 질감의 배경 위에 펜으로 자유롭게 선을 그려 경기 전술을 브리핑하거나 강의용 화이트보드로 활용할 수 있는 디지털 작전판입니다.',
    usage: [
      '모듈을 클릭하면 빈 전술 보드 화면이 열립니다.',
      '선수들의 이동 경로를 그리거나 메모를 추가하여 전술을 설명합니다.',
      '일반 모임에서는 강의자가 태블릿을 이용해 시각적 설명을 덧붙이는 칠판 용도로 유용하게 사용할 수 있습니다.'
    ]
  },
  BracketPositionBlock: {
    title: '전술 보드 및 라인업',
    subtitle: '실시간 포메이션 전술판 및 라인업',
    target: '축구, 풋살 등 팀을 나누어 경기를 진행하는 팀',
    purpose: '미니 경기장 화면 위에 선수 아바타들을 배치하여 시각적으로 선발 라인업을 짜고 포메이션을 구성합니다.',
    usage: [
      '모듈을 열면 축구장 그래픽 위에 선수 포지션 아이콘들이 나타납니다.',
      '아이콘을 드래그 앤 드롭으로 자유롭게 배치합니다.',
      'A팀(블루)과 B팀(레드)을 나누어 자체 청백전 라인업이나 상대팀 맞춤형 포메이션을 짤 수 있습니다.'
    ]
  },
  SessionDifficultyBlock: {
    title: '오늘 모임 어땠나요?',
    subtitle: '당일 모임 체감 난이도 수렴기',
    target: '훈련 강도 조절이 필요한 스포츠 팀이나 난이도 피드백이 중요한 스터디 모임',
    purpose: '훈련이나 모임이 끝난 직후, 팀원들에게 체감 난이도(RPE)를 1~5점 척도로 입력받아 다음 훈련에 반영합니다.',
    usage: [
      '팀원들이 훈련 종료 후 대시보드에서 당일 체감 난이도를 5단계 중 하나로 선택합니다.',
      '너무 쉽거나(1점) 너무 어렵다(4, 5점)고 선택하면 Gemini AI가 추가 질문을 던져 구체적인 피드백을 수집합니다.',
      '운영진은 모인 데이터를 바탕으로 다음 훈련 스케줄과 난이도를 완벽하게 조율할 수 있습니다.'
    ]
  },
  LaborShieldBlock: {
    title: '노무 방어 (Labor-Shield)',
    subtitle: '전자근로계약서 · 노무 방어',
    target: '알바생이나 파트타임 직원을 자주 고용하는 모든 업종 (특히 요식업, 카페, 편의점 등)',
    purpose: '근로계약서 미작성으로 인한 과태료(건당 최소 120만 원) 리스크를 원천 차단하고, 주휴수당을 정확히 계산합니다.',
    usage: [
      '모듈을 열고 직원의 시급, 근무 요일, 시간을 입력합니다.',
      '직원의 전화번호를 넣고 [전송]을 누르면, 알바생의 카카오톡으로 근로계약서 전자서명 링크가 날아갑니다.',
      '알바생이 스마트폰으로 서명하면 계약서 PDF가 자동으로 서버에 영구 보관되며 사장님과 알바생 모두에게 교부됩니다.'
    ]
  },
  NoShowZeroBlock: {
    title: '예약금/회원권 (NoShow-Zero)',
    subtitle: '식당, 미용실 등 예약금 · 노쇼 방지 · 회원권',
    target: '100% 예약제로 운영되며 노쇼가 치명적인 업종 (식당, 미용실, 네일샵, 피부관리, PT 등)',
    purpose: '노쇼(예약 부도)를 방지하기 위해 예약금을 미리 결제받고, 기존 단골들의 선불 회원권(횟수권)을 차감 형태로 관리합니다.',
    usage: [
      '전화나 문자로 예약을 잡은 후, 모듈을 열어 고객 이름과 예약금을 입력합니다.',
      '카카오톡으로 예약금 결제 링크가 고객에게 발송됩니다.',
      '고객이 15분 내에 결제하면 예약이 확정되고, 결제하지 않으면 자동 취소됩니다.'
    ]
  },
  QuickQuoteBlock: {
    title: '사진 견적서 (Quick-Quote)',
    subtitle: '1분 사진 견적서 · AS 방어',
    target: '현장 방문이나 사진을 보고 견적을 내야 하는 출장 서비스 업종 (인테리어, 설비, 간판, 청소, 세차 등)',
    purpose: '고객과의 금액 및 AS 분쟁을 방지하기 위해 정식 견적서를 발송하고 법적 효력이 있는 동의를 받습니다.',
    usage: [
      '고객이 보낸 수리할 곳의 사진을 업로드하고 견적 금액과 특약 사항을 적습니다.',
      '고객의 카톡으로 사진이 첨부된 정식 견적서 링크가 발송됩니다.',
      '고객이 견적서 하단에 [동의 및 진행] 버튼을 누르면 증빙 자료로 자동 저장됩니다.'
    ]
  },
  PayCollectorBlock: {
    title: '미수금 청구 (Pay-Collector)',
    subtitle: '미수금 · 원비 자동 청구',
    target: '월 단위 정기 결제가 있거나, 외상 거래가 잦은 업종 (학원비, 교습소, B2B 도매, 식자재 유통 등)',
    purpose: '사장님이 직접 독촉할 필요 없이, 시스템이 알아서 미수금을 청구하고 결제를 받아냅니다.',
    usage: [
      '모듈에 미납자 이름, 청구 금액, 사유(예: 8월 학원비)를 입력합니다.',
      '카카오톡으로 미수금 청구서 및 결제 링크가 정중한 멘트와 함께 발송됩니다.',
      '고객이 링크를 눌러 결제하면, 사장님 대시보드에 즉시 수납 완료로 처리됩니다.'
    ]
  },
  MarginGuardBlock: {
    title: '마진 계산기 (Margin-Guard)',
    subtitle: '실질 마진율 · BEP 계산기',
    target: '배달앱 수수료, 재료비, 인건비가 복잡하게 얽혀 있는 업종 (배달 음식점, 프랜차이즈, 소매업 등)',
    purpose: '배달앱 수수료, 부가세 등을 모두 떼고 내 주머니에 실제로 얼마가 남는지(실질 마진율)를 정확히 계산해 줍니다.',
    usage: [
      '모듈을 열어 주력 메뉴의 판매가, 원가, 포장비, 배달앱 수수료율을 세팅합니다.',
      '하루 목표 매출이나 고정비를 입력하면, 적자를 면하기 위한 최소 판매량(BEP)을 직관적으로 보여줍니다.'
    ]
  }
};

interface MemberSummary {
  id: string;
  name: string;
  role: string;
  joinedAt?: Timestamp;
}

const ROLE_OPTIONS: { value: TeamRole; label: string; color: string; bg: string }[] = [
  { value: 'manager', label: '운영진', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  { value: 'member', label: '회원', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  { value: 'guest', label: '참관인', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
];

function SortableModuleItem({ id, module }: { id: string, module: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };
  const Icon = module.icon;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`w-full flex items-center gap-4 bg-white border rounded-2xl p-4 shadow-sm ${
        isDragging ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500 z-50' : 'border-slate-200 hover:border-emerald-300'
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${module.bg}`}>
        <Icon className={`w-6 h-6 ${module.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-base font-bold text-slate-800 block truncate">{module.label}</span>
        <span className="text-xs font-medium text-slate-500 block truncate mt-0.5">{module.description}</span>
      </div>
      <div 
        className="ml-auto shrink-0 p-3 cursor-grab active:cursor-grabbing touch-none flex items-center justify-center rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
        {...attributes}
        {...listeners}
      >
        <GripHorizontal className="w-6 h-6 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

export default function TeamSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const teamId = params?.teamId as string;

  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState('새로운 팀');
  const [teamDescription, setTeamDescription] = useState('');
  const [teamTemplate, setTeamTemplate] = useState('common');
  const [teamIcon, setTeamIcon] = useState<string>('');
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  
  const [iconUploading, setIconUploading] = useState(false);
  const [iconSaving, setIconSaving] = useState(false);
  const [pendingIconUrl, setPendingIconUrl] = useState<string>(''); // 업로드됐지만 아직 Firestore에 저장 안 된 URL
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [dashboardSetupTab, setDashboardSetupTab] = useState<'select' | 'reorder'>('select');

  // 👑 회원 등급 관리 상태
  const [isOwner, setIsOwner] = useState(false);
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [teamOwnerId, setTeamOwnerId] = useState('');
  const [roleChanging, setRoleChanging] = useState<string | null>(null); // 변경 중인 멤버 ID
  const [openDropdown, setOpenDropdown] = useState<string | null>(null); // 열린 드롭다운 ID
  const [infoModalModuleId, setInfoModalModuleId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
      return;
    }
    if (status === 'authenticated') {
      fetchTeamData();
    }
  }, [status, teamId]);

  const fetchTeamData = async () => {
    if (!teamId) return;
    try {
      const teamRef = doc(db, 'teams', teamId);
      const teamSnap = await getDoc(teamRef);
      if (teamSnap.exists()) {
        const data = teamSnap.data();
        setTeamName(data.teamName || '새로운 팀');
        setTeamDescription(data.description || '');
        setTeamIcon(data.teamIcon || '');
        
        const ownerId = data.ownerId || '';
        setTeamOwnerId(ownerId);
        
        // Owner 여부 확인
        const currentUserId = session?.user?.id;
        if (currentUserId && ownerId === currentUserId) {
          setIsOwner(true);
        } else if (currentUserId) {
          // member_summaries에서도 확인
          const mySummaryRef = doc(db, `teams/${teamId}/member_summaries`, currentUserId);
          const mySummarySnap = await getDoc(mySummaryRef);
          if (mySummarySnap.exists() && mySummarySnap.data().role === 'owner') {
            setIsOwner(true);
          }
        }
        
        const template = data.templateType || 'common';
        setTeamTemplate(template);
        
        // Auto select tab based on template
        if (template && template !== 'common') {
          setActiveTab(template);
        }

        if (data.enabledModules && data.enabledModules.length > 0) {
          // If already has modules set
          setEnabledModules(data.enabledModules);
        } else {
          // Default selection: empty (disabled by default)
          setEnabledModules([]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 👑 Owner일 때 멤버 목록 실시간 리스닝
  useEffect(() => {
    if (!isOwner || !teamId) return;
    const q = query(collection(db, `teams/${teamId}/member_summaries`), orderBy('joinedAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: MemberSummary[] = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as MemberSummary);
      });
      setMembers(fetched);
    });
    return () => unsubscribe();
  }, [isOwner, teamId]);

  const handleRoleChange = async (targetUserId: string, newRole: TeamRole) => {
    if (!session?.user?.id || !teamId) return;
    setRoleChanging(targetUserId);
    try {
      await assignMemberRole(teamId, targetUserId, newRole as 'manager' | 'member' | 'guest', session.user.id);
      setOpenDropdown(null);
    } catch (error: any) {
      alert(error.message || '등급 변경에 실패했습니다.');
    } finally {
      setRoleChanging(null);
    }
  };

  const handleToggle = (moduleId: string, checked: boolean) => {
    if (checked) {
      if (MODULE_DETAILS[moduleId]) {
        // 상세 안내가 있는 모듈은 모달 띄우기
        setInfoModalModuleId(moduleId);
      } else {
        // 안내가 없는 모듈은 바로 켬
        setEnabledModules(prev => !prev.includes(moduleId) ? [...prev, moduleId] : prev);
      }
    } else {
      // 끌 때는 바로 끔
      setEnabledModules(prev => prev.filter(id => id !== moduleId));
    }
  };

  const handleConfirmEnableModule = () => {
    if (infoModalModuleId) {
      setEnabledModules(prev => !prev.includes(infoModalModuleId) ? [...prev, infoModalModuleId] : prev);
      setInfoModalModuleId(null);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = enabledModules.indexOf(active.id as string);
      const newIndex = enabledModules.indexOf(over.id as string);
      setEnabledModules(arrayMove(enabledModules, oldIndex, newIndex));
    }
  };

  const handleComplete = async () => {
    if (!teamId) return;
    try {
      setSaving(true);
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, {
        enabledModules: enabledModules,
        description: teamDescription,
        teamIcon: teamIcon,
        updatedAt: new Date()
      });
      alert('대시보드 설정이 저장되었습니다.');
      router.push(`/mile/${teamId}/dashboard`);
    } catch (error) {
      console.error(error);
      alert('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const filteredModules = useMemo(() => {
    return AVAILABLE_MODULES.filter(m => {
      const matchesSearch = m.label.includes(searchQuery) || m.description.includes(searchQuery);
      const matchesTab = activeTab === 'all' || m.category === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [searchQuery, activeTab]);

  const activeCount = enabledModules.length;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !teamId) return;

    setIconUploading(true);
    try {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      await new Promise((resolve) => { img.onload = resolve; });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const MAX_SIZE = 256;
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
      } else {
        if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
      }
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      const webpDataUrl = canvas.toDataURL('image/webp', 0.8);

      const iconRef = ref(storage, `teams/${teamId}/icon.webp`);
      await uploadString(iconRef, webpDataUrl, 'data_url');
      const downloadURL = await getDownloadURL(iconRef);
      const urlWithTimestamp = `${downloadURL}&ts=${Date.now()}`;

      // Storage 업로드 후 프리뷰에만 반영 — Firestore 저장은 아래 "대표 이미지로 등록" 버튼 클릭 시
      setTeamIcon(urlWithTimestamp);
      setPendingIconUrl(downloadURL); // Firestore 저장 대기 URL
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIconUploading(false);
    }
  };

  const handleRegisterIcon = async () => {
    if (!pendingIconUrl || !teamId) return;
    setIconSaving(true);
    try {
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, { teamIcon: pendingIconUrl });
      setPendingIconUrl(''); // 등록 완료 후 대기 상태 초기화
      alert('대표 이미지가 등록되었습니다!');
    } catch (error) {
      console.error('Icon register failed:', error);
      alert('대표 이미지 등록에 실패했습니다.');
    } finally {
      setIconSaving(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-24 selection:bg-emerald-200 font-sans">
      
      {/* Header */}
      <div className="bg-white px-6 py-10 border-b border-slate-100 shadow-sm text-center sticky top-0 z-30 relative">
        <Link 
          href={`/mile/${teamId}/dashboard`} 
          className="absolute top-6 left-6 inline-flex items-center gap-1 text-slate-400 hover:text-emerald-600 transition-colors text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> 뒤로가기
        </Link>

        <div className="w-14 h-14 bg-slate-50 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-inner border border-slate-100">
          <Settings className="w-7 h-7 text-slate-700" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
          대시보드 맞춤 설정
        </h1>
        <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto leading-relaxed">
          <span className="text-emerald-600 font-bold">{teamName}</span>의 성격에 맞춰
          필요한 모듈을 탐색하고 조합해 보세요.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        
        {/* Team Icon Setup */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="flex-1 space-y-2 text-center md:text-left">
            <h2 className="text-lg font-black text-slate-800">클럽 프로필 이미지 설정</h2>
            <p className="text-sm text-slate-500">
              클럽을 대표하는 사진을 업로드하거나 어울리는 이모지를 선택하세요.<br className="hidden md:block"/>설정된 사진은 메인 화면의 내 클럽 목록에 표시됩니다.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <label className="cursor-pointer">
                <Input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={iconUploading} />
                <Button asChild variant="outline" className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-10" disabled={iconUploading}>
                  <span>
                    {iconUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Image className="w-4 h-4 mr-2" />}
                    사진 업로드
                  </span>
                </Button>
              </label>
              <Button 
                variant="outline" 
                className="rounded-xl h-10 text-slate-600 hover:bg-slate-50"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                😀 이모지 선택
              </Button>
            </div>
            
            {showEmojiPicker && (
              <div className="mt-4 p-4 bg-slate-50 rounded-2xl flex flex-wrap gap-2 justify-center md:justify-start animate-in slide-in-from-top-2">
                {PREDEFINED_EMOJIS.map(emoji => (
                  <button 
                    key={emoji} 
                    onClick={() => { setTeamIcon(emoji); setShowEmojiPicker(false); }}
                    className="w-10 h-10 text-2xl hover:scale-125 transition-transform bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="shrink-0 flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-3xl bg-slate-50 border border-slate-200 shadow-inner flex items-center justify-center overflow-hidden relative">
              {iconUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              ) : teamIcon ? (
                teamIcon.length <= 4 ? (
                  <span className="text-4xl">{teamIcon}</span>
                ) : (
                  <NextImage src={teamIcon} alt="팀 대표 이미지" width={96} height={96} className="w-full h-full object-cover" />
                )
              ) : (
                <span className="text-3xl font-black text-slate-300">{teamName.charAt(0)}</span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Preview</p>
            {/* 업로드 후 Firestore 저장 확인 버튼 */}
            {pendingIconUrl && (
              <button
                onClick={handleRegisterIcon}
                disabled={iconSaving}
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/30 transition-all animate-in fade-in zoom-in-95 duration-200 disabled:opacity-60"
              >
                {iconSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : '✓'}
                대표 이미지로 등록
              </button>
            )}
          </div>
        </section>

        {/* Team Description Setup */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 pb-12">
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-800">클럽 한줄 소개 설정</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">클럽의 정체성을 한 문장으로 표현해보세요.</p>
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-4">
            <label className="text-xs font-bold text-slate-500 mb-1.5 flex justify-between">
              <span>한줄 소개 입력</span>
              <span className="text-slate-400 font-normal">{teamDescription.length}/60</span>
            </label>
            <input
              type="text"
              placeholder="예: 매주 토요일 오전에 달리는 모임입니다."
              maxLength={60}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
            />
          </div>
        </section>

        {/* 👑 회원 등급 관리 섹션 — Owner만 표시 */}
        {isOwner && (
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">회원 등급 관리</h2>
                <p className="text-xs text-slate-500 font-medium">관리자만 회원의 등급을 변경할 수 있습니다.</p>
              </div>
            </div>
            
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-0.5 items-center px-2 mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">프로필</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">이름</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">등급</span>
              </div>
              
              <div className="space-y-2">
                {members.map((member) => {
                  const memberRole = normalizeRole(member.role);
                  const isSelf = member.id === session?.user?.id;
                  const isMemberOwner = member.id === teamOwnerId || memberRole === 'owner';
                  const isDropdownOpen = openDropdown === member.id;
                  const isChanging = roleChanging === member.id;
                  
                  return (
                    <div key={member.id} className="relative">
                      <div className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        isMemberOwner ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50/50 border-slate-100'
                      }`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-slate-400 shrink-0 border border-slate-200">
                            {isMemberOwner ? (
                              <Crown className="w-4 h-4 text-amber-500" />
                            ) : (
                              <UserCircle2 className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-bold text-slate-800 block truncate">
                              {member.name}
                              {isSelf && <span className="text-[10px] text-emerald-500 ml-1">(나)</span>}
                            </span>
                          </div>
                        </div>
                        
                        {/* 등급 표시 / 변경 버튼 */}
                        {isMemberOwner ? (
                          <span className="text-xs font-bold text-amber-600 bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 shrink-0">
                            👑 관리자
                          </span>
                        ) : (
                          <button
                            onClick={() => setOpenDropdown(isDropdownOpen ? null : member.id)}
                            disabled={isChanging}
                            className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
                              isDropdownOpen 
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-1 ring-emerald-300'
                                : memberRole === 'manager'
                                  ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                                  : memberRole === 'member'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {isChanging ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                {ROLE_LABELS[memberRole] || '회원'}
                                <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      
                      {/* 드롭다운 */}
                      {isDropdownOpen && !isMemberOwner && (
                        <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden min-w-[140px] animate-in slide-in-from-top-2 duration-150">
                          {ROLE_OPTIONS.map(option => (
                            <button
                              key={option.value}
                              onClick={() => handleRoleChange(member.id, option.value)}
                              disabled={memberRole === option.value}
                              className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors flex items-center justify-between ${
                                memberRole === option.value
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span>{option.label}</span>
                              {memberRole === option.value && (
                                <span className="text-emerald-500 text-xs">✓ 현재</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {members.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-8 font-medium">등록된 회원이 없습니다.</p>
              )}
            </div>
          </section>
        )}

        {/* Dashboard Configuration Tabs Section */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <LayoutTemplate className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">대시보드 모듈 설정</h2>
              <p className="text-xs text-slate-500 font-medium">필요한 모듈을 선택하고 원하는 순서로 배치하세요.</p>
            </div>
          </div>

          {/* Setup Tabs */}
          <div className="flex bg-slate-100/80 p-1 rounded-2xl mb-8">
            <button
              onClick={() => setDashboardSetupTab('select')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                dashboardSetupTab === 'select'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ActivitySquare className="w-4 h-4" />
              모듈 선택 ({enabledModules.length})
            </button>
            <button
              onClick={() => setDashboardSetupTab('reorder')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                dashboardSetupTab === 'reorder'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <GripHorizontal className="w-4 h-4" />
              모듈 배치
            </button>
          </div>

          {dashboardSetupTab === 'select' && (
            <div className="animate-in fade-in duration-300">
              {/* Search & Filter */}
              <div className="space-y-4 mb-6">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    placeholder="모듈 이름이나 기능을 검색해 보세요..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 bg-white border-slate-200 rounded-2xl shadow-sm text-base focus-visible:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {CATEGORY_TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                        activeTab === tab.id
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modules Grid */}
              {filteredModules.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-slate-400 font-bold">검색 결과가 없습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredModules.map(module => {
                    const Icon = module.icon;
                    const isChecked = enabledModules.includes(module.id);
                    
                    return (
                      <div 
                        key={module.id} 
                        className={`p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                          isChecked 
                            ? 'bg-white border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500' 
                            : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm'
                        }`}
                        onClick={() => handleToggle(module.id, !isChecked)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${module.bg}`}>
                            <Icon className={`w-6 h-6 ${module.color}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded-sm">
                                {module.category}
                              </span>
                              <h3 className="text-base font-bold text-slate-800">
                                {module.label}
                              </h3>
                            </div>
                            <p className="text-xs text-slate-500 font-medium line-clamp-1">
                              {module.description}
                            </p>
                          </div>
                        </div>
                        
                        <div onClick={(e) => e.stopPropagation()}>
                          <Switch 
                            checked={isChecked}
                            onCheckedChange={(checked) => handleToggle(module.id, checked)}
                            aria-label={`${module.label} 모듈 활성화 토글`}
                            className="data-[state=checked]:bg-emerald-500 shrink-0 ml-2"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {dashboardSetupTab === 'reorder' && (
            <div className="animate-in fade-in duration-300">
              {enabledModules.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
                  <LayoutTemplate className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-bold mb-1">선택된 모듈이 없습니다.</p>
                  <p className="text-slate-400 text-sm">모듈 선택 탭에서 사용할 기능을 추가해 주세요.</p>
                </div>
              ) : (
                <div className="bg-slate-50/50 rounded-2xl p-4 sm:p-6 border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium mb-4 text-center">블록의 우측 손잡이를 잡고 위아래로 드래그하여 순서를 변경하세요.</p>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <div className="flex flex-col gap-3">
                      <SortableContext items={enabledModules} strategy={verticalListSortingStrategy}>
                        {enabledModules.map(id => {
                          const module = AVAILABLE_MODULES.find(m => m.id === id);
                          if (!module) return null;
                          return <SortableModuleItem key={id} id={id} module={module} />;
                        })}
                      </SortableContext>
                    </div>
                  </DndContext>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Submit */}
        <div className="pt-8 pb-10">
          <Button 
            onClick={handleComplete}
            disabled={saving || activeCount === 0}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-lg shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>총 {activeCount}개 모듈로 대시보드 조립 <ArrowRight className="w-5 h-5" /></>
            )}
          </Button>
          <p className="text-center text-xs text-slate-400 mt-4 font-medium">
            언제든지 셋업 화면으로 돌아와 모듈을 추가/제거할 수 있습니다.
          </p>
        </div>

      </div>

      {/* 모듈 안내 모달 */}
      {infoModalModuleId && MODULE_DETAILS[infoModalModuleId] && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col mx-4">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-800">{MODULE_DETAILS[infoModalModuleId].title}</h2>
                <p className="text-xs text-slate-500 mt-1">{MODULE_DETAILS[infoModalModuleId].subtitle}</p>
              </div>
              <button onClick={() => setInfoModalModuleId(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors" aria-label="닫기">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div>
                <p className="text-xs font-black text-emerald-600 mb-2">🎯 어떤 사장님께 필요한가요?</p>
                <p className="text-sm text-slate-700 bg-emerald-50 rounded-xl p-4">{MODULE_DETAILS[infoModalModuleId].target}</p>
              </div>
              
              <div>
                <p className="text-xs font-black text-blue-600 mb-2">💡 주요 용도</p>
                <p className="text-sm text-slate-700 bg-blue-50 rounded-xl p-4">{MODULE_DETAILS[infoModalModuleId].purpose}</p>
              </div>

              <div>
                <p className="text-xs font-black text-slate-800 mb-2">🚀 사용법</p>
                <ol className="space-y-3 bg-slate-50 rounded-xl p-4">
                  {MODULE_DETAILS[infoModalModuleId].usage.map((step, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-slate-700">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="px-6 pb-6 pt-4 border-t border-slate-100 shrink-0 flex gap-3">
              <Button onClick={() => setInfoModalModuleId(null)} variant="outline" className="flex-1 h-12 rounded-xl text-slate-600 font-bold border-slate-200 hover:bg-slate-50">
                취소
              </Button>
              <Button onClick={handleConfirmEnableModule} className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/20">
                계속 (추가하기)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
