'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Loader2, Shield, Users, Settings, Plus, ArrowLeft, Search, LayoutTemplate,
  Edit3, Camera, CheckCircle2, ChevronRight, ActivitySquare, Send, Copy, Download, Share2, Bell
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';

import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { DynamicBlockBoard } from '@/components/dashboard/DynamicBlockBoard';
import { TeamChatRoom } from '@/components/chat/TeamChatRoom';
import { TeamBlock, isOkrBlock, isAcwrBlock } from '@/types/firebase';
import { NotificationSettingsSheet } from '@/components/user/NotificationSettingsSheet';

// --- 코어 모듈 ---
import { WellnessBlock } from '@/components/blocks/WellnessBlock';
import { AnnouncementBlock } from '@/components/blocks/AnnouncementBlock';
import { ScheduleBlock } from '@/components/blocks/ScheduleBlock';
import { CommunityBlock } from '@/components/blocks/CommunityBlock';
import { PlayersBlock } from '@/components/blocks/PlayersBlock';

// --- 비즈니스 모듈 ---
import { KanbanTaskBlock } from '@/components/blocks/KanbanTaskBlock';
import { OKRMappingBlock } from '@/components/blocks/OKRMappingBlock';
import { ConstantFeedbackBlock } from '@/components/blocks/ConstantFeedbackBlock';
import { WeeklyPulseBlock } from '@/components/blocks/WeeklyPulseBlock';

// --- 음악/창작 모듈 ---
import { PartBalanceSchedulerBlock } from '@/components/blocks/PartBalanceSchedulerBlock';
import { MediaArchiveBlock } from '@/components/blocks/MediaArchiveBlock';
import { CreativeBurnoutBlock } from '@/components/blocks/CreativeBurnoutBlock';
import { DDayBoardBlock } from '@/components/blocks/DDayBoardBlock';

// --- 학업/스터디 모듈 ---
import { TimerProgressBlock } from '@/components/blocks/TimerProgressBlock';
import { StudyMaterialArchiveBlock } from '@/components/blocks/StudyMaterialArchiveBlock';
import { AssignmentMissionBlock } from '@/components/blocks/AssignmentMissionBlock';
import { StudySatisfactionBlock } from '@/components/blocks/StudySatisfactionBlock';

// --- 취미/클래스 모듈 ---
import { ExpenseSettlementBlock } from '@/components/blocks/ExpenseSettlementBlock';
import { ClassAttendanceBlock } from '@/components/blocks/ClassAttendanceBlock';
import { ExcellentGalleryBlock } from '@/components/blocks/ExcellentGalleryBlock';
import { SessionDifficultyBlock } from '@/components/blocks/SessionDifficultyBlock';

// --- 스포츠 모듈 ---
import { BracketPositionBlock } from '@/components/blocks/BracketPositionBlock';
import { TacticalDrawingBlock } from '@/components/blocks/TacticalDrawingBlock';
import { PhysicalACWRBlock } from '@/components/blocks/PhysicalACWRBlock';
import { AuthInterceptModal } from '@/components/auth/AuthInterceptModal';

const BLOCK_REGISTRY = [
  // Core
  { blockId: 'wellness', blockName: '웰니스 체크', category: 'core', desc: '오늘의 컨디션 체크인' },
  { blockId: 'announcements', blockName: '공지사항', category: 'core', desc: '팀 공지 및 주요 소식' },
  { blockId: 'schedule', blockName: '일정', category: 'core', desc: '모임 캘린더 및 스케줄' },
  { blockId: 'community', blockName: '커뮤니티', category: 'core', desc: '멤버 간 자유 소통' },
  { blockId: 'players', blockName: '멤버 명단', category: 'core', desc: '참여자 목록 및 관리' },
  // Business
  { blockId: 'kanban', blockName: '칸반 태스크 보드', category: 'business', desc: '진행 상태별 업무 트래킹' },
  { blockId: 'okr', blockName: 'OKR 목표 매핑', category: 'business', desc: '조직과 개인의 목표 정렬' },
  { blockId: 'feedback', blockName: '상시 성장 피드백', category: 'business', desc: '동료 간 다면 평가 및 리뷰' },
  { blockId: 'weekly_pulse', blockName: '주간 펄스 체크', category: 'business', desc: '팀 컨디션 및 번아웃 예방' },
  // Hobby (Art/Music + Class)
  { blockId: 'part_balance', blockName: '파트별 밸런스 스케줄러', category: 'hobby', desc: '세션/파트 별 연습 일정 조율' },
  { blockId: 'media_archive', blockName: '합주 음원/영상 아카이브', category: 'hobby', desc: '미디어 파일 클라우드 저장소' },
  { blockId: 'creative_burnout', blockName: '창작 번아웃 게이지', category: 'hobby', desc: '팀원 멘탈리티 및 스트레스 관리' },
  { blockId: 'dday_board', blockName: '공연/전시 디데이 보드', category: 'hobby', desc: '중요 이벤트 D-Day 카운트다운' },
  { blockId: 'expense', blockName: '회비/비용 정산 모듈', category: 'hobby', desc: '모임 운영비 및 정산 내역 투명화' },
  { blockId: 'attendance', blockName: '수강 등록/출석부', category: 'hobby', desc: '참석 여부 및 출석률 통계' },
  { blockId: 'gallery', blockName: '우수 갤러리 피드', category: 'hobby', desc: '우수작품 및 활동 사진 공유' },
  { blockId: 'difficulty', blockName: '세션 난이도 수렴기', category: 'hobby', desc: '클래스 진행 속도 및 난이도 조율' },
  // Study
  { blockId: 'timer', blockName: '타이머 연동 진도 보드', category: 'study', desc: '집중 시간 및 학습 진척도 트래킹' },
  { blockId: 'study_material', blockName: '스터디 자료집 아카이브', category: 'study', desc: '강의 및 기출문제 자료실' },
  { blockId: 'assignment', blockName: '과제 미션 대시보드', category: 'study', desc: '주간/월간 스터디 미션 제출' },
  { blockId: 'satisfaction', blockName: '스터디 만족도/준비성 체크', category: 'study', desc: '모임 전후 피드백 서베이' },
  // Sports
  { blockId: 'bracket', blockName: '대진표/포지션 보드', category: 'sports', desc: '경기 대진 및 스쿼드 포지션' },
  { blockId: 'tactics', blockName: '전술 드로잉 판', category: 'sports', desc: '경기 전술 작전 보드' },
  { blockId: 'acwr', blockName: '피지컬 ACWR 부상 통계', category: 'sports', desc: '운동 부하 비율 및 부상 위험 관리' },
];

interface TeamInfo {
  membership: {
    _id: string;
    role: string;
    position?: string;
    playerNumber?: number;
  };
  team: {
    _id: string;
    teamName: string;
    teamCode: string;
    category: string;
    templateType?: string;
    ageGroup?: string;
  };
}

export default function TeamDashboardClient({ initialTeamInfo }: { initialTeamInfo: TeamInfo }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [teamInfo, setTeamInfo] = useState<TeamInfo>(initialTeamInfo);
  const [viewTab, setViewTab] = useState<'dashboard' | 'chat'>('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  // Settings & Invite Modals
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Settings State
  const [blocks, setBlocks] = useState<TeamBlock[]>([]);
  const [editingBlocks, setEditingBlocks] = useState(false);

  const handleTabSwitch = (tab: 'dashboard' | 'chat') => {
    if (tab === 'chat' && teamInfo.membership.role === 'guest') {
      setAuthModalOpen(true);
      return;
    }
    setViewTab(tab);
  };

  useEffect(() => {
    if (!teamInfo.team._id) return;
    
    // Firestore 실시간 리스너 연결 (REST API 대체)
    const teamRef = doc(db, 'teams', teamInfo.team._id);
    const unsubscribe = onSnapshot(teamRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.enabledBlocks) {
          // 💡 Type Guard 및 Union 패턴 전면 적용
          setBlocks(data.enabledBlocks as TeamBlock[]);
        }
      }
    }, (error) => {
      console.error("Firestore 동기화 에러:", error);
    });

    return () => unsubscribe();
  }, [teamInfo.team._id]);

  const handleShareInvite = async () => {
    const inviteUrl = `${window.location.origin}/invite/${teamInfo.team._id}`;
    
    // 네이티브 공유 API (모바일 카카오톡 등)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `[글리마일] ${teamInfo.team.teamName} 모임 초대`,
          text: `우리 모임의 프리미엄 웰니스 라운지로 당신을 초대합니다! 지금 바로 합류하세요.`,
          url: inviteUrl
        });
        return;
      } catch (err) {
        console.error('공유 실패:', err);
      }
    }

    // 클립보드 복사 폴백
    try {
      await navigator.clipboard.writeText(`[글리마일] ${teamInfo.team.teamName} 초대장\n\n초대 링크: ${inviteUrl}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const link = document.createElement('a');
      link.download = `Gleemile_Invite_${teamInfo.team.teamName}.png`;
      link.href = pngUrl;
      link.click();
    }
  };

  const isDirector = teamInfo.membership.role === 'director' || teamInfo.membership.role === 'coach';

  const renderBlock = (block: TeamBlock) => {
    const props = { 
      teamId: teamInfo.team._id, 
      teamName: teamInfo.team.teamName, 
      userId: session?.user?.id || '',
      role: teamInfo.membership.role 
    };

    // 💡 Type Guard 적용: TypeScript가 이 블록 내부에서는 block.objectiveTitle 등을 자동 추론합니다!
    if (isOkrBlock(block)) {
      return <OKRMappingBlock key={block.blockId} {...props} title={block.objectiveTitle} />;
    }
    if (isAcwrBlock(block)) {
      return <PhysicalACWRBlock key={block.blockId} {...props} />;
    }

    // 💡 Legacy Blocks 팩토리 라우팅 (추후 개별 Type Guard로 모두 교체)
    switch (block.blockType) {
      case 'wellness': return <WellnessBlock key={block.blockId} {...props} />;
      case 'announcements': return <AnnouncementBlock key={block.blockId} {...props} />;
      case 'schedule': return <ScheduleBlock key={block.blockId} {...props} />;
      case 'community': return <CommunityBlock key={block.blockId} {...props} />;
      case 'players': return <PlayersBlock key={block.blockId} {...props} />;
      case 'kanban': return <KanbanTaskBlock key={block.blockId} {...props} />;
      case 'feedback': return <ConstantFeedbackBlock key={block.blockId} {...props} />;
      case 'weekly_pulse': return <WeeklyPulseBlock key={block.blockId} {...props} />;
      case 'part_balance': return <PartBalanceSchedulerBlock key={block.blockId} {...props} />;
      case 'media_archive': return <MediaArchiveBlock key={block.blockId} {...props} />;
      case 'creative_burnout': return <CreativeBurnoutBlock key={block.blockId} {...props} />;
      case 'dday_board': return <DDayBoardBlock key={block.blockId} {...props} />;
      case 'expense': return <ExpenseSettlementBlock key={block.blockId} {...props} />;
      case 'attendance': return <ClassAttendanceBlock key={block.blockId} {...props} />;
      case 'gallery': return <ExcellentGalleryBlock key={block.blockId} {...props} />;
      case 'difficulty': return <SessionDifficultyBlock key={block.blockId} {...props} />;
      case 'timer': return <TimerProgressBlock key={block.blockId} {...props} />;
      case 'study_material': return <StudyMaterialArchiveBlock key={block.blockId} {...props} />;
      case 'assignment': return <AssignmentMissionBlock key={block.blockId} {...props} />;
      case 'satisfaction': return <StudySatisfactionBlock key={block.blockId} {...props} />;
      case 'bracket': return <BracketPositionBlock key={block.blockId} {...props} />;
      case 'tactics': return <TacticalDrawingBlock key={block.blockId} {...props} />;
      default: {
        const fallback = block as any;
        return <div key={fallback?.blockId || 'unknown'} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">알 수 없는 블록입니다. ({fallback?.blockType})</div>;
      }
    }
  };

  // 초대 모달
  const renderInviteModal = () => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col items-center p-8 relative animate-in zoom-in-95 duration-300">
        <button 
          onClick={() => setInviteModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2"
        >
          ✕
        </button>
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <Share2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">모임 초대하기</h3>
        <p className="text-sm text-slate-500 text-center mb-6">
          멤버들에게 초대 링크나 QR 코드를 공유하여<br/>우리 모임에 합류시키세요.
        </p>

        {/* QR Code */}
        <div className="bg-slate-50 p-4 rounded-2xl mb-6 relative group border border-slate-100">
          <QRCodeSVG 
            id="qr-code-canvas"
            value={`${window.location.origin}/invite/${teamInfo.team._id}`} 
            size={160} 
            level="H"
            includeMargin={true}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
            <button 
              onClick={downloadQRCode}
              className="bg-white text-emerald-600 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
            >
              <Download className="w-4 h-4" /> QR 저장
            </button>
          </div>
        </div>

        <div className="w-full flex gap-2">
          <Button 
            onClick={handleShareInvite}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12 text-base font-bold"
          >
            카카오톡 / 링크 공유
          </Button>
        </div>

        {/* 토스트 알림 */}
        {showToast && (
          <div className="absolute bottom-4 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm shadow-xl animate-in slide-in-from-bottom-2">
            링크가 클립보드에 복사되었습니다!
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => router.push('/mile/mypage')}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 px-4 text-center">
            <h2 className="text-lg font-bold text-slate-800 truncate">
              {teamInfo.team.teamName}
            </h2>
            <p className="text-[11px] text-slate-500">{teamInfo.team.category.toUpperCase()}</p>
          </div>
          <div className="flex items-center">
            {session?.user && (
              <button 
                onClick={() => setIsNotificationSheetOpen(true)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-600 relative"
              >
                <Bell className="w-5 h-5" />
              </button>
            )}
            {isDirector && (
              <button 
                onClick={() => setSettingsModalOpen(true)}
                className="p-2 -mr-2 rounded-full hover:bg-slate-100 text-slate-600"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 pb-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => handleTabSwitch('dashboard')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                viewTab === 'dashboard' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutTemplate className="w-4 h-4" />
              대시보드
            </button>
            <button
              onClick={() => handleTabSwitch('chat')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                viewTab === 'chat' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Send className="w-4 h-4" />
              실시간 채팅
            </button>
          </div>
        </div>
      </div>

      {/* Floating Glee Mascot for Guests */}
      {teamInfo.membership.role === 'guest' && viewTab === 'dashboard' && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
          transition={{ 
            x: { type: "spring", stiffness: 200, damping: 20 },
            y: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
          }}
          className="fixed top-36 right-4 z-[45] flex flex-col items-end pointer-events-none drop-shadow-2xl"
        >
          <div className="bg-white text-slate-800 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-xl mb-3 relative border border-slate-100">
            실시간 소통은<br/>가입이 필요해요!
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-b border-r border-slate-100 transform rotate-45"></div>
          </div>
          <div className="w-16 h-16 bg-gradient-to-tr from-white to-slate-50 rounded-[30px] flex items-center justify-center shadow-lg border-2 border-white relative overflow-hidden">
            <Image src="/images/happy.webp" alt="Glee Guide" width={56} height={56} className="object-contain" priority />
          </div>
        </motion.div>
      )}

      <div className="max-w-md mx-auto relative h-[calc(100vh-130px)]">
        {viewTab === 'dashboard' ? (
          <div className="p-4 space-y-6 pb-24 overflow-y-auto h-full hide-scrollbar">
            {/* 방장 도구 모음 */}
            {isDirector && (
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-emerald-800">관리자 도구</h4>
                  <p className="text-xs text-emerald-600">블록 모듈 설정 및 멤버 초대</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingBlocks(!editingBlocks)} className="rounded-xl border-emerald-200 text-emerald-700 bg-white">
                    <LayoutTemplate className="w-4 h-4 mr-1" />
                    블록 관리
                  </Button>
                  <Button size="sm" onClick={() => setInviteModalOpen(true)} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Share2 className="w-4 h-4 mr-1" />
                    초대하기
                  </Button>
                </div>
              </div>
            )}

            {/* 대시보드 렌더링 영역 */}
            <DynamicBlockBoard 
              blocks={blocks}
              editable={editingBlocks}
              onReorder={(newBlocks) => setBlocks(newBlocks)}
              renderBlock={renderBlock}
            />

            {blocks.filter(b => b.isActive).length === 0 && (
              <div className="text-center py-20 bg-slate-100/50 rounded-3xl border border-slate-200 border-dashed">
                <LayoutTemplate className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-600">활성화된 모듈이 없습니다</h3>
                <p className="text-sm text-slate-400 mt-1">관리자 도구에서 블록을 추가해보세요.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full bg-slate-50 relative">
            <TeamChatRoom teamId={teamInfo.team._id} />
          </div>
        )}
      </div>

      {inviteModalOpen && renderInviteModal()}

      {/* 설정 모달 Placeholder */}
      {settingsModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center">
             <h3 className="font-bold text-lg mb-4">모임 설정</h3>
             <p className="text-sm text-slate-500 mb-6">추후 다양한 권한 및 삭제 기능이 제공됩니다.</p>
             <Button onClick={() => setSettingsModalOpen(false)} className="w-full rounded-xl">닫기</Button>
           </div>
        </div>
      )}

      <AuthInterceptModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        callbackUrl={`/mile/join-public/${teamInfo.team._id}`}
        message="채팅에 참여하려면 모임에 가입해주세요!"
      />

      {session?.user?.id && (
        <NotificationSettingsSheet 
          isOpen={isNotificationSheetOpen}
          onClose={() => setIsNotificationSheetOpen(false)}
          userId={session.user.id}
        />
      )}
    </div>
  );
}
